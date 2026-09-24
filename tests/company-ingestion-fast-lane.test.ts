import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  ESSITY_CALENDAR_SOURCE_URL,
  ESSITY_ORIGIN,
  EVOLUTION_CALENDAR_SOURCE_URL,
  EVOLUTION_DOCUMENT_ORIGIN,
  EVOLUTION_ORIGIN,
  HM_ORIGIN,
  parseEssityCalendar,
  parseEssityFinancialReports,
  parseEssityPressReleases,
  parseEvolutionCalendar,
  parseEvolutionFinancialReports,
  parseEvolutionPressReleases,
  parseHmCalendar,
  parseHmFinancialReports,
  parseHmPressReleases,
} from "@/lib/companies/ingestion/adapters/omxs30-fast-lane";
import {
  companyDocumentOrigins,
  expectedCompanySourceUrl,
} from "@/lib/companies/ingestion/collect";
import {
  COMPANY_SOURCE_TYPES,
  validateNormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import { SUPPORTED_COMPANY_INGESTION_SLUGS } from "@/lib/companies/ingestion/queue";

const NOW = new Date("2026-09-24T12:00:00.000Z");
const SLUGS = ["evolution", "essity", "hm"] as const;

describe("OMXS30 first-party fast lane", () => {
  it("aktiverar bara Evolution, Essity och H&M med exakta https-källor", () => {
    const migration = readFileSync(
      new URL(
        "../supabase/migrations/20260924220000_seed_omxs30_fast_lane_company_sources.sql",
        import.meta.url,
      ),
      "utf8",
    );

    for (const slug of SLUGS) {
      assert.equal(SUPPORTED_COMPANY_INGESTION_SLUGS.includes(slug), true);
      assert.equal(migration.match(new RegExp(`'${slug}'`, "g"))?.length, 3);
      for (const sourceType of COMPANY_SOURCE_TYPES) {
        const url = expectedCompanySourceUrl(slug, sourceType);
        assert.match(migration, new RegExp(url.replaceAll(".", "\\.")));
        assert.equal(new URL(url).protocol, "https:");
      }
    }

    assert.equal(companyDocumentOrigins("evolution").includes(EVOLUTION_DOCUMENT_ORIGIN), true);
    assert.deepEqual(companyDocumentOrigins("essity"), [ESSITY_ORIGIN]);
    assert.deepEqual(companyDocumentOrigins("hm"), [HM_ORIGIN]);
    for (const blocked of ["addtech", "boliden", "epiroc", "industrivarden", "nordea", "seb", "swedbank", "tele2"]) {
      assert.equal(migration.includes(`'${blocked}'`), false);
      assert.equal(SUPPORTED_COMPANY_INGESTION_SLUGS.includes(blocked as never), false);
    }
  });

  it("läser verifierad markup och släpper igenom varken tredjepart eller datumlösa dokument", () => {
    const press = parseEvolutionPressReleases(`<p class="date-stamp">21/09/2026 - 08:00</p><a href="/investors/financial-publications/press-releases/verified-release"><strong>Verified Evolution release</strong></a><p class="date-stamp">21/09/2026 - 08:00</p><a href="https://storage.mfn.se/press.pdf"><strong>Delegated only</strong></a>`);
    assert.equal(press.length, 1);
    assert.equal(press[0]?.sourceUrl, "https://www.evolution.com/investors/financial-publications/press-releases/verified-release");
    assert.equal(validateNormalizedCompanyDocument(press[0]!, [EVOLUTION_ORIGIN]), true);

    const reports = parseEvolutionFinancialReports(`<tr><td>Evolution: Interim report January-June 2026</td><td>17/07/2026 - 07:30</td><td><a href="https://storage.mfn.se/bbf67910-dce3-4b0c-8228-de12e62c78f6/evo-q2-2026-07-17-eng.pdf">pdf</a><a href="https://storage.mfn.se/proxy/report.pdf?url=https%3A%2F%2Fmb.cision.com%2Fx">proxy</a></td></tr>`);
    assert.equal(reports.length, 1);
    assert.equal(reports[0]?.publishedAt, "2026-07-17T00:00:00.000Z");
    assert.equal(reports[0]?.sourceUrl.startsWith(`${EVOLUTION_DOCUMENT_ORIGIN}/`), true);
    assert.equal(parseEvolutionFinancialReports(`<tr><td>Interim report Q2 2026</td><td><a href="https://storage.mfn.se/bbf67910-dce3-4b0c-8228-de12e62c78f6/q2.pdf">pdf</a></td></tr>`).length, 0);

    const events = parseEvolutionCalendar(`<strong>23 October &#x27;26</strong></p><span class="text-text-font-2">Interim report January – September 2026</span><strong>1 September &#x27;26</strong></p><span class="text-text-font-2">Interim report Q2 2026</span>`, NOW);
    assert.equal(events.length, 1);
    assert.equal(events[0]?.eventAt, "2026-10-23T00:00:00.000Z");
    assert.equal(events[0]?.sourceUrl.startsWith(`${EVOLUTION_CALENDAR_SOURCE_URL}#`), true);

    const essityPress = parseEssityPressReleases(`<p class="date no-margin skeleton">September 23, 2026 - 14:50</p><h5><a href="/media/press-release/verified-release/F8677D0915C38A39"><span>Verified Essity release</span></a></h5>`);
    assert.equal(essityPress.length, 1);
    assert.equal(validateNormalizedCompanyDocument(essityPress[0]!, [ESSITY_ORIGIN]), true);
    assert.equal(parseEssityPressReleases(`<p class="date">September 23, 2026 - 14:50</p><a href="https://news.cision.com/x"><span>Cision</span></a>`).length, 0);

    const essityReports = parseEssityFinancialReports(`<div class="caption">July 16, 2026 - 07:00</div><a href="/investors/reports/reportdetails/interim-reports/report-for-quarter-2-2026">Report for quarter 2, 2026</a><a href="https://assets.www.essity.com/essity/Q2.pdf">Report for quarter 2, 2026</a>`);
    assert.equal(essityReports.length, 1);
    assert.equal(essityReports[0]?.sourceUrl, "https://www.essity.com/investors/reports/reportdetails/interim-reports/report-for-quarter-2-2026");
    assert.equal(essityReports[0]?.publishedAt, "2026-07-16T00:00:00.000Z");

    const essityEvents = parseEssityCalendar(`<h3><span class="skeleton">2026</span></h3><time class="date"><h3>22</h3><p class="month skeleton">Oct</p></time><span>Essity publishes the interim report quarter 3, 2026</span><time class="date"><h3>1</h3><p class="month">Oct</p></time><span>Silent period October 1 – 21, 2026</span>Past events`, NOW);
    assert.equal(essityEvents.length, 1);
    assert.equal(essityEvents[0]?.eventAt, "2026-10-22T00:00:00.000Z");
    assert.equal(essityEvents[0]?.sourceUrl.startsWith(`${ESSITY_CALENDAR_SOURCE_URL}#`), true);

    const hmPress = parseHmPressReleases(`<time datetime="2026-09-24T08:00:44+02:00"></time><a href="https://hmgroup.com/news/verified-nine-month-report-2026/">Nine-month report 2026</a><time datetime="2026-09-24T08:00:44+02:00"></time><a href="https://evil.example/news/fake/">Fake</a>`);
    assert.equal(hmPress.length, 1);
    assert.equal(validateNormalizedCompanyDocument(hmPress[0]!, [HM_ORIGIN]), true);

    const hmReports = parseHmFinancialReports(`<p>24 September 2026<br /> <a href="/wp-content/uploads/2026/09/H-M-Hennes-Mauritz-AB-Nine-month-report-2026.pdf">H &amp; M Hennes &amp; Mauritz AB Nine-month report 2026</a></p><p>26 March 2026<br /> <a href="/wp-content/uploads/2026/03/notes.zip">Notes</a></p>`);
    assert.equal(hmReports.length, 1);
    assert.equal(hmReports[0]?.documentType, "quarterly_report");
    assert.equal(hmReports[0]?.publishedAt, "2026-09-24T00:00:00.000Z");

    const hmEvents = parseHmCalendar(`<div class="hm-events__date">28 Jan 2027</div><div class="hm-events__title">Full-year report (1 Dec 2025 – 30 Nov 2026)</div><div class="hm-events__date">24 Sep 2026</div><div class="hm-events__title">Nine-month report</div><div class="hm-events__date">05 May 2027</div><div class="hm-events__title">Annual general meeting</div>`, NOW);
    assert.equal(hmEvents.length, 1);
    assert.equal(hmEvents[0]?.documentType, "report_date");
    assert.equal(hmEvents[0]?.eventAt, "2027-01-28T00:00:00.000Z");
  });
});
