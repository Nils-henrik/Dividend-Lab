import "server-only";

import type { CompanyProfile } from "@/lib/companies/types";
import {
  fetchYahooFundamentals,
  fetchYahooHistoryResearch,
} from "@/lib/model-portfolios/engine/yahoo-research";

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
