import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { auditOmxs30Coverage } from "../lib/companies/coverage-audit";
import { buildCurrentEvents, CURRENT_EVENT_LIMIT } from "../lib/companies/current-events";
import { getCompanyProfile } from "../lib/companies/catalog";
import { collectCompanySource } from "../lib/companies/ingestion/collect";
import {
  parseIndustrivardenCalendar,
  parseIndustrivardenFinancialReports,
  parseIndustrivardenPressReleases,
  parseNordeaDecidedDividend,
  parseNordeaFinancialReports,
  parseNordeaPressReleases,
  parseSwedbankFinancialReports,
  parseSwedbankPressReleases,
  parseTele2Calendar,
  parseTele2Ceo,
  parseTele2FinancialReports,
  parseTele2PressReleases,
} from "../lib/companies/ingestion/adapters/omxs30-crown";
import { isSupportedCompanyIngestionSlug } from "../lib/companies/ingestion/queue";
import { COMPANY_OFFICIAL_COVERAGE } from "../lib/companies/official-coverage";
import { VERIFIED_OMXS30_SLUGS } from "../lib/companies/omxs30";
import { selectOwnershipSnapshot } from "../lib/companies/ownership-snapshot";
import { assembleCompanyOfficialData } from "../lib/companies/official-data";
import {
  buildCompanyPageModel,
  COMPANY_PAGE_INDEX_MINIMUM,
  type PageMarketInput,
} from "../lib/companies/page-model";
import {
  parseIndustrivardenReportSnapshot,
  parseNordeaReportSnapshot,
  parseTele2ReportSnapshot,
} from "../lib/companies/report-snapshot";

const NOW = new Date("2026-09-29T08:00:00.000Z");

function read(path: string) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

function market(): PageMarketInput {
  return {
    price: 100,
    change: 4,
    changePct: 4,
    currency: "SEK",
    volume: 1,
    marketTimestamp: "2026-09-29T08:00:00.000Z",
    marketCap: 1,
    week52Low: 80,
    week52High: 120,
    sourceUrl: "https://finance.yahoo.com/quote/TEST.ST",
    valuation: {
      trailingPe: 10,
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

test("coverage-auditen täcker varje följbart OMXS30-bolag", () => {
  const rows = auditOmxs30Coverage();
  assert.deepEqual(rows.map((row) => row.slug), [...VERIFIED_OMXS30_SLUGS]);
  assert.equal(rows.length, 30);
  for (const row of rows) {
    assert.equal(row.delayedQuote, "page_only");
    assert.equal(row.valuation, "page_only");
    assert.equal(row.annualFinancials, "page_only");
    assert.equal(row.paidDividendHistory, "page_only");
    assert.ok(row.officialSourceUrls.every((url) => url.startsWith("https://")));
    assert.equal(row.lastSuccess, null);
    assert.equal(row.lastFailure, null);
  }
  const bySlug = new Map(rows.map((row) => [row.slug, row]));
  assert.equal(bySlug.get("boliden")?.press, "blocked");
  assert.equal(bySlug.get("epiroc")?.reports, "blocked");
  assert.equal(bySlug.get("hexagon")?.calendar, "blocked");
  assert.equal(bySlug.get("tele2")?.press, "automated");
  assert.equal(bySlug.get("nordea")?.dividend, "automated");
  assert.equal(bySlug.get("industrivarden")?.calendar, "automated");
  assert.equal(bySlug.get("swedbank")?.reports, "automated");
  assert.equal(bySlug.get("skanska")?.reports, "source_link_only");
  assert.equal(bySlug.get("abb")?.indexableFromAutomatedCoverage, false);
});

test("blockerade källor förblir oblockerade från ingestion och hämtas inte", async () => {
  let fetched = 0;
  for (const slug of ["boliden", "epiroc", "hexagon"]) {
    assert.equal(COMPANY_OFFICIAL_COVERAGE[slug].press.mode, "blocked");
    assert.equal(isSupportedCompanyIngestionSlug(slug), false);
    const result = await collectCompanySource(slug, {
      sourceType: "press_releases",
      sourceUrl: COMPANY_OFFICIAL_COVERAGE[slug].press.href,
    }, {
      now: NOW,
      fetchImpl: async () => {
        fetched += 1;
        throw new Error("bypass");
      },
    });
    assert.equal(result.status, "error");
    if (result.status === "error") assert.equal(result.reason, "unsupported_company");
  }
  assert.equal(fetched, 0);
  assert.equal(isSupportedCompanyIngestionSlug("skanska"), false);
  assert.match(read("lib/companies/ingestion/collect.ts"), /cf-mitigated|unsupported_company|INDUSTRIVARDEN_RSS_SOURCE_URL/);
  assert.doesNotMatch(read("lib/companies/ingestion/adapters/omxs30-crown.ts"), /börskollen|borskollen|cloudflare/i);
});

test("Nordea, Tele2, Swedbank och Industrivärden läser bara egna domäner", () => {
  const nordea = parseNordeaPressReleases(`
    <h3>Changes in leadership</h3>
    <time datetime="19-08-2026">19-08-2026</time>
    <a href="/en/press/2026-08-19/changes-in-nordeas-group-leadership-team">Read more</a>
    <h3>Half-year results 2026 and decision on mid-year dividend</h3>
    <time datetime="16-07-2026">16-07-2026</time>
    <a href="/en/press/2026-07-16/half-year-results-2026-and-decision-on-mid-year-dividend">Read more</a>
    <a href="https://evil.example/en/press/2026-07-16/half-year-results">Ignore</a>
  `);
  assert.deepEqual(nordea.map((item) => item.title), ["Changes in leadership"]);
  const nordeaReport = parseNordeaFinancialReports(`
    <h3>Half-year results 2026 and decision on mid-year dividend</h3>
    <time datetime="16-07-2026">16-07-2026</time>
    <a href="/en/press/2026-07-16/half-year-results-2026-and-decision-on-mid-year-dividend">Read more</a>
  `);
  assert.equal(nordeaReport[0]?.documentType, "half_year_report");
  assert.equal(nordeaReport[0]?.sourceUrl, "https://www.nordea.com/en/press/2026-07-16/half-year-results-2026-and-decision-on-mid-year-dividend");

  const tele2 = `
    <a class="blurb--large-image" href="/media/news/2026/invitation-to-the-presentation/">
      <span class="type">Press release</span>
      <span data-date="Tue Sep 29 2026 05:00:57 GMT+0000 (Coordinated Universal Time)"></span>
      <h3>Invitation to the presentation of the third quarter 2026 results</h3>
    </a>
    <a class="blurb--large-image" href="/investors/reports-and-presentations/tele2-reports-second-quarter-2026-results/">
      <span class="type">Interim report</span>
      <span data-date="Thu Jul 16 2026 05:00:00 GMT+0000"></span>
      <h3>Tele2 reports second quarter 2026 results</h3>
      <a href="/files/Main/3372/4374673/interim-report-q2-2026.pdf">Download Report</a>
    </a>
    <a class="blurb--large-image" href="/investors/calendar/2026/tele2-interim-report-q3-2026/">
      <span class="type">Calendar</span>
      <span data-date="Tue Oct 20 2026 05:00:00 GMT+0000"></span>
      <h3>Tele2 Interim Report Q3 2026</h3>
    </a>
    <a class="blurb--large-image" href="https://evil.example/files/report.pdf">
      <span class="type">Interim report</span>
      <span data-date="Thu Jul 16 2026 05:00:00 GMT+0000"></span>
      <h3>Foreign report</h3>
    </a>
  `;
  assert.equal(parseTele2PressReleases(tele2)[0]?.sourceUrl, "https://www.tele2.com/media/news/2026/invitation-to-the-presentation/");
  assert.equal(parseTele2FinancialReports(tele2)[0]?.documentType, "quarterly_report");
  assert.equal(parseTele2FinancialReports(tele2)[0]?.sourceUrl, "https://www.tele2.com/files/Main/3372/4374673/interim-report-q2-2026.pdf");
  assert.equal(parseTele2Calendar(tele2)[0]?.eventAt?.slice(0, 10), "2026-10-20");
  assert.equal(parseTele2Ceo(`<span class="quote-with-reference__name">Nicholas Högberg</span> <span class="quote-with-reference__title">President and Group CEO</span>`, "https://www.tele2.com/investors/", "Tele2")?.facts[0]?.valueText, "Nicholas Högberg");

  const swedbank = `
    <div class="timestamp">2026-09-18 13:23</div>
    <a class="general-link" href="/newsroom/press-releases.details.agreement-on-sale-of-non-performing-loans.E54FC012A81FF020.html">Agreement on sale of non-performing loans</a>
    <div class="timestamp">2026-07-17 07:00</div>
    <a class="general-link" href="/newsroom/press-releases.details.swedbank-interim-report-for-the-second-quarter-2026.DA59ABC946065D11.html">Swedbank interim report for the second quarter 2026</a>
    <a href="https://internetbank.swedbank.se/ConditionsEarchive/download?bankid=1111&id=WEBDOC">PDF</a>
  `;
  assert.equal(parseSwedbankPressReleases(swedbank).length, 1);
  assert.equal(parseSwedbankFinancialReports(swedbank)[0]?.documentType, "quarterly_report");
  assert.equal(parseSwedbankFinancialReports(swedbank)[0]?.publishedAt?.slice(0, 10), "2026-07-17");
  assert.equal(parseSwedbankFinancialReports(swedbank).some((item) => item.sourceUrl.includes("internetbank")), false);

  const rss = `<?xml version="1.0"?><rss version="2.0"><channel>
    <item xml:base="https://www.industrivarden.se/media/Pressmeddelanden/2026/valberedning-infor-industrivardens-arsstamma-2027/"><title>Valberedning inför Industrivärdens årsstämma 2027</title><pubDate>Fri, 25 Sep 2026 10:00:00 +0200</pubDate></item>
    <item xml:base="https://www.industrivarden.se/media/Pressmeddelanden/2026/delarsrapport-1-januari--30-juni-2026/"><title>Delårsrapport, 1 januari – 30 juni 2026</title><pubDate>Wed, 08 Jul 2026 08:00:00 +0200</pubDate></item>
    <item xml:base="https://evil.example/media/Pressmeddelanden/2026/delarsrapport/"><title>Delårsrapport, 1 januari – 30 juni 2026</title><pubDate>Wed, 08 Jul 2026 08:00:00 +0200</pubDate></item>
  </channel></rss>`;
  assert.equal(parseIndustrivardenPressReleases(rss).length, 1);
  assert.equal(parseIndustrivardenFinancialReports(rss)[0]?.documentType, "half_year_report");
  assert.equal(parseIndustrivardenFinancialReports(rss)[0]?.fiscalPeriod, "2026 H1");
  const calendar = parseIndustrivardenCalendar(`
    <ul class="c-calendarevent-list">
      <span class="c-calendarevent-teaser-item__date-number">07</span>
      <span class="c-calendarevent-teaser-item__date-month">okt</span>
      <h2 class="c-calendarevent-teaser-item__heading">Delårsrapport januari-september</h2>
      <span class="c-calendarevent-teaser-item__date-number">15</span>
      <span class="c-calendarevent-teaser-item__date-month">apr</span>
      <h2 class="c-calendarevent-teaser-item__heading">Årsstämma 2027</h2>
    </ul>
  `);
  assert.equal(calendar.length, 1);
  assert.equal(calendar[0]?.eventAt?.slice(0, 10), "2027-04-15");
});

test("rapportutdrag kräver källa, valuta och jämförelseperiod", () => {
  const nordea = parseNordeaReportSnapshot(`
    <link rel="canonical" href="https://www.nordea.com/en/press/2026-07-16/half-year-results-2026" />
    <table><tr><th>EURm</th><th>Q2 2026</th><th>Q2 2025</th><th>Chg %</th></tr>
    <tr><td>Operating profit</td><td>1,608</td><td>1,599</td><td>1</td></tr>
    <tr><td>Net profit for the period</td><td>1,232</td><td></td><td></td></tr></table>
    <table><tr><th></th><th>Q2 2026</th><th>Q2 2025</th><th>Chg %</th></tr>
    <tr><td>Diluted earnings per share (DEPS), EUR</td><td>0.36</td><td>0.35</td><td>3</td></tr></table>
  `, "https://www.nordea.com/en/press/2026-07-16/half-year-results-2026");
  assert.equal(nordea?.currency, "EUR");
  assert.equal(nordea?.publishedOn, "2026-07-16");
  assert.equal(nordea?.sourcePublisher, "Nordea");
  assert.equal(nordea?.metrics.find((metric) => metric.id === "operating_profit")?.comparisonAmount, 1599);
  assert.equal(nordea?.metrics.find((metric) => metric.id === "net_profit")?.comparisonAmount, null);
  assert.equal(nordea?.metrics.find((metric) => metric.id === "diluted_eps")?.scale, "unit");
  assert.equal(parseNordeaReportSnapshot("<table><tr><td>Operating profit</td><td>1</td></tr></table>", "https://www.nordea.com/en/press/2026-07-16/half-year-results-2026"), null);

  const tele2 = parseTele2ReportSnapshot(`
    <span>Jul 16 2026,  7:00 AM CET</span>
    <p>Total revenue of SEK 7.4 billion increased by 2% organically compared to Q2 2025.</p>
    <p>Underlying EBITDAaL of SEK 3.0 billion increased by 4%.</p>
    <p>Net profit from total operations of SEK 1.2 (1.2) billion and earnings per share of SEK 1.75 (1.72) in Q2 2026.</p>
    <p>Equity free cash flow of SEK 1.5 (1.6) billion in Q2 2026.</p>
  `, "https://www.tele2.com/investors/reports-and-presentations/tele2-reports-second-quarter-2026-results/");
  assert.equal(tele2?.currency, "SEK");
  assert.equal(tele2?.metrics.some((metric) => metric.id === "ebit" || metric.label === "EBIT"), false);
  assert.equal(tele2?.metrics.find((metric) => metric.id === "revenue")?.comparisonAmount, null);
  assert.equal(tele2?.metrics.find((metric) => metric.id === "equity_free_cash_flow")?.comparisonAmount, 1.6);
  assert.equal(parseTele2ReportSnapshot("<p>Total revenue of 7.4 billion in Q2 2026.</p>", "https://www.tele2.com/investors/reports-and-presentations/q2/"), null);

  const industrivarden = parseIndustrivardenReportSnapshot(`
    <time datetime="2026-07-08">8 jul 2026</time>
    <p>Substansvärdet den 30 juni 2026 var 225,0 mdkr, eller 521 kronor per aktie.</p>
  `, "https://www.industrivarden.se/media/Pressmeddelanden/2026/delarsrapport-1-januari--30-juni-2026/");
  assert.equal(industrivarden?.metrics[0]?.id, "net_asset_value");
  assert.equal(industrivarden?.metrics.some((metric) => metric.id === "revenue"), false);
  assert.equal(industrivarden?.currency, "SEK");
});

test("beslutad utdelning är inte förslag och saknar gissad utbetalningsdag", () => {
  const parsed = parseNordeaDecidedDividend(`
    The Board decided to distribute a mid-year dividend for 2026 amounting to EUR 0.34 per share.
    The dividend record date is confirmed for 6 August 2026 and the dividend payment date will be 13 August or as soon as possible thereafter.
  `, "https://www.nordea.com/en/press/2026-07-16/half-year-results-2026-and-decision-on-mid-year-dividend", "Nordea");
  assert.equal(parsed?.facts.find((fact) => fact.factType === "dividend_kind")?.valueText, "decided");
  assert.equal(parsed?.facts.find((fact) => fact.factType === "dividend_per_share")?.valueNumeric, 0.34);
  assert.equal(parsed?.facts.find((fact) => fact.factType === "dividend_currency")?.valueText, "EUR");
  assert.equal(parsed?.facts.find((fact) => fact.factType === "dividend_record_date")?.valueText, "2026-08-06");
  assert.equal(parsed?.facts.some((fact) => fact.factType === "dividend_payment_date"), false);
  assert.equal(parsed?.facts.some((fact) => fact.factType === "dividend_ex_date"), false);
});

test("aktuellt deduplicerar rapport och press och stannar på sex rader", () => {
  const duplicated = buildCurrentEvents({
    events: [{ title: "Stämma", date: "2026-11-01", url: "https://example.com/agm", publisher: "Bolaget" }],
    reports: [{ title: "Q2-rapport", date: "2026-07-16", url: "https://example.com/q2", publisher: "Bolaget" }],
    press: [{ title: "Q2-rapport", date: "2026-07-16", url: "https://example.com/q2", publisher: "Bolaget" }],
    articles: [],
    changePct: null,
    marketTimestamp: null,
    marketSourceUrl: null,
    now: NOW,
  });
  assert.deepEqual(duplicated.map((event) => event.kind), ["calendar", "report"]);
  const crowded = buildCurrentEvents({
    events: [{ title: "Stämma", date: "2026-11-01", url: "https://example.com/agm", publisher: "Bolaget" }],
    reports: [{ title: "Rapport", date: "2026-07-16", url: "https://example.com/report", publisher: "Bolaget" }],
    press: [{ title: "Press", date: "2026-09-01", url: "https://example.com/press", publisher: "Bolaget" }],
    articles: [{ title: "Artikel", publishedAt: "2026-09-21T08:00:00.000Z", href: "/news/artikel" }],
    dividend: { title: "Beslutad utdelning 0,34 EUR", date: "2026-08-06", url: "https://example.com/dividend", publisher: "Bolaget" },
    changePct: 4,
    marketTimestamp: "2026-09-29T08:00:00.000Z",
    marketSourceUrl: "https://finance.yahoo.com/quote/TEST.ST",
    now: NOW,
  });
  assert.equal(crowded.length <= CURRENT_EVENT_LIMIT, true);
  assert.deepEqual(crowded.map((event) => event.kind), ["calendar", "report", "dividend", "press", "news", "price_move"]);
});

test("indexering kräver fortfarande två stabila signaler och ignorerar marknadsdata", () => {
  assert.equal(COMPANY_PAGE_INDEX_MINIMUM, 2);
  const company = getCompanyProfile("abb");
  assert.ok(company);
  const thin = buildCompanyPageModel({
    company,
    market: market(),
    official: assembleCompanyOfficialData({
      slug: "abb",
      pressReleasesUrl: "https://global.abb/group/en/investors",
      reportsUrl: "https://global.abb/group/en/investors",
      calendarUrl: "https://global.abb/group/en/investors",
      profileUrl: "https://global.abb/group/en/investors",
      documents: [],
      documentQuery: "ok",
      facts: [],
      ownership: [],
      profileQuery: "ok",
      sources: [],
      now: NOW,
    }),
    articles: [],
    now: NOW,
  });
  assert.equal(thin.indexable, false);
  const substantial = buildCompanyPageModel({
    company: getCompanyProfile("nordea") ?? company,
    market: { ...market(), price: null, changePct: null },
    official: assembleCompanyOfficialData({
      slug: "nordea",
      pressReleasesUrl: "https://www.nordea.com/en/investors",
      reportsUrl: "https://www.nordea.com/en/investors",
      calendarUrl: "https://www.nordea.com/en/investors/financial-calendar",
      profileUrl: "https://www.nordea.com/en/investors",
      documents: [
        { type: "press_release", title: "Leadership", url: "https://www.nordea.com/en/press/2026-08-19/changes", publisher: "Nordea", publishedAt: "2026-08-19", eventAt: null },
        { type: "half_year_report", title: "Half-year results 2026", url: "https://www.nordea.com/en/press/2026-07-16/results", publisher: "Nordea", publishedAt: "2026-07-16", eventAt: null },
      ],
      documentQuery: "ok",
      facts: [],
      ownership: [],
      profileQuery: "ok",
      sources: [],
      now: NOW,
    }),
    articles: [],
    now: NOW,
  });
  assert.equal(substantial.indexable, true);
  assert.deepEqual(substantial.indexSignals, ["reports", "press"]);
  assert.deepEqual(thin.indexSignals, []);
  const owners = selectOwnershipSnapshot([
    { owner: "Äldre", capitalPct: 40, asOf: "2024-12-31" },
    { owner: "Ny", capitalPct: 12, asOf: "2026-06-30" },
  ]);
  assert.deepEqual(owners.items.map((item) => item.owner), ["Ny"]);
});

test("kronjuvelen rör inte Autoredaktionen, cron eller PR 415", () => {
  const surface = [
    "lib/companies/ingestion/adapters/omxs30-crown.ts",
    "lib/companies/report-snapshot.ts",
    "lib/companies/coverage-audit.ts",
    "lib/companies/page-model.ts",
    "components/companies/CompanyPageContent.tsx",
  ].map(read).join("\n");
  assert.doesNotMatch(surface, /autoredaktion|dax-40|nasdaq-100|börskollen/i);
  assert.match(read("vercel.json"), /17 3 \* \* \*/);
  assert.match(read("lib/companies/ingestion/schedule.ts"), /17 3 \* \* \*/);
});
