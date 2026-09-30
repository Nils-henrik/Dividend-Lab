import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getCompanyProfile } from "../lib/companies/catalog";
import {
  NIBE_MFN_FEED_ID,
  NIBE_MFN_LEI,
  NIBE_MFN_PUBLISHER,
  nibeMfnFeedUrl,
} from "../lib/companies/mfn-feed";
import {
  officialItemsConflict,
  officialSectionNeedsMfnBackup,
  withNibeOfficialDisclosureFallback,
} from "../lib/companies/nibe-official-fallback";
import { assembleCompanyOfficialData, type CompanyOfficialData } from "../lib/companies/official-data";
import type { CompanyFollowState } from "../lib/companies/server";
import "./shims/register-server-only.mjs";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const NIBE_FIXTURE = JSON.stringify({
  version: "https://www.mfn.se/feed/version/1",
  items: [
    {
      news_id: "report-1",
      url: "https://feed.mfn.se/v1/feed/f9cedcd2-6006-4325-bb43-6ffb51e93b6b/item/report-1.html",
      author: { entity_id: NIBE_MFN_FEED_ID, leis: [NIBE_MFN_LEI] },
      properties: { type: "ir", tags: ["sub:report", "sub:report:interim"] },
      content: {
        title: "NIBE Industrier AB (publ), Interim Report 2, 2026",
        publish_date: "2026-08-21T06:00:00Z",
      },
    },
    {
      news_id: "press-1",
      url: "https://feed.mfn.se/v1/feed/f9cedcd2-6006-4325-bb43-6ffb51e93b6b/item/press-1.html",
      author: { entity_id: NIBE_MFN_FEED_ID, leis: [NIBE_MFN_LEI] },
      properties: { type: "ir", tags: [":regulatory"] },
      content: {
        title: "Dividend proposal is not a paid dividend fact",
        publish_date: "2026-08-20T06:00:00Z",
      },
    },
    {
      news_id: "foreign-1",
      url: "https://feed.mfn.se/v1/feed/other/item/foreign-1.html",
      author: { entity_id: "other-feed", leis: ["00000000000000000000"] },
      properties: { type: "ir", tags: ["sub:report"] },
      content: { title: "Wrong issuer", publish_date: "2026-08-19T06:00:00Z" },
    },
  ],
});

const FOREIGN_FIXTURE = JSON.stringify({
  version: "https://www.mfn.se/feed/version/1",
  items: [{
    news_id: "foreign-1",
    url: "https://feed.mfn.se/a.html",
    author: { entity_id: "other-feed", leis: ["00000000000000000000"] },
    properties: { type: "ir", tags: ["sub:report"] },
    content: { title: "Wrong issuer", publish_date: "2026-08-21T06:00:00Z" },
  }],
});

function nibe() {
  const company = getCompanyProfile("nibe");
  assert.ok(company);
  assert.equal(company.fiLei, NIBE_MFN_LEI);
  return company;
}

function emptyFollow(): CompanyFollowState {
  return { companyId: null, isAvailable: false, isFollowing: false, documents: [] };
}

function jsonFetch(body: string, calls: string[]): typeof fetch {
  return async (input) => {
    calls.push(String(input));
    return new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
}

function assembled(overrides: Partial<Parameters<typeof assembleCompanyOfficialData>[0]> = {}) {
  const company = nibe();
  return assembleCompanyOfficialData({
    slug: company.slug,
    pressReleasesUrl: company.pressReleasesUrl,
    reportsUrl: company.reportsUrl,
    calendarUrl: company.calendarUrl,
    profileUrl: company.websiteUrl,
    documents: [],
    documentQuery: "ok",
    facts: [],
    ownership: [],
    profileQuery: "ok",
    sources: [],
    ...overrides,
  });
}

test("official loader backup states match missing and unavailable reads", () => {
  assert.equal(officialSectionNeedsMfnBackup("temporarily_unavailable"), true);
  assert.equal(officialSectionNeedsMfnBackup("schema_unavailable"), true);
  assert.equal(officialSectionNeedsMfnBackup("available_empty"), true);
  assert.equal(officialSectionNeedsMfnBackup("available_with_items"), false);
  assert.equal(officialSectionNeedsMfnBackup("source_link_only"), false);
  assert.equal(officialSectionNeedsMfnBackup("blocked"), false);
  assert.equal(officialItemsConflict(
    [{ title: "A", date: "2026-08-20", url: "https://feed.mfn.se/a" }],
    [{ title: "B", date: "2026-08-20", url: "https://feed.mfn.se/a" }],
  ), true);
  assert.equal(officialItemsConflict(
    [{ title: "A", date: "2026-08-20", url: "https://feed.mfn.se/a" }],
    [{ title: "B", date: "2026-08-21", url: "https://feed.mfn.se/b" }],
  ), false);
});

test("the company official-data loader uses MFN when NIBE primary disclosures are unavailable", async () => {
  const { loadCompanyOfficialData } = await import("../lib/companies/official-data.server.ts");
  const calls: string[] = [];
  const official = await loadCompanyOfficialData(nibe(), emptyFollow(), jsonFetch(NIBE_FIXTURE, calls));
  assert.deepEqual(calls, [nibeMfnFeedUrl()]);
  assert.equal(official.pressReleases.status, "available_with_items");
  assert.equal(official.pressReleases.items.length, 1);
  assert.equal(official.pressReleases.items[0]?.title, "Dividend proposal is not a paid dividend fact");
  assert.equal(official.pressReleases.items[0]?.date, "2026-08-20");
  assert.equal(
    official.pressReleases.items[0]?.url,
    "https://feed.mfn.se/v1/feed/f9cedcd2-6006-4325-bb43-6ffb51e93b6b/item/press-1.html",
  );
  assert.equal(official.pressReleases.sourcePublisher, NIBE_MFN_PUBLISHER);
  assert.equal(official.pressReleases.sourceUrl, nibeMfnFeedUrl());
  assert.equal(official.pressReleases.asOf, "2026-08-20T06:00:00.000Z");
  assert.equal(official.reports.status, "available_with_items");
  assert.equal(official.reports.items.length, 1);
  assert.equal(official.reports.items[0]?.title, "NIBE Industrier AB (publ), Interim Report 2, 2026");
  assert.equal(official.reports.items[0]?.date, "2026-08-21");
  assert.equal(official.reports.sourcePublisher, NIBE_MFN_PUBLISHER);
  assert.equal(official.reports.sourceUrl, nibeMfnFeedUrl());
  assert.equal(official.reports.asOf, "2026-08-21T06:00:00.000Z");
  assert.equal(official.reports.items.some((item) => item.title === official.pressReleases.items[0]?.title), false);
  assert.equal(official.dividend.perShare, null);
  assert.equal(official.dividend.status === "available_with_items", false);
  assert.equal(official.events.status, "schema_unavailable");
  assert.equal(official.events.items.length, 0);
  assert.match(read("lib/companies/official-data.server.ts"), /withNibeOfficialDisclosureFallback/);
  assert.match(read("lib/companies/nibe-official-fallback.ts"), /readNibeMfnFeed\(/);
  assert.match(read("lib/companies/page-data.server.ts"), /getCompanyOfficialData\(/);
});

test("NIBE primary documents stay primary and do not fetch MFN", async () => {
  const { loadCompanyOfficialData } = await import("../lib/companies/official-data.server.ts");
  const calls: string[] = [];
  const official = await loadCompanyOfficialData(nibe(), {
    ...emptyFollow(),
    documents: [
      {
        id: "press",
        type: "press_release",
        title: "Primary press",
        url: "https://www.nibegroup.com/news/primary",
        publisher: "NIBE",
        publishedAt: "2026-08-01T06:00:00.000Z",
        eventAt: null,
        fiscalPeriod: null,
      },
      {
        id: "report",
        type: "quarterly_report",
        title: "Primary report",
        url: "https://www.nibegroup.com/reports/primary",
        publisher: "NIBE",
        publishedAt: "2026-08-02T06:00:00.000Z",
        eventAt: null,
        fiscalPeriod: null,
      },
    ],
  }, jsonFetch(NIBE_FIXTURE, calls));
  assert.deepEqual(calls, []);
  assert.equal(official.pressReleases.items[0]?.title, "Primary press");
  assert.equal(official.pressReleases.sourcePublisher, null);
  assert.equal(official.reports.items[0]?.title, "Primary report");
});

test("stored NIBE press stays in place while missing reports fail over once", async () => {
  const { loadCompanyOfficialData } = await import("../lib/companies/official-data.server.ts");
  const calls: string[] = [];
  const official = await loadCompanyOfficialData(nibe(), {
    ...emptyFollow(),
    documents: [{
      id: "press",
      type: "press_release",
      title: "Primary press",
      url: "https://www.nibegroup.com/news/primary",
      publisher: "NIBE",
      publishedAt: "2026-08-01T06:00:00.000Z",
      eventAt: null,
      fiscalPeriod: null,
    }],
  }, jsonFetch(NIBE_FIXTURE, calls));
  assert.deepEqual(calls, [nibeMfnFeedUrl()]);
  assert.deepEqual(official.pressReleases.items.map((item) => item.title), ["Primary press"]);
  assert.equal(official.reports.items.length, 1);
  assert.equal(official.reports.sourcePublisher, NIBE_MFN_PUBLISHER);
  assert.equal(official.dividend.perShare, null);
});

test("MFN foreign issuer is rejected by the official-data loader", async () => {
  const { loadCompanyOfficialData } = await import("../lib/companies/official-data.server.ts");
  const calls: string[] = [];
  const official = await loadCompanyOfficialData(nibe(), emptyFollow(), jsonFetch(FOREIGN_FIXTURE, calls));
  assert.equal(calls.length, 1);
  assert.equal(official.pressReleases.status, "schema_unavailable");
  assert.equal(official.pressReleases.items.length, 0);
  assert.equal(official.reports.items.length, 0);
  assert.equal(official.dividend.perShare, null);
});

test("other companies and a mismatched NIBE LEI do not call MFN", async () => {
  const { loadCompanyOfficialData } = await import("../lib/companies/official-data.server.ts");
  const volvo = getCompanyProfile("volvo");
  assert.ok(volvo);
  let fetches = 0;
  const fetchImpl: typeof fetch = async () => {
    fetches += 1;
    throw new Error("must_not_fetch");
  };
  const other = await loadCompanyOfficialData(volvo, emptyFollow(), fetchImpl);
  const wrongLei = await loadCompanyOfficialData({ ...nibe(), fiLei: "WRONG" }, emptyFollow(), fetchImpl);
  assert.equal(fetches, 0);
  assert.equal(other.pressReleases.status, "schema_unavailable");
  assert.equal(wrongLei.pressReleases.items.length, 0);
  assert.equal(wrongLei.reports.items.length, 0);
});

test("stored empty and failed NIBE primaries fall back without merging contradictions", async () => {
  const company = nibe();
  const failed = assembled({
    documentQuery: "ok",
    sources: [
      {
        sourceType: "press_releases",
        sourceUrl: "https://www.nibegroup.com/news",
        publisher: "NIBE",
        supportMode: "automated",
        lastCheckedAt: "2026-09-30T00:00:00.000Z",
        lastSuccessAt: null,
        lastFailureReason: "listing_http_403",
      },
      {
        sourceType: "financial_reports",
        sourceUrl: "https://www.nibegroup.com/investors",
        publisher: "NIBE",
        supportMode: "automated",
        lastCheckedAt: "2026-09-30T00:00:00.000Z",
        lastSuccessAt: "2026-09-30T00:00:00.000Z",
        lastFailureReason: null,
      },
    ],
  });
  assert.equal(failed.pressReleases.status, "temporarily_unavailable");
  assert.equal(failed.reports.status, "available_empty");
  const calls: string[] = [];
  const backed = await withNibeOfficialDisclosureFallback({
    company,
    official: failed,
    fetchImpl: jsonFetch(NIBE_FIXTURE, calls),
  });
  assert.deepEqual(calls, [nibeMfnFeedUrl()]);
  assert.equal(backed.pressReleases.status, "available_with_items");
  assert.equal(backed.reports.status, "available_with_items");
  assert.equal(backed.dividend, failed.dividend);
  assert.equal(backed.events, failed.events);

  const conflictingPress = "https://feed.mfn.se/v1/feed/f9cedcd2-6006-4325-bb43-6ffb51e93b6b/item/press-1.html";
  const primary: CompanyOfficialData = {
    ...failed,
    pressReleases: {
      status: "available_with_items",
      items: [{ title: "Stored headline", date: "2026-08-20", url: conflictingPress }],
      sourceUrl: "https://www.nibegroup.com/news",
      sourcePublisher: "NIBE",
      asOf: "2026-08-20",
    },
  };
  const conflictCalls: string[] = [];
  const conflicted = await withNibeOfficialDisclosureFallback({
    company,
    official: primary,
    fetchImpl: jsonFetch(NIBE_FIXTURE, conflictCalls),
  });
  assert.equal(conflictCalls.length, 1);
  assert.equal(conflicted.pressReleases.status, "temporarily_unavailable");
  assert.deepEqual(conflicted.pressReleases.items, []);
  assert.equal(conflicted.reports.items.length, 1);
  assert.equal(conflicted.reports.items.some((item) => item.url === conflictingPress), false);

  const linkOnly = assembled();
  assert.equal(linkOnly.pressReleases.status, "source_link_only");
  let linkFetches = 0;
  const unchanged = await withNibeOfficialDisclosureFallback({
    company,
    official: linkOnly,
    fetchImpl: async () => {
      linkFetches += 1;
      throw new Error("must_not_fetch");
    },
  });
  assert.equal(linkFetches, 0);
  assert.equal(unchanged, linkOnly);
});

test("cross-checked NIBE disclosures that disagree fail closed", async () => {
  const company = nibe();
  const pressUrl = "https://feed.mfn.se/v1/feed/f9cedcd2-6006-4325-bb43-6ffb51e93b6b/item/press-1.html";
  const official = assembled({
    documents: [{
      type: "press_release",
      title: "Stored headline",
      url: pressUrl,
      publishedAt: "2026-08-20T06:00:00.000Z",
      eventAt: null,
    }],
  });
  assert.equal(official.pressReleases.status, "available_with_items");
  const calls: string[] = [];
  const conflicted = await withNibeOfficialDisclosureFallback({
    company,
    official,
    fetchImpl: jsonFetch(NIBE_FIXTURE, calls),
    crossCheck: true,
  });
  assert.deepEqual(calls, [nibeMfnFeedUrl()]);
  assert.equal(conflicted.pressReleases.status, "temporarily_unavailable");
  assert.deepEqual(conflicted.pressReleases.items, []);
  assert.equal(conflicted.dividend, official.dividend);
});

test("ADR-008 records practical free redundancy and still fails closed", () => {
  const adr = read("docs/project/DECISIONS.md");
  assert.match(adr, /practical free redundancy/i);
  assert.match(adr, /one functioning independent free backup/i);
  assert.match(adr, /second backup is optional/i);
  assert.match(adr, /Release readiness does not require three functioning sources/);
  assert.match(adr, /fail closed/i);
  assert.match(adr, /paid provider is not added/i);
  assert.doesNotMatch(adr, /not release-ready under a literal three-functioning-source rule/);
  const chain = read("lib/companies/source-chain.ts");
  assert.match(chain, /Backup 2 is optional/);
  assert.match(chain, /fails closed|is not fetched/);
});
