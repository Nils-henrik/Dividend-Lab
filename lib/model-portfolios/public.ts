import type { Metadata } from "next";
import type { ModelPortfolioStrategyKey } from "@/lib/model-portfolios/engine/policy";
import { getCanonicalUrl } from "@/lib/seo/canonical";

/**
 * Product launch date for the four public DivLab AI model portfolios.
 * Source of truth aligned with:
 * - supabase/migrations/20260810120000_model_portfolio_live_simulation.sql (launched_at)
 * - docs/model-portfolios/live-simulation-activation-20260810.md
 */
export const MODEL_PORTFOLIO_PUBLIC_LAUNCH_DATE = "2026-08-10";
export const MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL = "10 augusti 2026";

export const MODEL_PORTFOLIO_PROCESS_PATH =
  "/portfolios/sa-fungerar-ai-processen" as const;

export type ModelPortfolioPublicCatalogEntry = {
  slug: string;
  name: string;
  strategyKey: ModelPortfolioStrategyKey;
  riskLabel: string;
  title: string;
  description: string;
  summary: string;
};

/** Deterministic public catalog for the four live model portfolios (SEO + sitemap). */
export const MODEL_PORTFOLIO_PUBLIC_CATALOG: readonly ModelPortfolioPublicCatalogEntry[] =
  [
    {
      slug: "forsiktig",
      name: "Försiktig",
      strategyKey: "conservative",
      riskLabel: "Lägre risk",
      title: "Försiktig AI-portfölj | DivLab",
      description:
        "DivLabs försiktiga AI-portfölj för börsen prioriterar kapitalbevarande, kvalitet och låg omsättning. Simulerad modellportfölj som gick live 10 augusti 2026.",
      summary:
        "Försiktig är DivLabs AI-förvaltade modellportfölj med lägre risk. Mandatet prioriterar kvalitet, stark balansräkning och låg omsättning framför kortsiktig aktivitet.",
    },
    {
      slug: "medelrisk",
      name: "Medelrisk",
      strategyKey: "balanced",
      riskLabel: "Medelrisk",
      title: "Medelrisk AI-portfölj | DivLab",
      description:
        "DivLabs medelrisk-AI-portfölj balanserar tillväxt, kvalitet och värdering. Simulerad modellportfölj med AI för aktieanalys, live sedan 10 augusti 2026.",
      summary:
        "Medelrisk är DivLabs balanserade AI-portfölj. Mandatet kombinerar kvalitet, värdering och tillväxt, och accepterar HOLD när signalerna inte är tillräckligt starka.",
    },
    {
      slug: "hog-risk",
      name: "Högrisk",
      strategyKey: "high_risk",
      riskLabel: "Hög risk",
      title: "Högrisk AI-portfölj | DivLab",
      description:
        "DivLabs högrisk-AI-portfölj söker högre uppsida med snabbare omprövning av case. Simulerad modellportfölj som gick live 10 augusti 2026.",
      summary:
        "Högrisk är DivLabs mer offensiva AI-portfölj. Mandatet tillåter högre volatilitet och snabbare reaktion på verifierade katalysatorer, inom tydliga riskgränser.",
    },
    {
      slug: "utdelning",
      name: "Utdelning",
      strategyKey: "dividend",
      riskLabel: "Medelrisk",
      title: "Utdelning AI-portfölj | DivLab",
      description:
        "DivLabs utdelningsinriktade AI-portfölj fokuserar på hållbar utdelning, kvalitet och totalavkastning. Simulerad modellportfölj, live sedan 10 augusti 2026.",
      summary:
        "Utdelning är DivLabs AI-portfölj med fokus på hållbar och växande utdelningsinkomst. Mandatet undviker yield traps och behandlar utdelningssänkningar som omprövningssignaler.",
    },
  ] as const;

export const MODEL_PORTFOLIO_PUBLIC_SLUGS =
  MODEL_PORTFOLIO_PUBLIC_CATALOG.map((entry) => entry.slug);

export const MODEL_PORTFOLIO_INDEXABLE_PATHS = [
  "/portfolios",
  MODEL_PORTFOLIO_PROCESS_PATH,
  ...MODEL_PORTFOLIO_PUBLIC_SLUGS.map((slug) => `/portfolios/${slug}`),
] as const;

export function getModelPortfolioPublicEntry(
  slug: string,
): ModelPortfolioPublicCatalogEntry | undefined {
  return MODEL_PORTFOLIO_PUBLIC_CATALOG.find((entry) => entry.slug === slug);
}

export function buildModelPortfolioHubMetadata(): Metadata {
  const title = "AI-portföljer för börsen | DivLab";
  const description =
    "Fyra AI-portföljer med olika investeringsstrategier: Försiktig, Medelrisk, Högrisk och Utdelning. Simulerade modellportföljer med AI för aktieanalys, live sedan 10 augusti 2026.";
  const canonical = getCanonicalUrl("/portfolios");

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "sv_SE",
    },
  };
}

export function buildModelPortfolioDetailMetadata(
  slug: string,
): Metadata | null {
  const entry = getModelPortfolioPublicEntry(slug);
  if (!entry) return null;

  const canonical = getCanonicalUrl(`/portfolios/${entry.slug}`);

  return {
    title: { absolute: entry.title },
    description: entry.description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title: entry.title,
      description: entry.description,
      url: canonical,
      type: "website",
      locale: "sv_SE",
    },
  };
}

export function buildModelPortfolioProcessMetadata(): Metadata {
  const title = "Så arbetar DivLabs AI-portföljer | DivLab";
  const description =
    "Så använder DivLab AI för aktieanalys i modellportföljerna: data och nyheter, AI-analys, verifiering och genomförande av simulerade modellaffärer.";
  const canonical = getCanonicalUrl(MODEL_PORTFOLIO_PROCESS_PATH);

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "sv_SE",
    },
  };
}
