import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getPilotCompanies } from "../lib/companies/catalog";
import {
  MFN_FETCH_POLICY,
  NIBE_MFN_FEED_ID,
  NIBE_MFN_LEI,
  mfnDisclosuresConflict,
  nibeMfnFeedUrl,
  parseNibeMfnFeed,
  readNibeMfnFeed,
  type MfnDisclosure,
} from "../lib/companies/mfn-feed";
import { auditCatalogSourceChains, resolveSourceFailover, type SourceSlot } from "../lib/companies/source-chain";
import {
  NASDAQ_CNS_COMPANY_ID_BY_SLUG,
  NASDAQ_CNS_QUERY_LIMIT,
  NASDAQ_EUROPE_RSS,
  SOURCE_POLICY_VERIFIED_ON,
  nasdaqCompanyNewsMayBeFetched,
  nasdaqCompanyNewsQueryUrl,
  nasdaqRssSuitableForIssuerDisclosures,
  nordicEodhdDisplayDecision,
  paidDividendHistoryFromDisclosure,
} from "../lib/companies/source-policy";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function disclosure(partial: Partial<MfnDisclosure> & Pick<MfnDisclosure, "newsId">): MfnDisclosure {
  return {
    title: "Delårsrapport",
    publishedAt: "2026-08-21T06:00:00.000Z",
    sourceUrl: "https://feed.mfn.se/v1/feed/item.html",
    kind: "report",
    lei: NIBE_MFN_LEI,
    ...partial,
  };
}

const NIBE_FIXTURE = JSON.stringify({
  version: "https://www.mfn.se/feed/version/1",
  items: [
    {
      news_id: "report-1",
      url: "https://feed.mfn.se/v1/feed/f9cedcd2-6006-4325-bb43-6ffb51e93b6b/item/report-1.html",
      author: {
        entity_id: NIBE_MFN_FEED_ID,
        leis: [NIBE_MFN_LEI],
      },
      properties: {
        type: "ir",
        tags: ["sub:report", "sub:report:interim", "sub:report:interim:q2"],
      },
      content: {
        title: "NIBE Industrier AB (publ), Interim Report 2, 2026",
        publish_date: "2026-08-21T06:00:00Z",
      },
    },
    {
      news_id: "press-1",
      url: "https://feed.mfn.se/v1/feed/f9cedcd2-6006-4325-bb43-6ffb51e93b6b/item/press-1.html",
      author: {
        entity_id: NIBE_MFN_FEED_ID,
        leis: [NIBE_MFN_LEI],
      },
      properties: { type: "ir", tags: [":regulatory", ":regulatory:mar"] },
      content: {
        title: "Regulatory notice",
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

test("Nasdaq, EODHD, Euroclear and RSS stay fail-closed", () => {
  const companies = getPilotCompanies();
  assert.equal(companies.length, 30);
  assert.equal(nasdaqCompanyNewsMayBeFetched(), false);
  assert.equal(paidDividendHistoryFromDisclosure(), null);
  assert.notEqual(paidDividendHistoryFromDisclosure(), 0);
  const entitlement = nordicEodhdDisplayDecision(companies.length);
  assert.equal(entitlement.status, "licensing_blocked");
  assert.equal(entitlement.nordicBudget, 0);
  assert.equal(entitlement.freeDailyLimit, 20);
  assert.equal(entitlement.coversOutage, false);
  assert.equal(entitlement.publicDisplayEntitlement, "unverified");
  assert.equal(NASDAQ_CNS_QUERY_LIMIT, 20);
  assert.equal(SOURCE_POLICY_VERIFIED_ON, "2026-09-30");

  const policy = read("lib/companies/source-policy.ts");
  assert.doesNotMatch(policy, /process\.env|EODHD_API_KEY|fetch\(/);
  assert.doesNotMatch(read("lib/companies/mfn-feed.ts"), /eodhd|yahoo|borskollen/i);

  for (const feed of NASDAQ_EUROPE_RSS) {
    assert.equal(nasdaqRssSuitableForIssuerDisclosures(feed.classification), false);
  }
  assert.deepEqual(
    companies.map((company) => company.slug).sort(),
    Object.keys(NASDAQ_CNS_COMPANY_ID_BY_SLUG).sort(),
  );
  for (const company of companies) {
    const companyId = NASDAQ_CNS_COMPANY_ID_BY_SLUG[company.slug];
    assert.ok(companyId);
    assert.notEqual(companyId, company.displayName);
    assert.notEqual(companyId, company.name);
    const endpoint = nasdaqCompanyNewsQueryUrl(companyId);
    assert.ok(endpoint?.startsWith("https://api.news.eu.nasdaq.com/news/query.action?"));
    const url = new URL(endpoint ?? "");
    assert.equal(url.searchParams.get("company"), companyId);
    assert.equal(url.searchParams.get("limit"), "20");
    assert.equal(url.searchParams.get("globalName"), "NordicAllMarkets");
    assert.equal(nasdaqCompanyNewsQueryUrl(company.displayName), null);
  }
  assert.equal(NASDAQ_CNS_COMPANY_ID_BY_SLUG["assa-abloy"], "ASSA ABLOY  AB");
  assert.equal(nasdaqCompanyNewsQueryUrl("Investor"), null);
});

test("NIBE MFN backup is issuer-bound, bounded and independent", async () => {
  const nibe = getPilotCompanies().find((company) => company.slug === "nibe");
  assert.equal(nibe?.fiLei, NIBE_MFN_LEI);
  const endpoint = nibeMfnFeedUrl();
  const url = new URL(endpoint);
  assert.equal(url.origin, "https://feed.mfn.se");
  assert.equal(url.pathname, `/v1/feed/${NIBE_MFN_FEED_ID}.json`);
  assert.equal(url.searchParams.get("limit"), String(MFN_FETCH_POLICY.itemLimit));
  assert.equal(url.searchParams.get("lang"), "en");
  assert.equal(MFN_FETCH_POLICY.allowRedirects, false);
  assert.equal(MFN_FETCH_POLICY.redirect, "error");
  assert.ok(MFN_FETCH_POLICY.maxBytes <= 262_144);
  assert.equal(MFN_FETCH_POLICY.itemLimit, 20);
  assert.match(read("lib/companies/ingestion/http.ts"), /redirect: "error"/);
  assert.match(read("lib/companies/mfn-feed.ts"), /fetchBoundedText/);

  const reports = parseNibeMfnFeed(NIBE_FIXTURE, "reports");
  assert.equal(reports.status, "ok");
  if (reports.status === "ok") {
    assert.equal(reports.value.length, 1);
    assert.equal(reports.value[0]?.kind, "report");
    assert.equal(reports.value[0]?.lei, NIBE_MFN_LEI);
    assert.equal(reports.asOf, "2026-08-21T06:00:00.000Z");
    assert.equal("amount" in reports.value[0], false);
  }
  const press = parseNibeMfnFeed(NIBE_FIXTURE, "press");
  assert.equal(press.status, "ok");
  if (press.status === "ok") {
    assert.equal(press.value.length, 2);
    assert.equal(press.value.every((item) => item.lei === NIBE_MFN_LEI), true);
  }

  const foreign = parseNibeMfnFeed(JSON.stringify({
    version: "https://www.mfn.se/feed/version/1",
    items: [{
      news_id: "x",
      url: "https://example.com/item",
      author: { entity_id: "other", leis: ["OTHER"] },
      properties: { type: "ir", tags: ["sub:report"] },
      content: { title: "Other", publish_date: "2026-08-21T06:00:00Z" },
    }],
  }), "press");
  assert.equal(foreign.status, "unavailable");
  if (foreign.status === "unavailable") assert.equal(foreign.reason, "issuer_binding_mismatch");

  let fetches = 0;
  const refused = await readNibeMfnFeed({
    lei: "WRONG",
    feedId: NIBE_MFN_FEED_ID,
    domain: "press",
    fetchImpl: async () => {
      fetches += 1;
      throw new Error("must_not_fetch");
    },
  });
  assert.equal(fetches, 0);
  assert.equal(refused.status, "unavailable");

  const chain = auditCatalogSourceChains().find((item) => item.slug === "nibe");
  const pressBackup = chain?.domains.press.slots[1];
  assert.equal(pressBackup?.status, "functioning");
  assert.equal(pressBackup?.endpoint, endpoint);
  assert.equal(pressBackup?.binding, `lei:${NIBE_MFN_LEI}`);
  assert.equal(pressBackup?.verifiedAsOf, SOURCE_POLICY_VERIFIED_ON);
  assert.notEqual(chain?.domains.press.slots[0]?.shell, pressBackup?.shell);
  assert.equal(chain?.domains.press.slots[2]?.status, "licensing_blocked");

  const calls: string[] = [];
  const slots = chain?.domains.press.slots;
  assert.ok(slots);
  const failover = await resolveSourceFailover({
    slots,
    valuesAgree: (left: readonly MfnDisclosure[], right: readonly MfnDisclosure[]) =>
      !mfnDisclosuresConflict(left, right),
    read: async (slot: SourceSlot) => {
      calls.push(slot.providerId ?? slot.status);
      if (slot.providerId === "nibe_mfn_feed") {
        return parseNibeMfnFeed(NIBE_FIXTURE, "press");
      }
      return { status: "unavailable", reason: "primary_down" };
    },
  });
  assert.deepEqual(calls, [chain?.domains.press.slots[0]?.providerId, "nibe_mfn_feed"]);
  assert.equal(failover.status, "ok");
  if (failover.status === "ok") {
    assert.equal(failover.providerId, "nibe_mfn_feed");
    assert.equal(failover.role, "backup1");
    assert.equal(failover.asOf, "2026-08-21T06:00:00.000Z");
  }

  const conflict = await resolveSourceFailover({
    slots: [
      { ...slots[0], status: "functioning", providerId: "issuer_press", endpoint: "https://www.nibegroup.com/news" },
      slots[1],
      slots[2],
    ],
    valuesAgree: (left: readonly MfnDisclosure[], right: readonly MfnDisclosure[]) =>
      !mfnDisclosuresConflict(left, right),
    read: async (slot: SourceSlot) => {
      if (slot.status !== "functioning") return { status: "unavailable", reason: "skipped" };
      const base = disclosure({ newsId: "report-1" });
      if (slot.providerId === "nibe_mfn_feed") {
        return { status: "ok", value: [{ ...base, kind: "press" }], asOf: base.publishedAt };
      }
      return { status: "ok", value: [base], asOf: base.publishedAt };
    },
  });
  assert.equal(conflict.status, "conflict");
  assert.equal("value" in conflict, false);

  const same = disclosure({ newsId: "only-left" });
  const other = disclosure({ newsId: "only-right", title: "Annan rubrik" });
  assert.equal(mfnDisclosuresConflict([same], [other]), false);
});
