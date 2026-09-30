import { aiPortfolioHref } from "@/lib/companies/cross-navigation";
import { canonicalizeInstrumentSymbol } from "@/lib/model-portfolios/engine/instrument-symbol";
import {
  getModelPortfolioPublicEntry,
  MODEL_PORTFOLIO_PUBLIC_CATALOG,
} from "@/lib/model-portfolios/public";

export type PublicModelPortfolioHolding = {
  portfolioSlug: string;
  instrumentSymbol: string;
  exchange: string;
  quantity: number;
  status: "active" | "paused" | "draft";
};

export type CompanyAiPortfolioLink = {
  slug: string;
  name: string;
  href: string;
};

export type CompanyMarketSymbol = {
  slug: string;
  marketDataSymbol: string;
};

const CATALOG_ORDER = new Map(
  MODEL_PORTFOLIO_PUBLIC_CATALOG.map((entry, index) => [entry.slug, index]),
);

const NORDIC_YAHOO_SUFFIX = /\.(ST|CO|HE|OL)$/i;

function marketSymbolKey(symbol: string) {
  const trimmed = symbol.trim();
  if (!trimmed) return null;
  try {
    const exchange = NORDIC_YAHOO_SUFFIX.test(trimmed) ? "ST" : "US";
    return canonicalizeInstrumentSymbol(trimmed, exchange).yahooSymbol;
  } catch {
    return null;
  }
}

function holdingSymbolKey(symbol: string, exchange: string) {
  const trimmed = symbol.trim();
  if (!trimmed || !exchange.trim()) return null;
  try {
    return canonicalizeInstrumentSymbol(trimmed, exchange).yahooSymbol;
  } catch {
    return null;
  }
}

function isCurrentPublicHolding(holding: PublicModelPortfolioHolding) {
  return (holding.status === "active" || holding.status === "paused")
    && Number.isFinite(holding.quantity)
    && holding.quantity > 0
    && getModelPortfolioPublicEntry(holding.portfolioSlug) !== undefined;
}

/**
 * Public AI-portfolio pages where this exact listed symbol is a current holding.
 * Unknown, zero, draft, non-public and unmatched rows are omitted.
 */
export function companyAiPortfolioLinksForSymbol(
  marketDataSymbol: string,
  holdings: readonly PublicModelPortfolioHolding[],
): CompanyAiPortfolioLink[] {
  const companyKey = marketSymbolKey(marketDataSymbol);
  if (!companyKey) return [];

  const slugs = new Set<string>();
  for (const holding of holdings) {
    if (!isCurrentPublicHolding(holding)) continue;
    if (holdingSymbolKey(holding.instrumentSymbol, holding.exchange) !== companyKey) continue;
    slugs.add(holding.portfolioSlug);
  }

  return [...slugs]
    .sort((left, right) => (CATALOG_ORDER.get(left) ?? 99) - (CATALOG_ORDER.get(right) ?? 99))
    .flatMap((slug) => {
      const entry = getModelPortfolioPublicEntry(slug);
      if (!entry) return [];
      return [{
        slug: entry.slug,
        name: entry.name,
        href: aiPortfolioHref(entry.slug),
      }];
    });
}

/**
 * Links for the requested companies. A symbol shared by more than one catalog
 * company is omitted so a holding is never attached to the wrong page.
 * `holdings === null` means the read failed; callers must omit the UI.
 */
export function companyAiPortfolioLinksBySlug(
  companies: readonly CompanyMarketSymbol[],
  holdings: readonly PublicModelPortfolioHolding[] | null,
  catalog: readonly CompanyMarketSymbol[] = companies,
): Record<string, CompanyAiPortfolioLink[]> {
  if (!holdings) return {};

  const owners = new Map<string, string[]>();
  for (const company of catalog) {
    const key = marketSymbolKey(company.marketDataSymbol);
    if (!key) continue;
    const slugs = owners.get(key) ?? [];
    slugs.push(company.slug);
    owners.set(key, slugs);
  }
  const ambiguous = new Set(
    [...owners.entries()].filter(([, slugs]) => new Set(slugs).size > 1).map(([key]) => key),
  );

  const links: Record<string, CompanyAiPortfolioLink[]> = {};
  for (const company of companies) {
    const key = marketSymbolKey(company.marketDataSymbol);
    if (!key || ambiguous.has(key)) continue;
    const matched = companyAiPortfolioLinksForSymbol(company.marketDataSymbol, holdings);
    if (matched.length > 0) links[company.slug] = matched;
  }
  return links;
}
