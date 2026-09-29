import "server-only";

import { cache } from "react";
import { getCompanyProfile } from "@/lib/companies/catalog";
import {
  parseYahooAnnualFinancials,
  type AnnualFinancialPoint,
  type FinancialHistoryStatus,
} from "@/lib/companies/financial-history";
import { sessionExtremes } from "@/lib/companies/quote-session";
import type { CompanyProfile } from "@/lib/companies/types";
import type { ValuationSnapshot } from "@/lib/companies/valuation";
import {
  fetchYahooFundamentals,
  fetchYahooHistoryResearch,
} from "@/lib/model-portfolios/engine/yahoo-research";

const WATCHLIST_MARKET_CONCURRENCY = 4;

export type CompanyMarketData = {
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePct: number | null;
  currency: string | null;
  volume: number | null;
  marketTimestamp: string | null;
  marketCap: number | null;
  peRatio: number | null;
  dividendYield: number | null;
  week52Low: number | null;
  week52High: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  sessionVolume: number | null;
  sparkline: number[];
  sourceUrl: string;
  fetchedAt: string;
  valuation: ValuationSnapshot;
  financials: {
    status: FinancialHistoryStatus;
    points: AnnualFinancialPoint[];
  };
};

function finiteOrNull(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function emptyValuation(): ValuationSnapshot {
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

function finite(values: Array<number | null | undefined>) {
  return values.filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value),
  );
}

async function loadCompanyMarketData(
  company: CompanyProfile,
  includeFundamentals = true,
  includeStatements = false,
): Promise<CompanyMarketData> {
  const fetchedAt = new Date().toISOString();
  const [history, statementFundamentals] = await Promise.all([
    fetchYahooHistoryResearch(company.marketDataSymbol),
    includeFundamentals
      ? fetchYahooFundamentals(company.marketDataSymbol, 1, fetch, new Date(), includeStatements)
      : Promise.resolve(null),
  ]);
  const fundamentals = statementFundamentals
    ?? (includeFundamentals && includeStatements
      ? await fetchYahooFundamentals(company.marketDataSymbol, 1)
      : null);
  const quote = history?.quote ?? null;
  const cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 1);
  const yearBars =
    history?.history.filter((bar) => new Date(`${bar.date}T00:00:00Z`) >= cutoff) ?? [];
  const lows = finite(yearBars.map((bar) => bar.low));
  const highs = finite(yearBars.map((bar) => bar.high));
  const price = quote?.close ?? null;
  const previousClose = quote?.previousClose ?? null;
  const lastBar = history?.history.at(-1) ?? null;
  const extremes = sessionExtremes(
    quote?.timestamp ?? null,
    lastBar
      ? {
          date: lastBar.date,
          high: lastBar.high,
          low: lastBar.low,
          volume: lastBar.volume,
        }
      : null,
  );
  const sparkline = (history?.history ?? [])
    .slice(-30)
    .map((bar) => bar.close)
    .filter((close) => Number.isFinite(close));
  const snapshot = fundamentals?.snapshot;
  const valuation: ValuationSnapshot = snapshot
    ? {
        trailingPe: finiteOrNull(snapshot.trailingPe ?? snapshot.peRatio),
        forwardPe: finiteOrNull(snapshot.forwardPe),
        priceToSales: finiteOrNull(snapshot.priceSalesTtm),
        priceToBook: finiteOrNull(snapshot.priceBookMrq),
        enterpriseToEbitda: finiteOrNull(snapshot.enterpriseToEbitda),
        enterpriseValue: finiteOrNull(snapshot.enterpriseValue),
        trailingEps: finiteOrNull(snapshot.trailingEps),
        beta: finiteOrNull(snapshot.beta),
        sharesOutstanding: finiteOrNull(snapshot.sharesOutstanding),
        payoutRatio: finiteOrNull(snapshot.payoutRatio),
        dividendYield: finiteOrNull(snapshot.dividendYield ?? snapshot.forwardAnnualDividendYield),
      }
    : emptyValuation();
  const currency = history?.currency ?? null;
  // Listing currency stays on the quote. Statement rows read financialCurrency themselves.
  const financialPoints = includeStatements && statementFundamentals
    ? parseYahooAnnualFinancials(statementFundamentals.statements)
    : [];
  const financials = {
    status: !includeStatements
      ? "empty" as const
      : !statementFundamentals
        ? "unavailable" as const
        : financialPoints.length
          ? "available" as const
          : "empty" as const,
    points: financialPoints,
  };

  return {
    price,
    previousClose,
    change:
      price !== null && previousClose !== null ? price - previousClose : null,
    changePct: quote?.changePct ?? null,
    currency,
    volume: quote?.volume ?? null,
    marketTimestamp: quote?.timestamp ?? null,
    marketCap: fundamentals?.snapshot.marketCap ?? null,
    peRatio:
      fundamentals?.snapshot.peRatio ?? fundamentals?.snapshot.trailingPe ?? null,
    dividendYield:
      fundamentals?.snapshot.dividendYield ??
      fundamentals?.snapshot.forwardAnnualDividendYield ??
      null,
    week52Low: lows.length ? Math.min(...lows) : null,
    week52High: highs.length ? Math.max(...highs) : null,
    dayHigh: history?.dayHigh ?? extremes.dayHigh,
    dayLow: history?.dayLow ?? extremes.dayLow,
    sessionVolume: history?.dayVolume ?? extremes.sessionVolume,
    sparkline,
    sourceUrl:
      history?.sourceUrl ??
      `https://finance.yahoo.com/quote/${encodeURIComponent(company.marketDataSymbol)}`,
    fetchedAt,
    valuation,
    financials,
  };
}

export const getCompanyMarketData = cache(loadCompanyMarketData);

export async function getRelatedCompanyMarketData(
  companies: readonly CompanyProfile[],
): Promise<Record<string, CompanyMarketData>> {
  const pairs = await Promise.all(
    companies.map(async (company) => [company.slug, await getCompanyMarketData(company, false)] as const),
  );
  return Object.fromEntries(pairs);
}

/**
 * Delayed quotes for companies the user already follows.
 * Discovery listings must not call this: one chart request plus one
 * fundamentals request per followed slug is the cost boundary.
 */
export async function getFollowedCompaniesMarketData(
  slugs: readonly string[],
): Promise<Record<string, CompanyMarketData>> {
  const companies = slugs.flatMap((slug) => {
    const company = getCompanyProfile(slug);
    return company ? [company] : [];
  });
  const results: Record<string, CompanyMarketData> = {};
  let cursor = 0;

  async function worker() {
    while (cursor < companies.length) {
      const company = companies[cursor];
      cursor += 1;

      if (!company) {
        continue;
      }

      results[company.slug] = await getCompanyMarketData(company);
    }
  }

  const workerCount = Math.min(WATCHLIST_MARKET_CONCURRENCY, companies.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}
