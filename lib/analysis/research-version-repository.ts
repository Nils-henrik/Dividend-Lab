import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { VersionedResearchPacket } from "./peer-comparison-audit";
import {
  buildPeerReadyResearchPacketFromRow,
  buildVersionedResearchPacketFromRow,
  normalizeAnalysisVersionId,
} from "./research-version-read";

function canonicalIdentity(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!normalized) throw new Error("divlab_research_version_identity_required");
  return normalized;
}

function isoBoundary(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("divlab_research_version_data_as_of_invalid");
  }
  return date.toISOString();
}

function queryError(stage: string, error: { code?: string } | null): Error {
  return new Error(`divlab_research_version_${stage}_failed:${error?.code ?? "unknown"}`);
}

/** Load one exact immutable, publishable research version by UUID. */
export async function loadPublishableDivLabResearchVersionById(input: {
  supabase: SupabaseClient;
  analysisVersionId: string;
  expectedSymbol?: string;
  expectedExchange?: string;
}): Promise<VersionedResearchPacket | null> {
  const analysisVersionId = normalizeAnalysisVersionId(input.analysisVersionId);
  const { data, error } = await input.supabase
    .from("divlab_analysis_versions")
    .select("id,engine_version,data_as_of,research_packet,publishable")
    .eq("id", analysisVersionId)
    .eq("publishable", true)
    .maybeSingle();

  if (error) throw queryError("load_by_id", error);
  if (!data) return null;

  return buildVersionedResearchPacketFromRow({
    row: data,
    expectedSymbol: input.expectedSymbol,
    expectedExchange: input.expectedExchange,
  });
}

/** Resolve the newest publishable immutable research version as-of a boundary. */
export async function loadLatestPublishableDivLabResearchVersionAsOf(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
  maxDataAsOf: string;
}): Promise<VersionedResearchPacket | null> {
  const symbol = canonicalIdentity(input.symbol);
  const exchange = canonicalIdentity(input.exchange);
  const maxDataAsOf = isoBoundary(input.maxDataAsOf);

  const analysisResult = await input.supabase
    .from("divlab_analyses")
    .select("id,instrument_symbol,exchange,status")
    .eq("instrument_symbol", symbol)
    .eq("exchange", exchange)
    .maybeSingle();

  if (analysisResult.error) throw queryError("load_analysis", analysisResult.error);
  if (!analysisResult.data || analysisResult.data.status === "archived") return null;

  const versionResult = await input.supabase
    .from("divlab_analysis_versions")
    .select("id,version_number,engine_version,data_as_of,research_packet,publishable")
    .eq("analysis_id", analysisResult.data.id)
    .eq("publishable", true)
    .lte("data_as_of", maxDataAsOf)
    .order("data_as_of", { ascending: false })
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (versionResult.error) throw queryError("load_as_of", versionResult.error);
  if (!versionResult.data) return null;

  return buildVersionedResearchPacketFromRow({
    row: versionResult.data,
    expectedSymbol: symbol,
    expectedExchange: exchange,
  });
}

/**
 * Resolve the newest immutable peer-ready research version available no later
 * than the supplied point-in-time boundary. Public publishability is not
 * required; every candidate is revalidated through peer-research-readiness-v1.
 *
 * We scan a bounded recent history because a newer ordinary non-ready research
 * attempt must not mask an older valid peer-ready version. Corrupted immutable
 * rows (identity/current-contract violations) still fail closed instead of being
 * silently skipped.
 */
export async function loadLatestPeerReadyDivLabResearchVersionAsOf(input: {
  supabase: SupabaseClient;
  symbol: string;
  exchange: string;
  maxDataAsOf: string;
}): Promise<VersionedResearchPacket | null> {
  const symbol = canonicalIdentity(input.symbol);
  const exchange = canonicalIdentity(input.exchange);
  const maxDataAsOf = isoBoundary(input.maxDataAsOf);

  const analysisResult = await input.supabase
    .from("divlab_analyses")
    .select("id,instrument_symbol,exchange,status")
    .eq("instrument_symbol", symbol)
    .eq("exchange", exchange)
    .maybeSingle();

  if (analysisResult.error) throw queryError("load_peer_analysis", analysisResult.error);
  if (!analysisResult.data || analysisResult.data.status === "archived") return null;

  const versionResult = await input.supabase
    .from("divlab_analysis_versions")
    .select("id,version_number,engine_version,data_as_of,research_packet,publishable")
    .eq("analysis_id", analysisResult.data.id)
    .lte("data_as_of", maxDataAsOf)
    .order("data_as_of", { ascending: false })
    .order("version_number", { ascending: false })
    .limit(20);

  if (versionResult.error) throw queryError("load_peer_as_of", versionResult.error);

  for (const row of versionResult.data ?? []) {
    try {
      return buildPeerReadyResearchPacketFromRow({
        row,
        expectedSymbol: symbol,
        expectedExchange: exchange,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message === "divlab_peer_research_version_not_ready" ||
          error.message === "divlab_peer_research_version_not_candidate")
      ) {
        continue;
      }
      throw error;
    }
  }

  return null;
}
