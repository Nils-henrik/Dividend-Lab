import { divLabAnalystDraftSchema } from "@/lib/analysis/analyst-schema";
import {
  DIVLAB_ANALYST_QUALITY_GATE_VERSION,
  type DivLabAnalystQualityGate,
} from "@/lib/analysis/analyst-quality-gate";
import type { AnalysisSource } from "@/lib/analysis/quality-gate";
import type { DivBrainApprovedAnalysisRecord } from "./types";

function object(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readAnalystQualityGate(value: unknown): DivLabAnalystQualityGate | null {
  const gate = object(value);
  const score = finiteNumber(gate?.score);
  if (
    !gate ||
    gate.version !== DIVLAB_ANALYST_QUALITY_GATE_VERSION ||
    gate.publishable !== true ||
    score === null ||
    score < 0 ||
    score > 100 ||
    !Array.isArray(gate.blockers) ||
    gate.blockers.length !== 0 ||
    !Array.isArray(gate.warnings) ||
    !object(gate.metrics) ||
    !object(gate.checks)
  ) {
    return null;
  }
  return gate as unknown as DivLabAnalystQualityGate;
}

function readZone(value: unknown): { lower: number; upper: number } | null {
  const zone = object(value);
  const lower = finiteNumber(zone?.lower);
  const upper = finiteNumber(zone?.upper);
  if (lower === null || upper === null || lower <= 0 || upper < lower) return null;
  return { lower, upper };
}

function readResearchSummary(researchPacket: unknown): DivBrainApprovedAnalysisRecord["researchSummary"] {
  const packet = object(researchPacket);
  const valuation = object(packet?.valuation);
  const scenarios = Array.isArray(valuation?.scenarios) ? valuation.scenarios : [];
  const base = scenarios.map(object).find((scenario) => scenario?.name === "base") ?? null;
  const technical = object(packet?.technical);
  const levels = object(technical?.levels);
  const supports = Array.isArray(levels?.supports) ? levels.supports : [];
  const resistances = Array.isArray(levels?.resistances) ? levels.resistances : [];
  return {
    baseScenarioValue: finiteNumber(base?.valuePerShare),
    baseScenarioUpsideDownsidePct: finiteNumber(base?.upsideDownsidePct),
    nearestSupport: readZone(supports[0]),
    nearestResistance: readZone(resistances[0]),
    resistanceState: text(levels?.resistanceState),
  };
}

function analysisSourceFromRow(value: unknown): AnalysisSource | null {
  const row = object(value);
  const id = text(row?.source_id);
  const kind = text(row?.kind);
  const publisher = text(row?.publisher);
  const url = text(row?.url);
  const publishedAt = text(row?.published_at);
  const verifiedAt = text(row?.verified_at);
  const validKinds = new Set<AnalysisSource["kind"]>([
    "quarterly_report",
    "annual_report",
    "company_release",
    "market_data",
    "fundamental_data",
    "fx_data",
    "news",
    "other",
  ]);
  if (
    !id ||
    !kind ||
    !validKinds.has(kind as AnalysisSource["kind"]) ||
    !publisher ||
    !url ||
    !publishedAt ||
    !verifiedAt
  ) {
    return null;
  }
  return {
    id,
    kind: kind as AnalysisSource["kind"],
    publisher,
    url,
    publishedAt,
    verifiedAt,
    primary: row?.primary === true,
  };
}

export function buildApprovedDivLabAnalysisRecord(input: {
  expectedSymbol: string;
  expectedExchange: string;
  analysisRow: unknown;
  versionRow: unknown;
  contentRow: unknown;
  sourceRows: readonly unknown[];
}): DivBrainApprovedAnalysisRecord | null {
  const analysis = object(input.analysisRow);
  const version = object(input.versionRow);
  const content = object(input.contentRow);
  if (!analysis || !version || !content) return null;

  const expectedSymbol = input.expectedSymbol.trim().toUpperCase();
  const expectedExchange = input.expectedExchange.trim().toUpperCase();
  const symbol = text(analysis.instrument_symbol)?.toUpperCase() ?? null;
  const exchange = text(analysis.exchange)?.toUpperCase() ?? null;
  const analysisId = text(analysis.id);
  const versionAnalysisId = text(version.analysis_id);
  const analysisVersionId = text(version.id);
  const name = text(analysis.instrument_name);
  const slug = text(analysis.slug);
  const status = text(analysis.status);
  if (
    !expectedSymbol ||
    !expectedExchange ||
    !symbol ||
    !exchange ||
    symbol !== expectedSymbol ||
    exchange !== expectedExchange ||
    !analysisId ||
    !analysisVersionId ||
    versionAnalysisId !== analysisId ||
    !name ||
    !slug ||
    (status !== "draft" && status !== "published") ||
    version.publishable !== true
  ) {
    return null;
  }

  if (content.analyst_schema_version !== "analyst-v2") return null;
  const analystDraftResult = divLabAnalystDraftSchema.safeParse(content.analyst_draft);
  if (!analystDraftResult.success) return null;
  const analystQualityGate = readAnalystQualityGate(content.analyst_quality_gate);
  if (!analystQualityGate) return null;

  const sources = input.sourceRows
    .map(analysisSourceFromRow)
    .filter((source): source is AnalysisSource => source !== null);
  if (sources.length === 0 || sources.length !== input.sourceRows.length) return null;

  const currentPrice = finiteNumber(version.current_price);
  const versionNumber = finiteNumber(version.version_number);
  const dataAsOf = text(version.data_as_of);
  const currency = text(version.currency)?.toUpperCase() ?? null;
  const engineVersion = text(version.engine_version);
  if (
    currentPrice === null ||
    currentPrice <= 0 ||
    versionNumber === null ||
    !Number.isInteger(versionNumber) ||
    versionNumber < 1 ||
    !dataAsOf ||
    !currency ||
    !engineVersion
  ) {
    return null;
  }

  return {
    analysisId,
    analysisVersionId,
    versionNumber,
    symbol,
    exchange,
    name,
    slug,
    analysisStatus: status,
    engineVersion,
    dataAsOf,
    currentPrice,
    currency,
    publishedAt: text(version.published_at),
    analystDraft: analystDraftResult.data,
    analystQualityGate,
    sources,
    researchSummary: readResearchSummary(version.research_packet),
  };
}
