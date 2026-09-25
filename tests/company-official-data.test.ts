import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { planBaselineRefresh, shouldRefreshCompanySource } from "@/lib/companies/ingestion/baseline";
import {
  companyFactRows,
  companyOwnershipRows,
  validateCompanyFact,
  validateCompanyOwnership,
} from "@/lib/companies/ingestion/facts";
import { runCompanyIngestionJob } from "@/lib/companies/ingestion/run-job";
import type { CompanyIngestionOrchestratorStore, OfficialCompanySource } from "@/lib/companies/ingestion/store";
import { officialPanelCopy } from "@/lib/companies/official-copy";
import { COMPANY_OFFICIAL_COVERAGE } from "@/lib/companies/official-coverage";
import {
  assembleCompanyOfficialData,
  officialDividendYieldPercent,
  overlayInvestorLiveData,
  type CompanyOfficialData,
} from "@/lib/companies/official-data";
import { getPilotCompanies } from "@/lib/companies/catalog";

const NOW = new Date("2026-09-25T12:00:00.000Z");
const ORIGIN = "https://www.investorab.com";

function baseInput(overrides: Partial<Parameters<typeof assembleCompanyOfficialData>[0]> = {}) {
  return {
    slug: "addtech",
    pressReleasesUrl: "https://www.addtech.com/investors-and-media/press-releases",
    reportsUrl: "https://www.addtech.com/investors-and-media/financial-reports",
    calendarUrl: "https://www.addtech.com/investors-and-media/financial-calendar",
    profileUrl: "https://www.addtech.com/investors-and-media/press-releases",
    documents: [],
    documentQuery: "ok" as const,
    facts: [],
    ownership: [],
    profileQuery: "ok" as const,
    sources: [],
    now: NOW,
    ...overrides,
  };
}

describe("company official data contract", () => {
  it("builds the same sections for every company and keeps Investor content on the generic path", () => {
    const persisted = assembleCompanyOfficialData(baseInput({
      slug: "investor",
      documents: [{
        type: "press_release",
        title: "Investor press",
        url: "https://www.investorab.com/investors-media/press-releases/verified",
        publishedAt: "2026-09-24T00:00:00.000Z",
        eventAt: null,
      }],
      facts: [{
        factType: "ceo",
        valueText: "Christian Cederholm",
        valueNumeric: null,
        unit: null,
        asOf: "2026-09-25",
        sourceUrl: "https://www.investorab.com/about-investor/board-management/executive-leadership-team",
        sourcePublisher: "Investor AB",
      }],
      ownership: [{
        ownerName: "Wallenberg Foundations",
        capitalPct: 23.3,
        votesPct: 50,
        asOf: "2026-06-30",
        sourceUrl: "https://www.investorab.com/investors-media/the-investor-share/ownership-structure",
        sourcePublisher: "Investor AB",
      }],
    }));
    assert.equal(persisted.pressReleases.items[0]?.title, "Investor press");
    assert.equal(persisted.ceo.name, "Christian Cederholm");
    assert.equal(persisted.ownership.items[0]?.sourcePublisher, "Investor AB");
    assert.equal(persisted.ownership.asOf, "2026-06-30");

    const overlaid = overlayInvestorLiveData(assembleCompanyOfficialData(baseInput({ slug: "investor" })), {
      pressReleases: [{ title: "Live press", date: "2026-09-20", url: "https://www.investorab.com/live" }],
      reports: [{ title: "Q2 Report", date: "2026-07-17", url: "https://www.investorab.com/q2.pdf" }],
      events: [{ title: "Q3 report", date: "2026-10-17", url: "https://www.investorab.com/calendar" }],
      ownership: [{ owner: "Wallenberg Foundations", capitalPct: 23.3, votesPct: 50 }],
      ownershipAsOf: "2026-06-30",
      ceo: "Christian Cederholm",
      dividendPerShare: 5.2,
      dividendCurrency: "SEK",
      dividendYear: null,
    });
    assert.equal(overlaid.pressReleases.status, "available_with_items");
    assert.equal(overlaid.ceo.name, "Christian Cederholm");
    assert.equal(overlaid.dividend.perShare, 5.2);
    assert.equal(overlaid.dividend.currency, "SEK");
    assert.equal(overlaid.ownership.items[0]?.sourceUrl?.startsWith(ORIGIN), true);
  });

  it("uses truthful Addtech states instead of a false fetch error", () => {
    const pending = assembleCompanyOfficialData(baseInput());
    assert.equal(pending.events.status, "source_link_only");
    assert.equal(pending.reports.status, "source_link_only");
    assert.match(officialPanelCopy("calendar", pending.events.status).text, /officiella kalender/);
    assert.match(officialPanelCopy("reports", pending.reports.status).text, /officiella rapportarkiv/);
    assert.doesNotMatch(officialPanelCopy("calendar", pending.events.status).text, /kunde inte hämtas/);

    const failed = assembleCompanyOfficialData(baseInput({
      sources: [{
        sourceType: "financial_calendar",
        sourceUrl: "https://www.addtech.com/investors-and-media/financial-calendar",
        publisher: "Addtech",
        supportMode: "automated",
        lastCheckedAt: "2026-09-25T00:00:00.000Z",
        lastSuccessAt: null,
        lastFailureReason: "listing_http_403",
      }],
    }));
    assert.equal(failed.events.status, "temporarily_unavailable");
    assert.match(officialPanelCopy("calendar", failed.events.status).text, /kunde inte hämtas just nu/);

    const empty = assembleCompanyOfficialData(baseInput({
      sources: [{
        sourceType: "financial_calendar",
        sourceUrl: "https://www.addtech.com/investors-and-media/financial-calendar",
        publisher: "Addtech",
        supportMode: "automated",
        lastCheckedAt: "2026-09-25T00:00:00.000Z",
        lastSuccessAt: "2026-09-25T00:00:00.000Z",
        lastFailureReason: null,
      }],
    }));
    assert.equal(empty.events.status, "available_empty");
    assert.match(officialPanelCopy("calendar", empty.events.status).text, /Inga kommande finansiella händelser/);
    assert.equal(officialPanelCopy("press", "schema_unavailable").text, "Bolagsdata är inte tillgänglig i den här miljön.");
  });

  it("keeps only future report dates and does not annualize an incompatible dividend", () => {
    const data = assembleCompanyOfficialData(baseInput({
      slug: "volvo",
      documents: [
        {
          type: "report_date",
          title: "Q3",
          url: "https://www.volvogroup.com/calendar#q3",
          publishedAt: null,
          eventAt: "2026-10-23T05:20:00.000Z",
        },
        {
          type: "report_date",
          title: "Old",
          url: "https://www.volvogroup.com/calendar#old",
          publishedAt: null,
          eventAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    }));
    assert.deepEqual(data.events.items.map((item) => item.title), ["Q3"]);
    const dividend: CompanyOfficialData["dividend"] = {
      status: "available_with_items",
      perShare: 5,
      currency: "USD",
      year: 2026,
      sourceUrl: ORIGIN,
      sourcePublisher: "Investor AB",
      asOf: "2026-09-25",
    };
    assert.equal(officialDividendYieldPercent({ dividend, price: 100, marketCurrency: "SEK" }), null);
    assert.equal(officialDividendYieldPercent({
      dividend: { ...dividend, currency: "SEK" },
      price: 200,
      marketCurrency: "SEK",
    }), 2.5);
  });

  it("persists CEO, ownership and dividend with source attribution and rejects duplicates", () => {
    const facts = companyFactRows([
      {
        factType: "ceo",
        valueText: "Christian Cederholm",
        valueNumeric: null,
        unit: null,
        asOf: "2026-09-25",
        sourceUrl: `${ORIGIN}/about-investor/board-management/executive-leadership-team`,
        sourcePublisher: "Investor AB",
      },
      {
        factType: "dividend_per_share",
        valueText: null,
        valueNumeric: 5.2,
        unit: "SEK",
        asOf: "2026-09-25",
        sourceUrl: `${ORIGIN}/investors-media/the-investor-share/dividend-and-dividend-policy`,
        sourcePublisher: "Investor AB",
      },
    ], [ORIGIN], "2026-09-25T12:00:00.000Z");
    assert.equal(facts?.[0]?.source_publisher, "Investor AB");
    assert.equal(facts?.[1]?.source_url.startsWith("https://"), true);
    assert.equal(companyFactRows([
      facts![0] && {
        factType: "ceo",
        valueText: "A",
        valueNumeric: null,
        unit: null,
        asOf: null,
        sourceUrl: `${ORIGIN}/a`,
        sourcePublisher: "Investor AB",
      },
      {
        factType: "ceo",
        valueText: "B",
        valueNumeric: null,
        unit: null,
        asOf: null,
        sourceUrl: `${ORIGIN}/b`,
        sourcePublisher: "Investor AB",
      },
    ], [ORIGIN], "2026-09-25T12:00:00.000Z"), null);
    assert.equal(validateCompanyFact({
      factType: "ceo",
      valueText: "Name",
      valueNumeric: null,
      unit: null,
      asOf: null,
      sourceUrl: "https://evil.example/ceo",
      sourcePublisher: "Investor AB",
    }, [ORIGIN]), false);

    const owners = companyOwnershipRows([{
      ownerName: "Wallenberg Foundations",
      capitalPct: 23.3,
      votesPct: 50,
      asOf: "2026-06-30",
      sourceUrl: `${ORIGIN}/investors-media/the-investor-share/ownership-structure`,
      sourcePublisher: "Investor AB",
    }], [ORIGIN], "2026-09-25T12:00:00.000Z");
    assert.equal(owners?.[0]?.source_publisher, "Investor AB");
    assert.equal(validateCompanyOwnership({
      ownerName: "Guessed",
      capitalPct: 10,
      votesPct: null,
      asOf: null,
      sourceUrl: "http://www.investorab.com/owners",
      sourcePublisher: "Investor AB",
    }, [ORIGIN]), false);
    assert.equal(companyOwnershipRows([], [ORIGIN], "2026-09-25T12:00:00.000Z"), null);
  });

  it("refreshes uninitialized companies before stale followed companies and still includes unfollowed companies", () => {
    const planned = planBaselineRefresh({
      now: NOW,
      limit: 2,
      companies: [
        {
          slug: "addtech",
          followed: false,
          sources: [{ supportMode: "automated", lastCheckedAt: null }],
        },
        {
          slug: "investor",
          followed: true,
          sources: [{ supportMode: "automated", lastCheckedAt: "2026-09-20T00:00:00.000Z" }],
        },
        {
          slug: "volvo",
          followed: false,
          sources: [{ supportMode: "automated", lastCheckedAt: null }],
        },
        {
          slug: "abb",
          followed: false,
          sources: [{ supportMode: "blocked", lastCheckedAt: null }],
        },
      ],
    });
    assert.deepEqual(planned, ["addtech", "volvo"]);
    const followedFirst = planBaselineRefresh({
      now: NOW,
      limit: 1,
      companies: [
        { slug: "volvo", followed: false, sources: [{ supportMode: "automated", lastCheckedAt: null }] },
        { slug: "investor", followed: true, sources: [{ supportMode: "automated", lastCheckedAt: null }] },
      ],
    });
    assert.deepEqual(followedFirst, ["investor"]);
    assert.equal(shouldRefreshCompanySource({
      jobType: "baseline_refresh",
      supportMode: "blocked",
      lastCheckedAt: null,
      now: NOW,
    }), false);
    assert.equal(shouldRefreshCompanySource({
      jobType: "initial_sync",
      supportMode: "automated",
      lastCheckedAt: "2026-09-25T00:00:00.000Z",
      now: NOW,
    }), false);
    assert.equal(shouldRefreshCompanySource({
      jobType: "baseline_refresh",
      supportMode: "automated",
      lastCheckedAt: "2026-09-20T00:00:00.000Z",
      now: NOW,
    }), true);
    assert.equal(shouldRefreshCompanySource({
      jobType: "baseline_refresh",
      supportMode: "automated",
      lastCheckedAt: "2026-09-25T00:00:00.000Z",
      now: NOW,
    }), false);
    assert.equal(shouldRefreshCompanySource({
      jobType: "baseline_refresh",
      supportMode: "automated",
      lastCheckedAt: "2026-09-24T15:00:00.000Z",
      now: NOW,
    }), true);
  });

  it("drains the supported universe in three daily batches of eight", () => {
    const companies = Array.from({ length: 17 }, (_, index) => ({
      slug: `company-${index}`,
      followed: index === 16,
      sources: [{ supportMode: "automated" as const, lastCheckedAt: null as string | null }],
    }));
    const first = planBaselineRefresh({ now: NOW, companies });
    assert.equal(first.length, 8);
    assert.equal(first[0], "company-16");

    const markChecked = (
      rows: typeof companies,
      slugs: readonly string[],
    ) => rows.map((company) => (
      slugs.includes(company.slug)
        ? { ...company, sources: [{ supportMode: "automated" as const, lastCheckedAt: NOW.toISOString() }] }
        : company
    ));
    const second = planBaselineRefresh({ now: NOW, companies: markChecked(companies, first) });
    assert.equal(second.length, 8);
    const third = planBaselineRefresh({
      now: NOW,
      companies: markChecked(markChecked(companies, first), second),
    });
    assert.deepEqual(third, ["company-15"]);
    assert.equal(new Set([...first, ...second, ...third]).size, 17);
  });

  it("does not fabricate documents from a blocked source", async () => {
    const saved: string[] = [];
    const source: OfficialCompanySource = {
      id: "99970661-3c0b-4d3f-a0ce-cd03dd45f611",
      sourceType: "press_releases",
      sourceUrl: "https://www.boliden.com/investor-relations/",
      publisher: "Boliden",
      lastCheckedAt: null,
      supportMode: "blocked",
      lastSuccessAt: null,
      lastFailureReason: null,
    };
    const store = {
      async loadCompany() {
        return { status: "ok", company: { id: "fd31b206-b20a-4183-9e98-a5af9545c458", slug: "saab" } };
      },
      async loadOfficialSources() {
        return { status: "ok", sources: [source, { ...source, id: "99970661-3c0b-4d3f-a0ce-cd03dd45f612", sourceType: "financial_reports" }, { ...source, id: "99970661-3c0b-4d3f-a0ce-cd03dd45f613", sourceType: "financial_calendar" }] };
      },
      async saveDocuments() {
        saved.push("documents");
        return true;
      },
      async saveFacts() {
        saved.push("facts");
        return true;
      },
      async replaceOwnership() {
        saved.push("ownership");
        return true;
      },
      async markSourceChecked() {
        return true;
      },
      async markSourceFailure() {
        return true;
      },
      async markSourceSupport() {
        return true;
      },
      async loadOfficialSource() {
        return { status: "error" };
      },
      async savePressReleases() {
        return false;
      },
      async completeJob() {
        return true;
      },
      async retryOrFailJob() {
        return true;
      },
    } as CompanyIngestionOrchestratorStore;
    const result = await runCompanyIngestionJob({
      id: "6bb70661-3c0b-4d3f-a0ce-cd03dd45f610",
      companyId: "fd31b206-b20a-4183-9e98-a5af9545c458",
      jobType: "baseline_refresh",
      attempts: 1,
    }, { store, now: () => NOW, sleep: async () => undefined });
    assert.deepEqual(result, { status: "completed", savedDocuments: 0 });
    assert.deepEqual(saved, []);
  });

  it("covers every followable company without fake owners or Börskollen", () => {
    const page = readFileSync(new URL("../app/bolag/[slug]/page.tsx", import.meta.url), "utf8");
    const ingestion = readFileSync(new URL("../lib/companies/ingestion/collect.ts", import.meta.url), "utf8");
    assert.doesNotMatch(page, /slug === "investor" \? getInvestorOfficialData/);
    assert.doesNotMatch(`${page}\n${ingestion}`, /börskollen|borskollen/i);
    for (const company of getPilotCompanies()) {
      const coverage = COMPANY_OFFICIAL_COVERAGE[company.slug];
      assert.ok(coverage, company.slug);
      for (const category of ["press", "reports", "calendar", "ceo", "ownership", "dividend"] as const) {
        assert.match(coverage[category].href, /^https:\/\//);
        assert.equal("owner" in coverage[category], false);
      }
    }
  });
});
