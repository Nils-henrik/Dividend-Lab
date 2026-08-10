import "server-only";

import type { DailyBar, DelayedQuote } from "./eodhd";
import type {
  EodhdFundamentalsSnapshot,
  ResearchFundamentalScores,
} from "./research-fundamentals";
import { scoreNormalizedFundamentals } from "./research-fundamentals";

const YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const YAHOO_QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote";
const USER_AGENT = "DivLab/1.0 market-research";

export type YahooResearchFundamentals = {
  snapshot: EodhdFundamentalsSnapshot;
  scores: ResearchFundamentalScores;
  sourceUrl: string;
  fetchedAt: string;
};

export type YahooHistoryResearch = {
  quote: DelayedQuote | null;
  history: DailyBar[];
  sourceUrl: string;
  currency: string | null;
  exchangeName: string | null;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: Record<string, unknown>;
      timestamp?: unknown[];
      indicators?: {
        quote?: Array<{
          open?: unknown[];
          high?: unknown[];
          low?: unknown[];
          close?: unknown[];
          volume?: unknown[];
        }>;
        adjclose?: Array<{ adjclose?: unknown[] }>;
      };
    }>;
  };
};

type YahooSummaryResult = {
  summaryDetail?: Record<string, unknown>;
  defaultKeyStatistics?: Record<string, unknown>;
  financialData?: Record<string, unknown>;
  price?: Record<string, unknown>;
};

type YahooSummaryResponse = {
  quoteSummary?: { result?: YahooSummaryResult[] };
};

type YahooQuoteResponse = {
  quoteResponse?: { result?: Array<Record<string, unknown>> };
};

function finiteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (value && typeof value === "object") {
    return finiteNumber((value as { raw?: unknown }).raw);
  }
  return null;
}

function finitePositive(value: unknown): number | null {
  const parsed = finiteNumber(value);
  return parsed !== null && parsed > 0 ? parsed : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isoFromEpochSeconds(value: unknown): string | null {
  const seconds = finiteNumber(value);
  if (seconds === null || seconds <= 0) return null;
  const date = new Date(seconds * 1_000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function dateFromEpochSeconds(value: unknown): string | null {
  const timestamp = isoFromEpochSeconds(value);
  return timestamp ? timestamp.slice(0, 10) : null;
}

function yahooMarketFromSymbol(symbol: string): "US" | "SE" | "DK" | "FI" | "NO" {
  const upper = symbol.toUpperCase();
  if (upper.endsWith(".ST")) return "SE";
  if (upper.endsWith(".CO")) return "DK";
  if (upper.endsWith(".HE")) return "FI";
  if (upper.endsWith(".OL")) return "NO";
  return "US";
}

function stripYahooSuffix(symbol: string): string {
  return symbol.replace(/\.(ST|CO|HE|OL)$/i, "");
}

function exchangeFromMarket(market: ReturnType<typeof yahooMarketFromSymbol>): string {
  if (market === "SE") return "ST";
  if (market === "DK") return "CO";
  if (market === "FI") return "HE";
  if (market === "NO") return "OL";
  return "US";
}

export function toYahooSymbol(symbol: string, exchange: string): string {
  const clean = symbol.trim();
  if (!clean) throw new Error("invalid_yahoo_symbol");
  if (/\.(ST|CO|HE|OL)$/i.test(clean)) return clean.toUpperCase();
  const normalizedExchange = exchange.trim().toUpperCase();
  if (["ST", "STO", "XSTO"].includes(normalizedExchange)) return `${clean}.ST`;
  if (["CO", "CPH", "XCSE"].includes(normalizedExchange)) return `${clean}.CO`;
  if (["HE", "HEL", "XHEL"].includes(normalizedExchange)) return `${clean}.HE`;
  if (["OL", "OSL", "XOSL"].includes(normalizedExchange)) return `${clean}.OL`;
  return clean;
}

export async function fetchYahooHistoryResearch(
  yahooSymbol: string,
  fetchImpl: typeof fetch = fetch,
): Promise<YahooHistoryResearch | null> {
  const symbol = yahooSymbol.trim();
  if (!symbol) return null;
  const url = new URL(`${YAHOO_CHART_ENDPOINT}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("range", "18mo");
  url.searchParams.set("interval", "1d");
  url.searchParams.set("events", "div,splits");
  url.searchParams.set("includeAdjustedClose", "true");

  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 900 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as YahooChartResponse;
    const result = body.chart?.result?.[0];
    if (!result) return null;

    const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
    const quoteRows = result.indicators?.quote?.[0];
    const adjustedRows = result.indicators?.adjclose?.[0]?.adjclose ?? [];
    const history: DailyBar[] = [];

    for (let index = 0; index < timestamps.length; index += 1) {
      const date = dateFromEpochSeconds(timestamps[index]);
      const open = finiteNumber(quoteRows?.open?.[index]);
      const high = finiteNumber(quoteRows?.high?.[index]);
      const low = finiteNumber(quoteRows?.low?.[index]);
      const close = finiteNumber(quoteRows?.close?.[index]);
      const volume = finiteNumber(quoteRows?.volume?.[index]);
      if (!date || open === null || high === null || low === null || close === null || volume === null) continue;
      history.push({
        date,
        open,
        high,
        low,
        close,
        adjustedClose: finiteNumber(adjustedRows[index]),
        volume,
      });
    }

    const meta = result.meta ?? {};
    const market = yahooMarketFromSymbol(symbol);
    const regularPrice = finitePositive(meta.regularMarketPrice);
    const previousClose = finitePositive(meta.chartPreviousClose ?? meta.previousClose);
    const last = history.at(-1);
    const timestamp = isoFromEpochSeconds(meta.regularMarketTime) ??
      (last ? `${last.date}T21:00:00.000Z` : null);
    const quote: DelayedQuote | null = regularPrice && timestamp
      ? {
          symbol: stripYahooSuffix(symbol),
          exchange: exchangeFromMarket(market),
          market,
          timestamp,
          open: last?.open ?? null,
          high: last?.high ?? null,
          low: last?.low ?? null,
          close: regularPrice,
          previousClose,
          volume: last?.volume ?? null,
          changePct: previousClose && previousClose > 0
            ? (regularPrice / previousClose - 1) * 100
            : null,
          delayed: true,
          provider: "eodhd",
        }
      : null;

    return {
      quote,
      history,
      sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`,
      currency: stringValue(meta.currency),
      exchangeName: stringValue(meta.fullExchangeName ?? meta.exchangeName),
    };
  } catch {
    return null;
  }
}

function readModuleNumber(module: Record<string, unknown> | undefined, key: string): number | null {
  if (!module) return null;
  return finiteNumber(module[key]);
}

function snapshotFromSummary(result: YahooSummaryResult): EodhdFundamentalsSnapshot {
  const summary = result.summaryDetail;
  const stats = result.defaultKeyStatistics;
  const financial = result.financialData;
  const price = result.price;
  return {
    marketCap: readModuleNumber(price, "marketCap"),
    peRatio: readModuleNumber(summary, "trailingPE"),
    pegRatio: readModuleNumber(stats, "pegRatio"),
    profitMargin: readModuleNumber(financial, "profitMargins"),
    operatingMarginTtm: readModuleNumber(financial, "operatingMargins"),
    returnOnEquityTtm: readModuleNumber(financial, "returnOnEquity"),
    returnOnAssetsTtm: readModuleNumber(financial, "returnOnAssets"),
    quarterlyEarningsGrowthYoy: readModuleNumber(financial, "earningsGrowth"),
    quarterlyRevenueGrowthYoy: readModuleNumber(financial, "revenueGrowth"),
    dividendYield: readModuleNumber(summary, "dividendYield"),
    payoutRatio: readModuleNumber(summary, "payoutRatio"),
    forwardAnnualDividendYield: readModuleNumber(summary, "dividendYield"),
    trailingPe: readModuleNumber(summary, "trailingPE"),
    priceBookMrq: readModuleNumber(stats, "priceToBook"),
    priceSalesTtm: readModuleNumber(summary, "priceToSalesTrailing12Months"),
  };
}

function snapshotFromQuote(row: Record<string, unknown>): EodhdFundamentalsSnapshot {
  return {
    marketCap: finiteNumber(row.marketCap),
    peRatio: finiteNumber(row.trailingPE),
    trailingPe: finiteNumber(row.trailingPE),
    dividendYield: finiteNumber(row.dividendYield),
    forwardAnnualDividendYield: finiteNumber(row.trailingAnnualDividendYield),
    priceBookMrq: finiteNumber(row.priceToBook),
    priceSalesTtm: finiteNumber(row.priceToSalesTrailing12Months),
  };
}

async function fetchSummarySnapshot(
  symbol: string,
  fetchImpl: typeof fetch,
): Promise<EodhdFundamentalsSnapshot | null> {
  const url = new URL(`${YAHOO_SUMMARY_ENDPOINT}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("modules", "summaryDetail,defaultKeyStatistics,financialData,price");
  url.searchParams.set("formatted", "false");
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 14_400 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as YahooSummaryResponse;
    const result = body.quoteSummary?.result?.[0];
    return result ? snapshotFromSummary(result) : null;
  } catch {
    return null;
  }
}

async function fetchQuoteSnapshot(
  symbol: string,
  fetchImpl: typeof fetch,
): Promise<EodhdFundamentalsSnapshot | null> {
  const url = new URL(YAHOO_QUOTE_ENDPOINT);
  url.searchParams.set("symbols", symbol);
  try {
    const response = await fetchImpl(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 14_400 },
    });
    if (!response.ok) return null;
    const body = (await response.json()) as YahooQuoteResponse;
    const row = body.quoteResponse?.result?.[0];
    return row ? snapshotFromQuote(row) : null;
  } catch {
    return null;
  }
}

export async function fetchYahooFundamentals(
  yahooSymbol: string,
  fxToSek: number,
  fetchImpl: typeof fetch = fetch,
  now = new Date(),
): Promise<YahooResearchFundamentals | null> {
  if (!Number.isFinite(fxToSek) || fxToSek <= 0) return null;
  const symbol = yahooSymbol.trim();
  if (!symbol) return null;

  const snapshot =
    (await fetchSummarySnapshot(symbol, fetchImpl)) ??
    (await fetchQuoteSnapshot(symbol, fetchImpl));
  if (!snapshot) return null;

  const scores = scoreNormalizedFundamentals(snapshot, fxToSek);
  const useful = [
    scores.qualityScore,
    scores.valuationScore,
    scores.earningsRevisionScore,
    scores.dividendQualityScore,
    scores.catalystScore,
    scores.balanceSheetScore,
  ].some((value) => Number.isFinite(value));
  if (!useful) return null;

  return {
    snapshot,
    scores,
    sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/key-statistics/`,
    fetchedAt: now.toISOString(),
  };
}
