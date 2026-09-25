import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ESSITY_CALENDAR_SOURCE_URL,
  ESSITY_ORIGIN,
  HM_ORIGIN,
  parseEssityCalendar,
  parseEssityFinancialReports,
  parseEssityPressReleases,
  parseHmCalendar,
  parseHmFinancialReports,
  parseHmPressReleases,
} from "@/lib/companies/ingestion/adapters/omxs30-essity-hm";
import {
  companyDocumentOrigins,
  expectedCompanySourceUrl,
} from "@/lib/companies/ingestion/collect";
import { COMPANY_SOURCE_TYPES, validateNormalizedCompanyDocument } from "@/lib/companies/ingestion/document";
import { SUPPORTED_COMPANY_INGESTION_SLUGS } from "@/lib/companies/ingestion/queue";

const NOW = new Date("2026-09-24T12:00:00.000Z");

describe("OMXS30 Essity/H&M ingestion", () => {
  it("registers exact HTTPS sources and origins", () => {
    for (const slug of ["essity", "hm"] as const) {
      assert.equal(SUPPORTED_COMPANY_INGESTION_SLUGS.includes(slug), true);
      for (const type of COMPANY_SOURCE_TYPES) {
        assert.equal(new URL(expectedCompanySourceUrl(slug, type)).protocol, "https:");
      }
    }
    assert.deepEqual(companyDocumentOrigins("essity"), [ESSITY_ORIGIN]);
    assert.deepEqual(companyDocumentOrigins("hm"), [HM_ORIGIN]);
  });

  it("parses Essity only from verified same-origin markup", () => {
    const press = parseEssityPressReleases(`<p class="date no-margin skeleton">September 23, 2026 - 14:50</p><h5><a href="/media/press-release/verified-release/F8677D0915C38A39"><span>Verified Essity release</span></a></h5>`);
    assert.equal(press.length, 1);
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [ESSITY_ORIGIN]), true);
    assert.equal(parseEssityPressReleases(`<p class="date">September 23, 2026 - 14:50</p><a href="https://evil.example/x"><span>Bad</span></a>`).length, 0);

    const reports = parseEssityFinancialReports(`<div class="caption">July 16, 2026 - 07:00</div><a href="/investors/reports/reportdetails/interim-reports/report-for-quarter-2-2026">Report for quarter 2, 2026</a>`);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.publishedAt, "2026-07-16T00:00:00.000Z");

    const events = parseEssityCalendar(`<h3><span class="skeleton">2026</span></h3><time class="date"><h3>22</h3><p class="month skeleton">Oct</p></time><span>Essity publishes the interim report quarter 3, 2026</span>Past events`, NOW);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.sourceUrl.startsWith(`${ESSITY_CALENDAR_SOURCE_URL}#`), true);
  });

  it("parses H&M reports/news/calendar and rejects foreign URLs", () => {
    const press = parseHmPressReleases(`<time datetime="2026-09-24T08:00:44+02:00"></time><a href="https://hmgroup.com/news/verified-nine-month-report-2026/">Nine-month report 2026</a><time datetime="2026-09-24T08:00:44+02:00"></time><a href="https://evil.example/news/fake/">Fake</a>`);
    assert.equal(press.length, 1);
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [HM_ORIGIN]), true);

    const reports = parseHmFinancialReports(`<p>24 September 2026<br /> <a href="/wp-content/uploads/2026/09/H-M-Hennes-Mauritz-AB-Nine-month-report-2026.pdf">H &amp; M Hennes &amp; Mauritz AB Nine-month report 2026</a></p>`);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.documentType, "quarterly_report");

    const events = parseHmCalendar(`<div class="hm-events__date">28 Jan 2027</div><div class="hm-events__title">Full-year report (1 Dec 2025 – 30 Nov 2026)</div><div class="hm-events__date">05 May 2027</div><div class="hm-events__title">Annual general meeting</div>`, NOW);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.eventAt, "2027-01-28T00:00:00.000Z");
  });
});
