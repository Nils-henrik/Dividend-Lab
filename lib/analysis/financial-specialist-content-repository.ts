import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivLabAnalystUsage } from "./analyst";
import {
  DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION,
  type DivLabFinancialSpecialistAnalystQualityGate,
} from "./financial-specialist-analyst-quality-gate";
import {
  DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION,
  type DivLabFinancialSpecialistAnalystDraft,
} from "./financial-specialist-schema";
import type { DivLabFinancialSpecialistResearchPacket } from "./financial-specialist-deep-research";
import { defaultAnalysisSlug } from "./repository";

export type PersistedDivLabFinancialSpecialistBundle = {
  analysisId: string;
  versionId: string;
  versionNumber: number;
  publishable: boolean;
  contentId: string;
};

function result(value: unknown): PersistedDivLabFinancialSpecialistBundle {
  if (!value || typeof value !== "object") throw new Error("financial_specialist_persist_invalid_result");
  const row = value as Record<string, unknown>;
  const analysisId = typeof row.analysis_id === "string" ? row.analysis_id : null;
  const versionId = typeof row.version_id === "string" ? row.version_id : null;
  const contentId = typeof row.content_id === "string" ? row.content_id : null;
  const versionNumber = Number(row.version_number);
  if (!analysisId || !versionId || !contentId || !Number.isInteger(versionNumber) || versionNumber <= 0) {
    throw new Error("financial_specialist_persist_invalid_result");
  }
  return {
    analysisId,
    versionId,
    contentId,
    versionNumber,
    publishable: row.publishable === true,
  };
}

export async function persistDivLabFinancialSpecialistBundle(input: {
  supabase: SupabaseClient;
  packet: DivLabFinancialSpecialistResearchPacket;
  draft: DivLabFinancialSpecialistAnalystDraft;
  analystQualityGate: DivLabFinancialSpecialistAnalystQualityGate;
  analystModel: string;
  usage: DivLabAnalystUsage;
  generatedAt: string;
  slug?: string;
}): Promise<PersistedDivLabFinancialSpecialistBundle> {
  if (!input.packet.qualityGate.publishable || input.packet.qualityGate.score !== 100) {
    throw new Error("financial_specialist_persist_requires_research_100");
  }
  if (!input.analystQualityGate.publishable || input.analystQualityGate.score !== 100) {
    throw new Error("financial_specialist_persist_requires_analyst_100");
  }
  const slug = input.slug?.trim() || defaultAnalysisSlug(input.packet);
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
    p_content_schema_version: DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION,
    p_analyst_model: input.analystModel,
    p_analyst_draft: input.draft,
    p_ai_usage: input.usage,
    p_generated_at: input.generatedAt,
    p_analyst_quality_gate: input.analystQualityGate,
    p_analyst_quality_gate_version: DIVLAB_FINANCIAL_SPECIALIST_ANALYST_QUALITY_GATE_VERSION,
  });
  if (error) throw new Error(`financial_specialist_persist_failed:${error.code ?? "unknown"}`);
  return result(data);
}
