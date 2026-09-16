import type { Metadata } from "next";
import type { ModelPortfolioStrategyKey } from "@/lib/model-portfolios/engine/policy";
import { getCanonicalUrl } from "@/lib/seo/canonical";

export const MODEL_PORTFOLIO_PUBLIC_LAUNCH_DATE = "2026-08-10";
export const MODEL_PORTFOLIO_PUBLIC_LAUNCH_LABEL = "10 augusti 2026";

export const MODEL_PORTFOLIO_PROCESS_PATH =
  "/portfolios/sa-fungerar-ai-processen" as const;

export type ModelPortfolioPublicCatalogEntry = {
  slug: string;
  name: string;
  strategyKey: ModelPortfolioStrategyKey;
  riskLabel: string;
  horizonLabel: string;
  workStyle: string;
  title: string;
  description: string;
  summary: string;
};

export const MODEL_PORTFOLIO_PUBLIC_CATALOG: readonly ModelPortfolioPublicCatalogEntry[] = [
  {
    slug: "forsiktig",
    name: "Försiktig",
    strategyKey: "conservative",
    riskLabel: "Lägre risk",
    horizonLabel: "12–60+ månader",
    workStyle: "Tänker i år snarare än veckor. Söker stabila kvalitetsbolag med stark balansräkning, uthållig lönsamhet och rimlig långsiktig värdering. Kort marknadsbrus ska sällan ändra ett intakt case.",
    title: "Försiktig AI-portfölj – innehav & resultat | DivLab",
    description: "Följ DivLabs försiktiga AI-portfölj: aktuella aktier, strategi, AI-beslut och kassaflödesjusterat resultat. Simulerad modellportfölj med lägre risk.",
    summary: "Försiktig arbetar med 12–60+ månaders tidshorisont. AI:n prioriterar kvalitet, stark balansräkning, stabila kassaflöden och långsiktig värdetillväxt framför kortsiktigt momentum.",
  },
  {
    slug: "medelrisk",
    name: "Medelrisk",
    strategyKey: "balanced",
    riskLabel: "Medelrisk",
    horizonLabel: "2–24 månader",
    workStyle: "Arbetar mer aktivt än Försiktig och väger samman fundamenta, värdering, estimatrevideringar, verifierade katalysatorer och medellång trend. Kapital kan roteras när risk/reward förändras tydligt.",
    title: "AI-portfölj med medelrisk – aktier & resultat | DivLab",
    description: "Följ DivLabs AI-portfölj med medelrisk: aktuella aktier, strategi, affärer och kassaflödesjusterat resultat i en transparent modellportfölj.",
    summary: "Medelrisk arbetar med 2–24 månaders tidshorisont. AI:n kombinerar fundamenta och värdering med revideringar, katalysatorer och momentum och kan därför rotera oftare än Försiktig.",
  },
  {
    slug: "hog-risk",
    name: "Högrisk",
    strategyKey: "high_risk",
    riskLabel: "Hög risk",
    horizonLabel: "1 vecka–12 månader",
    workStyle: "Är den mest opportunistiska portföljen men bedriver inte daytrading. Söker både katalysator-/momentumcase och kvalitetsbolag som fallit kraftigt men där fundamenta fortfarande håller. AI:n väntar hellre på en bekräftad entry än försöker fånga absoluta botten och har tydlig preferens för likvida small/mid-cap-bolag i Norden och USA.",
    title: "AI-portfölj med hög risk – aktier & resultat | DivLab",
    description: "Följ DivLabs AI-portfölj med hög risk: aktuella aktier, opportunistisk strategi, affärer och kassaflödesjusterat resultat inom fasta riskgränser.",
    summary: "Högrisk arbetar med 1 vecka–12 månaders tidshorisont. AI:n kombinerar katalysatorer och momentum med fallen-quality/recovery-case, prioriterar likvida small/mid caps och kräver entry-bekräftelse innan stora kursfall behandlas som köplägen.",
  },
  {
    slug: "utdelning",
    name: "Utdelning",
    strategyKey: "dividend",
    riskLabel: "Medelrisk",
    horizonLabel: "5–10+ år",
    workStyle: "Söker enbart utdelande värdepapper. Preferens- och D-aktier får förtur, medan vanliga utdelningsaktier och utdelande ETF:er används för kvalitet, riskspridning och ett jämnare kassaflöde. Utdelningssäkerhet och emittentrisk går alltid före hög direktavkastning.",
    title: "Utdelningsportfölj med AI – innehav & resultat | DivLab",
    description: "Följ DivLabs utdelningsportfölj med AI: aktuella utdelningsaktier, preferens- och D-aktier, affärer och kassaflödesjusterat resultat.",
    summary: "Utdelning arbetar med 5–10+ års tidshorisont och söker bara utdelande värdepapper. AI:n prioriterar preferens- och D-aktier, kan köpa utdelande ETF:er som XACT Norden Högutdelande och Montrose Global Monthly Dividend och filtrerar bort vanliga aktier utan verifierad utdelning.",
  },
] as const;

export const MODEL_PORTFOLIO_PUBLIC_SLUGS = MODEL_PORTFOLIO_PUBLIC_CATALOG.map((entry) => entry.slug);

export const MODEL_PORTFOLIO_INDEXABLE_PATHS = [
  "/portfolios",
  MODEL_PORTFOLIO_PROCESS_PATH,
  ...MODEL_PORTFOLIO_PUBLIC_SLUGS.map((slug) => `/portfolios/${slug}`),
] as const;

export function getModelPortfolioPublicEntry(slug: string): ModelPortfolioPublicCatalogEntry | undefined {
  return MODEL_PORTFOLIO_PUBLIC_CATALOG.find((entry) => entry.slug === slug);
}

export function buildModelPortfolioHubMetadata(): Metadata {
  const title = "AI-portföljer – aktier, innehav & resultat | DivLab";
  const description = "Kan AI slå börsen? Följ fyra transparenta AI-portföljer med olika strategier, aktuella aktier, affärer och resultat exklusive insättningar.";
  const canonical = getCanonicalUrl("/portfolios");
  return {
    title: { absolute: title }, description, robots: { index: true, follow: true }, alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", locale: "sv_SE" },
    twitter: { card: "summary", title, description },
  };
}

export function buildModelPortfolioDetailMetadata(slug: string): Metadata | null {
  const entry = getModelPortfolioPublicEntry(slug);
  if (!entry) return null;
  const canonical = getCanonicalUrl(`/portfolios/${entry.slug}`);
  return {
    title: { absolute: entry.title }, description: entry.description, robots: { index: true, follow: true }, alternates: { canonical },
    openGraph: { title: entry.title, description: entry.description, url: canonical, type: "website", locale: "sv_SE" },
    twitter: { card: "summary", title: entry.title, description: entry.description },
  };
}

export function buildModelPortfolioProcessMetadata(): Metadata {
  const title = "Så fungerar DivLabs AI-portföljer | DivLab";
  const description = "Så väljer DivLabs AI-förvaltare aktier: datakällor, AI-analys, riskkontroller, simulerade affärer och resultat rensat för externa insättningar.";
  const canonical = getCanonicalUrl(MODEL_PORTFOLIO_PROCESS_PATH);
  return {
    title: { absolute: title }, description, robots: { index: true, follow: true }, alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", locale: "sv_SE" },
    twitter: { card: "summary", title, description },
  };
}
