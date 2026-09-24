import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { parseAtlasCopcoCalendar, parseAtlasCopcoFinancialReports } from "@/lib/companies/ingestion/adapters/atlas-copco-financials";
import {
  parseAstraZenecaCalendar,
  parseAstraZenecaPressRelease,
  parseAstraZenecaPressSitemap,
  parseAstraZenecaReports,
} from "@/lib/companies/ingestion/adapters/astrazeneca";
import {
  isEricssonDocumentUrl,
  parseEricssonOfficialHtml,
} from "@/lib/companies/ingestion/adapters/ericsson";
import {
  investorPageEmbedsAlertIr,
  parseInvestorFinancialReports,
  parseInvestorIngestionPressReleases,
} from "@/lib/companies/ingestion/adapters/investor";
import {
  parseVolvoCalendar,
  parseVolvoPressReleases,
  parseVolvoReportCandidates,
  parseVolvoReportDetail,
} from "@/lib/companies/ingestion/adapters/volvo";
import { collectCompanySource } from "@/lib/companies/ingestion/collect";
import {
  COMPANY_INGESTION_CLEANUP_MARGIN_MS,
  COMPANY_INGESTION_JOB_BUDGET_MS,
  COMPANY_INGESTION_PLATFORM_MAX_MS,
  createJobDeadline,
} from "@/lib/companies/ingestion/deadline";
import { INGESTION_REQUEST_TIMEOUT_MS } from "@/lib/companies/ingestion/fetch-source";
import {
  validateNormalizedCompanyDocument,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import {
  isSupportedCompanyIngestionSlug,
  SUPPORTED_COMPANY_INGESTION_SLUGS,
  type CompanyIngestionJob,
} from "@/lib/companies/ingestion/queue";
import { runCompanyIngestionJob } from "@/lib/companies/ingestion/run-job";
import {
  mergePersistedCompanyDocument,
  type CompanyIngestionOrchestratorStore,
  type OfficialCompanySource,
} from "@/lib/companies/ingestion/store";
import {
  classifyCompanyDocuments,
  companySourceDisclaimer,
} from "@/lib/companies/documents-view";

const NOW = new Date("2026-09-24T12:00:00.000Z");
const JOB: CompanyIngestionJob = {
  id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
  companyId: "fd31b206-b20a-4183-9e98-a5af9545c458",
  jobType: "initial_sync",
  attempts: 1,
};

function source(type: OfficialCompanySource["sourceType"], url: string, checked = false): OfficialCompanySource {
  return {
    id: `99970661-3c0b-4d3f-a0ce-cd03dd45f61${type.length % 10}`,
    sourceType: type,
    sourceUrl: url,
    publisher: "Publisher",
    lastCheckedAt: checked ? "2026-09-01T00:00:00.000Z" : null,
  };
}

function manualClock(start = 0) {
  let elapsed = start;
  return {
    clock: () => elapsed,
    sleep: async (milliseconds: number) => {
      elapsed += milliseconds;
    },
    advance: (milliseconds: number) => {
      elapsed += milliseconds;
    },
  };
}

function memoryStore(options: {
  slug: string;
  sources: OfficialCompanySource[];
  failSave?: boolean;
}) {
  const calls: string[] = [];
  const saved: NormalizedCompanyDocument[] = [];
  const checked: string[] = [];
  const store: CompanyIngestionOrchestratorStore = {
    async loadCompany() {
      calls.push("company");
      return { status: "ok", company: { id: JOB.companyId, slug: options.slug } };
    },
    async loadOfficialSources() {
      calls.push("sources");
      return { status: "ok", sources: options.sources };
    },
    async saveDocuments(input) {
      calls.push(`save:${input.documents[0]?.documentType ?? "empty"}`);
      if (options.failSave) return false;
      saved.push(...input.documents);
      return true;
    },
    async loadOfficialSource() {
      return { status: "error" };
    },
    async savePressReleases() {
      return false;
    },
    async markSourceChecked(sourceId) {
      calls.push(`checked:${sourceId}`);
      checked.push(sourceId);
      return true;
    },
    async completeJob() {
      calls.push("complete");
      return true;
    },
    async retryOrFailJob(_job, reason) {
      calls.push(`retry:${reason}`);
      return true;
    },
  };
  return { store, calls, saved, checked };
}

describe("company ingestion v2", () => {
  it("stödjer pilotbolagen plus verifierade OMXS30-utökningar och failar stängt för okända", () => {
    assert.deepEqual(SUPPORTED_COMPANY_INGESTION_SLUGS, [
      "investor",
      "volvo",
      "ericsson",
      "atlas-copco",
      "astrazeneca",
      "saab",
      "sandvik",
      "sca",
      "alfa-laval",
      "assa-abloy",
      "handelsbanken",
      "nibe",
    ]);
    assert.equal(isSupportedCompanyIngestionSlug("volvo"), true);
    assert.equal(isSupportedCompanyIngestionSlug("atlas copco"), false);
    assert.equal(isSupportedCompanyIngestionSlug("abb"), false);
  });

  it("validerar normaliserade dokument och behåller verifierade värden", () => {
    const report: NormalizedCompanyDocument = {
      documentType: "quarterly_report",
      title: "Quarterly Report Q2 2026",
      sourceUrl: "https://www.atlascopcogroup.com/content/dam/atlas-copco/q2.pdf",
      sourcePublisher: "Atlas Copco Group",
      publishedAt: "2026-07-16T00:00:00.000Z",
      eventAt: null,
      fiscalPeriod: "2026 Q2",
    };
    assert.equal(validateNormalizedCompanyDocument(report, ["https://www.atlascopcogroup.com"]), true);
    assert.equal(validateNormalizedCompanyDocument({
      ...report,
      documentType: "report_date",
      publishedAt: "2026-07-16T00:00:00.000Z",
      eventAt: "2026-10-22T00:00:00.000Z",
    }, ["https://www.atlascopcogroup.com"]), false);
    assert.equal(validateNormalizedCompanyDocument({
      ...report,
      sourceUrl: "https://evil.example/q2.pdf",
    }, ["https://www.atlascopcogroup.com"]), false);

    assert.equal(
      mergePersistedCompanyDocument(
        { ...report, fiscalPeriod: null, publishedAt: null, eventAt: null, documentType: "report_date" },
        {
          source_url: report.sourceUrl,
          published_at: "2026-07-16T00:00:00.000Z",
          event_at: null,
          fiscal_period: "2026 Q2",
        },
      ).fiscal_period,
      "2026 Q2",
    );
  });

  it("skickar okänt bolag till kontrollerat fel utan hämtning", async () => {
    const { store, calls } = memoryStore({ slug: "abb", sources: [] });
    let fetched = false;
    assert.deepEqual(
      await runCompanyIngestionJob(JOB, {
        store,
        now: () => NOW,
        fetchImpl: (() => {
          fetched = true;
          throw new Error("should not fetch");
        }) as typeof fetch,
      }),
      { status: "retry_scheduled", reason: "unsupported_company" },
    );
    assert.equal(fetched, false);
    assert.deepEqual(calls, ["company", "retry:unsupported_company"]);
  });

  it("slutför ett jobb först när alla tre källor har sparats", async () => {
    const urls = [
      "https://www.volvogroup.com/en/news-and-media.html",
      "https://www.volvogroup.com/en/investors/reports-and-presentations.html",
      "https://www.volvogroup.com/en/investors/financial-calendar.html",
    ];
    const { store, calls, saved, checked } = memoryStore({
      slug: "volvo",
      sources: [
        source("press_releases", urls[0]),
        source("financial_reports", urls[1]),
        source("financial_calendar", urls[2]),
      ],
    });
    const pages: Record<string, string> = {
      [urls[0]]: `<div class="articlelist__item"><p class="articlelist__headerCaption">Press release</p><span class="articlelist__headerTimeDate">2026-09-23</span><h3 class="articlelist__headerTitle"><a href="https://www.volvogroup.com/en/news-and-media/news/2026/sep/verified-release.html">Verified Volvo release</a></h3></div>`,
      [urls[1]]: `<div data-nc-params-Teaser='{"analyticsData":{"title":"Volvo Group Second Quarter 2026"},"CTAURL":"/en/news-and-media/events/2026/jul/second-quarter-2026.html"}'></div>`,
      "https://www.volvogroup.com/en/news-and-media/events/2026/jul/second-quarter-2026.html": `<div data-nc-params-eventinformation='{"startDate":"2026-07-17T07:20:00+02:00"}'></div><a href="/content/dam/volvo-group/markets/master/investors/reports-and-presentations/interim-reports/2026/volvo-group-q2-2026-eng.pdf">Report</a>`,
      [urls[2]]: `<div class="eventlist--upcoming"><li class="eventlist__item"><a href="https://www.volvogroup.com/en/news-and-media/events/2026/oct/third-quarter-2026.html"><time datetime="2026-10-23T05:20:00.000Z">October 23, 2026</time><span class="eventlist__titleLink">Third quarter 2026</span></a></li></div><div class="eventlist--past"></div>`,
    };
    assert.equal(
      (await runCompanyIngestionJob(JOB, {
        store,
        now: () => NOW,
        sleep: async () => undefined,
        fetchImpl: (async (input) => new Response(pages[String(input)] ?? "", {
          headers: { "content-type": "text/html" },
        })) as typeof fetch,
      })).status,
      "completed",
    );
    assert.equal(saved.length, 3);
    assert.deepEqual(saved.map((document) => document.documentType), [
      "press_release",
      "quarterly_report",
      "report_date",
    ]);
    assert.equal(
      saved[1]?.sourceUrl,
      "https://www.volvogroup.com/content/dam/volvo-group/markets/master/investors/reports-and-presentations/interim-reports/2026/volvo-group-q2-2026-eng.pdf",
    );
    assert.equal(checked.length, 3);
    assert.equal(calls.at(-1), "complete");
  });

  it("markerar bara lyckade källor som kontrollerade och försöker om resten", async () => {
    const press = "https://www.volvogroup.com/en/news-and-media.html";
    const reports = "https://www.volvogroup.com/en/investors/reports-and-presentations.html";
    const calendar = "https://www.volvogroup.com/en/investors/financial-calendar.html";
    const { store, checked, calls } = memoryStore({
      slug: "volvo",
      sources: [
        source("press_releases", press),
        source("financial_reports", reports),
        source("financial_calendar", calendar),
      ],
    });
    const result = await runCompanyIngestionJob(JOB, {
      store,
      now: () => NOW,
      sleep: async () => undefined,
      fetchImpl: (async (input) => {
        const url = String(input);
        if (url === calendar) {
          return new Response("down", { status: 503, headers: { "content-type": "text/html" } });
        }
        if (url === press) {
          return new Response(`<div class="articlelist__item"><p class="articlelist__headerCaption">Press release</p><span class="articlelist__headerTimeDate">2026-09-23</span><h3 class="articlelist__headerTitle"><a href="https://www.volvogroup.com/en/news-and-media/news/2026/sep/verified-release.html">Verified Volvo release</a></h3></div>`, { headers: { "content-type": "text/html" } });
        }
        if (url.endsWith("annual-report-2025.html")) {
          return new Response(`<div data-nc-params-eventinformation='{"startDate":"2026-02-19T08:00:00.000Z"}'></div>`, { headers: { "content-type": "text/html" } });
        }
        return new Response(`<div data-nc-params-Teaser='{"analyticsData":{"title":"Annual Report 2025"},"CTAURL":"/en/news-and-media/events/2026/feb/annual-report-2025.html"}'></div>`, { headers: { "content-type": "text/html" } });
      }) as typeof fetch,
    });
    assert.equal(result.status, "retry_scheduled");
    assert.match(result.status === "retry_scheduled" ? result.reason : "", /financial_calendar_/);
    assert.equal(checked.length, 2);
    assert.equal(calls.includes("complete"), false);
  });

  it("gör tredje försöket permanent och hoppar över redan kontrollerade källor", async () => {
    const press = "https://www.ericsson.com/en/newsroom/latest-news?locs=68304&typeFilters=3";
    const { store, calls } = memoryStore({
      slug: "ericsson",
      sources: [
        source("press_releases", press, true),
        source("financial_reports", "https://www.ericsson.com/en/investors/financial-reports-and-presentations"),
        source("financial_calendar", "https://www.ericsson.com/en/investors/financial-calendar"),
      ],
    });
    const requested: string[] = [];
    const result = await runCompanyIngestionJob({ ...JOB, attempts: 3 }, {
      store,
      now: () => NOW,
      sleep: async () => undefined,
      fetchImpl: (async (input) => {
        requested.push(String(input));
        return new Response("<html><title>Just a moment...</title>cf-chl</html>", {
          headers: { "content-type": "text/html" },
        });
      }) as typeof fetch,
    });
    assert.deepEqual(result, { status: "failed", reason: "financial_reports_bot_challenge" });
    assert.equal(requested.includes(press), false);
    assert.equal(calls.includes("complete"), false);
  });

  it("lämnar inte ett oväntat fel i processing och läcker inte detaljer", async () => {
    const { store, calls } = memoryStore({ slug: "volvo", sources: [] });
    store.loadCompany = async () => {
      throw new Error("secret database detail");
    };
    assert.deepEqual(
      await runCompanyIngestionJob(JOB, { store, now: () => NOW }),
      { status: "retry_scheduled", reason: "worker_unexpected_error" },
    );
    assert.doesNotMatch(JSON.stringify(calls), /secret database detail/);
  });

  it("stoppar nästa källa och detalj när jobbets tidsbudget tar slut", async () => {
    const time = manualClock();
    const press = "https://www.volvogroup.com/en/news-and-media.html";
    const reports = "https://www.volvogroup.com/en/investors/reports-and-presentations.html";
    const calendar = "https://www.volvogroup.com/en/investors/financial-calendar.html";
    const secondDetail = "https://www.volvogroup.com/en/news-and-media/events/2026/feb/annual-report-2025.html";
    const { store, calls, saved, checked } = memoryStore({
      slug: "volvo",
      sources: [
        source("press_releases", press),
        source("financial_reports", reports),
        source("financial_calendar", calendar),
      ],
    });
    const requested: string[] = [];
    const result = await runCompanyIngestionJob(JOB, {
      store,
      now: () => NOW,
      clock: time.clock,
      sleep: time.sleep,
      fetchImpl: (async (input) => {
        const url = String(input);
        requested.push(url);
        if (url === press) {
          return new Response(`<div class="articlelist__item"><p class="articlelist__headerCaption">Press release</p><span class="articlelist__headerTimeDate">2026-09-23</span><h3 class="articlelist__headerTitle"><a href="https://www.volvogroup.com/en/news-and-media/news/2026/sep/verified-release.html">Verified Volvo release</a></h3></div>`, {
            headers: { "content-type": "text/html" },
          });
        }
        if (url === reports) {
          return new Response(`<div data-nc-params-Teaser='{"analyticsData":{"title":"Volvo Group Second Quarter 2026"},"CTAURL":"/en/news-and-media/events/2026/jul/second-quarter-2026.html"}'></div><div data-nc-params-Teaser='{"analyticsData":{"title":"Annual Report 2025"},"CTAURL":"/en/news-and-media/events/2026/feb/annual-report-2025.html"}'></div>`, {
            headers: { "content-type": "text/html" },
          });
        }
        if (url.endsWith("second-quarter-2026.html")) {
          time.advance(COMPANY_INGESTION_JOB_BUDGET_MS);
          return new Response(`<div data-nc-params-eventinformation='{"startDate":"2026-07-17T07:20:00+02:00"}'></div><a href="/content/dam/volvo-group/markets/master/investors/reports-and-presentations/interim-reports/2026/volvo-group-q2-2026-eng.pdf">Report</a>`, {
            headers: { "content-type": "text/html" },
          });
        }
        throw new Error(`unexpected fetch ${url}`);
      }) as typeof fetch,
    });

    assert.deepEqual(result, { status: "retry_scheduled", reason: "job_deadline_exceeded" });
    assert.equal(requested.includes(secondDetail), false);
    assert.equal(requested.includes(calendar), false);
    assert.equal(saved.length, 1);
    assert.equal(saved[0]?.documentType, "press_release");
    assert.equal(checked.length, 1);
    assert.equal(calls.includes("complete"), false);
    assert.equal(calls.includes("retry:job_deadline_exceeded"), true);
  });

  it("markerar deadline som permanent fel på sista försöket utan att lämna jobbet lyckat", async () => {
    let started = false;
    const time = manualClock();
    const clock = () => {
      const value = time.clock();
      if (!started) {
        started = true;
        return value;
      }

      return value + COMPANY_INGESTION_JOB_BUDGET_MS;
    };
    const { store, calls, checked } = memoryStore({
      slug: "atlas-copco",
      sources: [
        source("press_releases", "https://www.atlascopcogroup.com/en/media/press-releases"),
        source("financial_reports", "https://www.atlascopcogroup.com/en/investors/reports-and-presentations"),
        source("financial_calendar", "https://www.atlascopcogroup.com/en/investors/calendar-and-events"),
      ],
    });
    let fetched = false;
    const result = await runCompanyIngestionJob({ ...JOB, attempts: 3 }, {
      store,
      now: () => NOW,
      clock,
      sleep: time.sleep,
      fetchImpl: (async () => {
        fetched = true;
        throw new Error("should not fetch");
      }) as typeof fetch,
    });

    assert.deepEqual(result, { status: "failed", reason: "job_deadline_exceeded" });
    assert.equal(fetched, false);
    assert.equal(checked.length, 0);
    assert.equal(calls.includes("complete"), false);
    assert.equal(calls.includes("retry:job_deadline_exceeded"), true);
  });

  it("kortar nästa request-timeout till kvarvarande budget och stoppar Atlas-detaljer", async () => {
    const time = manualClock();
    const deadline = createJobDeadline({ clock: time.clock });
    assert.equal(COMPANY_INGESTION_JOB_BUDGET_MS, 45_000);
    assert.equal(COMPANY_INGESTION_CLEANUP_MARGIN_MS, 5_000);
    assert.ok(COMPANY_INGESTION_JOB_BUDGET_MS < COMPANY_INGESTION_PLATFORM_MAX_MS);
    assert.equal(deadline.requestTimeoutMs(INGESTION_REQUEST_TIMEOUT_MS), INGESTION_REQUEST_TIMEOUT_MS);
    time.advance(36_000);
    assert.equal(deadline.requestTimeoutMs(INGESTION_REQUEST_TIMEOUT_MS), 4_000);
    time.advance(4_000);
    assert.equal(deadline.requestTimeoutMs(INGESTION_REQUEST_TIMEOUT_MS), null);
    assert.equal(deadline.allowDelay(1_000), false);

    const first = "https://www.atlascopcogroup.com/en/media/press-releases/2026/first-release";
    const second = "https://www.atlascopcogroup.com/en/media/press-releases/2026/second-release";
    const detailClock = manualClock();
    const { store, checked, calls } = memoryStore({
      slug: "atlas-copco",
      sources: [
        source("press_releases", "https://www.atlascopcogroup.com/en/media/press-releases"),
        source("financial_reports", "https://www.atlascopcogroup.com/en/investors/reports-and-presentations", true),
        source("financial_calendar", "https://www.atlascopcogroup.com/en/investors/calendar-and-events", true),
      ],
    });
    const requested: string[] = [];
    const result = await runCompanyIngestionJob(JOB, {
      store,
      now: () => NOW,
      clock: detailClock.clock,
      sleep: detailClock.sleep,
      fetchImpl: (async (input) => {
        const url = String(input);
        requested.push(url);
        if (url.endsWith("sitemap.xml")) {
          return new Response(`<?xml version="1.0"?><urlset><url><loc>${first}</loc><lastmod>2026-09-01</lastmod></url><url><loc>${second}</loc><lastmod>2026-08-01</lastmod></url></urlset>`, {
            headers: { "content-type": "application/xml" },
          });
        }
        if (url === first) {
          detailClock.advance(COMPANY_INGESTION_JOB_BUDGET_MS);
          return new Response(`<h1 class="cmp-title__text">Verified Atlas Copco release</h1><p class="cmp-pagedate">August 27, 2026</p>`, {
            headers: { "content-type": "text/html" },
          });
        }
        throw new Error(`unexpected fetch ${url}`);
      }) as typeof fetch,
    });

    assert.deepEqual(result, { status: "retry_scheduled", reason: "job_deadline_exceeded" });
    assert.equal(requested.includes(second), false);
    assert.equal(checked.length, 0);
    assert.equal(calls.at(-1), "retry:job_deadline_exceeded");
  });

  it("hämtar inte AstraZenecas robots-blockerade listendpoint", async () => {
    const requested: string[] = [];
    const result = await collectCompanySource("astrazeneca", {
      sourceType: "press_releases",
      sourceUrl: "https://www.astrazeneca.com/media-centre/press-releases.html",
    }, {
      now: NOW,
      sleep: async () => undefined,
      fetchImpl: (async (input) => {
        const url = String(input);
        requested.push(url);
        if (url.includes("/content/astraz")) {
          throw new Error("disallowed listing");
        }
        if (url.endsWith("azcomsitemap.xml")) {
          return new Response(`<urlset><url><loc>https://www.astrazeneca.com/media-centre/press-releases/2026/verified-release.html</loc><lastmod>2026-09-24T00:00:00.000Z</lastmod></url><url><loc>https://evil.example/media-centre/press-releases/2026/fake.html</loc><lastmod>2026-09-24T00:00:00.000Z</lastmod></url></urlset>`, {
            headers: { "content-type": "application/xml" },
          });
        }
        return new Response(`<h1>Verified AstraZeneca release</h1><meta itemprop="datePublished" content="2026-09-24">`, {
          headers: { "content-type": "text/html" },
        });
      }) as typeof fetch,
    });
    assert.equal(result.status, "ok");
    assert.equal(result.status === "ok" ? result.documents[0]?.sourceUrl : "", "https://www.astrazeneca.com/media-centre/press-releases/2026/verified-release.html");
    assert.equal(requested.some((url) => url.includes("/content/astraz")), false);
  });

  it("runtime dispatchar inte längre alla jobb till Atlas Copco", () => {
    const runtime = readFileSync(new URL("../lib/companies/ingestion/runtime.ts", import.meta.url), "utf8");
    assert.match(runtime, /runCompanyIngestionJob/);
    assert.doesNotMatch(runtime, /runAtlasCopcoIngestionJob/);
  });
});

describe("official source parsers", () => {
  it("läser Volvo, Atlas Copco och AstraZeneca från verifierad struktur", () => {
    assert.equal(parseVolvoPressReleases(`<div class="articlelist__item"><p class="articlelist__headerCaption">Story</p><span class="articlelist__headerTimeDate">2026-09-01</span><a href="https://www.volvogroup.com/en/news-and-media/news/2026/sep/story.html">Story</a></div>`).length, 0);
    assert.equal(parseVolvoReportCandidates(`<div data-nc-params-Teaser='{"analyticsData":{"title":"IAA Transportation"},"CTAURL":"/en/news-and-media/events/2026/sep/iaa.html"}'></div>`).length, 0);
    const detail = parseVolvoReportDetail(
      `<a href="https://attacker.example/report.pdf">x</a><div data-nc-params-eventinformation='{"startDate":"2026-07-17T07:20:00+02:00"}'></div><a href="/content/dam/volvo-group/markets/master/investors/reports-and-presentations/interim-reports/2026/volvo-group-26q2-presentation-material.pdf">Slides</a><a href="/content/dam/volvo-group/markets/master/investors/reports-and-presentations/interim-reports/2026/volvo-group-q2-2026-eng.pdf">Report</a>`,
      "https://www.volvogroup.com/en/news-and-media/events/2026/jul/second-quarter-2026.html",
      "Volvo Group Second Quarter 2026",
    );
    assert.equal(detail?.sourceUrl, "https://www.volvogroup.com/content/dam/volvo-group/markets/master/investors/reports-and-presentations/interim-reports/2026/volvo-group-q2-2026-eng.pdf");
    const datedPageOnly = parseVolvoReportDetail(
      `<a href="https://attacker.example/report.pdf">x</a><div data-nc-params-eventinformation='{"startDate":"2026-07-17T07:20:00+02:00"}'></div>`,
      "https://www.volvogroup.com/en/news-and-media/events/2026/jul/second-quarter-2026.html",
      "Volvo Group Second Quarter 2026",
    );
    assert.equal(datedPageOnly?.sourceUrl, "https://www.volvogroup.com/en/news-and-media/events/2026/jul/second-quarter-2026.html");
    assert.equal(parseVolvoCalendar(`<div class="eventlist--upcoming"><li class="eventlist__item"><a href="https://www.volvogroup.com/en/news-and-media/events/2026/sep/iaa.html"><time datetime="2026-10-01T00:00:00.000Z"></time><span class="eventlist__titleLink">IAA Transportation</span></a></li></div>`, NOW).length, 0);

    const atlasReports = parseAtlasCopcoFinancialReports(`<a class="cmp-download__title-link" href="/content/dam/atlas-copco/group/documents/investors/financial-publications/english/20260716-en-q2-2026-fl.pdf">Quarterly Report Q2 2026</a><a class="cmp-download__title-link" href="https://evil.example/q2.pdf">Quarterly Report Q2 2026</a>`);
    assert.equal(atlasReports.length, 1);
    assert.equal(atlasReports[0]?.publishedAt, "2026-07-16T00:00:00.000Z");
    const atlasEvents = parseAtlasCopcoCalendar(`<div class="cmp-teaser"><p class="cmp-teaser__date">October 22 2026</p><p class="cmp-teaser__pretitle">QUARTERLY REPORT</p><h3 class="cmp-teaser__title">Atlas Copco Group Q3 2026 report</h3><a href="https://calendar.google.com/calendar/render?action=TEMPLATE">Google</a></div></div>`, NOW);
    assert.equal(atlasEvents[0]?.documentType, "report_date");
    assert.equal(atlasEvents[0]?.publishedAt, null);
    assert.match(atlasEvents[0]?.sourceUrl ?? "", /^https:\/\/www\.atlascopcogroup\.com\/en\/investors\/calendar-and-events#/);

    const azReports = parseAstraZenecaReports(`<h3>H1 and Q2 2026 results</h3><span class="footnote">27 July 2026</span><a href="/content/dam/az/PDF/2026/h1q2/H1-and-Q2-2026-results-announcement.pdf"><p class="download-tile__header">H1 and Q2 2026 results announcement</p></a><h3>Other</h3>`);
    assert.equal(azReports[0]?.documentType, "half_year_report");
    assert.equal(azReports[0]?.publishedAt, "2026-07-27T00:00:00.000Z");
    const azEvents = parseAstraZenecaCalendar(`<time class="event-card__date" datetime="2026-10-30"><span>AZN 9M and Q3 2026 results</span>`, NOW);
    assert.equal(azEvents.length, 1);
    assert.equal(parseAstraZenecaPressSitemap(`<urlset><url><loc>https://www.astrazeneca.com/content/astraz/media-centre/press-releases/2026/secret.html</loc><lastmod>2026-09-24T00:00:00.000Z</lastmod></url></urlset>`).status === "ok"
      ? parseAstraZenecaPressSitemap(`<urlset><url><loc>https://www.astrazeneca.com/content/astraz/media-centre/press-releases/2026/secret.html</loc><lastmod>2026-09-24T00:00:00.000Z</lastmod></url></urlset>`).candidates.length
      : 1, 0);
    assert.equal(parseAstraZenecaPressRelease(`<h1>Verified</h1><meta itemprop="datePublished" content="2026-09-24">`, "https://evil.example/media-centre/press-releases/2026/verified.html"), null);
  });

  it("blockerar Investors AlertIR-embed och datumlösa rapporter", () => {
    const iframe = `<iframe src="https://vp053.alertir.com/v4/en/press-releases?origin=https://www.investorab.com/investors-media/press-releases"></iframe>`;
    assert.equal(investorPageEmbedsAlertIr(iframe), true);
    assert.equal(parseInvestorIngestionPressReleases(iframe).length, 0);
    assert.equal(parseInvestorFinancialReports(`<li class="link-lists__list-item"><a href="/media/12jpon2s/interim-report-january-june-2026.pdf"><span class="link-lists__link__text">Q2 Report</span></a></li>`).length, 0);
    const dated = parseInvestorFinancialReports(`<li class="link-lists__list-item"><time datetime="2026-07-17T05:20:00.000Z"></time><a href="/media/12jpon2s/interim-report-january-june-2026.pdf"><span class="link-lists__link__text">Q2 Report</span></a></li>`);
    assert.equal(dated[0]?.documentType, "quarterly_report");
    assert.equal(dated[0]?.sourceUrl, "https://www.investorab.com/media/12jpon2s/interim-report-january-june-2026.pdf");
  });

  it("failar stängt för Ericsson och avvisar främmande origin", () => {
    assert.deepEqual(parseEricssonOfficialHtml("<html><title>Just a moment...</title></html>"), {
      status: "error",
      reason: "bot_challenge",
    });
    assert.equal(parseEricssonOfficialHtml(`<a href="https://evil.example/report.pdf">Report</a>`).status, "error");
    assert.equal(isEricssonDocumentUrl("https://www.ericsson.com/en/investors/financial-calendar"), true);
    assert.equal(isEricssonDocumentUrl("https://evil.example/en/investors/financial-calendar"), false);
    assert.equal(isEricssonDocumentUrl("https://www.ericsson.com/en/news?ref=1"), true);
  });
});

describe("company page documents", () => {
  it("klassificerar dokumenttyper och håller källtexten bolagsspecifik", () => {
    const classified = classifyCompanyDocuments([
      {
        type: "press_release",
        title: "Press",
        url: "https://www.volvogroup.com/press",
        publishedAt: "2026-09-23T00:00:00.000Z",
        eventAt: null,
      },
      {
        type: "quarterly_report",
        title: "Q2",
        url: "https://www.volvogroup.com/q2",
        publishedAt: "2026-07-17T00:00:00.000Z",
        eventAt: null,
      },
      {
        type: "report_date",
        title: "Q3",
        url: "https://www.volvogroup.com/q3",
        publishedAt: null,
        eventAt: "2026-10-23T05:20:00.000Z",
      },
      {
        type: "report_date",
        title: "Old",
        url: "https://www.volvogroup.com/old",
        publishedAt: null,
        eventAt: "2026-01-01T00:00:00.000Z",
      },
    ], NOW);
    assert.deepEqual(classified.pressReleases.map((item) => item.title), ["Press"]);
    assert.deepEqual(classified.reports.map((item) => item.title), ["Q2"]);
    assert.deepEqual(classified.events.map((item) => item.title), ["Q3"]);
    assert.match(companySourceDisclaimer({ slug: "volvo", name: "Volvo" }), /Volvo Group/);
    assert.doesNotMatch(companySourceDisclaimer({ slug: "volvo", name: "Volvo" }), /Investor AB/);
    assert.match(companySourceDisclaimer({ slug: "investor", name: "Investor" }), /Investor AB/);
    const page = readFileSync(new URL("../components/companies/CompanyPageContent.tsx", import.meta.url), "utf8");
    assert.doesNotMatch(page, /Bolagsdata hämtas från Investor AB/);
    assert.match(page, /companySourceDisclaimer/);
    assert.match(page, /classifyCompanyDocuments/);
  });
});
