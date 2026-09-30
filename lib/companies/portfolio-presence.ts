export type PortfolioInstrumentKey = {
  symbol: string;
  exchange: "ST";
};

/** Canonical Yahoo symbol from the company catalog, not a display-name guess. */
export function portfolioInstrumentKey(marketDataSymbol: string): PortfolioInstrumentKey | null {
  const match = marketDataSymbol.trim().toUpperCase().match(/^([A-Z0-9]+(?:-[A-Z0-9]+)?)\.ST$/);
  if (!match) return null;
  return { symbol: match[1]!, exchange: "ST" };
}

export function portfolioExchangeMatches(exchange: string) {
  const value = exchange.trim().toUpperCase();
  return value === "ST" || value === "XSTO" || value === "STO" || value === "STOCKHOLM";
}
