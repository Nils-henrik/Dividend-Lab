import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DivLabAnalysisArticle from "@/components/analysis/DivLabAnalysisArticle";
import AnalysisShareActions from "@/components/analysis/AnalysisShareActions";
import {
  AnalysisClientProvider,
  type AnalysisClientPayload,
} from "@/components/analysis/AnalysisClientContext";
import PublicContentShell from "@/components/layout/PublicContentShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { getPublishedDivLabAnalysis } from "@/lib/analysis/public-read";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

type Props = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

function metadataDescription(summary: string): string {
  const normalized = summary.replace(/\s+/g, " ").trim();
  if (normalized.length <= 155) return normalized;
  return `${normalized.slice(0, 152).trimEnd()}…`;
}

function analysisJsonLd(input: Awaited<ReturnType<typeof getPublishedDivLabAnalysis>>) {
  if (!input) return null;
  const { packet, draft } = input;
  const path = `/analyses/${input.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${packet.instrument.name}: aktieanalys`,
    description: metadataDescription(draft.executiveSummary),
    datePublished: input.publishedAt,
    dateModified: input.publishedAt,
    inLanguage: "sv-SE",
    mainEntityOfPage: getCanonicalUrl(path),
    author: {
      "@type": "Organization",
      name: "DivLab",
      url: getCanonicalUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: "DivLab",
      url: getCanonicalUrl("/"),
    },
    about: {
      "@type": "Corporation",
      name: packet.instrument.name,
      tickerSymbol: packet.instrument.symbol,
    },
    image: getCanonicalUrl(`${path}/opengraph-image`),
  };
}

function buildClientPayload(
  analysis: NonNullable<Awaited<ReturnType<typeof getPublishedDivLabAnalysis>>>,
): AnalysisClientPayload {
  const technical = analysis.packet.technical.snapshot;
  const baseScenario = analysis.packet.valuation.scenarios.find((scenario) => scenario.name === "base");
  const mapLevel = (level: (typeof analysis.packet.technical.levels.supports)[number]) => ({
    lower: level.lower,
    upper: level.upper,
    center: level.center,
    distancePct: level.distancePct,
    touches: level.touches,
    strength: level.strength,
  });
  const mapClaim = (claim: { text: string; sourceIds: readonly string[] }) => ({
    text: claim.text,
    sourceIds: [...claim.sourceIds],
  });

  return {
    instrument: {
      name: analysis.packet.instrument.name,
      symbol: analysis.packet.instrument.symbol,
      currency: analysis.packet.instrument.currency,
      currentPrice: analysis.packet.instrument.currentPrice,
    },
    technical: {
      trendRegime: technical.trend.regime,
      rsi14: technical.momentum.rsi14,
      priceVsSma50Pct: technical.trend.priceVsSma50Pct,
      volumeRatio20: technical.volume.volumeRatio20,
      supports: analysis.packet.technical.levels.supports.map(mapLevel),
      resistances: analysis.packet.technical.levels.resistances.map(mapLevel),
    },
    view: analysis.draft.view,
    riskLevel: analysis.draft.riskLevel,
    confidence: analysis.draft.confidence,
    fundamentalScore: analysis.packet.fundamental.scorecard.overall,
    baseScenario: baseScenario
      ? {
          valuePerShare: baseScenario.valuePerShare,
          upsideDownsidePct: baseScenario.upsideDownsidePct,
        }
      : null,
    investmentCase: analysis.draft.investmentCase.map(mapClaim),
    fundamentalInterpretation: analysis.draft.fundamentalInterpretation.map(mapClaim),
    valuationInterpretation: analysis.draft.valuationInterpretation.map(mapClaim),
    catalysts: analysis.draft.catalysts.map(mapClaim),
    risks: analysis.draft.risks.map(mapClaim),
    sources: analysis.packet.sources.map((source, index) => ({ id: source.id, number: index + 1 })),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const analysis = await getPublishedDivLabAnalysis(slug);
  if (!analysis) {
    return {
      title: "Analys hittades inte | DivLab",
      robots: { index: false, follow: false },
    };
  }

  const { packet, draft } = analysis;
  const title = `${packet.instrument.name} aktieanalys – teknisk & fundamental | DivLab`;
  const description = metadataDescription(draft.executiveSummary);
  const canonical = getCanonicalUrl(`/analyses/${analysis.slug}`);
  const image = getCanonicalUrl(`/analyses/${analysis.slug}/opengraph-image`);

  return {
    title,
    description,
    authors: [{ name: "DivLab Redaktion" }],
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      locale: "sv_SE",
      siteName: "DivLab",
      publishedTime: analysis.publishedAt,
      images: [{ url: image, width: 1200, height: 630, alt: `${packet.instrument.name} – DivLab Analys` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function AnalysisPage({ params }: Props) {
  const { slug } = await params;
  const analysis = await getPublishedDivLabAnalysis(slug);
  if (!analysis) notFound();

  const path = `/analyses/${analysis.slug}`;
  const structured = analysisJsonLd(analysis);
  const clientPayload = buildClientPayload(analysis);

  return (
    <PublicContentShell publicContentClassName="bg-[#080b10] text-slate-100">
      {structured ? (
        <JsonLdScript
          data={[
            structured,
            breadcrumbJsonLd([
              { name: "Hem", path: "/" },
              { name: "Analyser", path: "/analyses" },
              { name: analysis.packet.instrument.name, path },
            ]),
          ]}
        />
      ) : null}
      <div className="mx-auto flex w-full max-w-5xl justify-end px-4 pt-5 sm:px-6 lg:px-8">
        <AnalysisShareActions
          companyName={analysis.packet.instrument.name}
          symbol={analysis.packet.instrument.symbol}
          view={analysis.draft.view}
        />
      </div>
      <AnalysisClientProvider analysis={clientPayload}>
        <DivLabAnalysisArticle analysis={analysis} />
      </AnalysisClientProvider>
    </PublicContentShell>
  );
}
