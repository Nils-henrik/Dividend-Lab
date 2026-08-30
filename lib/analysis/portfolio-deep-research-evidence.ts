import type { ModelPortfolioEvidence } from "@/lib/model-portfolios/engine/decision";
import {
  DIVLAB_DEEP_RESEARCH_VERSION,
  type DivLabResearchPacket,
} from "./deep-research";
import type { VersionedResearchPacket } from "./peer-comparison-audit";
import { normalizeAnalysisVersionId } from "./research-version-read";
import { DIVLAB_VALUATION_PROVENANCE_VERSION } from "./valuation-provenance";

export const DIVLAB_PORTFOLIO_DEEP_RESEARCH_EVIDENCE_VERSION =
  "portfolio-deep-research-evidence-v1" as const;

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function number(value: number | null | undefined, digits = 2): string {
  return finite(value) ? value.toFixed(digits) : "unknown";
}

function percent(value: number | null | undefined, digits = 1): string {
  return finite(value) ? `${(value * 100).toFixed(digits)}%` : "unknown";
}

function boundedList(values: readonly string[], max = 3): string {
  const selected = values.map((value) => value.trim()).filter(Boolean).slice(0, max);
  return selected.length ? selected.join(" | ") : "inga verifierade punkter";
}

function zoneSummary(
  zones: readonly { lower: number; upper: number; strength: string }[],
): string {
  if (!zones.length) return "inga validerade zoner";
  return zones
    .slice(0, 2)
    .map((zone) => `${number(zone.lower)}–${number(zone.upper)} (${zone.strength})`)
    .join(" | ");
}

function assertPortfolioEvidencePacket(
  versioned: VersionedResearchPacket,
): { analysisVersionId: string; packet: DivLabResearchPacket } {
  const analysisVersionId = normalizeAnalysisVersionId(versioned.analysisVersionId);
  const packet = versioned.packet;
  if (
    packet.version !== DIVLAB_DEEP_RESEARCH_VERSION ||
    packet.qualityGate.publishable !== true ||
    packet.valuationProvenance.version !== DIVLAB_VALUATION_PROVENANCE_VERSION
  ) {
    throw new Error("portfolio_deep_research_evidence_not_publishable");
  }
  return { analysisVersionId, packet };
}

function evidence(input: {
  analysisVersionId: string;
  packet: DivLabResearchPacket;
  section: "fundamental" | "valuation" | "technical";
  title: string;
  summary: string;
}): ModelPortfolioEvidence {
  return {
    id: `DEEP-RESEARCH:${input.analysisVersionId}:${input.section}`,
    kind: "deep_research",
    publisher: "DivLab Deep Research",
    publishedAt: input.packet.createdAt,
    verifiedAt: input.packet.createdAt,
    title: input.title,
    summary: input.summary.slice(0, 1_600),
  };
}

/**
 * Convert one exact immutable, publishable Deep Research version into bounded
 * deterministic evidence that a portfolio manager can reference by evidenceId.
 *
 * No provider/model call happens here. The adapter does not reinterpret the
 * research as a buy/sell signal and never loses the analysis-version UUID.
 */
export function buildPortfolioEvidenceFromDeepResearch(
  versioned: VersionedResearchPacket,
): ModelPortfolioEvidence[] {
  const { analysisVersionId, packet } = assertPortfolioEvidencePacket(versioned);
  const identity = `${packet.instrument.name} (${packet.instrument.symbol}.${packet.instrument.exchange})`;
  const sourceCount = packet.sources.length;
  const primarySourceCount = packet.sources.filter((source) => source.primary).length;
  const fundamental = packet.fundamental;
  const valuation = packet.valuation;
  const technical = packet.technical;

  const fundamentalSummary = [
    `Immutable analysversion ${analysisVersionId}.`,
    `Data as of ${packet.dataAsOf}.`,
    `Bolagstyp ${packet.companyClassification.type}; metod ${fundamental.methodology.framework}; status ${fundamental.methodology.status}.`,
    `Fundamental scorecard overall=${number(fundamental.scorecard.overall, 3)}, coverage=${number(fundamental.scorecard.coverage, 3)}.`,
    `Styrkor: ${boundedList(fundamental.strengths)}.`,
    `Risk/concerns: ${boundedList(fundamental.concerns)}.`,
    `Unknowns: ${boundedList(fundamental.unknowns)}.`,
    `Källor: ${sourceCount} totalt, ${primarySourceCount} primärkällor.`,
    "Detta är verifierad Deep Research-evidens, inte ett köp- eller säljbeslut.",
  ].join(" ");

  const trailing = valuation.trailing;
  const valuationSummary = [
    `Immutable analysversion ${analysisVersionId}.`,
    `Marknadspris ${number(valuation.currentPrice)} ${valuation.currency}.`,
    `Trailing P/E=${number(trailing.pe)}, P/FCF=${number(trailing.priceToFcf)}, FCF-yield=${percent(trailing.fcfYield)}, EV/EBIT=${number(trailing.evToEbit)}, EV/EBITDA=${number(trailing.evToEbitda)}.`,
    `Base case value=${number(valuation.baseCaseValue)} ${valuation.currency}; base case upside/downside=${percent(valuation.baseCaseUpsideDownsidePct)}.`,
    `Valuation provenance=${packet.valuationProvenance.version}.`,
    "Multiplar och scenario är kontext, inte ett automatiskt värderings- eller handelssignal.",
  ].join(" ");

  const snapshot = technical.snapshot;
  const levels = technical.levels;
  const technicalSummary = [
    `Immutable analysversion ${analysisVersionId}.`,
    `Teknisk data as of ${snapshot.asOf ?? packet.dataAsOf}; sessions=${snapshot.sessions}.`,
    `Trend=${snapshot.trend.regime}; RSI14=${number(snapshot.momentum.rsi14)}; pris vs SMA50=${percent(snapshot.trend.priceVsSma50Pct)}; pris vs SMA200=${percent(snapshot.trend.priceVsSma200Pct)}.`,
    `Composite technical score=${number(snapshot.scores.composite, 3)}; trend score=${number(snapshot.scores.trend, 3)}; breakout score=${number(snapshot.scores.breakout, 3)}; stability score=${number(snapshot.scores.stability, 3)}.`,
    `Stöd: ${zoneSummary(levels.supports)}.`,
    `Motstånd: ${zoneSummary(levels.resistances)}; resistanceState=${levels.resistanceState}.`,
    `Signaler: ${boundedList(snapshot.signals, 4)}.`,
    "Teknisk analys används som timing/riskkontext och får inte ensam skapa en affär.",
  ].join(" ");

  return [
    evidence({
      analysisVersionId,
      packet,
      section: "fundamental",
      title: `${identity} — Deep Research fundamental`,
      summary: fundamentalSummary,
    }),
    evidence({
      analysisVersionId,
      packet,
      section: "valuation",
      title: `${identity} — Deep Research valuation`,
      summary: valuationSummary,
    }),
    evidence({
      analysisVersionId,
      packet,
      section: "technical",
      title: `${identity} — Deep Research technical`,
      summary: technicalSummary,
    }),
  ];
}
