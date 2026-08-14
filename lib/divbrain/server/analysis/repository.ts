import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
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

function string(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readAnalystQualityGate(value: unknown): DivLabAnalystQualityGate | null {
  const gate = object(value);
  if (
    !gate ||
    gate.version !== DIVLAB_ANALYST_QUALITY_GATE_VERSION ||
    gate.publishable !== true ||
    !Number.isFinite(gate.score) ||
    !Array.isArray(gate.blockers) ||
    gate.blockers.length !== 0 ||
    !Array.isArray(gate.warnings) ||
    !object(gate.metrics) ||
    !object(gate.checks)
  ) {
    return null;
  }
  return gate as DivLabAnalystQualityGate;
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
    resistanceState: string(levels?.resistanceState),
  };
}

function analysisSourceFromRow(value: unknown): AnalysisSource | null {
  const row = object(value);
  const id = string(row?.source_id);
  const kind = string(row?.kind);
  const publisher = string(row?.publisher);
  const url = string(row?.url);
  const publishedAt = string(row?.published_at);
  const verifiedAt = string(row?.verified_at);
  if (!id || !kind || !publisher || !url || !publishedAt || !verifiedAt) return null;
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

/**
 * Reads only the latest research version that is both research-publishable and
 * backed by a passing immutable Analyst Quality Gate. Draft analysis containers
 * are allowed for internal DivBrain use; archived analyses and failed contents are not.
 */
export async function loadLatestApprovedDivLabAnalysisForDivBrain(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
}): Promise<DivBrainApprovedAnalysisRecord | null> {
  const symbol = input.symbol.trim().toUpperCase();
  const exchange = input.exchange.trim().toUpperCase();
  if (!symbol || !exchange) throw new Error("divbrain_analysis_identity_required");

  const { data: analysis, error: analysisError } = await input.supabase
    .from("divlab_analyses")
    .select("id,instrument_symbol,exchange,instrument_name,slug,status")
    .eq("instrument_symbol", symbol)
    .eq("exchange", exchange)
    .maybeSingle();
  if (analysisError) throw new Error(`divbrain_analysis_lookup_failed:${analysisError.code ?? "unknown"}`);
  if (!analysis || analysis.status === "archived") return null;
  if (analysis.status !== "draft" && analysis.status !== "published") {
    throw new Error("divbrain_analysis_status_invalid");
  }

  const { data: version, error: versionError } = await input.supabase
    .from("divlab_analysis_versions")
    .select(
      "id,analysis_id,version_number,engine_version,data_as_of,current_price,currency,published_at,research_packet,publishable",
    )
    .eq("analysis_id", analysis.id)
    .eq("publishable", true)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError) throw new Error(`divbrain_analysis_version_lookup_failed:${versionError.code ?? "unknown"}`);
  if (!version) return null;

  const { data: content, error: contentError } = await input.supabase
    .from("divlab_analysis_contents")
    .select("analyst_schema_version,analyst_draft,analyst_quality_gate")
    .eq("analysis_version_id", version.id)
    .maybeSingle();
  if (contentError) throw new Error(`divbrain_analysis_content_lookup_failed:${contentError.code ?? "unknown"}`);
  if (!content || content.analyst_schema_version !== "analyst-v2") return null;

  const analystDraftResult = divLabAnalystDraftSchema.safeParse(content.analyst_draft);
  if (!analystDraftResult.success) return null;
  const analystQualityGate = readAnalystQualityGate(content.analyst_quality_gate);
  if (!analystQualityGate) return null;

  const { data: sourceRows, error: sourceError } = await input.supabase
    .from("divlab_analysis_sources")
    .select("source_id,kind,publisher,url,published_at,verified_at,primary")
    .eq("analysis_version_id", version.id)
    .order("primary", { ascending: false });
  if (sourceError) throw new Error(`divbrain_analysis_sources_lookup_failed:${sourceError.code ?? "unknown"}`);
  const sources = (sourceRows ?? []).map(analysisSourceFromRow).filter((source): source is AnalysisSource => source !== null);
  if (sources.length === 0) return null;

  const currentPrice = finiteNumber(version.current_price);
  const versionNumber = finiteNumber(version.version_number);
  const dataAsOf = string(version.data_as_of);
  const currency = string(version.currency)?.toUpperCase() ?? null;
  const engineVersion = string(version.engine_version);
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
    analysisId: analysis.id,
    analysisVersionId: version.id,
    versionNumber,
    symbol,
    exchange,
    name: analysis.instrument_name,
    slug: analysis.slug,
    analysisStatus: analysis.status,
    engineVersion,
    dataAsOf,
    currentPrice,
    currency,
    publishedAt: string(version.published_at),
    analystDraft: analystDraftResult.data,
    analystQualityGate,
    sources,
    researchSummary: readResearchSummary(version.research_packet),
  };
}
