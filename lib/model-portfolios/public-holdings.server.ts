import "server-only";

import {
  companyAiPortfolioLinksBySlug,
  type CompanyAiPortfolioLink,
  type PublicModelPortfolioHolding,
} from "@/lib/companies/ai-portfolio-crosslinks";
import { getCompanyProfile, getPilotCompanies } from "@/lib/companies/catalog";
import { getModelPortfolioReadContext } from "@/lib/model-portfolios/read-client";
import { MODEL_PORTFOLIO_PUBLIC_SLUGS } from "@/lib/model-portfolios/public";

type PortfolioRow = {
  id: string;
  slug: string;
  status: string;
};

type HoldingRow = {
  portfolio_id: string;
  instrument_symbol: string;
  exchange: string;
  quantity: number | string;
};

function portfolioStatus(status: string): PublicModelPortfolioHolding["status"] | null {
  if (status === "active" || status === "paused" || status === "draft") return status;
  return null;
}

/**
 * Current holdings of the public DivLab AI model portfolios.
 * Read-only. Returns null when the canonical read is unavailable so callers
 * omit cross-links instead of implying that a company is unheld.
 */
export async function loadPublicModelPortfolioHoldings(): Promise<PublicModelPortfolioHolding[] | null> {
  try {
    const { client } = await getModelPortfolioReadContext();
    if (!client) return null;

    const { data: portfolioData, error: portfolioError } = await client
      .from("model_portfolios")
      .select("id,slug,status")
      .in("slug", [...MODEL_PORTFOLIO_PUBLIC_SLUGS]);

    if (portfolioError || !portfolioData) return null;

    const portfolios = (portfolioData as PortfolioRow[]).flatMap((row) => {
      const status = portfolioStatus(String(row.status));
      if (!status || status === "draft") return [];
      if (!MODEL_PORTFOLIO_PUBLIC_SLUGS.includes(row.slug)) return [];
      return [{ id: String(row.id), slug: String(row.slug), status }];
    });

    if (portfolios.length === 0) return [];

    const { data: holdingData, error: holdingError } = await client
      .from("model_portfolio_holdings")
      .select("portfolio_id,instrument_symbol,exchange,quantity")
      .in("portfolio_id", portfolios.map((portfolio) => portfolio.id))
      .gt("quantity", 0);

    if (holdingError || !holdingData) return null;

    const portfolioById = new Map(portfolios.map((portfolio) => [portfolio.id, portfolio]));
    return (holdingData as HoldingRow[]).flatMap((row) => {
      const portfolio = portfolioById.get(String(row.portfolio_id));
      const quantity = Number(row.quantity);
      if (!portfolio || !Number.isFinite(quantity) || quantity <= 0) return [];
      return [{
        portfolioSlug: portfolio.slug,
        instrumentSymbol: String(row.instrument_symbol),
        exchange: String(row.exchange),
        quantity,
        status: portfolio.status,
      }];
    });
  } catch {
    return null;
  }
}

/**
 * Integrator contract: portfolios that currently hold this catalog company.
 * null = holdings could not be read (omit). [] = no current public holding.
 */
export async function loadCompanyAiPortfolioLinks(
  companySlug: string,
): Promise<CompanyAiPortfolioLink[] | null> {
  const profile = getCompanyProfile(companySlug);
  if (!profile) return [];

  const holdings = await loadPublicModelPortfolioHoldings();
  if (holdings === null) return null;

  const catalog = getPilotCompanies().map((company) => ({
    slug: company.slug,
    marketDataSymbol: company.marketDataSymbol,
  }));
  const grouped = companyAiPortfolioLinksBySlug(
    [{ slug: profile.slug, marketDataSymbol: profile.marketDataSymbol }],
    holdings,
    catalog,
  );
  return grouped[profile.slug] ?? [];
}
