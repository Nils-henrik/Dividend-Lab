import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivLabAnalystUsage } from "./analyst";

export type FounderPublishedSpecialistBundle = {
  persistence: {
    analysisId: string;
    versionId: string;
    versionNumber: number;
    contentId: string;
    schemaVersion: string;
    analystQualityGateVersion: string;
    publishable: boolean;
  };
  publication: {
    analysisId: string;
    versionId: string;
    versionNumber: number;
    publishedAt: string;
  };
};

function uuid(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

export async function founderPersistAndPublishSpecialistAnalysis(input: {
  supabase: SupabaseClient;
  packet: {
    version: string;
    dataAsOf: string;
    instrument: { symbol: string; exchange: string; name: string; currency: string; currentPrice: number };
    chart: unknown;
    sources: unknown[];
    qualityGate: { publishable: boolean; score: number; blockers: readonly string[] };
  };
  draft: unknown;
  analystQualityGate: { version: string; publishable: boolean; score: number; blockers: readonly string[] };
  analystModel: string;
  usage: DivLabAnalystUsage;
  schemaVersion: string;
  slug: string;
  generatedAt: string;
}): Promise<FounderPublishedSpecialistBundle> {
  if (
    !input.packet.qualityGate.publishable ||
    input.packet.qualityGate.score !== 100 ||
    input.packet.qualityGate.blockers.length > 0 ||
    !input.analystQualityGate.publishable ||
    input.analystQualityGate.score !== 100 ||
    input.analystQualityGate.blockers.length > 0
  ) {
    throw new Error("specialist_founder_publish_requires_100_100");
  }
  const { data, error } = await input.supabase.rpc("founder_publish_divlab_analysis_bundle", {
    p_instrument_symbol: input.packet.instrument.symbol,
    p_exchange: input.packet.instrument.exchange,
    p_instrument_name: input.packet.instrument.name,
    p_slug: input.slug,
    p_engine_version: input.packet.version,
    p_data_as_of: input.packet.dataAsOf,
    p_currency: input.packet.instrument.currency,
    p_current_price: input.packet.instrument.currentPrice,
    p_research_packet: input.packet,
    p_quality_gate: input.packet.qualityGate,
    p_publishable: true,
    p_sources: input.packet.sources,
    p_content_schema_version: input.schemaVersion,
    p_analyst_quality_gate_version: input.analystQualityGate.version,
    p_analyst_quality_gate: input.analystQualityGate,
    p_analyst_model: input.analystModel,
    p_analyst_draft: input.draft,
    p_ai_usage: input.usage,
    p_generated_at: input.generatedAt,
  });
  if (error) {
    const message = error.message ?? "";
    if (message.includes("divlab_analysis_founder_auth_required")) throw new Error("divlab_analysis_founder_auth_required");
    if (message.includes("divlab_analysis_founder_role_required")) throw new Error("divlab_analysis_founder_role_required");
    throw new Error(`specialist_founder_publish_failed:${error.code ?? "unknown"}`);
  }
  if (!data || typeof data !== "object") throw new Error("specialist_founder_publish_invalid_result");
  const row = data as Record<string, unknown>;
  const analysisId = uuid(row.analysis_id);
  const versionId = uuid(row.version_id);
  const contentId = uuid(row.content_id);
  const versionNumber = Number(row.version_number);
  const publishedAt = typeof row.published_at === "string" ? new Date(row.published_at).toISOString() : null;
  if (!analysisId || !versionId || !contentId || !Number.isInteger(versionNumber) || !publishedAt) {
    throw new Error("specialist_founder_publish_invalid_result");
  }
  return {
    persistence: {
      analysisId,
      versionId,
      versionNumber,
      contentId,
      schemaVersion: input.schemaVersion,
      analystQualityGateVersion: input.analystQualityGate.version,
      publishable: true,
    },
    publication: { analysisId, versionId, versionNumber, publishedAt },
  };
}
