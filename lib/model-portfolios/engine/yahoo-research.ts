import "server-only";

import {
  canonicalizeInstrumentSymbol,
  toYahooTransportSymbol,
} from "./instrument-symbol";
import type { DailyBar, DelayedQuote } from "./eodhd";
import type {
  EodhdFundamentalsSnapshot,
  ResearchFundamentalScores,
} from "./research-fundamentals";
import { scoreNormalizedFundamentals } from "./research-fundamentals";

const YAHOO_CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
const YAHOO_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const YAHOO_QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote";
const YAHOO_CRUMB_ENDPOINT = "https://query1.finance.yahoo.com/v1/test/getcrumb";
const YAHOO_HOME = "https://finance.yahoo.com/";
const USER_AGENT =
  "Mozilla/5.0 (compatible; DivLab/1.0; +https://divlab.se) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36";

/**
 * Source contract (Yahoo fundamentals for Nordic 09:20):
 * - Chart history stays unauthenticated (works in production without crumb).
 * - quoteSummary / v7 quote require a short-lived crumb + cookie session.
 * - Sessions are cached in-process (~45 min) to keep cost/rate bounded.
 * - Missing/unauthorized responses degrade to null fundamentals (never fabricate).
 * - Nordic EODHD budget remains hard zero; this path is the Yahoo replacement.
 */
const YAHOO_SESSION_TTL_MS = 45 * 60 * 1_000;

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

type YahooSession = {
  crumb: string;
  cookie: string;
  fetchedAtMs: number;
};

let cachedYahooSession: YahooSession | null = null;

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

function exchangeFromMarket(market: ReturnType<typeof yahooMarketFromSymbol>): string {
  if (market === "SE") return "ST";
  if (market === "DK") return "CO";
  if (market === "FI") return "HE";
  if (market === "NO") return "OL";
  return "US";
}

export function toYahooSymbol(symbol: string, exchange: string): string {
  return toYahooTransportSymbol(symbol, exchange);
}

/**
 * Resolve the true previous trading-session close for daily % change.
 *
 * Yahoo chart `chartPreviousClose` is the close before the requested chart
 * *range*, not the prior session. With range=18mo that produces false 10–30%
 * moves. Prefer meta.previousClose; otherwise the most recent prior daily bar.
 *
 * Split/adjustment: daily % change compares regularMarketPrice to the prior
 * unadjusted session close. When the last history bar already reflects today's
 * partial session (close ≈ regular price), use the penultimate raw close.
 * Never fall back to long-range chartPreviousClose.
 */
export function resolvePreviousSessionClose(input: {
  meta: Record<string, unknown>;
  history: readonly DailyBar[];
  regularPrice: number | null;
}): number | null {
  const sessionPrevious = finitePositive(input.meta.previousClose);
  if (sessionPrevious) return sessionPrevious;

  const history = input.history;
  if (!history.length) return null;

  const last = history.at(-1)!;
  const prior = history.at(-2);
  const regularPrice = input.regularPrice;

  // Prefer adjusted closes only when comparing two history bars across a split
  // gap where raw closes diverge sharply from adj closes but adj pair is coherent.
  const priorRaw = prior ? finitePositive(prior.close) : null;
  const lastRaw = finitePositive(last.close);

  if (prior && priorRaw && lastRaw && regularPrice && regularPrice > 0) {
    const lastLooksLikeToday =
      Math.abs(lastRaw - regularPrice) / regularPrice <= 0.02 ||
      Math.abs(lastRaw - regularPrice) < 0.05;
    if (lastLooksLikeToday) {
      return splitSafePriorClose(prior, last) ?? priorRaw;
    }
  }

  if (priorRaw && lastRaw && regularPrice && regularPrice > 0) {
    // Market open / incomplete last bar already handled; otherwise last bar is prior session.
    return lastRaw;
  }

  if (priorRaw && lastRaw) {
    return splitSafePriorClose(prior!, last) ?? priorRaw;
  }

  return lastRaw;
}

function splitSafePriorClose(prior: DailyBar, last: DailyBar): number | null {
  const priorRaw = finitePositive(prior.close);
  const lastRaw = finitePositive(last.close);
  const priorAdj = finitePositive(prior.adjustedClose);
  const lastAdj = finitePositive(last.adjustedClose);
  if (!priorRaw || !lastRaw) return priorRaw;

  if (priorAdj && lastAdj && priorAdj > 0 && lastAdj > 0) {
    const rawRatio = lastRaw / priorRaw;
    const adjRatio = lastAdj / priorAdj;
    // Corporate action: raw move huge while adjusted move is modest.
    if (Math.abs(rawRatio - 1) > 0.35 && Math.abs(adjRatio - 1) <= 0.2) {
      // Express prior close in the current share class using adj continuity.
      return finitePositive(priorAdj * (lastRaw / lastAdj)) ?? priorRaw;
    }
  }
  return priorRaw;
}

export function changePctFromPrices(
  regularPrice: number | null,
  previousClose: number | null,
): number | null {
  if (!regularPrice || !previousClose || previousClose <= 0) return null;
  return (regularPrice / previousClose - 1) * 100;
}

/** Normalize Yahoo yield fields that may arrive as percent (5.84) or fraction (0.0584). */
export function normalizeYahooYield(value: number | null): number | null {
  if (value === null || !Number.isFinite(value) || value < 0) return null;
  if (value > 1) return value / 100;
  return value;
}

function cookieHeaderFromJar(jar: Map<string, string>): string {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function ingestSetCookies(response: Response, jar: Map<string, string>): void {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const rawCookies: string[] =
    typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  // Some fetch polyfills only expose a single set-cookie via get().
  if (!rawCookies.length) {
    const single = response.headers.get("set-cookie");
    if (single) rawCookies.push(single);
  }
  for (const raw of rawCookies) {
    // Prefer named Yahoo session cookies even if multiple were joined.
    for (const name of ["A1", "A1S", "A3", "B"] as const) {
      const match = raw.match(new RegExp(`(?:^|[,\\s])${name}=([^;\\s,]+)`));
      if (match?.[1]) jar.set(name, match[1]);
    }
    const first = raw.split(";", 1)[0] ?? "";
    const eq = first.indexOf("=");
    if (eq <= 0) continue;
    const name = first.slice(0, eq).trim();
    const value = first.slice(eq + 1).trim();
    if (!name || !value) continue;
    if (["A1", "A1S", "A3", "B"].includes(name)) jar.set(name, value);
  }
}

/**
 * Obtain (and cache) a Yahoo crumb + cookie session for quote/quoteSummary.
 * Failures return null so callers can degrade to missing fundamentals.
 */
export async function getYahooCrumbSession(
  fetchImpl: typeof fetch = fetch,
  now = new Date(),
): Promise<YahooSession | null> {
  if (
    cachedYahooSession &&
    now.getTime() - cachedYahooSession.fetchedAtMs < YAHOO_SESSION_TTL_MS
  ) {
    return cachedYahooSession;
  }

  const jar = new Map<string, string>();
  try {
    const home = await fetchImpl(YAHOO_HOME, {
      headers: {
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    ingestSetCookies(home, jar);
    if (!jar.size) return null;

    const crumbResponse = await fetchImpl(YAHOO_CRUMB_ENDPOINT, {
      headers: {
        Accept: "*/*",
        "User-Agent": USER_AGENT,
        Cookie: cookieHeaderFromJar(jar),
      },
    });
    ingestSetCookies(crumbResponse, jar);
    if (!crumbResponse.ok) return null;
    const crumb = (await crumbResponse.text()).trim();
    if (!crumb || crumb.length > 80 || /[\s<>]/.test(crumb)) return null;

    const session: YahooSession = {
      crumb,
      cookie: cookieHeaderFromJar(jar),
      fetchedAtMs: now.getTime(),
    };
    cachedYahooSession = session;
    return session;
  } catch {
    return null;
  }
}

/** Test helper: clear the in-process Yahoo session cache. */
export function clearYahooCrumbSessionCache(): void {
  cachedYahooSession = null;
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
    const previousClose = resolvePreviousSessionClose({
      meta,
      history,
      regularPrice,
    });
    const last = history.at(-1);
    const timestamp = isoFromEpochSeconds(meta.regularMarketTime) ??
      (last ? `${last.date}T21:00:00.000Z` : null);
    const canonical = canonicalizeInstrumentSymbol(
      symbol,
      exchangeFromMarket(market),
    );
    const quote: DelayedQuote | null = regularPrice && timestamp
      ? {
          symbol: canonical.baseSymbol,
          exchange: canonical.exchange,
          market,
          timestamp,
          open: last?.open ?? null,
          high: last?.high ?? null,
          low: last?.low ?? null,
          close: regularPrice,
          previousClose,
          volume: last?.volume ?? null,
          changePct: changePctFromPrices(regularPrice, previousClose),
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
    dividendYield: normalizeYahooYield(readModuleNumber(summary, "dividendYield")),
    payoutRatio: readModuleNumber(summary, "payoutRatio"),
    forwardAnnualDividendYield: normalizeYahooYield(readModuleNumber(summary, "dividendYield")),
    trailingPe: readModuleNumber(summary, "trailingPE"),
    priceBookMrq: readModuleNumber(stats, "priceToBook"),
    priceSalesTtm: readModuleNumber(summary, "priceToSalesTrailing12Months"),
  };
}

function snapshotFromQuote(row: Record<string, unknown>): EodhdFundamentalsSnapshot {
  const trailingYield = normalizeYahooYield(finiteNumber(row.trailingAnnualDividendYield));
  const dividendYield =
    trailingYield ??
    normalizeYahooYield(finiteNumber(row.dividendYield));
  return {
    marketCap: finiteNumber(row.marketCap),
    peRatio: finiteNumber(row.trailingPE),
    trailingPe: finiteNumber(row.trailingPE),
    dividendYield,
    forwardAnnualDividendYield: dividendYield,
    priceBookMrq: finiteNumber(row.priceToBook),
    priceSalesTtm: finiteNumber(row.priceToSalesTrailing12Months),
  };
}

async function fetchSummarySnapshot(
  symbol: string,
  fetchImpl: typeof fetch,
  session: YahooSession,
): Promise<EodhdFundamentalsSnapshot | null> {
  const url = new URL(`${YAHOO_SUMMARY_ENDPOINT}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("modules", "summaryDetail,defaultKeyStatistics,financialData,price");
  url.searchParams.set("formatted", "false");
  url.searchParams.set("crumb", session.crumb);
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        Cookie: session.cookie,
      },
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
  session: YahooSession,
): Promise<EodhdFundamentalsSnapshot | null> {
  const url = new URL(YAHOO_QUOTE_ENDPOINT);
  url.searchParams.set("symbols", symbol);
  url.searchParams.set("crumb", session.crumb);
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        Cookie: session.cookie,
      },
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

  const session = await getYahooCrumbSession(fetchImpl, now);
  if (!session) return null;

  const snapshot =
    (await fetchSummarySnapshot(symbol, fetchImpl, session)) ??
    (await fetchQuoteSnapshot(symbol, fetchImpl, session));
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
