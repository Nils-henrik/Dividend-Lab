import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseSaabCalendar,
  parseSaabFinancialReports,
  parseSaabPressReleases,
  parseSandvikCalendar,
  parseSandvikFinancialReports,
  parseSandvikPressReleases,
  parseScaCalendar,
  parseScaFinancialReports,
  parseScaPressReleases,
  SAAB_ORIGIN,
  SANDVIK_ORIGIN,
  SCA_ORIGIN,
} from "@/lib/companies/ingestion/adapters/omxs30-static";
import {
  companyDocumentOrigins,
  expectedCompanySourceUrl,
} from "@/lib/companies/ingestion/collect";
import {
  COMPANY_SOURCE_TYPES,
  validateNormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import { SUPPORTED_COMPANY_INGESTION_SLUGS } from "@/lib/companies/ingestion/queue";
import { collectCompanySource } from "@/lib/companies/ingestion/collect";
import { mergePersistedCompanyDocument } from "@/lib/companies/ingestion/store";

const NOW = new Date("2026-09-24T12:00:00.000Z");
const NEW_SLUGS = ["saab", "sandvik", "sca"] as const;

describe("OMXS30 official source expansion", () => {
  it("ger varje nytt slug tre https-källor på tillåten origin", () => {
    for (const slug of NEW_SLUGS) {
      assert.equal(SUPPORTED_COMPANY_INGESTION_SLUGS.includes(slug), true);
      const origins = companyDocumentOrigins(slug);
      assert.equal(origins.length, 1);
      for (const sourceType of COMPANY_SOURCE_TYPES) {
        const url = expectedCompanySourceUrl(slug, sourceType);
        assert.equal(url.startsWith(`${origins[0]}/`), true);
        assert.equal(new URL(url).protocol, "https:");
        assert.equal(new URL(url).search, "");
      }
    }
  });

  it("läser Saab, Sandvik och SCA från verifierad markup och failar stängt", () => {
    const saabPress = parseSaabPressReleases(`<a href="/newsroom/press-releases/2026/verified-release" class="item swiper-slide"><span class="date">24&#xA0;September&#xA0;2026</span><span class="title">Verified Saab release</span></a><a href="https://evil.example/newsroom/press-releases/2026/fake" class="item"><span class="date">24 September 2026</span><span class="title">Fake</span></a>`);
    assert.equal(saabPress.length, 1);
    assert.equal(saabPress[0]?.sourceUrl, "https://www.saab.com/newsroom/press-releases/2026/verified-release");
    assert.equal(validateNormalizedCompanyDocument(saabPress[0]!, [SAAB_ORIGIN]), true);

    const saabReports = parseSaabFinancialReports(`<h3 class="listed-item__heading">Interim Report Q2</h3><a href="/globalassets/cision/documents/2026/q2.pdf">Report (en)</a><div class="date">2026-07-17 7:30 CET</div><a href="https://evil.example/q2.pdf">Report (en)</a>`);
    assert.equal(saabReports.length, 1);
    assert.equal(saabReports[0]?.publishedAt, "2026-07-17T00:00:00.000Z");
    assert.equal(parseSaabFinancialReports(`<h3 class="listed-item__heading">Interim Report Q2</h3><a href="/globalassets/cision/documents/2026/q2.pdf">Report (en)</a>`).length, 0);

    const saabEvents = parseSaabCalendar(`<div class="upcoming item-listing"><div class="date">23&#xA0;October&#xA0;2026</div><a href="/investors/calendar/q3-interim-report-2026"><h4>Q3 Interim Report 2026</h4></a><div class="date">25 Nov 2026 - 26 Nov 2026</div><a href="/investors/calendar/seminar"><h4>Winter Seminar</h4></a></div>`, NOW);
    assert.equal(saabEvents.length, 1);
    assert.equal(saabEvents[0]?.documentType, "report_date");
    assert.equal(parseSaabCalendar(`<div class="date">23 October 2026</div><h4>Q3 Interim Report 2026</h4>`, NOW).length, 0);

    const sandvikPress = parseSandvikPressReleases(`<li><a href="https://www.home.sandvik/en/news-and-media/news/2026/09/verified-release/"><p>Sep 21, 2026 1:00 PM CET - Press release</p><p class="text-lg max-w-3xl">Verified Sandvik release</p></a></li><li><a href="https://www.home.sandvik/en/news-and-media/news/2026/09/story/"><p>Sep 21, 2026 - Story</p><p class="text-lg">Story</p></a></li>`);
    assert.equal(sandvikPress.length, 1);
    assert.equal(validateNormalizedCompanyDocument(sandvikPress[0]!, [SANDVIK_ORIGIN]), true);

    const sandvikReports = parseSandvikFinancialReports(`<h2>Interim Report Q2</h2><p>July 17, 2026 at 11:30 AM CEST</p><a href="/siteassets/investors/reports--presentations/interim-reports/2026/presentation-q2-2026.pdf">Presentation</a><a href="/siteassets/investors/reports--presentations/interim-reports/2026/interim-report-second-quarter-2026.pdf">Interim report</a>`);
    assert.equal(sandvikReports.length, 1);
    assert.equal(sandvikReports[0]?.sourceUrl.endsWith("interim-report-second-quarter-2026.pdf"), true);
    assert.equal(parseSandvikFinancialReports(`<h2>Interim Report Q2</h2><a href="/siteassets/investors/x.pdf">Interim report</a>`).length, 0);

    const sandvikEvents = parseSandvikCalendar(`<li class="relative"><time datetime="2026-10-22T08:00:00.000Z"></time><h2>Interim report third quarter 2026</h2><div data-link="/en/investors/calendar/2026/interim-report-third-quarter-2026/"></div></li><li class="relative"><time datetime="2026-10-01T00:00:00.000Z"></time><h2>Silent period third quarter 2026</h2><div data-link="/en/investors/calendar/2026/silent-period-third-quarter-2026/"></div></li>`, NOW);
    assert.equal(sandvikEvents.length, 1);
    assert.equal(sandvikEvents[0]?.eventAt, "2026-10-22T08:00:00.000Z");

    const scaPress = parseScaPressReleases(`<time dateTime='2026-09-23T06:00:00+00:00'></time><h2 class="as-h3"><a href="/en/media/press-releases/2026/verified-release/">Verified SCA release</a></h2><h2><a href="https://evil.example/en/media/press-releases/2026/fake/">Fake</a></h2>`);
    assert.equal(scaPress.length, 1);
    assert.equal(validateNormalizedCompanyDocument(scaPress[0]!, [SCA_ORIGIN]), true);

    const scaReports = parseScaFinancialReports(`<h2 class="as-h3">Interim Report Q2 2026</h2><time dateTime="22/07/2026, 8:00 am"></time><a href="/siteassets/investors/reports-and-presentations/interim-reports/2026/presentation.pdf">Presentation Q2 2026</a><a href="/siteassets/media/press-releases-and-reports/documents/2026/q2.pdf">Interim Report Q2 2026</a>`);
    assert.equal(scaReports.length, 1);
    assert.equal(scaReports[0]?.publishedAt, "2026-07-22T00:00:00.000Z");
    assert.equal(parseScaFinancialReports(`<h2>Interim Report Q2 2026</h2><a href="/siteassets/q2.pdf">Interim Report Q2 2026</a>`).length, 0);

    const scaEvents = parseScaCalendar(`<time dateTime='2026-10-23T06:00:00+00:00'></time><h3><a href="/en/investors/ir-calendar/2026/october-23---interim-report-q3-2026/">Interim report Q3 2026</a></h3><time dateTime='2026-09-01T06:00:00+00:00'></time><h3><a href="/en/investors/ir-calendar/2026/old/">Interim report Q2 2026</a></h3>`, NOW);
    assert.equal(scaEvents.length, 1);
    assert.equal(scaEvents[0]?.documentType, "report_date");
  });

  it("failar stängt för fel käll-URL och okänt bolag utan hämtning", async () => {
    let fetched = false;
    const fetchImpl = (() => {
      fetched = true;
      throw new Error("should not fetch");
    }) as typeof fetch;
    assert.deepEqual(await collectCompanySource("saab", {
      sourceType: "press_releases",
      sourceUrl: "https://www.saab.com/newsroom",
    }, { now: NOW, fetchImpl }), { status: "error", reason: "unexpected_source_url" });
    assert.deepEqual(await collectCompanySource("abb", {
      sourceType: "press_releases",
      sourceUrl: "https://global.abb/group/en/media",
    }, { now: NOW, fetchImpl }), { status: "error", reason: "unsupported_company" });
    assert.equal(fetched, false);
  });

  it("skapar inte en andra rad när samma dokument redan finns", () => {
    const document = parseScaPressReleases(`<time dateTime='2026-09-23T06:00:00+00:00'></time><h2><a href="/en/media/press-releases/2026/verified-release/">Verified SCA release</a></h2>`)[0]!;
    const again = parseScaPressReleases(`<time dateTime='2026-09-23T06:00:00+00:00'></time><h2><a href="/en/media/press-releases/2026/verified-release/">Verified SCA release</a></h2><time dateTime='2026-09-23T06:00:00+00:00'></time><h2><a href="/en/media/press-releases/2026/verified-release/">Verified SCA release</a></h2>`);
    assert.equal(again.length, 1);
    const merged = mergePersistedCompanyDocument(document, {
      source_url: document.sourceUrl,
      published_at: document.publishedAt,
      event_at: null,
      fiscal_period: "keep",
    });
    assert.equal(merged.source_url, document.sourceUrl);
    assert.equal(merged.fiscal_period, "keep");
  });
});
