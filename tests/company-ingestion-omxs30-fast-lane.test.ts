import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ALFA_LAVAL_ORIGIN,
  ASSA_ABLOY_ORIGIN,
  ASSA_ABLOY_PRESS_DETAIL_PREFIX,
  HANDELSBANKEN_ORIGIN,
  NIBE_ORIGIN,
  parseAlfaLavalFinancialNews,
  parseAlfaLavalReportCandidates,
  parseAlfaLavalReportPdf,
  parseAssaAbloyFinancialReports,
  parseAssaAbloyPressConfig,
  parseAssaAbloyPressReleases,
  parseHandelsbankenCalendar,
  parseHandelsbankenFinancialReports,
  parseNibeCalendar,
  parseNibePressReleases,
  parseNibeReportPdf,
} from "@/lib/companies/ingestion/adapters/omxs30-fast-lane";
import { validateNormalizedCompanyDocument } from "@/lib/companies/ingestion/document";

const NOW = new Date("2026-09-24T12:00:00.000Z");

function base64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

describe("OMXS30 fast lane parsers", () => {
  it("läser Alfa Lavals finansiella nyheter och rapport-PDF", () => {
    const html = `<div class="news-room-financial-news-block-content"><a class="news-room-single-financial-news" href="/media/news/investors/2026/alfa-laval-ab-publ-interim-report-1-april-30-june-2026/"><p class="news-block-date">July 21, 2026</p><p class="financial-news-block-title">Alfa Laval AB (publ) Interim report 1 April - 30 June 2026</p></a><a class="news-room-single-financial-news" href="https://evil.example/media/news/investors/2026/fake/"><p class="news-block-date">July 21, 2026</p><p class="financial-news-block-title">Fake</p></a></div></div>`;
    const press = parseAlfaLavalFinancialNews(html);
    assert.equal(press.length, 1);
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [ALFA_LAVAL_ORIGIN]), true);
    const candidate = parseAlfaLavalReportCandidates(html)[0]!;
    const report = parseAlfaLavalReportPdf(`<a href="https://www.alfalaval.com/contentassets/d17d9f898dbd4387b3ee7cf206c2af19/wkr0006.pdf" title="Press release as PDF">Press release as PDF</a><a href="/contentassets/x/presentation.pdf">Presentation</a>`, candidate);
    assert.equal(report?.sourceUrl.endsWith("/wkr0006.pdf"), true);
    assert.equal(report?.publishedAt, "2026-07-21T00:00:00.000Z");
    assert.equal(parseAlfaLavalReportPdf(`<a href="/contentassets/x/presentation.pdf">Presentation</a>`, candidate), null);
  });

  it("läser ASSA ABLOY bara från den inbäddade JSON-källan", () => {
    const config = base64(JSON.stringify({
      url: "/rest/api/v1/press-releases.en.json",
      detailedPageUrl: ASSA_ABLOY_PRESS_DETAIL_PREFIX,
    }));
    assert.equal(parseAssaAbloyPressConfig(`<gw-group-press-releases-list content="${config}"></gw-group-press-releases-list>`), true);
    assert.equal(parseAssaAbloyPressConfig(`<div content="${base64(JSON.stringify({ url: "/rest/api/v1/other.json" }))}"></div>`), false);

    const press = parseAssaAbloyPressReleases(JSON.stringify({
      items: [
        { id: "c1579119935a1298", title: "Quarterly Report Q2 2026", publishDate: "2026-07-17T08:00:00+02:00" },
        { id: "not-hex", title: "Quarterly Report Q1 2026", publishDate: "2026-04-28T08:00:00+02:00" },
      ],
    }));
    assert.equal(press.length, 1);
    assert.equal(press[0]?.sourceUrl, `${ASSA_ABLOY_PRESS_DETAIL_PREFIX}.c1579119935a1298`);
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [ASSA_ABLOY_ORIGIN]), true);

    const archive = base64(JSON.stringify({
      columns: [{
        assetsAndLinks: [{
          links: [
            { title: "Q2 Report 2026", fileFormat: "pdf", url: "https://www.assaabloy.com/group/en/documents/investors/interim-reports/2026/Q2%20Report%202026.pdf" },
            { title: "Q1 Report 2026", fileFormat: "pdf", url: "https://evil.example/q1.pdf" },
          ],
        }],
      }],
    }));
    const reports = parseAssaAbloyFinancialReports(`<div content="${archive}"></div>`, JSON.stringify({
      items: [{ id: "c1579119935a1298", title: "Quarterly Report Q2 2026", publishDate: "2026-07-17T08:00:00+02:00" }],
    }));
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.publishedAt, "2026-07-17T06:00:00.000Z");
    assert.equal(reports[0]?.documentType, "quarterly_report");
  });

  it("läser Handelsbankens kalender och senaste rapport från samma sida", () => {
    const html = `<span class="TwoLineHeading-module__lineOne">Interim Report</span> <span class="TwoLineHeading-module__lineTwo">January–June 2026</span><a href="/tron/xgpu/info/contents/v1/document/72-282351">Download report</a><h3>2026</h3><div class="shb-cms-table-list__item-data-block"><div>15 July</div></div><div class="shb-cms-table-list__item-data-block"><div>Interim Report January–June</div></div><div class="shb-cms-table-list__item-data-block"><div>21 October</div></div><div class="shb-cms-table-list__item-data-block"><div>Interim Report January–September</div></div><div class="shb-cms-table-list__item-data-block"><div>8–21 April</div></div><div class="shb-cms-table-list__item-data-block"><div>Silent period</div></div>`;
    const reports = parseHandelsbankenFinancialReports(html);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.publishedAt, "2026-07-15T00:00:00.000Z");
    assert.equal(validateNormalizedCompanyDocument(reports[0]!, [HANDELSBANKEN_ORIGIN]), true);
    const events = parseHandelsbankenCalendar(html, NOW);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.documentType, "report_date");
    assert.equal(events[0]?.title.includes("January–September"), true);
  });

  it("läser NIBE-nyheter, rapport-PDF och kommande rapportdatum", () => {
    const news = `<time class="smallxgrey" datetime="2026-05-19T08:00:00+02:00">5/19/2026 8:00 AM</time><h3 class="sv-font-h3-r"><a href="/investors/pm-news-reports/2026---news-reports/2026-05-19-interim-report-1-2026-q1"><span>Interim report 1, 2026 (Q1)</span></a></h3>`;
    const press = parseNibePressReleases(news);
    assert.equal(press.length, 1);
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [NIBE_ORIGIN]), true);
    const report = parseNibeReportPdf(`<a href="/download/18.39edb3519e022fddbd637/1779172899766/GB-NIBE-Q1-report-2026-F1.pdf">Interim report 1, 2026 pdf</a><a href="/download/18.e89c2f619e48bd89d31ab/1779353111073/PPT-Q1-2026-F2.pdf">ppt presentation</a>`, {
      detailUrl: press[0]!.sourceUrl,
      title: press[0]!.title,
      publishedAt: press[0]!.publishedAt!,
    });
    assert.equal(report?.sourceUrl.endsWith("GB-NIBE-Q1-report-2026-F1.pdf"), true);
    const events = parseNibeCalendar(`<h2 id="h-NextReport">Next Report</h2><h2>Interim report</h2><h2>Q3 2026</h2><p class="normal">23.11. 2026, 08.00</p><h2 id="h-NextTelefonkonference">Next Telefonkonference</h2><p class="normal">23.11. 2026, 11.00</p><small class="smallxgrey">21 August 2026 08:00</small><a href="/investors/calendar-2025-2026/q3-2026/past">Interim report, Q2, January – June 2026</a><small class="smallxgrey">17 November 2026 08:00</small><a href="/investors/calendar-2025-2026/q4-2026/2026-11-17-interim-report-q3">Interim report Q3, January – September 2026</a>`, NOW);
    assert.equal(events.length, 2);
    assert.equal(events.some((event) => event.eventAt === "2026-11-23T00:00:00.000Z" && event.title === "Interim report Q3 2026"), true);
    assert.equal(events.some((event) => event.title.includes("Telefonkonference")), false);
  });
});
