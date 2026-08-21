import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DivLabAnalysisArticle from "@/components/analysis/DivLabAnalysisArticle";
import DivLabSpecializedAnalysisArticle from "@/components/analysis/DivLabSpecializedAnalysisArticle";
import AnalysisShareActions from "@/components/analysis/AnalysisShareActions";
import { AnalysisClientProvider, type AnalysisClientPayload } from "@/components/analysis/AnalysisClientContext";
import PublicContentShell from "@/components/layout/PublicContentShell";
import JsonLdScript from "@/components/seo/JsonLd";
import { analysisBaseValue, analysisExecutiveSummary, getPublishedDivLabAnalysis, type PublishedAnyDivLabAnalysis } from "@/lib/analysis/public-read";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";

type Props = { params: Promise<{ slug: string }> };
export const revalidate = 300;
function metadataDescription(summary: string): string { const normalized = summary.replace(/\s+/g, " ").trim(); return normalized.length <= 155 ? normalized : `${normalized.slice(0, 152).trimEnd()}…`; }
function claims(items: readonly { text: string; sourceIds: readonly string[] }[]) { return items.map((item) => ({ text: item.text, sourceIds: [...item.sourceIds] })); }

function buildClientPayload(analysis: PublishedAnyDivLabAnalysis): AnalysisClientPayload {
  const technical = analysis.packet.technical.snapshot;
  const mapLevel = (level: (typeof analysis.packet.technical.levels.supports)[number]) => ({ lower: level.lower, upper: level.upper, center: level.center, distancePct: level.distancePct, touches: level.touches, strength: level.strength });
  const baseValue = analysisBaseValue(analysis);
  const baseUpside = baseValue === null ? null : baseValue / analysis.packet.instrument.currentPrice - 1;
  let fundamentalScore: number | null = null;
  let fundamentalInterpretation: Array<{ text: string; sourceIds: string[] }> = [];
  let valuationInterpretation: Array<{ text: string; sourceIds: string[] }> = [];
  if (analysis.kind === "operating_company") {
    fundamentalScore = analysis.packet.fundamental.scorecard.overall ?? null;
    fundamentalInterpretation = claims(analysis.draft.fundamentalInterpretation);
    valuationInterpretation = claims(analysis.draft.valuationInterpretation);
  } else if (analysis.kind === "bank") {
    fundamentalInterpretation = claims(analysis.draft.bankFundamentalInterpretation);
    valuationInterpretation = claims(analysis.draft.valuationInterpretation);
  } else {
    fundamentalInterpretation = claims(analysis.draft.specialistInterpretation);
    valuationInterpretation = claims(analysis.draft.valuationInterpretation);
  }
  return {
    instrument: { name: analysis.packet.instrument.name, symbol: analysis.packet.instrument.symbol, currency: analysis.packet.instrument.currency, currentPrice: analysis.packet.instrument.currentPrice },
    technical: { trendRegime: technical.trend.regime, rsi14: technical.momentum.rsi14 ?? null, priceVsSma50Pct: technical.trend.priceVsSma50Pct ?? null, volumeRatio20: technical.volume.volumeRatio20 ?? null, supports: analysis.packet.technical.levels.supports.map(mapLevel), resistances: analysis.packet.technical.levels.resistances.map(mapLevel) },
    view: analysis.draft.view, riskLevel: analysis.draft.riskLevel, confidence: analysis.draft.confidence,
    fundamentalScore, baseScenario: baseValue === null ? null : { valuePerShare: baseValue, upsideDownsidePct: baseUpside },
    investmentCase: claims(analysis.draft.investmentCase), fundamentalInterpretation, valuationInterpretation,
    catalysts: claims(analysis.draft.catalysts), risks: claims(analysis.draft.risks),
    sources: analysis.packet.sources.map((source, index) => ({ id: source.id, number: index + 1 })),
  };
}
function analysisJsonLd(analysis: PublishedAnyDivLabAnalysis) {
  const path = `/analyses/${analysis.slug}`;
  return { "@context": "https://schema.org", "@type": "Article", headline: `${analysis.packet.instrument.name}: aktieanalys`, description: metadataDescription(analysisExecutiveSummary(analysis)), datePublished: analysis.publishedAt, dateModified: analysis.publishedAt, inLanguage: "sv-SE", mainEntityOfPage: getCanonicalUrl(path), author: { "@type": "Organization", name: "DivLab", url: getCanonicalUrl("/") }, publisher: { "@type": "Organization", name: "DivLab", url: getCanonicalUrl("/") }, about: { "@type": "Corporation", name: analysis.packet.instrument.name, tickerSymbol: analysis.packet.instrument.symbol }, image: getCanonicalUrl(`${path}/opengraph-image`) };
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params; const analysis = await getPublishedDivLabAnalysis(slug);
  if (!analysis) return { title: "Analys hittades inte | DivLab", robots: { index: false, follow: false } };
  const title = `${analysis.packet.instrument.name} aktieanalys – teknisk & fundamental | DivLab`;
  const description = metadataDescription(analysisExecutiveSummary(analysis)); const canonical = getCanonicalUrl(`/analyses/${analysis.slug}`); const image = getCanonicalUrl(`/analyses/${analysis.slug}/opengraph-image`);
  return { title, description, authors: [{ name: "DivLab Redaktion" }], alternates: { canonical }, robots: { index: true, follow: true }, openGraph: { title, description, type: "article", url: canonical, locale: "sv_SE", siteName: "DivLab", publishedTime: analysis.publishedAt, images: [{ url: image, width: 1200, height: 630, alt: `${analysis.packet.instrument.name} – DivLab Analys` }] }, twitter: { card: "summary_large_image", title, description, images: [image] } };
}
export default async function AnalysisPage({ params }: Props) {
  const { slug } = await params; const analysis = await getPublishedDivLabAnalysis(slug); if (!analysis) notFound();
  const path = `/analyses/${analysis.slug}`; const clientPayload = buildClientPayload(analysis);
  return (
    <PublicContentShell publicContentClassName="bg-[#080b10] text-slate-100">
      <JsonLdScript data={[analysisJsonLd(analysis), breadcrumbJsonLd([{ name: "Hem", path: "/" }, { name: "Analyser", path: "/analyses" }, { name: analysis.packet.instrument.name, path }])]} />
      <div className="mx-auto flex w-full max-w-5xl justify-end px-4 pt-5 sm:px-6 lg:px-8"><AnalysisShareActions companyName={analysis.packet.instrument.name} symbol={analysis.packet.instrument.symbol} view={analysis.draft.view} /></div>
      <AnalysisClientProvider analysis={clientPayload}>
        {analysis.kind === "operating_company" ? <DivLabAnalysisArticle analysis={analysis} /> : <DivLabSpecializedAnalysisArticle analysis={analysis} />}
      </AnalysisClientProvider>
    </PublicContentShell>
  );
}
