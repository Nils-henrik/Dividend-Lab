export type ModelPortfolioMarket = "US" | "SE" | "DK" | "FI" | "NO";

export type InstrumentUniverseSource = {
  market: ModelPortfolioMarket;
  authority: string;
  sourceType: "official_directory" | "official_listing_market";
  url: string;
  refreshCadence: "intraday" | "daily";
  notes: string;
};

export const INSTRUMENT_UNIVERSE_SOURCES: readonly InstrumentUniverseSource[] = [
  {
    market: "US",
    authority: "Nasdaq Trader",
    sourceType: "official_directory",
    url: "https://www.nasdaqtrader.com/trader.aspx?id=symboldirdefs",
    refreshCadence: "intraday",
    notes: "Use nasdaqlisted.txt and otherlisted.txt. Exclude test issues, non-equities and unsupported security types before screening.",
  },
  {
    market: "SE",
    authority: "Nasdaq Nordic",
    sourceType: "official_listing_market",
    url: "https://www.nasdaq.com/solutions/listings/markets/nordic/main-market",
    refreshCadence: "daily",
    notes: "Stockholm Main Market is the default Swedish universe. Growth-market names require an explicit liquidity and risk pass before eligibility.",
  },
  {
    market: "DK",
    authority: "Nasdaq Nordic",
    sourceType: "official_listing_market",
    url: "https://www.nasdaq.com/solutions/listings/markets/nordic/main-market",
    refreshCadence: "daily",
    notes: "Copenhagen Main Market is the default Danish universe.",
  },
  {
    market: "FI",
    authority: "Nasdaq Nordic",
    sourceType: "official_listing_market",
    url: "https://www.nasdaq.com/solutions/listings/markets/nordic/main-market",
    refreshCadence: "daily",
    notes: "Helsinki Main Market is the default Finnish universe.",
  },
  {
    market: "NO",
    authority: "Euronext Oslo Bors",
    sourceType: "official_listing_market",
    url: "https://www.euronext.com/en/markets/oslo",
    refreshCadence: "daily",
    notes: "Use official Oslo Bors listed-company data. Recovery Box and Penalty Bench securities must be flagged before research and can be excluded by policy.",
  },
] as const;

export type MarketDataCapability = {
  provider: "eodhd" | "required_realtime_provider";
  market: ModelPortfolioMarket;
  purpose: "research" | "execution";
  latency: "realtime" | "delayed_15_20m" | "unconfigured";
  transport: "websocket" | "rest" | "provider_required";
  executable: boolean;
};

export const MARKET_DATA_CAPABILITIES: readonly MarketDataCapability[] = [
  {
    provider: "eodhd",
    market: "US",
    purpose: "execution",
    latency: "realtime",
    transport: "websocket",
    executable: true,
  },
  ...(["SE", "DK", "FI", "NO"] as const).map((market) => ({
    provider: "eodhd" as const,
    market,
    purpose: "research" as const,
    latency: "delayed_15_20m" as const,
    transport: "rest" as const,
    executable: false,
  })),
  ...(["SE", "DK", "FI", "NO"] as const).map((market) => ({
    provider: "required_realtime_provider" as const,
    market,
    purpose: "execution" as const,
    latency: "unconfigured" as const,
    transport: "provider_required" as const,
    executable: false,
  })),
] as const;

export function canExecuteWithMarketData(market: ModelPortfolioMarket): boolean {
  return MARKET_DATA_CAPABILITIES.some(
    (capability) => capability.market === market && capability.purpose === "execution" && capability.executable,
  );
}
