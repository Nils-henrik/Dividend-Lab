import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioAiModel } from "@/lib/model-portfolios/engine/ai";
import type { DivLabAnalystUsage } from "./analyst";
import {
  DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION,
  type DivLabBankAnalystQualityGate,
} from "./bank-analyst-quality-gate";
import {
  DIVLAB_BANK_ANALYST_SCHEMA_VERSION,
  type DivLabBankAnalystDraft,
} from "./bank-analyst-schema";
import type { DivLabBankResearchPacket } from "./bank-deep-research";
import { defaultAnalysisSlug } from "./repository";

export type PersistedDivLabBankAnalysisBundle = {
  analysisId: string;
  versionId: string;
  versionNumber: number;
  publishable: boolean;
  contentId: string;
};

function readPersistResult(value: unknown): PersistedDivLabBankAnalysisBundle {
  if (!value || typeof value !== "object") {
    throw new Error("divlab_bank_analysis_bundle_persist_invalid_result");
  }
  const row = value as Record<string, unknown>;
  const analysisId = typeof row.analysis_id === "string" ? row.analysis_id : null;
  const versionId = typeof row.version_id === "string" ? row.version_id : null;
  const contentId = typeof row.content_id === "string" ? row.content_id : null;
  const versionNumber = Number(row.version_number);
  const publishable = row.publishable === true;
  if (
    !analysisId ||
    !versionId ||
    !contentId ||
    !Number.isInteger(versionNumber) ||
    versionNumber <= 0
  ) {
    throw new Error("divlab_bank_analysis_bundle_persist_invalid_result");
  }
  return { analysisId, versionId, versionNumber, publishable, contentId };
}

export async function persistDivLabBankAnalysisBundle(input: {
  supabase: SupabaseClient;
  packet: DivLabBankResearchPacket;
  draft: DivLabBankAnalystDraft;
  analystModel: ModelPortfolioAiModel | string;
  usage: DivLabAnalystUsage;
  qualityGate: DivLabBankAnalystQualityGate;
  generatedAt?: string;
  slug?: string;
}): Promise<PersistedDivLabBankAnalysisBundle> {
  if (!input.packet.qualityGate.publishable) {
    throw new Error("divlab_bank_analysis_bundle_requires_publishable_research");
  }
  if (!input.qualityGate.publishable || input.qualityGate.score !== 100) {
    throw new Error("divlab_bank_analysis_bundle_requires_passing_analyst_quality_gate");
  }
  const model = String(input.analystModel).trim();
  if (!model) throw new Error("divlab_bank_analysis_bundle_model_required");
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  if (!Number.isFinite(new Date(generatedAt).getTime())) {
    throw new Error("divlab_bank_analysis_bundle_generated_at_invalid");
  }
  const slug = input.slug?.trim() || defaultAnalysisSlug(input.packet);
  if (!slug) throw new Error("divlab_bank_analysis_bundle_slug_required");

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
    p_publishable: true,
    p_sources: input.packet.sources,
    p_content_schema_version: DIVLAB_BANK_ANALYST_SCHEMA_VERSION,
    p_analyst_model: model,
    p_analyst_draft: input.draft,
    p_ai_usage: input.usage,
    p_generated_at: generatedAt,
    p_analyst_quality_gate: input.qualityGate,
    p_analyst_quality_gate_version: DIVLAB_BANK_ANALYST_QUALITY_GATE_VERSION,
  });

  if (error) {
    throw new Error(`divlab_bank_analysis_bundle_persist_failed:${error.code ?? "unknown"}`);
  }

  return readPersistResult(data);
}
