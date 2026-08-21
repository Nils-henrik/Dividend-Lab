import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildHistoricalValuationAnalysis,
  type HistoricalValuationAnalysis,
} from "./historical-valuation";
import { buildVersionedResearchPacketFromRow } from "./research-version-read";

export const HISTORICAL_VALUATION_DEFAULT_VERSION_LIMIT = 120;
export const HISTORICAL_VALUATION_HARD_VERSION_LIMIT = 500;

function canonicalIdentity(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!normalized) throw new Error("historical_valuation_identity_required");
  return normalized;
}

function iso(value: string, reason: string): string {
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error(reason);
  return parsed.toISOString();
}

function boundedLimit(value: number | undefined): number {
  if (value === undefined) return HISTORICAL_VALUATION_DEFAULT_VERSION_LIMIT;
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("historical_valuation_version_limit_invalid");
  }
  return Math.min(
    Math.floor(value),
    HISTORICAL_VALUATION_HARD_VERSION_LIMIT,
  );
}

function queryError(stage: string, error: { code?: string } | null): Error {
  return new Error(`historical_valuation_${stage}_failed:${error?.code ?? "unknown"}`);
}

/**
 * Load genuine point-in-time valuation history from immutable persisted research.
 *
 * Both persistence time and research data boundary are constrained in SQL before
 * packets reach the deterministic history engine. The engine then independently
 * revalidates packet/source lookahead and exact provenance.
 */
export async function loadHistoricalValuationAnalysis(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
  maxObservationAt: string;
  generatedAt?: string;
  versionLimit?: number;
}): Promise<HistoricalValuationAnalysis | null> {
  const symbol = canonicalIdentity(input.symbol);
  const exchange = canonicalIdentity(input.exchange);
  const maxObservationAt = iso(
    input.maxObservationAt,
    "historical_valuation_max_observation_at_invalid",
  );
  const generatedAt = iso(
    input.generatedAt ?? new Date().toISOString(),
    "historical_valuation_generated_at_invalid",
  );
  if (new Date(maxObservationAt).getTime() > new Date(generatedAt).getTime()) {
    throw new Error("historical_valuation_generation_lookahead");
  }
  const limit = boundedLimit(input.versionLimit);

  const analysisResult = await input.supabase
    .from("divlab_analyses")
    .select("id,instrument_symbol,exchange,status")
    .eq("instrument_symbol", symbol)
    .eq("exchange", exchange)
    .maybeSingle();

  if (analysisResult.error) throw queryError("analysis_lookup", analysisResult.error);
  if (!analysisResult.data || analysisResult.data.status === "archived") return null;

  const versionsResult = await input.supabase
    .from("divlab_analysis_versions")
    .select("id,version_number,engine_version,data_as_of,research_packet,publishable,created_at")
    .eq("analysis_id", analysisResult.data.id)
    .eq("publishable", true)
    .lte("data_as_of", maxObservationAt)
    .lte("created_at", maxObservationAt)
    .order("created_at", { ascending: false })
    .order("version_number", { ascending: false })
    .limit(limit);

  if (versionsResult.error) throw queryError("version_history", versionsResult.error);
  if (!(versionsResult.data ?? []).length) return null;

  const versions = (versionsResult.data ?? []).map((row) =>
    buildVersionedResearchPacketFromRow({
      row,
      expectedSymbol: symbol,
      expectedExchange: exchange,
    }),
  );

  return buildHistoricalValuationAnalysis({
    versions,
    generatedAt,
    maxObservationAt,
  });
}
