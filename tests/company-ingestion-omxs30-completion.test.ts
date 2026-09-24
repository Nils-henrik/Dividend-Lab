import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ADDTECH_CALENDAR_SOURCE_URL,
  ADDTECH_CISION_FEED_URL,
  ADDTECH_CISION_ORIGIN,
  ADDTECH_ORIGIN,
  ADDTECH_PRESS_RELEASE_SOURCE_URL,
  EQT_CALENDAR_SOURCE_URL,
  EQT_ORIGIN,
  EQT_PRESS_RELEASE_SOURCE_URL,
  EQT_REPORTS_SOURCE_URL,
  EVOLUTION_CALENDAR_SOURCE_URL,
  EVOLUTION_ORIGIN,
  EVOLUTION_PRESS_RELEASE_SOURCE_URL,
  NIBE_ARCHIVE_WIDGET_URL,
  NIBE_CALENDAR_WIDGET_URL,
  NIBE_INVESTORS_SOURCE_URL,
  NIBE_ORIGIN,
  NIBE_PRESS_RELEASE_SOURCE_URL,
  NIBE_STORAGE_ORIGIN,
  parseAddtechCalendar,
  parseAddtechCisionFeed,
  parseEqtCalendar,
  parseEqtFinancialReports,
  parseEqtPressReleases,
  parseEvolutionCalendar,
  parseEvolutionFinancialReports,
  parseEvolutionPressReleases,
  parseNibeCalendar,
  parseNibeFinancialReports,
  parseNibePressReleases,
} from "@/lib/companies/ingestion/adapters/omxs30-completion";
import {
  companyDocumentOrigins,
  expectedCompanySourceUrl,
} from "@/lib/companies/ingestion/collect";
import { collectCompanySource } from "@/lib/companies/ingestion/collect";
import {
  COMPANY_SOURCE_TYPES,
  validateNormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import { SUPPORTED_COMPANY_INGESTION_SLUGS } from "@/lib/companies/ingestion/queue";
import { mergePersistedCompanyDocument } from "@/lib/companies/ingestion/store";

const NOW = new Date("2026-09-24T12:00:00.000Z");
const NEW_SLUGS = ["addtech", "eqt", "evolution", "nibe"] as const;
const EXISTING_SLUGS = [
  "investor",
  "volvo",
  "ericsson",
  "atlas-copco",
  "astrazeneca",
  "saab",
  "sandvik",
  "sca",
] as const;

describe("OMXS30 completion pass", () => {
  it("behåller de åtta tidigare slugs och ger varje ny källa en https-URL", () => {
    for (const slug of EXISTING_SLUGS) {
      assert.equal(SUPPORTED_COMPANY_INGESTION_SLUGS.includes(slug), true);
    }

    for (const slug of NEW_SLUGS) {
      assert.equal(SUPPORTED_COMPANY_INGESTION_SLUGS.includes(slug), true);
      for (const sourceType of COMPANY_SOURCE_TYPES) {
        const url = expectedCompanySourceUrl(slug, sourceType);
        assert.equal(new URL(url).protocol, "https:");
        assert.equal(companyDocumentOrigins(slug).length > 0, true);
      }
    }
  });

  it("läser Evolution från förstapartsmarkup och failar stängt", () => {
    const press = parseEvolutionPressReleases(`<p class="date-stamp">22/09/2026 - 15:40</p><a href="/investors/financial-publications/press-releases/verified-release"><strong>Verified Evolution release</strong></a><p class="date-stamp">22/09/2026 - 15:40</p><a href="https://evil.example/investors/financial-publications/press-releases/fake"><strong>Fake</strong></a>`);
    assert.equal(press.length, 1);
    assert.equal(press[0]?.publishedAt, "2026-09-22T00:00:00.000Z");
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [EVOLUTION_ORIGIN]), true);
    assert.equal(parseEvolutionPressReleases(`<p class="date-stamp">not-a-date</p><strong>Broken</strong>`).length, 0);

    const reports = parseEvolutionFinancialReports(`<tr><td><strong>Evolution: Interim report January-June 2026</strong><p class="date-stamp">17/07/2026 - 07:30</p><a href="/investors/financial-publications/press-releases/evolution-interim-report-january-june-2026">link</a></td></tr>`);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.documentType, "half_year_report");
    assert.equal(parseEvolutionFinancialReports(`<tr><td><strong>Evolution: Interim report January-June 2026</strong></td></tr>`).length, 0);

    const events = parseEvolutionCalendar(`<p class="h4"><strong>23 October &#x27;26</strong></p><span class="text-text-font-2">Interim report January – September 2026</span><p class="h4"><strong>01 September &#x27;26</strong></p><span class="text-text-font-2">Silent period</span>`, NOW);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.sourceUrl.startsWith(`${EVOLUTION_CALENDAR_SOURCE_URL}#`), true);
    assert.equal(validateNormalizedCompanyDocument(events[0]!, ["https://evil.example"]), false);
  });

  it("läser Addtechs Cision-flöde bara för Addtechs egen wire och statisk kalender", () => {
    const feed = JSON.stringify({
      Releases: [
        {
          InformationType: "PRM",
          Title: "Verified Addtech release",
          PublishDate: "2026-08-28T14:00:00Z",
          CisionWireUrl: "https://news.cision.com/addtech/r/verified-addtech-release,c4389248",
        },
        {
          InformationType: "PRM",
          Title: "Other issuer",
          PublishDate: "2026-08-28T14:00:00Z",
          CisionWireUrl: "https://news.cision.com/other/r/not-addtech,c1",
        },
        {
          InformationType: "RPT",
          Title: "Interim report Q1 1 April - 30 June 2026",
          PublishDate: "2026-07-14T06:15:00Z",
          CisionWireUrl: "https://news.cision.com/addtech/r/interim-report-q1,c4373193",
        },
      ],
    });
    const press = parseAddtechCisionFeed(feed, "PRM");
    assert.equal(press.length, 1);
    assert.equal(press[0]?.sourceUrl.includes("/addtech/r/"), true);
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [ADDTECH_CISION_ORIGIN]), true);
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [ADDTECH_ORIGIN]), false);
    const reports = parseAddtechCisionFeed(feed, "RPT");
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.documentType, "half_year_report");
    assert.equal(parseAddtechCisionFeed("{", "PRM").length, 0);
    assert.equal(parseAddtechCisionFeed(JSON.stringify({ Releases: "nope" }), "PRM").length, 0);

    const events = parseAddtechCalendar(`<p><strong>22/10/2026</strong><br> Interim report 1 April 2026 - 30 September 2026</p><p><strong>02/02/2027</strong><br> Seminar</p>`, NOW);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.sourceUrl.startsWith(`${ADDTECH_CALENDAR_SOURCE_URL}#`), true);
  });

  it("läser NIBE från bolagssidan och det inbäddade MFN-widgeten", () => {
    const press = parseNibePressReleases(`<time dateTime="2026-08-21T06:02:00Z"></time><h2 class="press-release-item-title"><a href="/news/verified-nibe-release">Verified NIBE release</a></h2><time dateTime="2026-08-21T06:02:00Z"></time><h2 class="press-release-item-title"><a href="https://evil.example/news/fake">Fake</a></h2>`);
    assert.equal(press.length, 1);
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [NIBE_ORIGIN]), true);
    assert.equal(parseNibePressReleases(`<h2 class="press-release-item-title"><a href="/news/missing-date">No date</a></h2>`).length, 0);

    const reports = parseNibeFinancialReports(`<div class="mfn-archive-event-title">Interim Report Q2</div><div class="mfn-archive-event-date">2026-08-21</div><td class="mfn-archive-item-type-report-pdf mfn-archive-item-lang-en"><a href="https://storage.mfn.se/2de10e82-345e-4a61-a2d0-934a1652c6e9/nibe-q2-report-2026-en.pdf"></a><a href="https://evil.example/2de10e82-345e-4a61-a2d0-934a1652c6e9/other.pdf">`);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.sourceUrl.startsWith(`${NIBE_STORAGE_ORIGIN}/`), true);
    assert.equal(validateNormalizedCompanyDocument(reports[0]!, [NIBE_ORIGIN]), false);
    assert.equal(parseNibeFinancialReports(`<div class="mfn-archive-event-title">Interim Report Q2</div><a href="https://storage.mfn.se/not-a-uuid/file.pdf">`).length, 0);

    const events = parseNibeCalendar(`<td class="datetimes">2026-11-17</td><td class="title">Interim report Q3 2026</td><td class="datetimes">2026-05-01</td><td class="title">Interim report Q1 2026</td>`, NOW);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.sourceUrl.startsWith(`${NIBE_INVESTORS_SOURCE_URL}#`), true);
  });

  it("läser EQT från den officiella Next-payloaden och släpper fel origin", () => {
    const press = parseEqtPressReleases(String.raw`https://eqtgroup.com/news/verified-eqt-release-2026-09-23"},\"title\":\"Verified EQT release\",\"publishedDate\":\"2026-09-23T05:15:00Z\" https://evil.example/news/fake"},\"title\":\"Fake\",\"publishedDate\":\"2026-09-23T05:15:00Z\"`);
    assert.equal(press.length, 1);
    assert.equal(press[0]?.sourceUrl, "https://eqtgroup.com/news/verified-eqt-release-2026-09-23");
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [EQT_ORIGIN]), true);
    assert.equal(parseEqtPressReleases("not json").length, 0);

    const reports = parseEqtFinancialReports(String.raw`\"date\":\"2026-07-17\",\"items\":[{\"title\":\"Webcast presentation\"},{\"title\":\"Half-year Report 2026\"}]`);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.documentType, "half_year_report");
    assert.equal(reports[0]?.sourceUrl.startsWith(`${EQT_REPORTS_SOURCE_URL}#`), true);
    assert.equal(parseEqtFinancialReports(String.raw`\"date\":\"not-a-date\",\"items\":[{\"title\":\"Half-year Report 2026\"}]`).length, 0);

    const events = parseEqtCalendar(String.raw`\"eventType\":\"interim_reports\",\"publishedDate\":\"$D2026-10-15T05:00:00.000Z\",\"current\":\"quarterly-announcement-july-september-2026\",\"title\":\"Quarterly Announcement July-September 2026\" \"eventType\":\"other\",\"publishedDate\":\"2026-11-01T05:00:00.000Z\",\"current\":\"seminar\",\"title\":\"Seminar\"`, NOW);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.sourceUrl, `${EQT_CALENDAR_SOURCE_URL}/quarterly-announcement-july-september-2026`);
    assert.equal(validateNormalizedCompanyDocument(events[0]!, ["https://cdn.sanity.io"]), false);
  });

  it("hämtar delegerade flöden bara när förstapartssidan innehåller den exakta markören", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url === ADDTECH_PRESS_RELEASE_SOURCE_URL) {
        return new Response(`<div data-identifier="563F27D62CDF474CAF699BBDBA94EF71" data-feed-to-show="PRM,RDV"></div>`, {
          headers: { "content-type": "text/html" },
        });
      }
      if (url === ADDTECH_CISION_FEED_URL) {
        return new Response(JSON.stringify({
          Releases: [{
            InformationType: "PRM",
            Title: "Verified Addtech release",
            PublishDate: "2026-08-28T14:00:00Z",
            CisionWireUrl: "https://news.cision.com/addtech/r/verified-addtech-release,c4389248",
          }],
        }), { headers: { "content-type": "application/json" } });
      }
      if (url === NIBE_INVESTORS_SOURCE_URL) {
        return new Response(`<script>${NIBE_ARCHIVE_WIDGET_URL}</script>`, {
          headers: { "content-type": "text/html" },
        });
      }
      if (url === NIBE_ARCHIVE_WIDGET_URL) {
        return new Response(`<div class="mfn-archive-event-title">Interim Report Q2</div><div class="mfn-archive-event-date">2026-08-21</div><td class="mfn-archive-item-type-report-pdf mfn-archive-item-lang-en"><a href="https://storage.mfn.se/2de10e82-345e-4a61-a2d0-934a1652c6e9/nibe-q2.pdf"></a>`, {
          headers: { "content-type": "text/html" },
        });
      }
      throw new Error(`unexpected ${url}`);
    }) as typeof fetch;

    const addtech = await collectCompanySource("addtech", {
      sourceType: "press_releases",
      sourceUrl: ADDTECH_PRESS_RELEASE_SOURCE_URL,
    }, { now: NOW, fetchImpl, sleep: async () => undefined });
    assert.equal(addtech.status, "ok");
    assert.deepEqual(calls, [ADDTECH_PRESS_RELEASE_SOURCE_URL, ADDTECH_CISION_FEED_URL]);

    calls.length = 0;
    const missing = await collectCompanySource("addtech", {
      sourceType: "press_releases",
      sourceUrl: ADDTECH_PRESS_RELEASE_SOURCE_URL,
    }, {
      now: NOW,
      sleep: async () => undefined,
      fetchImpl: (async () => new Response("<div></div>", {
        headers: { "content-type": "text/html" },
      })) as typeof fetch,
    });
    assert.deepEqual(missing, { status: "error", reason: "delegated_source_not_verified" });

    const nibe = await collectCompanySource("nibe", {
      sourceType: "financial_reports",
      sourceUrl: NIBE_INVESTORS_SOURCE_URL,
    }, { now: NOW, fetchImpl, sleep: async () => undefined });
    assert.equal(nibe.status, "ok");
    if (nibe.status === "ok") {
      assert.equal(nibe.documents[0]?.sourceUrl.startsWith(NIBE_STORAGE_ORIGIN), true);
    }
    assert.equal(calls.includes(NIBE_CALENDAR_WIDGET_URL), false);

    let fetched = false;
    const blocked = await collectCompanySource("abb", {
      sourceType: "press_releases",
      sourceUrl: "https://global.abb/group/en",
    }, {
      now: NOW,
      fetchImpl: (() => {
        fetched = true;
        throw new Error("should not fetch");
      }) as typeof fetch,
    });
    assert.deepEqual(blocked, { status: "error", reason: "unsupported_company" });
    assert.equal(fetched, false);
  });

  it("är idempotent för samma dokument-URL", () => {
    const document = parseEvolutionPressReleases(`<p class="date-stamp">22/09/2026 - 15:40</p><a href="/investors/financial-publications/press-releases/verified-release"><strong>Verified Evolution release</strong></a><p class="date-stamp">22/09/2026 - 15:40</p><a href="/investors/financial-publications/press-releases/verified-release"><strong>Verified Evolution release</strong></a>`)[0]!;
    const merged = mergePersistedCompanyDocument(document, {
      source_url: document.sourceUrl,
      published_at: document.publishedAt,
      event_at: null,
      fiscal_period: "keep",
    });
    assert.equal(merged.source_url, document.sourceUrl);
    assert.equal(merged.fiscal_period, "keep");
  });

  it("avvisar fel käll-URL utan hämtning", async () => {
    let fetched = false;
    const result = await collectCompanySource("evolution", {
      sourceType: "press_releases",
      sourceUrl: EVOLUTION_PRESS_RELEASE_SOURCE_URL.replace(/press-releases$/, "other"),
    }, {
      now: NOW,
      fetchImpl: (() => {
        fetched = true;
        throw new Error("should not fetch");
      }) as typeof fetch,
    });
    assert.deepEqual(result, { status: "error", reason: "unexpected_source_url" });
    assert.equal(fetched, false);
    assert.equal(expectedCompanySourceUrl("eqt", "press_releases"), EQT_PRESS_RELEASE_SOURCE_URL);
    assert.equal(expectedCompanySourceUrl("nibe", "press_releases"), NIBE_PRESS_RELEASE_SOURCE_URL);
  });
});
