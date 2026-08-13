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
    title: "Försiktig AI-portfölj | DivLab",
    description: "DivLabs försiktiga AI-portfölj för börsen har tidshorisonten 12–60+ månader och prioriterar kvalitet, kapitalbevarande och låg omsättning. Live sedan 10 augusti 2026.",
    summary: "Försiktig arbetar med 12–60+ månaders tidshorisont. AI:n prioriterar kvalitet, stark balansräkning, stabila kassaflöden och långsiktig värdetillväxt framför kortsiktigt momentum.",
  },
  {
    slug: "medelrisk",
    name: "Medelrisk",
    strategyKey: "balanced",
    riskLabel: "Medelrisk",
    horizonLabel: "2–24 månader",
    workStyle: "Arbetar mer aktivt än Försiktig och väger samman fundamenta, värdering, estimatrevideringar, verifierade katalysatorer och medellång trend. Kapital kan roteras när risk/reward förändras tydligt.",
    title: "Medelrisk AI-portfölj | DivLab",
    description: "DivLabs medelrisk-AI-portfölj har tidshorisonten 2–24 månader och balanserar kvalitet, värdering, tillväxt, katalysatorer och trend. Live sedan 10 augusti 2026.",
    summary: "Medelrisk arbetar med 2–24 månaders tidshorisont. AI:n kombinerar fundamenta och värdering med revideringar, katalysatorer och momentum och kan därför rotera oftare än Försiktig.",
  },
  {
    slug: "hog-risk",
    name: "Högrisk",
    strategyKey: "high_risk",
    riskLabel: "Hög risk",
    horizonLabel: "1 vecka–12 månader",
    workStyle: "Är den mest opportunistiska portföljen men bedriver inte daytrading. Söker både katalysator-/momentumcase och kvalitetsbolag som fallit kraftigt men där fundamenta fortfarande håller. AI:n väntar hellre på en bekräftad entry än försöker fånga absoluta botten och har tydlig preferens för likvida small/mid-cap-bolag i Norden och USA.",
    title: "Högrisk AI-portfölj | DivLab",
    description: "DivLabs högrisk-AI-portfölj söker asymmetrisk uppsida via katalysatorer, small/mid-cap-case och kvalificerade återhämtningscase i kvalitetsbolag inom fasta riskgränser.",
    summary: "Högrisk arbetar med 1 vecka–12 månaders tidshorisont. AI:n kombinerar katalysatorer och momentum med fallen-quality/recovery-case, prioriterar likvida small/mid caps och kräver entry-bekräftelse innan stora kursfall behandlas som köplägen.",
  },
  {
    slug: "utdelning",
    name: "Utdelning",
    strategyKey: "dividend",
    riskLabel: "Medelrisk",
    horizonLabel: "5–10+ år",
    workStyle: "Söker enbart utdelande värdepapper. Preferens- och D-aktier får förtur, medan vanliga utdelningsaktier och utdelande ETF:er används för kvalitet, riskspridning och ett jämnare kassaflöde. Utdelningssäkerhet och emittentrisk går alltid före hög direktavkastning.",
    title: "Utdelning AI-portfölj | DivLab",
    description: "DivLabs utdelnings-AI-portfölj investerar endast i utdelande aktier, preferens- och D-aktier samt utdelande ETF:er. Preferens/D har förtur, med fokus på hållbart kassaflöde och långsiktig totalavkastning.",
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
  const title = "AI-portföljer för börsen | DivLab";
  const description = "Fyra AI-portföljer med olika investeringsstrategier och tidshorisonter: Försiktig, Medelrisk, Högrisk och Utdelning. Simulerade modellportföljer, live sedan 10 augusti 2026.";
  const canonical = getCanonicalUrl("/portfolios");
  return {
    title: { absolute: title }, description, robots: { index: true, follow: true }, alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", locale: "sv_SE" },
  };
}

export function buildModelPortfolioDetailMetadata(slug: string): Metadata | null {
  const entry = getModelPortfolioPublicEntry(slug);
  if (!entry) return null;
  const canonical = getCanonicalUrl(`/portfolios/${entry.slug}`);
  return {
    title: { absolute: entry.title }, description: entry.description, robots: { index: true, follow: true }, alternates: { canonical },
    openGraph: { title: entry.title, description: entry.description, url: canonical, type: "website", locale: "sv_SE" },
  };
}

export function buildModelPortfolioProcessMetadata(): Metadata {
  const title = "Så arbetar DivLabs AI-portföljer | DivLab";
  const description = "Så använder DivLab AI för aktieanalys i modellportföljerna: data och nyheter, AI-analys, verifiering, riskkontroller och genomförande av simulerade modellaffärer.";
  const canonical = getCanonicalUrl(MODEL_PORTFOLIO_PROCESS_PATH);
  return {
    title: { absolute: title }, description, robots: { index: true, follow: true }, alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website", locale: "sv_SE" },
  };
}
