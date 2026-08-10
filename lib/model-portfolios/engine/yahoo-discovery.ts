import "server-only";

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

export type YahooDiscoveryOptions = {
  screens?: YahooDiscoveryScreen[];
  perScreen?: number;
  shortlistLimit?: number;
  minimumMarketCapUsd?: number;
  minimumAverageDailyVolume?: number;
  fetchImpl?: typeof fetch;
  now?: Date;
};

const DEFAULT_SCREENS: YahooDiscoveryScreen[] = ["day_gainers", "day_losers", "most_actives"];
const YAHOO_SCREENER_ENDPOINT = "https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved";

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

function discoveryScore(candidate: YahooDiscoveryCandidate): number {
  const move = Math.min(Math.abs(candidate.changePct ?? 0), 30) / 30;
  const relativeVolume =
    candidate.volume && candidate.averageDailyVolume3Month && candidate.averageDailyVolume3Month > 0
      ? Math.min(candidate.volume / candidate.averageDailyVolume3Month, 5) / 5
      : 0;
  const liquidity = candidate.averageDailyVolume3Month
    ? Math.min(Math.log10(Math.max(candidate.averageDailyVolume3Month, 1)) / 8, 1)
    : 0;
  return move * 0.55 + relativeVolume * 0.3 + liquidity * 0.15;
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
        "User-Agent": "DivLab/1.0 market-discovery",
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
