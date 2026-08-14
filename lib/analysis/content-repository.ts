import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioAiModel } from "@/lib/model-portfolios/engine/ai";
import type { DivLabAnalystUsage } from "./analyst";
import {
  DIVLAB_ANALYST_SCHEMA_VERSION,
  divLabAnalystDraftSchema,
  type DivLabAnalystDraft,
} from "./analyst-schema";
import type { DivLabResearchPacket } from "./deep-research";
import { defaultAnalysisSlug } from "./repository";

export type PersistedDivLabAnalysisBundle = {
  analysisId: string;
  versionId: string;
  versionNumber: number;
  contentId: string;
  schemaVersion: string;
  publishable: boolean;
};

function readBundleResult(value: unknown): PersistedDivLabAnalysisBundle {
  if (!value || typeof value !== "object") {
    throw new Error("divlab_analysis_bundle_invalid_result");
  }
  const row = value as Record<string, unknown>;
  const analysisId = typeof row.analysis_id === "string" ? row.analysis_id : null;
  const versionId = typeof row.version_id === "string" ? row.version_id : null;
  const contentId = typeof row.content_id === "string" ? row.content_id : null;
  const schemaVersion = typeof row.schema_version === "string" ? row.schema_version : null;
  const versionNumber = Number(row.version_number);
  const publishable = row.publishable === true;
  if (
    !analysisId ||
    !versionId ||
    !contentId ||
    !schemaVersion ||
    !Number.isInteger(versionNumber) ||
    versionNumber <= 0
  ) {
    throw new Error("divlab_analysis_bundle_invalid_result");
  }
  return {
    analysisId,
    versionId,
    versionNumber,
    contentId,
    schemaVersion,
    publishable,
  };
}

/**
 * Atomically persists the final deterministic research packet and the validated
 * analyst interpretation as separate immutable records in one database RPC.
 * A content validation error rolls the research version back as well.
 */
export async function persistDivLabAnalysisBundle(input: {
  supabase: SupabaseClient;
  packet: DivLabResearchPacket;
  analystDraft: DivLabAnalystDraft;
  analystModel: ModelPortfolioAiModel;
  usage: DivLabAnalystUsage;
  generatedAt: string;
  slug?: string;
}): Promise<PersistedDivLabAnalysisBundle> {
  const analystDraft = divLabAnalystDraftSchema.parse(input.analystDraft);
  const slug = input.slug?.trim() || defaultAnalysisSlug(input.packet);
  if (!slug) throw new Error("divlab_analysis_slug_required");

  const generatedAt = new Date(input.generatedAt);
  if (!Number.isFinite(generatedAt.getTime())) {
    throw new Error("divlab_analysis_generated_at_required");
  }

  const { data, error } = await input.supabase.rpc("persist_divlab_analysis_bundle", {
    p_instrument_symbol: input.packet.instrument.symbol,
    p_exchange: input.packet.instrument.exchange,
    p_instrument_name: input.packet.instrument.name,
    p_slug: slug,
    p_engine_version: input.packet.version,
    p_data_as_of: input.packet.dataAsOf,
    p_currency: input.packet.instrument.currency,
    p_current_price: input.packet.instrument.currentPrice,
    p_research_packet: input.packet,
    p_quality_gate: input.packet.qualityGate,
    p_publishable: input.packet.qualityGate.publishable,
    p_sources: input.packet.sources,
    p_content_schema_version: DIVLAB_ANALYST_SCHEMA_VERSION,
    p_analyst_model: input.analystModel,
    p_analyst_draft: analystDraft,
    p_ai_usage: input.usage,
    p_generated_at: generatedAt.toISOString(),
  });

  if (error) {
    throw new Error(`divlab_analysis_bundle_persist_failed:${error.code ?? "unknown"}`);
  }

  return readBundleResult(data);
}
