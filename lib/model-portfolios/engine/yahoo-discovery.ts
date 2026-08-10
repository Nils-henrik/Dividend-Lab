import "server-only";

import {
  NORDIC_RESEARCH_BOUNDS,
  NORDIC_SEED_UNIVERSE,
  normalizeNordicExchange,
  selectBoundedNordicShortlist,
  toNordicYahooSymbol,
  type NordicCapSegment,
  type NordicCountry,
  type NordicExchange,
  type NordicSeedInstrument,
} from "./nordic-universe";

export type YahooDiscoveryScreen = "day_gainers" | "day_losers" | "most_actives";

export type YahooDiscoveryCandidate = {
  symbol: string;
  name: string;
  exchange: string | null;
  currency: string | null;
  price: number | null;
  changePct: number | null;
  volume: number | null;
  averageDailyVolume3Month: number | null;
  marketCap: number | null;
  source: "yahoo_finance";
  sourceUrl: string;
  discoveredAt: string;
  screen: YahooDiscoveryScreen;
};

export type NordicYahooDiscoveryCandidate = {
  symbol: string;
  exchange: NordicExchange;
  country: NordicCountry;
  name: string;
  segment: NordicCapSegment;
  yahooSymbol: string;
  currency: string | null;
  price: number | null;
  changePct: number | null;
  volume: number | null;
  averageDailyVolume3Month: number | null;
  marketCap: number | null;
  score: number;
  source: "yahoo_finance";
  sourceUrl: string;
  discoveredAt: string;
};

type YahooQuote = {
  symbol?: unknown;
  shortName?: unknown;
  longName?: unknown;
  fullExchangeName?: unknown;
  currency?: unknown;
  regularMarketPrice?: unknown;
  regularMarketChangePercent?: unknown;
  regularMarketVolume?: unknown;
  averageDailyVolume3Month?: unknown;
  marketCap?: unknown;
};

type YahooScreenerResponse = {
  finance?: {
    result?: Array<{
      quotes?: YahooQuote[];
    }>;
  };
};

type YahooQuoteResponse = {
  quoteResponse?: {
    result?: YahooQuote[];
  };
};

export type YahooDiscoveryOptions = {
  screens?: YahooDiscoveryScreen[];
  perScreen?: number;
  shortlistLimit?: number;
  minimumMarketCapUsd?: number;
  minimumAverageDailyVolume?: number;
  fetchImpl?: typeof fetch;
  now?: Date;
};

export type NordicYahooDiscoveryOptions = {
  seeds?: readonly NordicSeedInstrument[];
  broadLimit?: number;
  shortlistLimit?: number;
  perCountryMin?: number;
  perCountryMax?: number;
  minimumMarketCap?: number;
  minimumAverageDailyVolume?: number;
  quoteBatchSize?: number;
  fetchImpl?: typeof fetch;
  now?: Date;
};

const DEFAULT_SCREENS: YahooDiscoveryScreen[] = ["day_gainers", "day_losers", "most_actives"];
const YAHOO_SCREENER_ENDPOINT = "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved";
const YAHOO_QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote";
const USER_AGENT = "DivLab/1.0 market-discovery";

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function sourcePage(screen: YahooDiscoveryScreen): string {
  if (screen === "day_gainers") return "https://finance.yahoo.com/markets/stocks/gainers/";
  if (screen === "day_losers") return "https://finance.yahoo.com/markets/stocks/losers/";
  return "https://finance.yahoo.com/markets/stocks/most-active/";
}

function discoveryScore(candidate: {
  changePct: number | null;
  volume: number | null;
  averageDailyVolume3Month: number | null;
  marketCap: number | null;
}): number {
  const move = Math.min(Math.abs(candidate.changePct ?? 0), 30) / 30;
  const relativeVolume =
    candidate.volume && candidate.averageDailyVolume3Month && candidate.averageDailyVolume3Month > 0
      ? Math.min(candidate.volume / candidate.averageDailyVolume3Month, 5) / 5
      : 0;
  const liquidity = candidate.averageDailyVolume3Month
    ? Math.min(Math.log10(Math.max(candidate.averageDailyVolume3Month, 1)) / 8, 1)
    : 0;
  const size = candidate.marketCap
    ? Math.min(Math.log10(Math.max(candidate.marketCap, 1)) / 12, 1)
    : 0;
  return move * 0.45 + relativeVolume * 0.25 + liquidity * 0.2 + size * 0.1;
}

function normalizeQuote(quote: YahooQuote, screen: YahooDiscoveryScreen, now: Date): YahooDiscoveryCandidate | null {
  const symbol = text(quote.symbol);
  if (!symbol) return null;
  return {
    symbol,
    name: text(quote.longName) ?? text(quote.shortName) ?? symbol,
    exchange: text(quote.fullExchangeName),
    currency: text(quote.currency),
    price: finiteNumber(quote.regularMarketPrice),
    changePct: finiteNumber(quote.regularMarketChangePercent),
    volume: finiteNumber(quote.regularMarketVolume),
    averageDailyVolume3Month: finiteNumber(quote.averageDailyVolume3Month),
    marketCap: finiteNumber(quote.marketCap),
    source: "yahoo_finance",
    sourceUrl: sourcePage(screen),
    discoveredAt: now.toISOString(),
    screen,
  };
}

function chunkSymbols(symbols: readonly string[], batchSize: number): string[][] {
  const chunks: string[][] = [];
  for (let index = 0; index < symbols.length; index += batchSize) {
    chunks.push(symbols.slice(index, index + batchSize));
  }
  return chunks;
}

function exchangeFromYahooQuote(quote: YahooQuote, fallback: NordicExchange): NordicExchange {
  const fromName = normalizeNordicExchange(text(quote.fullExchangeName) ?? "");
  if (fromName) return fromName;
  const symbol = text(quote.symbol)?.toUpperCase() ?? "";
  if (symbol.endsWith(".ST")) return "ST";
  if (symbol.endsWith(".CO")) return "CO";
  if (symbol.endsWith(".HE")) return "HE";
  if (symbol.endsWith(".OL")) return "OL";
  return fallback;
}

/**
 * Cheap discovery only. This intentionally asks Yahoo for a few predefined
 * mover/activity lists instead of crawling the full market. Candidates still
 * require trusted fundamental/market-data enrichment before a portfolio action.
 */
export async function discoverYahooCandidates(options: YahooDiscoveryOptions = {}): Promise<YahooDiscoveryCandidate[]> {
  const screens = options.screens ?? DEFAULT_SCREENS;
  const perScreen = Math.max(5, Math.min(options.perScreen ?? 20, 50));
  const shortlistLimit = Math.max(1, Math.min(options.shortlistLimit ?? 12, 30));
  const minimumMarketCapUsd = Math.max(0, options.minimumMarketCapUsd ?? 300_000_000);
  const minimumAverageDailyVolume = Math.max(0, options.minimumAverageDailyVolume ?? 250_000);
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();

  const discovered: YahooDiscoveryCandidate[] = [];
  for (const screen of screens) {
    const url = new URL(YAHOO_SCREENER_ENDPOINT);
    url.searchParams.set("formatted", "false");
    url.searchParams.set("scrIds", screen);
    url.searchParams.set("count", String(perScreen));

    const response = await fetchImpl(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      cache: "no-store",
    });
    if (!response.ok) continue;

    let body: YahooScreenerResponse;
    try {
      body = (await response.json()) as YahooScreenerResponse;
    } catch {
      continue;
    }

    for (const quote of body.finance?.result?.[0]?.quotes ?? []) {
      const candidate = normalizeQuote(quote, screen, now);
      if (candidate) discovered.push(candidate);
    }
  }

  const bySymbol = new Map<string, YahooDiscoveryCandidate>();
  for (const candidate of discovered) {
    if ((candidate.marketCap ?? 0) < minimumMarketCapUsd) continue;
    if ((candidate.averageDailyVolume3Month ?? 0) < minimumAverageDailyVolume) continue;
    const previous = bySymbol.get(candidate.symbol);
    if (!previous || discoveryScore(candidate) > discoveryScore(previous)) bySymbol.set(candidate.symbol, candidate);
  }

  return [...bySymbol.values()]
    .sort((a, b) => discoveryScore(b) - discoveryScore(a))
    .slice(0, shortlistLimit);
}

/**
 * Cheap Nordic discovery: batch-quote a maintained large/mid-cap seed universe,
 * then return a bounded shortlist with SE/NO/FI/DK representation.
 */
export async function discoverNordicYahooCandidates(
  options: NordicYahooDiscoveryOptions = {},
): Promise<{
  screened: NordicYahooDiscoveryCandidate[];
  shortlist: NordicYahooDiscoveryCandidate[];
}> {
  const seeds = (options.seeds ?? NORDIC_SEED_UNIVERSE).slice(
    0,
    Math.max(1, Math.min(options.broadLimit ?? NORDIC_RESEARCH_BOUNDS.broadDiscoveryCandidateCount, 200)),
  );
  const shortlistLimit = Math.max(
    1,
    Math.min(options.shortlistLimit ?? NORDIC_RESEARCH_BOUNDS.deepHistoryTechnicalCount, 30),
  );
  const perCountryMin = options.perCountryMin ?? NORDIC_RESEARCH_BOUNDS.perCountryMinShortlist;
  const perCountryMax = options.perCountryMax ?? NORDIC_RESEARCH_BOUNDS.perCountryMaxShortlist;
  const minimumMarketCap = Math.max(0, options.minimumMarketCap ?? NORDIC_RESEARCH_BOUNDS.minimumMarketCapSek);
  const minimumAverageDailyVolume = Math.max(
    0,
    options.minimumAverageDailyVolume ?? NORDIC_RESEARCH_BOUNDS.minimumAverageDailyVolume,
  );
  const quoteBatchSize = Math.max(
    1,
    Math.min(options.quoteBatchSize ?? NORDIC_RESEARCH_BOUNDS.quoteBatchSize, 80),
  );
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? new Date();

  const seedByYahoo = new Map<string, NordicSeedInstrument>();
  for (const seed of seeds) {
    seedByYahoo.set(toNordicYahooSymbol(seed.symbol, seed.exchange), seed);
  }

  const screened: NordicYahooDiscoveryCandidate[] = [];
  for (const batch of chunkSymbols([...seedByYahoo.keys()], quoteBatchSize)) {
    const url = new URL(YAHOO_QUOTE_ENDPOINT);
    url.searchParams.set("symbols", batch.join(","));
    url.searchParams.set("fields", [
      "symbol",
      "shortName",
      "longName",
      "fullExchangeName",
      "currency",
      "regularMarketPrice",
      "regularMarketChangePercent",
      "regularMarketVolume",
      "averageDailyVolume3Month",
      "marketCap",
    ].join(","));

    let body: YahooQuoteResponse;
    try {
      const response = await fetchImpl(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        cache: "no-store",
      });
      if (!response.ok) continue;
      body = (await response.json()) as YahooQuoteResponse;
    } catch {
      continue;
    }

    for (const quote of body.quoteResponse?.result ?? []) {
      const yahooSymbol = text(quote.symbol)?.toUpperCase();
      if (!yahooSymbol) continue;
      const seed = seedByYahoo.get(yahooSymbol);
      if (!seed) continue;

      const marketCap = finiteNumber(quote.marketCap);
      const averageDailyVolume3Month = finiteNumber(quote.averageDailyVolume3Month);
      const currency = text(quote.currency);
      // Yahoo marketCap is in local listing currency. Apply a currency-aware floor so
      // EUR-listed Finnish names are not judged against a SEK threshold.
      const marketCapFloor =
        currency?.toUpperCase() === "EUR"
          ? Math.round(minimumMarketCap / 11)
          : currency?.toUpperCase() === "DKK"
            ? Math.round(minimumMarketCap * 0.7)
            : minimumMarketCap;
      // Prefer live quote filters when present; keep seed membership if Yahoo omits size/volume.
      if (marketCap !== null && marketCap < marketCapFloor) continue;
      if (averageDailyVolume3Month !== null && averageDailyVolume3Month < minimumAverageDailyVolume) continue;

      const exchange = exchangeFromYahooQuote(quote, seed.exchange);
      const candidate: NordicYahooDiscoveryCandidate = {
        symbol: seed.symbol,
        exchange,
        country: seed.country,
        name: text(quote.longName) ?? text(quote.shortName) ?? seed.name,
        segment: seed.segment,
        yahooSymbol,
        currency,
        price: finiteNumber(quote.regularMarketPrice),
        changePct: finiteNumber(quote.regularMarketChangePercent),
        volume: finiteNumber(quote.regularMarketVolume),
        averageDailyVolume3Month,
        marketCap,
        score: discoveryScore({
          changePct: finiteNumber(quote.regularMarketChangePercent),
          volume: finiteNumber(quote.regularMarketVolume),
          averageDailyVolume3Month,
          marketCap,
        }),
        source: "yahoo_finance",
        sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(yahooSymbol)}`,
        discoveredAt: now.toISOString(),
      };
      screened.push(candidate);
    }
  }

  // Fail open to seed ranking when Yahoo quote batches are unavailable so the
  // Nordic pass still covers all four countries deterministically.
  const rankingBase: NordicYahooDiscoveryCandidate[] = screened.length
    ? screened
    : seeds.map((seed) => ({
        symbol: seed.symbol,
        exchange: seed.exchange,
        country: seed.country,
        name: seed.name,
        segment: seed.segment,
        yahooSymbol: toNordicYahooSymbol(seed.symbol, seed.exchange),
        currency: null,
        price: null,
        changePct: null,
        volume: null,
        averageDailyVolume3Month: null,
        marketCap: null,
        score: seed.segment === "large_cap" ? 0.2 : 0.1,
        source: "yahoo_finance" as const,
        sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(toNordicYahooSymbol(seed.symbol, seed.exchange))}`,
        discoveredAt: now.toISOString(),
      }));

  const shortlist = selectBoundedNordicShortlist(rankingBase, {
    shortlistLimit,
    perCountryMin,
    perCountryMax,
  });

  return { screened: rankingBase, shortlist };
}
