import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { getCompanyProfile, getPilotCompanies } from "../lib/companies/catalog";
import {
  auditCatalogDataParity,
  CATALOG_IDENTIFIER_FAIL_CLOSED,
  DATA_PARITY_DIMENSIONS,
  DATA_PARITY_STATUSES,
  formatCatalogParityMatrix,
  IDENTIFIER_PARITY_DIMENSIONS,
  isCompleteParityStatus,
  parityBlockers,
  parityStatusFromSupportMode,
} from "../lib/companies/data-parity";
import { parseYahooAnnualFinancials } from "../lib/companies/financial-history";
import { COMPANY_OFFICIAL_COVERAGE } from "../lib/companies/official-coverage";
import { officialDividendFallback, officialPanelCopy } from "../lib/companies/official-copy";
import { assembleCompanyOfficialData } from "../lib/companies/official-data";
import { COMPANY_PAGE_MODULE_IDS, companyPageNavigation } from "../lib/companies/page-nav";
import {
  buildCompanyPageModel,
  COMPANY_PAGE_INDEX_MINIMUM,
  type PageMarketInput,
} from "../lib/companies/page-model";
import { companyPageMetadataCopy } from "../lib/companies/page-seo";
import { MISSING_METRIC, buildValuationMetrics, formatStatementAmount } from "../lib/companies/valuation";

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function emptyMarket(): PageMarketInput {
  return {
    price: null,
    change: null,
    changePct: null,
    currency: null,
    volume: null,
    marketTimestamp: null,
    marketCap: null,
    week52Low: null,
    week52High: null,
    sourceUrl: "https://finance.yahoo.com/quote/TEST.ST",
    valuation: {
      trailingPe: null,
      forwardPe: null,
      priceToSales: null,
      priceToBook: null,
      enterpriseToEbitda: null,
      enterpriseValue: null,
      trailingEps: null,
      beta: null,
      sharesOutstanding: null,
      payoutRatio: null,
      dividendYield: null,
    },
    financials: { status: "empty", points: [] },
  };
}

test("varje katalogbolag använder samma sidmodell och täckningstabell", () => {
  const companies = getPilotCompanies();
  const rows = auditCatalogDataParity();
  assert.deepEqual(rows.map((row) => row.slug), companies.map((company) => company.slug));
  assert.equal(rows.length, companies.length);
  assert.equal(companies.length, 30);
  assert.deepEqual(Object.keys(CATALOG_IDENTIFIER_FAIL_CLOSED), []);

  const investor = buildCompanyPageModel({
    company: getCompanyProfile("investor")!,
    market: emptyMarket(),
    official: assembleCompanyOfficialData({
      slug: "investor",
      pressReleasesUrl: "https://www.investorab.com/investors-media/press-releases",
      reportsUrl: "https://www.investorab.com/investors-media/reports-presentations/",
      calendarUrl: "https://www.investorab.com/investors-media/events-calendar",
      profileUrl: "https://www.investorab.com/",
      documents: [],
      documentQuery: "ok",
      facts: [],
      ownership: [],
      profileQuery: "ok",
      sources: [],
    }),
    articles: [],
  });
  const boliden = buildCompanyPageModel({
    company: getCompanyProfile("boliden")!,
    market: emptyMarket(),
    official: assembleCompanyOfficialData({
      slug: "boliden",
      pressReleasesUrl: "https://www.boliden.com/investor-relations/",
      reportsUrl: "https://www.boliden.com/investor-relations/",
      calendarUrl: "https://www.boliden.com/investor-relations/",
      profileUrl: "https://www.boliden.com/investor-relations/",
      documents: [],
      documentQuery: "ok",
      facts: [],
      ownership: [],
      profileQuery: "ok",
      sources: [],
    }),
    articles: [],
  });
  assert.deepEqual(Object.keys(investor).sort(), Object.keys(boliden).sort());
  assert.deepEqual(investor.metrics.map((metric) => metric.id), boliden.metrics.map((metric) => metric.id));
  assert.equal(investor.priceText, MISSING_METRIC);
  assert.equal(boliden.priceText, MISSING_METRIC);
  assert.ok(investor.metrics.every((metric) => metric.value === MISSING_METRIC));
  assert.equal(investor.metrics.some((metric) => metric.value === "0" || metric.value.startsWith("0 ")), false);

  const rendering = [
    "components/companies/CompanyPageContent.tsx",
    "components/companies/CompanyComments.tsx",
    "components/companies/ShortInterestPanel.tsx",
    "app/bolag/[slug]/page.tsx",
    "lib/companies/page-nav.ts",
    "lib/companies/page-data.server.ts",
  ].map(read).join("\n");
  assert.doesNotMatch(rendering, /slug\s*===\s*["']investor["']/);
  assert.doesNotMatch(rendering, /company\.slug\s*===\s*["']/);
  assert.doesNotMatch(rendering, /companies\.length\s*===\s*30|slugs\.length\s*===\s*30/);
  for (const id of COMPANY_PAGE_MODULE_IDS) {
    assert.match(rendering, new RegExp(`id="${id}"`));
  }
  assert.deepEqual(
    companyPageNavigation({
      hasReports: false,
      hasOwnership: false,
      hasShortInterest: false,
      hasInsiders: false,
      hasNews: false,
      hasCurrentEvents: false,
    }).map((item) => item.label),
    ["Översikt", "Kurs", "Nyckeltal", "Finansiellt", "Utdelning", "Diskussion"],
  );
});

test("identifierare, källadresser och blockerade lägen är sanningsenliga", () => {
  const rows = auditCatalogDataParity();
  const matrix = formatCatalogParityMatrix(rows);
  assert.equal(matrix.split("\n").length, rows.length + 2);
  assert.match(matrix, /\| investor \|/);
  assert.match(matrix, /\| telia \|/);
  assert.doesNotMatch(matrix, /PASS REAL DATA|complete/i);

  for (const row of rows) {
    assert.ok(COMPANY_OFFICIAL_COVERAGE[row.slug], row.slug);
    assert.deepEqual(Object.keys(row.cells).sort(), [...DATA_PARITY_DIMENSIONS].sort());
    for (const dimension of DATA_PARITY_DIMENSIONS) {
      const item = row.cells[dimension];
      assert.ok(DATA_PARITY_STATUSES.includes(item.status), `${row.slug} ${dimension}`);
      assert.equal(item.complete, isCompleteParityStatus(item.status));
      if (item.status !== "PASS REAL DATA") assert.equal(item.complete, false);
      if (item.sourceUrl) assert.match(item.sourceUrl, /^https:\/\//);
    }
    for (const dimension of IDENTIFIER_PARITY_DIMENSIONS) {
      const documented = CATALOG_IDENTIFIER_FAIL_CLOSED[row.slug]?.[dimension];
      if (documented) {
        assert.equal(row.cells[dimension].status, documented.status);
        assert.equal(row.cells[dimension].reason, documented.reason);
        assert.notEqual(documented.status, "PASS REAL DATA");
      } else {
        assert.equal(row.cells[dimension].status, "PASS REAL DATA", `${row.slug} ${dimension}`);
      }
    }
    for (const category of ["press", "reports", "calendar", "ceo", "ownership", "dividend"] as const) {
      assert.match(COMPANY_OFFICIAL_COVERAGE[row.slug][category].href, /^https:\/\//);
    }
  }

  assert.equal(parityStatusFromSupportMode("automated"), "PASS REAL DATA");
  assert.equal(parityStatusFromSupportMode("source_link_only"), "SOURCE LINK ONLY");
  assert.equal(parityStatusFromSupportMode("blocked"), "BLOCKED BY SOURCE");
  assert.equal(isCompleteParityStatus("SOURCE LINK ONLY"), false);
  assert.equal(isCompleteParityStatus("BLOCKED BY SOURCE"), false);
  assert.equal(isCompleteParityStatus("TEMPORARILY UNAVAILABLE"), false);
  assert.equal(isCompleteParityStatus("NOT APPLICABLE / NO VERIFIED DATA"), false);

  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  assert.equal(bySlug.get("boliden")?.cells.officialPress.status, "BLOCKED BY SOURCE");
  assert.equal(bySlug.get("epiroc")?.cells.officialReports.status, "BLOCKED BY SOURCE");
  assert.equal(bySlug.get("hexagon")?.cells.officialCalendar.status, "BLOCKED BY SOURCE");
  assert.equal(bySlug.get("skanska")?.cells.officialReports.status, "SOURCE LINK ONLY");
  assert.equal(bySlug.get("nordea")?.cells.latestReportSnapshot.status, "PASS REAL DATA");
  assert.equal(bySlug.get("abb")?.cells.latestReportSnapshot.status, "SOURCE LINK ONLY");
  assert.equal(bySlug.get("abb")?.cells.latestReportSnapshot.complete, false);

  const boliden = assembleCompanyOfficialData({
    slug: "boliden",
    pressReleasesUrl: "https://www.boliden.com/investor-relations/",
    reportsUrl: "https://www.boliden.com/investor-relations/",
    calendarUrl: "https://www.boliden.com/investor-relations/",
    profileUrl: "https://www.boliden.com/investor-relations/",
    documents: [],
    documentQuery: "ok",
    facts: [],
    ownership: [],
    profileQuery: "ok",
    sources: [],
  });
  assert.equal(boliden.pressReleases.status, "blocked");
  assert.equal(boliden.ownership.status, "blocked");
  assert.deepEqual(boliden.ownership.items, []);
  const blockedCopy = officialPanelCopy("ownership", "blocked");
  assert.equal(blockedCopy.showLink, true);
  assert.match(blockedCopy.text, /kan inte läsas automatiskt/);
  assert.match(blockedCopy.text, /officiella ägarinformation/);
  assert.doesNotMatch(blockedCopy.text, /0 %|kunde inte hämtas|komplett/i);
  const linkCopy = officialPanelCopy("reports", "source_link_only");
  assert.match(linkCopy.text, /officiella rapportarkiv/);
  assert.doesNotMatch(linkCopy.text, /kan inte läsas automatiskt/);
  assert.match(officialDividendFallback("source_link_only") ?? "", /officiella källan/);
  assert.match(officialDividendFallback("blocked") ?? "", /inte som noll/);
  assert.equal(officialDividendFallback("available_with_items"), null);

  const blockers = parityBlockers(rows);
  assert.ok(blockers.some((item) => item.slug === "boliden" && item.status === "BLOCKED BY SOURCE"));
  assert.ok(blockers.every((item) => item.status !== "PASS REAL DATA"));
  assert.ok(blockers.every((item) => !item.sourceUrl || item.sourceUrl.startsWith("https://")));
});

test("saknade nyckeltal blir inte noll och den tunna SEO-grinden är oförändrad", () => {
  const metrics = buildValuationMetrics({
    currency: "SEK",
    marketCap: null,
    volume: null,
    week52Low: null,
    week52High: null,
    valuation: emptyMarket().valuation,
    officialYieldPercent: null,
    officialYieldBlocked: false,
  });
  assert.ok(metrics.length > 0);
  assert.ok(metrics.every((metric) => metric.value === MISSING_METRIC));
  assert.equal(formatStatementAmount(null, "SEK"), MISSING_METRIC);
  assert.notEqual(formatStatementAmount(null, "SEK"), "0");
  const parsed = parseYahooAnnualFinancials({
    financialCurrency: "SEK",
    incomeStatementHistory: {
      incomeStatementHistory: [{
        endDate: "2025-12-31",
        totalRevenue: { raw: 100 },
      }],
    },
  });
  assert.equal(parsed[0]?.revenue, 100);
  assert.equal(parsed[0]?.operatingIncome, null);
  assert.equal(parsed[0]?.netIncome, null);
  assert.equal(parsed[0]?.eps, null);
  assert.equal(parsed[0]?.freeCashFlow, null);

  assert.equal(COMPANY_PAGE_INDEX_MINIMUM, 2);
  const company = getCompanyProfile("telia");
  assert.ok(company);
  const thin = buildCompanyPageModel({
    company,
    market: emptyMarket(),
    official: assembleCompanyOfficialData({
      slug: "telia",
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
    }),
    articles: [],
  });
  assert.equal(thin.indexable, false);
  assert.equal(companyPageMetadataCopy(company, thin).robots.index, false);
  assert.equal(companyPageMetadataCopy(company, { indexable: true }).robots.index, true);
  const seo = read("lib/companies/page-seo.ts");
  assert.match(seo, /model\.indexable\s*\?/);
});
