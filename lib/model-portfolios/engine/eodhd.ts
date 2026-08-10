import "server-only";

import { resolveModelPortfolioMarketDataConfig } from "./config";
import type { EodhdCallBudget } from "./eodhd-budget";
import type { ModelPortfolioMarket } from "./sources";

const EODHD_BASE_URL = "https://eodhd.com/api";
const MAX_BATCH_SIZE = 20;
const QUOTE_REVALIDATE_SECONDS = 60;
const UNIVERSE_REVALIDATE_SECONDS = 86_400;
const HISTORY_REVALIDATE_SECONDS = 3_600;
const FUNDAMENTALS_REVALIDATE_SECONDS = 86_400;

export const EODHD_EXCHANGE_BY_MARKET: Record<ModelPortfolioMarket, string> = {
  US: "US",
  SE: "ST",
  DK: "CO",
  FI: "HE",
  NO: "OL",
};

export type EodhdInstrument = {
  code: string;
  name: string;
  country?: string;
  exchange: string;
  currency?: string;
  type?: string;
  isin?: string;
};

export type DelayedQuote = {
  symbol: string;
  exchange: string;
  market: ModelPortfolioMarket;
  timestamp: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  previousClose: number | null;
  volume: number | null;
  changePct: number | null;
  delayed: true;
  provider: "eodhd";
};

export type DailyBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number | null;
  volume: number;
};

type EodhdQuoteRow = {
  code?: unknown;
  timestamp?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
  volume?: unknown;
  previousClose?: unknown;
  change_p?: unknown;
};

type EodhdInstrumentRow = {
  Code?: unknown;
  Name?: unknown;
  Country?: unknown;
  Exchange?: unknown;
  Currency?: unknown;
  Type?: unknown;
  Isin?: unknown;
};

type EodhdDailyRow = {
  date?: unknown;
  open?: unknown;
  high?: unknown;
  low?: unknown;
  close?: unknown;
  adjusted_close?: unknown;
  volume?: unknown;
};

function finiteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function marketFromExchange(exchange: string): ModelPortfolioMarket | null {
  const entry = Object.entries(EODHD_EXCHANGE_BY_MARKET).find(([, code]) => code === exchange);
  return (entry?.[0] as ModelPortfolioMarket | undefined) ?? null;
}

function toIsoTimestamp(value: unknown): string | null {
  const seconds = finiteNumber(value);
  if (seconds === null || seconds <= 0) return null;
  const date = new Date(seconds * 1_000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function chunk<T>(values: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    batches.push(values.slice(index, index + size));
  }
  return batches;
}

function buildUrl(path: string, apiKey: string, params: Record<string, string> = {}): string {
  const url = new URL(`${EODHD_BASE_URL}${path}`);
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("fmt", "json");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

async function getJson(url: string, revalidate: number, budget?: EodhdCallBudget): Promise<unknown> {
  budget?.consume();
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate },
  });
  if (!response.ok) {
    throw new Error(`eodhd_http_${response.status}`);
  }
  return response.json();
}

export function parseDelayedQuote(
  row: EodhdQuoteRow,
  fallbackTicker?: string,
): DelayedQuote | null {
  const rawCode = nonEmptyString(row.code) ?? fallbackTicker ?? null;
  if (!rawCode) return null;
  const [symbol, exchange] = rawCode.split(".");
  if (!symbol || !exchange) return null;
  const market = marketFromExchange(exchange);
  const timestamp = toIsoTimestamp(row.timestamp);
  if (!market || !timestamp) return null;

  return {
    symbol,
    exchange,
    market,
    timestamp,
    open: finiteNumber(row.open),
    high: finiteNumber(row.high),
    low: finiteNumber(row.low),
    close: finiteNumber(row.close),
    previousClose: finiteNumber(row.previousClose),
    volume: finiteNumber(row.volume),
    changePct: finiteNumber(row.change_p),
    delayed: true,
    provider: "eodhd",
  };
}

export function parseInstrument(row: EodhdInstrumentRow, exchange: string): EodhdInstrument | null {
  const code = nonEmptyString(row.Code);
  const name = nonEmptyString(row.Name);
  if (!code || !name) return null;
  return {
    code,
    name,
    exchange: nonEmptyString(row.Exchange) ?? exchange,
    country: nonEmptyString(row.Country) ?? undefined,
    currency: nonEmptyString(row.Currency) ?? undefined,
    type: nonEmptyString(row.Type) ?? undefined,
    isin: nonEmptyString(row.Isin) ?? undefined,
  };
}

export function parseDailyBar(row: EodhdDailyRow): DailyBar | null {
  const date = nonEmptyString(row.date);
  const open = finiteNumber(row.open);
  const high = finiteNumber(row.high);
  const low = finiteNumber(row.low);
  const close = finiteNumber(row.close);
  const volume = finiteNumber(row.volume);
  if (!date || open === null || high === null || low === null || close === null || volume === null) {
    return null;
  }
  return {
    date,
    open,
    high,
    low,
    close,
    adjustedClose: finiteNumber(row.adjusted_close),
    volume,
  };
}

export function toEodhdTicker(symbol: string, market: ModelPortfolioMarket): string {
  const clean = symbol.trim();
  if (!clean) throw new Error("invalid_symbol");
  return `${clean}.${EODHD_EXCHANGE_BY_MARKET[market]}`;
}

export async function fetchEodhdUniverse(
  market: ModelPortfolioMarket,
  budget?: EodhdCallBudget,
): Promise<EodhdInstrument[]> {
  const config = resolveModelPortfolioMarketDataConfig();
  if (!config.configured) throw new Error(config.reason);
  const exchange = EODHD_EXCHANGE_BY_MARKET[market];
  const payload = await getJson(
    buildUrl(`/exchange-symbol-list/${exchange}`, config.apiKey),
    UNIVERSE_REVALIDATE_SECONDS,
    budget,
  );
  if (!Array.isArray(payload)) throw new Error("eodhd_invalid_universe_payload");
  return payload
    .map((row) => parseInstrument(row as EodhdInstrumentRow, exchange))
    .filter((row): row is EodhdInstrument => Boolean(row));
}

export async function fetchDelayedQuotes(
  instruments: readonly { symbol: string; market: ModelPortfolioMarket }[],
  budget?: EodhdCallBudget,
): Promise<DelayedQuote[]> {
  const config = resolveModelPortfolioMarketDataConfig();
  if (!config.configured) throw new Error(config.reason);
  const uniqueTickers = [...new Set(instruments.map((item) => toEodhdTicker(item.symbol, item.market)))];
  const results: DelayedQuote[] = [];

  for (const batch of chunk(uniqueTickers, MAX_BATCH_SIZE)) {
    if (!batch.length) continue;
    const [primary, ...rest] = batch;
    const payload = await getJson(
      buildUrl(`/real-time/${encodeURIComponent(primary)}`, config.apiKey, rest.length ? { s: rest.join(",") } : {}),
      QUOTE_REVALIDATE_SECONDS,
      budget,
    );
    const rows = Array.isArray(payload) ? payload : [payload];
    rows.forEach((row, index) => {
      const quote = parseDelayedQuote(row as EodhdQuoteRow, batch[index]);
      if (quote) results.push(quote);
    });
  }
  return results;
}

export async function fetchDailyHistory(
  symbol: string,
  market: ModelPortfolioMarket,
  from: string,
  to: string,
  budget?: EodhdCallBudget,
): Promise<DailyBar[]> {
  const config = resolveModelPortfolioMarketDataConfig();
  if (!config.configured) throw new Error(config.reason);
  const ticker = toEodhdTicker(symbol, market);
  const payload = await getJson(
    buildUrl(`/eod/${encodeURIComponent(ticker)}`, config.apiKey, {
      from,
      to,
      period: "d",
      order: "a",
    }),
    HISTORY_REVALIDATE_SECONDS,
    budget,
  );
  if (!Array.isArray(payload)) throw new Error("eodhd_invalid_history_payload");
  return payload
    .map((row) => parseDailyBar(row as EodhdDailyRow))
    .filter((row): row is DailyBar => Boolean(row));
}

export async function fetchEodhdFundamentals(
  symbol: string,
  market: ModelPortfolioMarket,
  budget?: EodhdCallBudget,
): Promise<unknown> {
  const config = resolveModelPortfolioMarketDataConfig();
  if (!config.configured) throw new Error(config.reason);
  const ticker = toEodhdTicker(symbol, market);
  return getJson(
    buildUrl(`/fundamentals/${encodeURIComponent(ticker)}`, config.apiKey, {
      filter: "Highlights,Valuation,SplitsDividends",
    }),
    FUNDAMENTALS_REVALIDATE_SECONDS,
    budget,
  );
}
