import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildApprovedDivLabAnalysisRecord } from "./record";
import type { DivBrainApprovedAnalysisRecord } from "./types";

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
  if (analysisError) {
    throw new Error(`divbrain_analysis_lookup_failed:${analysisError.code ?? "unknown"}`);
  }
  if (!analysis || analysis.status === "archived") return null;

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
  if (versionError) {
    throw new Error(
      `divbrain_analysis_version_lookup_failed:${versionError.code ?? "unknown"}`,
    );
  }
  if (!version) return null;

  const { data: content, error: contentError } = await input.supabase
    .from("divlab_analysis_contents")
    .select("analyst_schema_version,analyst_draft,analyst_quality_gate")
    .eq("analysis_version_id", version.id)
    .maybeSingle();
  if (contentError) {
    throw new Error(
      `divbrain_analysis_content_lookup_failed:${contentError.code ?? "unknown"}`,
    );
  }
  if (!content) return null;

  const { data: sourceRows, error: sourceError } = await input.supabase
    .from("divlab_analysis_sources")
    .select("source_id,kind,publisher,url,published_at,verified_at,primary")
    .eq("analysis_version_id", version.id)
    .order("primary", { ascending: false });
  if (sourceError) {
    throw new Error(
      `divbrain_analysis_sources_lookup_failed:${sourceError.code ?? "unknown"}`,
    );
  }

  return buildApprovedDivLabAnalysisRecord({
    expectedSymbol: symbol,
    expectedExchange: exchange,
    analysisRow: analysis,
    versionRow: version,
    contentRow: content,
    sourceRows: sourceRows ?? [],
  });
}
