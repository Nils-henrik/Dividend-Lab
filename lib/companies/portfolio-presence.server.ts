import "server-only";

import { MODEL_PORTFOLIO_PUBLIC_CATALOG } from "@/lib/model-portfolios/public";
import { getModelPortfolioReadContext } from "@/lib/model-portfolios/read-client";
import {
  portfolioExchangeMatches,
  portfolioInstrumentKey,
} from "@/lib/companies/portfolio-presence";

export type CompanyPortfolioPresence = {
  slug: string;
  name: string;
  href: string;
};

type HoldingRow = {
  portfolio_id: string;
  instrument_symbol: string;
  exchange: string;
  quantity: number | string;
};

type PortfolioRow = {
  id: string;
  slug: string;
  name: string;
};

export async function loadCompanyPortfolioPresence(
  marketDataSymbol: string,
): Promise<CompanyPortfolioPresence[]> {
  const key = portfolioInstrumentKey(marketDataSymbol);
  if (!key) return [];
  try {
    const { client } = await getModelPortfolioReadContext();
    if (!client) return [];
    const holdings = await client
      .from("model_portfolio_holdings")
      .select("portfolio_id, instrument_symbol, exchange, quantity")
      .eq("instrument_symbol", key.symbol)
      .gt("quantity", 0);
    if (holdings.error || !holdings.data) return [];
    const portfolioIds = [...new Set(
      (holdings.data as HoldingRow[])
        .filter((row) => row.instrument_symbol === key.symbol && portfolioExchangeMatches(row.exchange) && Number(row.quantity) > 0)
        .map((row) => row.portfolio_id),
    )];
    if (portfolioIds.length === 0) return [];
    const portfolios = await client
      .from("model_portfolios")
      .select("id, slug, name")
      .in("id", portfolioIds);
    if (portfolios.error || !portfolios.data) return [];
    const allowed = new Map(MODEL_PORTFOLIO_PUBLIC_CATALOG.map((entry) => [entry.slug, entry.name]));
    return (portfolios.data as PortfolioRow[])
      .flatMap((row) => {
        const name = allowed.get(row.slug);
        if (!name) return [];
        return [{ slug: row.slug, name, href: `/portfolios/${row.slug}` }];
      })
      .sort((left, right) => left.name.localeCompare(right.name, "sv"));
  } catch {
    return [];
  }
}
