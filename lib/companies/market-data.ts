import "server-only";

import { getCompanyProfile } from "@/lib/companies/catalog";
import { sessionExtremes } from "@/lib/companies/quote-session";
import type { CompanyProfile } from "@/lib/companies/types";
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
};

function finite(values: Array<number | null | undefined>) {
  return values.filter((value): value is number =>
    typeof value === "number" && Number.isFinite(value),
  );
}

export async function getCompanyMarketData(
  company: CompanyProfile,
  includeFundamentals = true,
): Promise<CompanyMarketData> {
  const fetchedAt = new Date().toISOString();
  const [history, fundamentals] = await Promise.all([
    fetchYahooHistoryResearch(company.marketDataSymbol),
    includeFundamentals
      ? fetchYahooFundamentals(company.marketDataSymbol, 1)
      : Promise.resolve(null),
  ]);
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

  return {
    price,
    previousClose,
    change:
      price !== null && previousClose !== null ? price - previousClose : null,
    changePct: quote?.changePct ?? null,
    currency: history?.currency ?? null,
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
  };
}

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
