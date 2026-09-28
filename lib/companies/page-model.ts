import type { NewsArticle } from "@/types/news";
import { buildCurrentEvents, stockholmIsoDate, type CurrentEvent } from "@/lib/companies/current-events";
import {
  classifyOfficialDividend,
  DIVIDEND_KIND_LABEL,
  paidDividendGrowth,
  type DividendKind,
  type PaidDividend,
} from "@/lib/companies/dividend-view";
import type { AnnualFinancialPoint, FinancialHistoryStatus } from "@/lib/companies/financial-history";
import { INSIDER_LINK } from "@/lib/companies/insiders";
import {
  officialDividendYieldPercent,
  type CompanyOfficialData,
} from "@/lib/companies/official-data";
import { companyOfficialCoverage } from "@/lib/companies/official-coverage";
import { selectOwnershipSnapshot } from "@/lib/companies/ownership-snapshot";
import type { CompanyProfile } from "@/lib/companies/types";
import {
  buildValuationMetrics,
  formatMoney,
  formatPercentPoints,
  formatPayoutRatio,
  formatSvNumber,
  MISSING_METRIC,
  type DisplayMetric,
  type ValuationSnapshot,
} from "@/lib/companies/valuation";

export type PageMarketInput = {
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency: string | null;
  volume: number | null;
  marketTimestamp: string | null;
  marketCap: number | null;
  week52Low: number | null;
  week52High: number | null;
  sourceUrl: string;
  valuation: ValuationSnapshot;
  financials: {
    status: FinancialHistoryStatus;
    points: AnnualFinancialPoint[];
  };
};

export type PageDocument = {
  type: string;
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: string | null;
  eventAt: string | null;
};

export type SourcedRow = {
  title: string;
  date: string | null;
  url: string;
  publisher: string | null;
  documentType: string | null;
};

export type CompanyPageModel = {
  delayedLabel: string;
  priceText: string;
  changeText: string;
  changePctText: string;
  positiveChange: boolean;
  marketTimestamp: string | null;
  marketSourceUrl: string;
  metrics: DisplayMetric[];
  financials: PageMarketInput["financials"];
  dividend: {
    kind: DividendKind;
    kindLabel: string;
    perShareText: string;
    currency: string | null;
    year: number | null;
    sourceUrl: string | null;
    sourcePublisher: string | null;
    asOf: string | null;
    history: PaidDividend[];
    growthText: string | null;
    payoutText: string;
    yieldBlocked: boolean;
  };
  currentEvents: CurrentEvent[];
  ownership: {
    asOf: string | null;
    sourceUrl: string | null;
    sourcePublisher: string | null;
    rows: Array<{ owner: string; capitalPct: number; votesPct: number | null; sourceUrl: string; sourcePublisher: string }>;
  };
  management: Array<{
    role: string;
    name: string;
    sourceUrl: string | null;
    sourcePublisher: string | null;
    asOf: string | null;
  }>;
  reports: SourcedRow[];
  press: SourcedRow[];
  events: SourcedRow[];
  insiders: typeof INSIDER_LINK;
  indexSignals: string[];
  indexable: boolean;
};

const REPORT_LABEL: Record<string, string> = {
  quarterly_report: "Kvartalsrapport",
  half_year_report: "Halvårsrapport",
  annual_report: "Årsredovisning",
  report_date: "Rapportdatum",
};

function documentType(documents: readonly PageDocument[], url: string) {
  const match = documents.find((document) => document.url === url);
  if (!match) return null;
  return REPORT_LABEL[match.type] ?? null;
}

function publisherFor(documents: readonly PageDocument[], url: string, fallback: string | null) {
  return documents.find((document) => document.url === url)?.publisher ?? fallback;
}

export function companyIndexSignals(input: {
  price: number | null;
  metrics: readonly DisplayMetric[];
  financialPoints: number;
  dividendKind: DividendKind;
  dividendAmount: boolean;
  paidDividends: number;
  reports: number;
  press: number;
  events: number;
  management: number;
  ownership: number;
}) {
  const signals: string[] = [];
  if (input.price !== null) signals.push("market_price");
  if (input.metrics.some((metric) => metric.id !== "official_yield" && metric.id !== "week52" && metric.id !== "volume" && metric.value !== MISSING_METRIC)) {
    signals.push("valuation");
  }
  if (input.financialPoints > 0) signals.push("financial_history");
  if (input.dividendAmount && input.dividendKind !== "board_proposal") signals.push("dividend");
  if (input.paidDividends > 0) signals.push("dividend_history");
  if (input.reports > 0) signals.push("reports");
  if (input.press > 0) signals.push("press");
  if (input.events > 0) signals.push("calendar");
  if (input.management > 0) signals.push("management");
  if (input.ownership > 0) signals.push("ownership");
  return signals;
}

export const COMPANY_PAGE_INDEX_MINIMUM = 2;

export function buildCompanyPageModel(input: {
  company: CompanyProfile;
  market: PageMarketInput;
  official: CompanyOfficialData;
  articles: readonly NewsArticle[];
  paidDividends?: readonly PaidDividend[];
  documents?: readonly PageDocument[];
  now?: Date;
}): CompanyPageModel {
  const documents = input.documents ?? [];
  const paidDividends = [...(input.paidDividends ?? [])].sort((left, right) => left.exDate.localeCompare(right.exDate));
  const blocker = companyOfficialCoverage(input.company.slug)?.dividend.blocker ?? null;
  const officialDividend = classifyOfficialDividend({
    perShare: input.official.dividend.perShare,
    blocker,
  });
  const officialYield = officialDividend.kind === "board_proposal"
    ? null
    : officialDividendYieldPercent({
      dividend: {
        ...input.official.dividend,
        perShare: officialDividend.perShare,
        currency: input.official.dividend.currency,
      },
      price: input.market.price,
      marketCurrency: input.market.currency,
    });
  const yieldBlocked = officialDividend.perShare !== null
    && officialDividend.kind !== "board_proposal"
    && input.market.price !== null
    && input.market.price > 0
    && Boolean(input.official.dividend.currency)
    && Boolean(input.market.currency)
    && input.official.dividend.currency !== input.market.currency;
  const metrics = buildValuationMetrics({
    currency: input.market.currency,
    marketCap: input.market.marketCap,
    volume: input.market.volume,
    week52Low: input.market.week52Low,
    week52High: input.market.week52High,
    valuation: input.market.valuation,
    officialYieldPercent: officialYield,
    officialYieldBlocked: yieldBlocked,
  });
  const growth = paidDividendGrowth(paidDividends, input.now);
  const reportItems = input.official.reports.status === "available_with_items" ? input.official.reports.items : [];
  const pressItems = input.official.pressReleases.status === "available_with_items" ? input.official.pressReleases.items : [];
  const eventItems = input.official.events.status === "available_with_items" ? input.official.events.items : [];
  const reports: SourcedRow[] = reportItems.map((item) => ({
    title: item.title,
    date: item.date,
    url: item.url,
    publisher: publisherFor(documents, item.url, input.official.reports.sourcePublisher),
    documentType: documentType(documents, item.url),
  }));
  const press: SourcedRow[] = pressItems.map((item) => ({
    title: item.title,
    date: item.date,
    url: item.url,
    publisher: publisherFor(documents, item.url, input.official.pressReleases.sourcePublisher),
    documentType: "Pressmeddelande",
  }));
  const today = stockholmIsoDate(input.now ?? new Date());
  const events: SourcedRow[] = eventItems.flatMap((item) => {
    if (!item.date || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || item.date < today) return [];
    return [{
      title: item.title,
      date: item.date,
      url: item.url,
      publisher: publisherFor(documents, item.url, input.official.events.sourcePublisher),
      documentType: documentType(documents, item.url) ?? "Kalenderhändelse",
    }];
  });
  const ownershipSnapshot = input.official.ownership.status === "available_with_items"
    ? selectOwnershipSnapshot(input.official.ownership.items)
    : { asOf: null, items: [] };
  const management = input.official.ceo.name
    ? [{
      role: "VD",
      name: input.official.ceo.name,
      sourceUrl: input.official.ceo.sourceUrl,
      sourcePublisher: input.official.ceo.sourcePublisher,
      asOf: input.official.ceo.asOf,
    }]
    : [];
  const articles = input.articles.map((article) => ({
    title: article.title,
    publishedAt: article.publishedAt,
    href: article.url ?? `/news/${article.id}`,
  }));
  const indexSignals = companyIndexSignals({
    price: input.market.price,
    metrics,
    financialPoints: input.market.financials.points.length,
    dividendKind: officialDividend.kind,
    dividendAmount: officialDividend.perShare !== null,
    paidDividends: paidDividends.length,
    reports: reports.length,
    press: press.length,
    events: events.length,
    management: management.length,
    ownership: ownershipSnapshot.items.length,
  });
  const changeText = input.market.change === null || !input.market.currency
    ? MISSING_METRIC
    : `${input.market.change > 0 ? "+" : ""}${formatSvNumber(input.market.change, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${input.market.currency}`;
  const changePctText = input.market.changePct === null
    ? MISSING_METRIC
    : `${input.market.changePct > 0 ? "+" : ""}${formatSvNumber(input.market.changePct, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`;

  return {
    delayedLabel: "Fördröjd marknadsdata",
    priceText: formatMoney(input.market.price, input.market.currency),
    changeText,
    changePctText,
    positiveChange: (input.market.changePct ?? 0) >= 0,
    marketTimestamp: input.market.marketTimestamp,
    marketSourceUrl: input.market.sourceUrl,
    metrics,
    financials: input.market.financials,
    dividend: {
      kind: officialDividend.kind,
      kindLabel: DIVIDEND_KIND_LABEL[officialDividend.kind],
      perShareText: officialDividend.perShare === null
        ? MISSING_METRIC
        : formatMoney(officialDividend.perShare, input.official.dividend.currency),
      currency: input.official.dividend.currency,
      year: input.official.dividend.year,
      sourceUrl: input.official.dividend.sourceUrl,
      sourcePublisher: input.official.dividend.sourcePublisher,
      asOf: input.official.dividend.asOf,
      history: paidDividends,
      growthText: growth
        ? `${growth.years}-årig årlig tillväxt av utbetald utdelning: ${formatPercentPoints(growth.cagr * 100)}. Summan av utbetalningar per avslutat kalenderår.`
        : null,
      payoutText: formatPayoutRatio(input.market.valuation.payoutRatio),
      yieldBlocked,
    },
    currentEvents: buildCurrentEvents({
      events,
      reports,
      press,
      articles,
      changePct: input.market.changePct,
      marketTimestamp: input.market.marketTimestamp,
      marketSourceUrl: input.market.sourceUrl,
      now: input.now,
    }),
    ownership: {
      asOf: ownershipSnapshot.asOf,
      sourceUrl: input.official.ownership.sourceUrl,
      sourcePublisher: ownershipSnapshot.items[0]?.sourcePublisher ?? input.official.ownership.sourcePublisher,
      rows: ownershipSnapshot.items.slice(0, 8).map((item) => ({
        owner: item.owner,
        capitalPct: item.capitalPct,
        votesPct: item.votesPct,
        sourceUrl: item.sourceUrl,
        sourcePublisher: item.sourcePublisher,
      })),
    },
    management,
    reports,
    press,
    events,
    insiders: INSIDER_LINK,
    indexSignals,
    indexable: indexSignals.length >= COMPANY_PAGE_INDEX_MINIMUM,
  };
}

export function formatPaidDividend(amount: number, currency: string) {
  return formatMoney(amount, currency);
}
