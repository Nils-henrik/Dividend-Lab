import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getPilotCompanies } from "../lib/companies/catalog";
import { auditCatalogDataParity } from "../lib/companies/data-parity";
import { ADDTECH_CISION_FEED_URL, NIBE_ARCHIVE_WIDGET_URL } from "../lib/companies/ingestion/adapters/omxs30-completion";
import { COMPANY_PAGE_INDEX_MINIMUM } from "../lib/companies/page-model";
import {
  auditCatalogSourceChains,
  cachedReadingWithinPolicy,
  CRITICAL_SOURCE_DOMAINS,
  dividendSlotsForSymbol,
  EXISTING_DIVIDEND_CACHE_MAX_AGE_MS,
  finiteOrMissing,
  formatSourceRedundancyMatrix,
  numbersMateriallyDisagree,
  resolveSourceFailover,
  sourceShell,
  SOURCE_ROLES,
  yahooChartEndpoint,
  yahooDividendEndpoint,
  type SourceSlot,
} from "../lib/companies/source-chain";
import { INSIDER_LINK } from "../lib/companies/insiders";
import { FI_INSIDER_SEARCH_URL } from "../lib/companies/source-policy";
import {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
} from "../lib/companies/short-interest/constants";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const PRESENTATION_MODULES = [
  "components/companies/CompanyPageContent.tsx",
  "lib/companies/follow-feed.ts",
  "lib/companies/current-events.ts",
  "lib/companies/documents-view.ts",
  "lib/companies/valuation.ts",
  "lib/companies/data-parity.ts",
  "lib/companies/source-labels.ts",
  "lib/companies/page-model.ts",
];

function slot(partial: Partial<SourceSlot> & Pick<SourceSlot, "role" | "status">): SourceSlot {
  return {
    providerId: null,
    endpoint: null,
    host: null,
    shell: null,
    binding: null,
    presentationLabel: null,
    verifiedAsOf: null,
    blocker: null,
    ...partial,
  };
}

test("rendered company copy does not name the market-data brand", () => {
  for (const path of PRESENTATION_MODULES) {
    assert.doesNotMatch(read(path), /Yahoo Finance/, path);
  }
  const transport = read("lib/model-portfolios/engine/yahoo-research.ts");
  assert.match(transport, /https:\/\/query1\.finance\.yahoo\.com\/v8\/finance\/chart/);
  assert.match(transport, /provider: "eodhd"/);
  const parity = read("lib/companies/data-parity.ts");
  assert.match(parity, /https:\/\/finance\.yahoo\.com\/quote\//);
  assert.match(read("lib/companies/market-data.ts"), /fetchYahooHistoryResearch/);
  assert.match(read("lib/companies/market-data.ts"), /resolveSourceFailover/);
  assert.match(read("lib/companies/dividend-history.server.ts"), /resolveSourceFailover/);
  assert.match(read("lib/companies/dividend-history.server.ts"), /EXISTING_DIVIDEND_CACHE_MAX_AGE_MS/);
});

test("every catalog company has an explicit three-slot chain", () => {
  const companies = getPilotCompanies();
  const chains = auditCatalogSourceChains(companies);
  assert.equal(companies.length, 30);
  assert.equal(auditCatalogDataParity().length, 30);
  assert.equal(COMPANY_PAGE_INDEX_MINIMUM, 2);
  assert.equal(chains.length, companies.length);
  const contract = read("lib/companies/source-chain.ts");
  assert.doesNotMatch(contract, /borskollen|börskollen|eodhd\.com/i);
  assert.doesNotMatch(contract, /nordicDisclosureCompanyAliases|companyNamesLikelyMatch|company\.displayName|company\.name/);

  for (const company of companies) {
    const chain = chains.find((item) => item.slug === company.slug);
    assert.ok(chain, company.slug);
    assert.deepEqual(Object.keys(chain.domains).sort(), [...CRITICAL_SOURCE_DOMAINS].sort());
    for (const domain of CRITICAL_SOURCE_DOMAINS) {
      const item = chain.domains[domain];
      assert.deepEqual(item.slots.map((entry) => entry.role), [...SOURCE_ROLES]);
      const functioning = item.slots.filter((entry) => entry.status === "functioning");
      const shells = functioning.map((entry) => entry.shell);
      assert.equal(new Set(shells).size, shells.length, `${company.slug} ${domain}`);
      for (const entry of functioning) {
        assert.ok(entry.endpoint?.startsWith("https://"), `${company.slug} ${domain}`);
        assert.doesNotMatch(entry.endpoint ?? "", /query2\.finance\.yahoo\.com|eodhd\.com|borskollen/i);
        assert.ok(entry.providerId, `${company.slug} ${domain}`);
        assert.ok(entry.binding, `${company.slug} ${domain} binding`);
      }
      const active = functioning[0] ?? null;
      assert.equal(item.activeProviderId, active?.providerId ?? null);
      assert.equal(item.activeEndpoint, active?.endpoint ?? null);
    }
    const price = chain.domains.price.slots;
    assert.equal(price[0]?.providerId, "yahoo_chart");
    assert.equal(price[0]?.status, "functioning");
    assert.equal(price[0]?.endpoint, yahooChartEndpoint(company.marketDataSymbol));
    assert.equal(price[0]?.binding, `symbol:${company.marketDataSymbol}`);
    assert.equal(price[1]?.status, "licensing_blocked");
    assert.equal(price[1]?.providerId, "eodhd_nordic_display");
    assert.equal(price[1]?.endpoint, null);
    assert.equal(price[2]?.status, "licensing_blocked");
    assert.equal(price[2]?.providerId, "nasdaq_nordic_equity_web_api");
    assert.equal(chain.domains.valuation.slots[1]?.status, "licensing_blocked");
    assert.equal(chain.domains.valuation.slots[2]?.status, "licensing_blocked");
    assert.equal(chain.domains.dividend.slots[1]?.status, "licensing_blocked");
    assert.equal(chain.domains.dividend.slots[2]?.status, "licensing_blocked");
    assert.equal(chain.domains.ownership.slots[1]?.status, "licensing_blocked");
    assert.equal(chain.domains.ownership.slots[1]?.providerId, "euroclear_sweden_register");
    assert.equal(chain.domains.insider.activeProviderId, null);
    assert.equal(chain.domains.insider.activeEndpoint, null);
    assert.equal(chain.domains.insider.slots[0]?.status, "source_link_only");
    assert.equal(chain.domains.insider.slots[0]?.providerId, "fi_insider_register");
    assert.equal(chain.domains.insider.slots[0]?.endpoint, INSIDER_LINK.url);
    assert.equal(chain.domains.insider.slots[0]?.binding, `lei:${company.fiLei}`);
    assert.equal(chain.domains.insider.slots[1]?.status, "source_link_only");
    assert.equal(chain.domains.insider.slots[1]?.providerId, "fi_insider_search");
    assert.equal(chain.domains.insider.slots[1]?.endpoint, FI_INSIDER_SEARCH_URL);
    assert.equal(chain.domains.insider.slots[2]?.status, "gap");
    assert.equal(
      chain.domains.insider.slots.some((entry) => entry.status === "functioning"),
      false,
    );
    const insiderEndpoints = chain.domains.insider.slots.map((entry) => entry.endpoint ?? "").join(" ");
    const insiderProviders = chain.domains.insider.slots.map((entry) => entry.providerId ?? "").join(" ");
    assert.equal(insiderEndpoints.includes(FI_AGGREGATE_ODS_URL), false);
    assert.equal(insiderEndpoints.includes(FI_CURRENT_POSITIONS_ODS_URL), false);
    assert.doesNotMatch(insiderProviders, /fi_short_interest/);
    for (const domain of ["press", "reports", "calendar"] as const) {
      const backups = chain.domains[domain].slots.filter((entry) => entry.role !== "primary");
      assert.equal(backups.some((entry) => entry.providerId === "nasdaq_cns_company_news"), true, company.slug);
      assert.equal(backups.every((entry) => entry.status !== "functioning" || entry.providerId === "nibe_mfn_feed"), true);
    }
  }

  const addtech = chains.find((item) => item.slug === "addtech");
  assert.equal(addtech?.domains.press.slots[0]?.endpoint, ADDTECH_CISION_FEED_URL);
  assert.equal(addtech?.domains.press.slots[0]?.status, "functioning");
  const nibe = chains.find((item) => item.slug === "nibe");
  assert.equal(nibe?.domains.reports.slots[0]?.endpoint, NIBE_ARCHIVE_WIDGET_URL);
  assert.equal(nibe?.domains.reports.slots[1]?.providerId, "nibe_mfn_feed");
  assert.equal(nibe?.domains.press.slots[1]?.providerId, "nibe_mfn_feed");
  assert.equal(nibe?.domains.press.slots[1]?.status, "functioning");
  assert.notEqual(nibe?.domains.press.slots[0]?.shell, nibe?.domains.press.slots[1]?.shell);
  assert.equal(nibe?.domains.calendar.slots[1]?.providerId, "nasdaq_cns_company_news");
  assert.equal(nibe?.domains.calendar.slots[1]?.status, "licensing_blocked");
  const boliden = chains.find((item) => item.slug === "boliden");
  assert.equal(boliden?.domains.press.slots[0]?.status, "blocked");
  assert.equal(boliden?.domains.press.activeProviderId, null);

  const matrix = formatSourceRedundancyMatrix(companies);
  assert.match(matrix, /### price/);
  assert.match(matrix, /\| investor \|/);
  assert.match(matrix, /\| telia \|/);
  const insiderMatrix = matrix.split("### insider")[1]?.split("### ")[0] ?? "";
  assert.match(insiderMatrix, /source_link_only fi_insider_register https:\/\/www\.fi\.se\/sv\/vara-register\/insynsregistret\//);
  assert.match(insiderMatrix, /source_link_only fi_insider_search https:\/\/marknadssok\.fi\.se\/publiceringsklient/);
  assert.doesNotMatch(insiderMatrix, /functioning|fi_short_interest|blankningsregistret/i);
  assert.equal(matrix.split("### ").length - 1, CRITICAL_SOURCE_DOMAINS.length);
  const dividend = dividendSlotsForSymbol("INVE-B.ST");
  assert.equal(dividend[0]?.endpoint, yahooDividendEndpoint("INVE-B.ST"));
  assert.match(dividend[0]?.endpoint ?? "", /events=div/);
  assert.equal(dividendSlotsForSymbol("not-a-symbol")[0]?.status, "gap");
});

test("failover order, conflict and missing values fail closed", async () => {
  assert.equal(finiteOrMissing(null), null);
  assert.equal(finiteOrMissing(undefined), null);
  assert.equal(finiteOrMissing(Number.NaN), null);
  assert.equal(finiteOrMissing(0), 0);
  assert.equal(Number(null), 0);
  assert.notEqual(finiteOrMissing(null), 0);
  assert.equal(numbersMateriallyDisagree(100, 100.4), false);
  assert.equal(numbersMateriallyDisagree(100, 101), true);
  assert.equal(sourceShell("query1.finance.yahoo.com"), sourceShell("query2.finance.yahoo.com"));
  assert.notEqual(sourceShell("query1.finance.yahoo.com"), sourceShell("www.fi.se"));

  const slots: [SourceSlot, SourceSlot, SourceSlot] = [
    slot({
      role: "primary",
      status: "functioning",
      providerId: "primary_feed",
      endpoint: "https://issuer.example/price",
      host: "issuer.example",
      shell: "issuer.example",
      binding: "symbol:TEST.ST",
    }),
    slot({
      role: "backup1",
      status: "functioning",
      providerId: "backup_feed",
      endpoint: "https://exchange.example/price",
      host: "exchange.example",
      shell: "exchange.example",
      binding: "symbol:TEST.ST",
    }),
    slot({
      role: "backup2",
      status: "gap",
      blocker: "Saknas.",
    }),
  ];
  const calls: string[] = [];
  const failover = await resolveSourceFailover({
    slots,
    crossCheck: false,
    valuesAgree: (left, right) => left === right,
    read: async (entry) => {
      calls.push(entry.providerId ?? "");
      if (entry.providerId === "primary_feed") return { status: "unavailable", reason: "down" };
      return { status: "ok", value: 25, asOf: "2026-09-30T10:00:00.000Z" };
    },
  });
  assert.deepEqual(calls, ["primary_feed", "backup_feed"]);
  assert.equal(failover.status, "ok");
  if (failover.status === "ok") {
    assert.equal(failover.providerId, "backup_feed");
    assert.equal(failover.role, "backup1");
    assert.equal(failover.asOf, "2026-09-30T10:00:00.000Z");
    assert.equal(failover.value, 25);
  }

  const conflict = await resolveSourceFailover({
    slots,
    valuesAgree: (left, right) => !numbersMateriallyDisagree(left, right),
    read: async (entry) => ({
      status: "ok",
      value: entry.providerId === "primary_feed" ? 100 : 110,
      asOf: "2026-09-30T10:00:00.000Z",
    }),
  });
  assert.equal(conflict.status, "conflict");
  assert.equal("value" in conflict, false);

  const rejected = await resolveSourceFailover({
    slots: [slots[0], slot({ role: "backup1", status: "gap", blocker: "Saknas." }), slots[2]],
    valuesAgree: () => true,
    rejectValue: (value) => value.missing ? "missing_became_zero" : null,
    read: async () => ({ status: "ok", value: { price: 0, missing: true }, asOf: "2026-09-30T10:00:00.000Z" }),
  });
  assert.equal(rejected.status, "missing");

  const fresh = cachedReadingWithinPolicy({
    cachedAt: "2026-09-30T09:00:00.000Z",
    now: "2026-09-30T10:00:00.000Z",
    maxAgeMs: EXISTING_DIVIDEND_CACHE_MAX_AGE_MS,
    value: 12,
    providerId: "yahoo_chart_dividends",
    endpoint: "https://query1.finance.yahoo.com/v8/finance/chart/INVE-B.ST",
    sourceAsOf: "2026-09-30T08:00:00.000Z",
  });
  assert.equal(fresh.status, "ok");
  if (fresh.status === "ok") assert.equal(fresh.asOf, "2026-09-30T08:00:00.000Z");
  const stale = cachedReadingWithinPolicy({
    cachedAt: "2026-09-28T09:00:00.000Z",
    now: "2026-09-30T10:00:00.000Z",
    maxAgeMs: EXISTING_DIVIDEND_CACHE_MAX_AGE_MS,
    value: 12,
    providerId: "yahoo_chart_dividends",
    endpoint: "https://query1.finance.yahoo.com/v8/finance/chart/INVE-B.ST",
    sourceAsOf: "2026-09-28T08:00:00.000Z",
  });
  assert.deepEqual(stale, { status: "unavailable", reason: "stale_cache" });
});
