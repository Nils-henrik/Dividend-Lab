import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { getCompanyProfile, getPilotCompanies } from "../lib/companies/catalog";
import { buildCurrentEvents } from "../lib/companies/current-events";
import {
  classifyOfficialDividend,
  DIVIDEND_KIND_LABEL,
  paidDividendGrowth,
  parseYahooDividendChart,
} from "../lib/companies/dividend-view";
import { parseYahooAnnualFinancials, readYahooReportingCurrency } from "../lib/companies/financial-history";
import { INSIDER_LINK } from "../lib/companies/insiders";
import { articleMatchesCompany, titleMentionsCompany } from "../lib/companies/news";
import { assembleCompanyOfficialData } from "../lib/companies/official-data";
import { selectOwnershipSnapshot } from "../lib/companies/ownership-snapshot";
import { buildCompanyPageModel, marketChangeDirection, partitionValuationMetrics, type PageMarketInput } from "../lib/companies/page-model";
import { companyPageMetadataCopy } from "../lib/companies/page-seo";
import { sectorPeers } from "../lib/companies/peers";
import { buildValuationMetrics, CURRENCY_MISMATCH_YIELD_REASON, formatStatementAmount, MISSING_METRIC } from "../lib/companies/valuation";
import type { NewsArticle } from "../types/news";
const NOW = new Date("2026-09-28T12:00:00.000Z");

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function titledArticle(title: string): NewsArticle {
  return {
    id: title,
    title,
    summary: title,
    category: "company",
    source: "DivLab",
    publishedAt: "2026-09-21T08:00:00.000Z",
    url: null,
    featured: false,
  };
}

function emptyValuation(): PageMarketInput["valuation"] {
  return {
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
  };
}

function market(overrides: Partial<PageMarketInput> = {}): PageMarketInput {
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
    valuation: emptyValuation(),
    financials: { status: "empty", points: [] },
    ...overrides,
  };
}

function official(slug: string, overrides: Partial<Parameters<typeof assembleCompanyOfficialData>[0]> = {}) {
  return assembleCompanyOfficialData({
    slug,
    pressReleasesUrl: "https://example.com/press",
    reportsUrl: "https://example.com/reports",
    calendarUrl: "https://example.com/calendar",
    profileUrl: "https://example.com/profile",
    documents: [],
    documentQuery: "ok",
    facts: [],
    ownership: [],
    profileQuery: "ok",
    sources: [],
    now: NOW,
    ...overrides,
  });
}

test("sidmodellen är generisk och saknar Investor-specialgren", () => {
  const source = read("lib/companies/page-model.ts");
  const page = read("app/bolag/[slug]/page.tsx");
  assert.doesNotMatch(source, /slug === ["']investor["']/);
  assert.doesNotMatch(page, /slug === ["']investor["']/);
  const company = getCompanyProfile("saab");
  assert.ok(company);
  const model = buildCompanyPageModel({
    company,
    market: market(),
    official: official("saab"),
    articles: [],
    now: NOW,
  });
  assert.equal(model.delayedLabel, "Fördröjd marknadsdata");
  assert.equal(model.insiders.status, "source_link_only");
});

test("saknat nyckeltal visas som tankstreck", () => {
  const metrics = buildValuationMetrics({
    currency: "SEK",
    marketCap: null,
    volume: null,
    week52Low: null,
    week52High: 10,
    valuation: emptyValuation(),
    officialYieldPercent: null,
    officialYieldBlocked: false,
  });
  assert.equal(metrics.find((metric) => metric.id === "trailing_pe")?.value, MISSING_METRIC);
  assert.equal(metrics.find((metric) => metric.id === "forward_pe")?.value, MISSING_METRIC);
  assert.equal(metrics.find((metric) => metric.id === "market_cap")?.value, MISSING_METRIC);
  assert.equal(metrics.find((metric) => metric.id === "week52")?.value, MISSING_METRIC);
  assert.equal(metrics.find((metric) => metric.id === "ps")?.value, MISSING_METRIC);
});

test("fördröjd marknadsdata är en fast etikett och pengar kräver valuta", () => {
  const company = getCompanyProfile("volvo");
  assert.ok(company);
  const model = buildCompanyPageModel({
    company,
    market: market({ price: 250, currency: null, change: 1, changePct: 0.4 }),
    official: official("volvo"),
    articles: [],
    now: NOW,
  });
  assert.equal(model.delayedLabel, "Fördröjd marknadsdata");
  assert.equal(model.priceText, MISSING_METRIC);
  assert.match(read("components/companies/CompanyPageContent.tsx"), /Fördröjd marknadsdata/);
});

test("värderingsfält renderas bara när de är verkliga", () => {
  const metrics = buildValuationMetrics({
    currency: "SEK",
    marketCap: 10_000_000_000,
    volume: 1000,
    week52Low: 90,
    week52High: 120,
    valuation: { ...emptyValuation(), trailingPe: 15.2, payoutRatio: 65 },
    officialYieldPercent: null,
    officialYieldBlocked: false,
  });
  assert.notEqual(metrics.find((metric) => metric.id === "trailing_pe")?.value, MISSING_METRIC);
  assert.equal(metrics.find((metric) => metric.id === "pb")?.value, MISSING_METRIC);
  assert.equal(metrics.find((metric) => metric.id === "ev_ebitda")?.value, MISSING_METRIC);
  const company = getCompanyProfile("hm");
  assert.ok(company);
  const model = buildCompanyPageModel({
    company,
    market: market({
      currency: "SEK",
      valuation: { ...emptyValuation(), payoutRatio: 65 },
    }),
    official: official("hm"),
    articles: [],
    now: NOW,
  });
  assert.equal(model.dividend.payoutText, MISSING_METRIC);
});

test("olika valutor blockerar direktavkastning", () => {
  const company = getCompanyProfile("hm");
  assert.ok(company);
  const blocked = buildCompanyPageModel({
    company,
    market: market({ price: 200, currency: "USD" }),
    official: official("hm", {
      facts: [
        { factType: "dividend_per_share", valueText: null, valueNumeric: 7.1, unit: "SEK", asOf: "2026-05-07", sourceUrl: "https://hmgroup.com/investors/dividend/", sourcePublisher: "H&M" },
        { factType: "dividend_currency", valueText: "SEK", valueNumeric: null, unit: null, asOf: "2026-05-07", sourceUrl: "https://hmgroup.com/investors/dividend/", sourcePublisher: "H&M" },
      ],
    }),
    articles: [],
    now: NOW,
  });
  assert.equal(blocked.dividend.yieldBlocked, true);
  assert.equal(blocked.metrics.find((metric) => metric.id === "official_yield")?.value, MISSING_METRIC);
  assert.equal(blocked.metrics.find((metric) => metric.id === "official_yield")?.definition, CURRENCY_MISMATCH_YIELD_REASON);

  const allowed = buildCompanyPageModel({
    company,
    market: market({ price: 200, currency: "SEK" }),
    official: official("hm", {
      facts: [
        { factType: "dividend_per_share", valueText: null, valueNumeric: 10, unit: "SEK", asOf: "2026-05-07", sourceUrl: "https://hmgroup.com/investors/dividend/", sourcePublisher: "H&M" },
        { factType: "dividend_currency", valueText: "SEK", valueNumeric: null, unit: null, asOf: "2026-05-07", sourceUrl: "https://hmgroup.com/investors/dividend/", sourcePublisher: "H&M" },
      ],
    }),
    articles: [],
    now: NOW,
  });
  assert.equal(allowed.dividend.yieldBlocked, false);
  assert.match(allowed.metrics.find((metric) => metric.id === "official_yield")?.value ?? "", /5,00 %/);
});

test("finansiell historik sorteras och fyller inte luckor", () => {
  const points = parseYahooAnnualFinancials({
    incomeStatementHistory: {
      incomeStatementHistory: [
        { endDate: { raw: Date.parse("2024-12-31T00:00:00Z") / 1000 }, totalRevenue: { raw: 400 }, operatingIncome: { raw: 40 }, netIncome: { raw: 20 } },
        { endDate: { raw: Date.parse("2022-12-31T00:00:00Z") / 1000 }, totalRevenue: { raw: 200 }, ebit: { raw: 999 } },
        { endDate: { raw: Date.parse("2021-12-31T00:00:00Z") / 1000 }, totalRevenue: null },
      ],
    },
    cashflowStatementHistory: {
      cashflowStatements: [
        { endDate: "2024-12-31", totalCashFromOperatingActivities: 50, capitalExpenditures: -10 },
        { endDate: "2022-12-31", totalCashFromOperatingActivities: 30, capitalExpenditures: 10 },
      ],
    },
    balanceSheetHistory: {
      balanceSheetStatements: [
        { endDate: "2024-12-31", totalCash: 15, shortLongTermDebt: 5, longTermDebt: 25 },
      ],
    },
    financialData: { financialCurrency: "SEK" },
  });

  assert.deepEqual(points.map((point) => point.fiscalYear), [2022, 2024]);
  assert.equal(points.find((point) => point.fiscalYear === 2023), undefined);
  assert.equal(points[0]?.operatingIncome, null);
  assert.equal(points[0]?.freeCashFlow, null);
  assert.equal(points[1]?.freeCashFlow, 40);
  assert.equal(points[1]?.freeCashFlowBasis, "operating_plus_capex");
  assert.equal(points[1]?.netDebt, 15);
  assert.equal(points[1]?.operatingMargin, 0.1);
  assert.equal(points[1]?.currency, "SEK");
  assert.deepEqual(parseYahooAnnualFinancials({}), []);
  assert.deepEqual(parseYahooAnnualFinancials(null), []);
});

test("årsredovisningens valuta är rapporteringsvalutan och gissas inte från kursen", () => {
  const astrazeneca = getCompanyProfile("astrazeneca");
  assert.ok(astrazeneca);
  assert.equal(astrazeneca.marketDataSymbol, "AZN.ST");
  const aznStatements = {
    price: { currency: "SEK" },
    summaryDetail: { currency: "SEK" },
    financialData: { financialCurrency: "USD" },
    incomeStatementHistory: {
      incomeStatementHistory: [
        { endDate: "2024-12-31", totalRevenue: { raw: 54_073_000_000 }, netIncome: { raw: -1_200_000_000 } },
      ],
    },
  };
  assert.equal(readYahooReportingCurrency(aznStatements), "USD");
  const azn = parseYahooAnnualFinancials(aznStatements);
  assert.equal(azn[0]?.currency, "USD");
  assert.equal(azn[0]?.currency === "SEK", false);
  assert.match(formatStatementAmount(azn[0]?.revenue ?? null, azn[0]?.currency ?? null), /54,07 md USD/);
  assert.match(formatStatementAmount(azn[0]?.netIncome ?? null, azn[0]?.currency ?? null), /^−1,20 md USD$/);

  const missingCurrency = {
    price: { currency: "SEK" },
    financialData: { financialCurrency: "" },
    incomeStatementHistory: {
      incomeStatementHistory: [
        { endDate: "2024-12-31", totalRevenue: { raw: 54_073_000_000 } },
      ],
    },
  };
  assert.equal(readYahooReportingCurrency(missingCurrency), null);
  assert.equal(readYahooReportingCurrency({ financialData: { financialCurrency: "US dollars" } }), null);
  assert.equal(readYahooReportingCurrency({ financialData: { financialCurrency: { raw: "USD" } } }), "USD");
  const unlabeled = parseYahooAnnualFinancials(missingCurrency);
  assert.equal(unlabeled[0]?.currency, null);
  const compact = formatStatementAmount(unlabeled[0]?.revenue ?? null, unlabeled[0]?.currency ?? null);
  assert.match(compact, /54,07 md$/);
  assert.equal(compact.includes("SEK"), false);
  assert.equal(compact.includes("USD"), false);
  assert.doesNotMatch(read("lib/companies/market-data.ts"), /parseYahooAnnualFinancials\([^)]*currency/);
  assert.doesNotMatch(read("lib/companies/financial-history.ts"), /price\.currency|summaryDetail/);
});

test("styrelseförslag är inte en beslutad utdelning", () => {
  const proposal = classifyOfficialDividend({ perShare: 6, blocker: "styrelseförslag", explicitKind: "board_proposal" });
  const decided = classifyOfficialDividend({ perShare: 6, explicitKind: "decided" });
  const unspecified = classifyOfficialDividend({ perShare: 6, blocker: null });
  assert.notEqual(proposal.kind, decided.kind);
  assert.equal(DIVIDEND_KIND_LABEL[proposal.kind].includes("Beslutad"), false);
  assert.equal(DIVIDEND_KIND_LABEL[decided.kind], "Beslutad utdelning");
  assert.equal(unspecified.kind, "unspecified");

  const saab = getCompanyProfile("saab");
  assert.ok(saab);
  const model = buildCompanyPageModel({
    company: saab,
    market: market({ price: 100, currency: "SEK" }),
    official: official("saab"),
    articles: [],
    now: NOW,
  });
  assert.equal(model.dividend.kind, "board_proposal");
  assert.equal(model.dividend.perShareText, MISSING_METRIC);
  assert.equal(model.dividend.kindLabel.includes("Beslutad"), false);
});

test("utdelningshistorik är kronologisk och tillväxt kräver en hel serie", () => {
  const parsed = parseYahooDividendChart({
    chart: {
      result: [{
        meta: { currency: "SEK" },
        events: {
          dividends: {
            b: { amount: 2, date: Date.parse("2024-04-11T00:00:00Z") / 1000 },
            a: { amount: 1, date: Date.parse("2023-04-12T00:00:00Z") / 1000 },
            c: { amount: 0, date: Date.parse("2025-04-10T00:00:00Z") / 1000 },
          },
        },
      }],
    },
  });
  assert.deepEqual(parsed.events.map((event) => event.exDate), ["2023-04-12", "2024-04-11"]);
  assert.equal(parsed.currency, "SEK");

  const growth = paidDividendGrowth([
    { exDate: "2022-04-01", amount: 10, currency: "SEK" },
    { exDate: "2023-04-01", amount: 10, currency: "SEK" },
    { exDate: "2024-04-01", amount: 10, currency: "SEK" },
    { exDate: "2025-04-01", amount: 20, currency: "SEK" },
  ], NOW);
  assert.equal(growth?.years, 3);
  assert.equal(paidDividendGrowth([
    { exDate: "2022-04-01", amount: 10, currency: "SEK" },
    { exDate: "2023-04-01", amount: 10, currency: "USD" },
  ], NOW), null);
  assert.equal(paidDividendGrowth([
    { exDate: "2021-04-01", amount: 10, currency: "SEK" },
    { exDate: "2022-04-01", amount: 10, currency: "SEK" },
    { exDate: "2023-04-01", amount: 10, currency: "SEK" },
  ], NOW), null);
});

test("rapporter och press behåller källa", () => {
  const company = getCompanyProfile("volvo");
  assert.ok(company);
  const model = buildCompanyPageModel({
    company,
    market: market(),
    official: official("volvo", {
      documents: [
        { type: "annual_report", title: "Årsredovisning 2025", url: "https://www.volvogroup.com/report.pdf", publishedAt: "2026-02-01", eventAt: null },
        { type: "press_release", title: "Volvo press", url: "https://www.volvogroup.com/press", publishedAt: "2026-09-01", eventAt: null },
      ],
    }),
    documents: [
      { type: "annual_report", title: "Årsredovisning 2025", url: "https://www.volvogroup.com/report.pdf", publisher: "Volvo Group", publishedAt: "2026-02-01", eventAt: null },
      { type: "press_release", title: "Volvo press", url: "https://www.volvogroup.com/press", publisher: "Volvo Group", publishedAt: "2026-09-01", eventAt: null },
    ],
    articles: [],
    now: NOW,
  });
  assert.equal(model.reports[0]?.documentType, "Årsredovisning");
  assert.equal(model.reports[0]?.publisher, "Volvo Group");
  assert.equal(model.reports[0]?.url, "https://www.volvogroup.com/report.pdf");
  assert.equal(model.press[0]?.publisher, "Volvo Group");
  assert.equal(model.press[0]?.documentType, "Pressmeddelande");
});

test("kalendern tar bara giltiga kommande datum", () => {
  const events = buildCurrentEvents({
    events: [
      { title: "Gammal", date: "2026-01-01", url: "https://example.com/old", publisher: "Bolaget" },
      { title: "Ogiltig", date: "snart", url: "https://example.com/bad", publisher: "Bolaget" },
      { title: "Rapport", date: "2026-10-23", url: "https://example.com/next", publisher: "Bolaget" },
    ],
    reports: [],
    press: [],
    articles: [],
    changePct: 1,
    marketTimestamp: "2026-09-28T10:00:00.000Z",
    marketSourceUrl: "https://finance.yahoo.com/quote/TEST.ST",
    now: NOW,
  });
  assert.deepEqual(events.map((event) => event.title), ["Rapport"]);
});

test("ägarlistan håller en avstämning", () => {
  const snapshot = selectOwnershipSnapshot([
    { owner: "Äldre", capitalPct: 40, asOf: "2024-12-31" },
    { owner: "Ny", capitalPct: 10, asOf: "2026-06-30" },
    { owner: "Ny två", capitalPct: 20, asOf: "2026-06-30" },
    { owner: "Utan datum", capitalPct: 99, asOf: null },
  ]);
  assert.equal(snapshot.asOf, "2026-06-30");
  assert.deepEqual(snapshot.items.map((item) => item.owner), ["Ny två", "Ny"]);
});

test("ledning behåller källa och insyn är bara en officiell länk", () => {
  const company = getCompanyProfile("addtech");
  assert.ok(company);
  const model = buildCompanyPageModel({
    company,
    market: market(),
    official: official("addtech", {
      facts: [{
        factType: "ceo",
        valueText: "Niklas Stenberg",
        valueNumeric: null,
        unit: null,
        asOf: "2026-08-31",
        sourceUrl: "https://www.addtech.com/this-is-addtech/executive-management",
        sourcePublisher: "Addtech",
      }],
    }),
    articles: [],
    now: NOW,
  });
  assert.equal(model.management[0]?.role, "VD");
  assert.equal(model.management[0]?.sourcePublisher, "Addtech");
  assert.equal(model.management[0]?.sourceUrl, "https://www.addtech.com/this-is-addtech/executive-management");
  assert.equal("transactions" in model.insiders, false);
  assert.equal(model.insiders, INSIDER_LINK);
  assert.match(model.insiders.url, /^https:\/\/www\.fi\.se\//);
});

test("DivLab-nyheter undviker prefixträffar och träffar korta tickers exakt", () => {
  const sandvik = getCompanyProfile("sandvik");
  const seb = getCompanyProfile("seb");
  const abb = getCompanyProfile("abb");
  const eqt = getCompanyProfile("eqt");
  const sca = getCompanyProfile("sca");
  const skf = getCompanyProfile("skf");
  const atlas = getCompanyProfile("atlas-copco");
  assert.ok(sandvik && seb && abb && eqt && sca && skf && atlas);
  assert.equal(titleMentionsCompany("Sandviken kommun höjer skatten", "Sandvik"), false);
  assert.equal(titleMentionsCompany("Rapport från Sandvik idag", "Sandvik"), true);
  assert.equal(titleMentionsCompany("SEB höjer utdelningen", seb.name), false);
  assert.equal(titleMentionsCompany("Skandinaviska Enskilda Banken höjer", seb.aliases[1] ?? ""), true);

  assert.equal(articleMatchesCompany(titledArticle("SEB höjer utdelningen"), seb), true);
  assert.equal(articleMatchesCompany(titledArticle("ABB i fokus"), abb), true);
  assert.equal(articleMatchesCompany(titledArticle("EQT investerar"), eqt), true);
  assert.equal(articleMatchesCompany(titledArticle("SCA höjer utdelningen"), sca), true);
  assert.equal(articleMatchesCompany(titledArticle("SKF B i rapporten"), skf), true);
  assert.equal(articleMatchesCompany(titledArticle("ATCO A rapport"), atlas), true);

  assert.equal(articleMatchesCompany(titledArticle("SEBORG kommun"), seb), false);
  assert.equal(articleMatchesCompany(titledArticle("ABBA släpper skiva"), abb), false);
  assert.equal(articleMatchesCompany(titledArticle("SCANDINAVIA växer"), sca), false);
  assert.equal(articleMatchesCompany(titledArticle("SKForetag utan träff"), skf), false);
  assert.equal(articleMatchesCompany(titledArticle("EQ testar produkten"), eqt), false);
  assert.equal(articleMatchesCompany(titledArticle("ATCO rapport"), atlas), false);
  assert.equal(articleMatchesCompany(titledArticle("Sandviken kommun höjer skatten"), sandvik), false);
});

test("liknande bolag kommer bara från samma sektor", () => {
  const investor = getCompanyProfile("investor");
  assert.ok(investor);
  const peers = sectorPeers(investor, getPilotCompanies(), 20);
  assert.ok(peers.length >= 4);
  assert.ok(peers.length <= 8);
  assert.ok(peers.every((peer) => peer.sector === "Finans" && peer.slug !== "investor"));
  assert.equal(peers.some((peer) => investor.relatedSlugs.includes(peer.slug)), false);
  assert.deepEqual(peers.map((peer) => peer.slug), [...peers].sort((left, right) => left.slug.localeCompare(right.slug, "sv")).map((peer) => peer.slug));
});

test("aktuellt härleds bara från verkliga poster", () => {
  const events = buildCurrentEvents({
    events: [{ title: "Stämma", date: "2026-11-01", url: "https://example.com/agm", publisher: "Bolaget" }],
    reports: [{ title: "Q2", date: "2026-07-17", url: "https://example.com/q2", publisher: "Bolaget" }],
    press: [{ title: "PM", date: "2026-09-01", url: "https://example.com/pm", publisher: "Bolaget" }],
    articles: [{ title: "DivLab-artikel", publishedAt: "2026-09-21T08:00:00.000Z", href: "/news/divlab" }],
    changePct: 4.25,
    marketTimestamp: "2026-09-28T15:00:00.000Z",
    marketSourceUrl: "https://finance.yahoo.com/quote/TEST.ST",
    now: NOW,
  });
  assert.deepEqual(events.map((event) => event.kind), ["calendar", "report", "press", "news", "price_move"]);
  assert.ok(events.every((event) => event.date && event.sourceLabel && event.href));
  const quiet = buildCurrentEvents({
    events: [],
    reports: [],
    press: [],
    articles: [],
    changePct: 0.4,
    marketTimestamp: "2026-09-28T15:00:00.000Z",
    marketSourceUrl: "https://finance.yahoo.com/quote/TEST.ST",
    now: NOW,
  });
  assert.deepEqual(quiet, []);
});

test("discovery och bevakning hämtar inte kurser för alla bolag", () => {
  const watchlist = read("app/watchlist/page.tsx");
  const page = read("app/bolag/[slug]/page.tsx");
  const loader = read("lib/companies/page-data.server.ts");
  assert.match(watchlist, /getFollowedCompaniesMarketData\(watchlist\.companies\.map/);
  assert.doesNotMatch(watchlist, /getFollowedCompaniesMarketData\(\s*listDiscoveryCompanies/);
  assert.doesNotMatch(watchlist, /getCompanyMarketData\(/);
  assert.doesNotMatch(page, /getRelatedCompanyMarketData/);
  assert.doesNotMatch(page, /listDiscoveryCompanies/);
  assert.match(loader, /getCompanyMarketData\(company, true, true\)/);
  assert.doesNotMatch(loader, /getFollowedCompaniesMarketData/);
});

test("bolagssidan har mobil struktur och sektionsankare", () => {
  const content = read("components/companies/CompanyPageContent.tsx");
  assert.match(content, /overflow-x-auto/);
  assert.match(content, /sm:grid-cols-2/);
  assert.match(content, /id="finansiell-utveckling"/);
  assert.match(content, /id="utdelning"/);
  assert.match(content, /id="aktuellt"/);
  assert.match(content, /id="insyn"/);
  assert.match(content, /Bolag i samma sektor/);
  assert.match(content, /FollowCompanyButton/);
  assert.match(content, /break-words/);
});

test("indexering kräver stabil substans och ignorerar tillfällig marknadsdata", () => {
  const company = getCompanyProfile("skf");
  assert.ok(company);
  const substantialOfficial = official("skf", {
    documents: [
      { type: "quarterly_report", title: "Q2", url: "https://www.skf.com/report", publishedAt: "2026-07-17", eventAt: null },
      { type: "press_release", title: "PM", url: "https://www.skf.com/press", publishedAt: "2026-09-01", eventAt: null },
    ],
  });
  const priceOnly = buildCompanyPageModel({
    company,
    market: market({
      price: 200,
      change: 2,
      changePct: 1,
      currency: "SEK",
      marketCap: 50_000_000_000,
      valuation: { ...emptyValuation(), trailingPe: 18 },
      financials: {
        status: "available",
        points: [{
          fiscalYear: 2024,
          endDate: "2024-12-31",
          currency: "SEK",
          revenue: 1,
          operatingIncome: null,
          netIncome: null,
          eps: null,
          freeCashFlow: null,
          freeCashFlowBasis: null,
          cash: null,
          debt: null,
          netDebt: null,
          operatingMargin: null,
          profitMargin: null,
        }],
      },
    }),
    official: official("skf"),
    articles: [],
    paidDividends: [{ exDate: "2025-04-01", amount: 5, currency: "SEK" }],
    now: NOW,
  });
  assert.equal(priceOnly.indexable, false);
  assert.equal(priceOnly.indexSignals.includes("valuation"), false);
  assert.equal(priceOnly.indexSignals.includes("market_price"), false);
  assert.deepEqual(companyPageMetadataCopy(company, priceOnly).robots, { index: false, follow: true });

  const withoutYahoo = buildCompanyPageModel({
    company,
    market: market(),
    official: substantialOfficial,
    articles: [],
    now: NOW,
  });
  const withYahoo = buildCompanyPageModel({
    company,
    market: market({ price: 200, change: 2, changePct: 1, currency: "SEK", valuation: { ...emptyValuation(), trailingPe: 18 } }),
    official: substantialOfficial,
    articles: [titledArticle("SKF rapport"), titledArticle("SKF utdelning")],
    now: NOW,
  });
  assert.equal(withoutYahoo.indexable, true);
  assert.equal(withYahoo.indexable, true);
  assert.equal(companyPageMetadataCopy(company, withoutYahoo).robots.index, true);
  assert.deepEqual(withoutYahoo.indexSignals.filter((signal) => signal === "reports" || signal === "press").sort(), ["press", "reports"]);
  assert.match(companyPageMetadataCopy(company, withYahoo).title, /SKF aktie/);
  assert.match(companyPageMetadataCopy(company, withYahoo).description, /SKF/);
});

test("saknad dagsförändring är neutral och nyckeltal utan värde är sekundära", () => {
  assert.equal(marketChangeDirection(null, null), "neutral");
  assert.equal(marketChangeDirection(4, null), "neutral");
  assert.equal(marketChangeDirection(null, 1.2), "neutral");
  assert.equal(marketChangeDirection(0, 0), "neutral");
  assert.equal(marketChangeDirection(1.5, 0.4), "positive");
  assert.equal(marketChangeDirection(-1.5, -0.4), "negative");

  const company = getCompanyProfile("volvo");
  assert.ok(company);
  const missing = buildCompanyPageModel({
    company,
    market: market({ price: 100, currency: "SEK" }),
    official: official("volvo"),
    articles: [],
    now: NOW,
  });
  assert.equal(missing.changeDirection, "neutral");
  const down = buildCompanyPageModel({
    company,
    market: market({ price: 100, change: -2, changePct: -1.5, currency: "SEK" }),
    official: official("volvo"),
    articles: [],
    now: NOW,
  });
  assert.equal(down.changeDirection, "negative");
  const groups = partitionValuationMetrics(missing.metrics);
  assert.ok(groups.unavailable.length > 0);
  assert.ok(groups.available.every((metric) => metric.value !== MISSING_METRIC));
  assert.ok(groups.unavailable.every((metric) => metric.value === MISSING_METRIC && metric.source && metric.definition));
  const content = read("components/companies/CompanyPageContent.tsx");
  assert.match(content, /Nyckeltal som saknas/);
  assert.match(content, /Graf: TradingView/);
  assert.match(content, /Kurs och nyckeltal: Yahoo Finance/);
  assert.doesNotMatch(content, /Källa: Yahoo Finance/);
  assert.match(content, /text-divlab-text-secondary/);
  assert.doesNotMatch(content, /positiveChange/);
});

test("varken Börskollen, Autoredaktionen, PR 415 eller ändrad Phase 2-cron ingår", () => {
  const surface = [
    "app/bolag/[slug]/page.tsx",
    "components/companies/CompanyPageContent.tsx",
    "lib/companies/page-model.ts",
    "lib/companies/page-data.server.ts",
    "lib/companies/financial-history.ts",
    "lib/companies/dividend-view.ts",
  ].map(read).join("\n");
  assert.doesNotMatch(surface, /börskollen|borskollen/i);
  assert.doesNotMatch(surface, /autoredaktion/i);
  assert.equal(existsSync(new URL("../lib/companies/catalog/dax40.ts", import.meta.url)), false);
  assert.equal(existsSync(new URL("../lib/companies/catalog/nasdaq100.ts", import.meta.url)), false);
  assert.equal(existsSync(new URL("../supabase/migrations/20260928150000_seed_global_followable_companies.sql", import.meta.url)), false);
  assert.match(read("lib/companies/ingestion/schedule.ts"), /17 3 \* \* \*/);
  assert.match(read("vercel.json"), /17 3 \* \* \*/);
  assert.match(read("lib/model-portfolios/engine/yahoo-research.ts"), /includeStatements \? `\$\{SUMMARY_MODULES\},\$\{STATEMENT_MODULES\}` : SUMMARY_MODULES/);
});
