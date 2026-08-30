import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioAiModel } from "@/lib/model-portfolios/engine/ai";
import type { DivLabAnalystUsage } from "./analyst";
import type { DivLabAnalystQualityGate } from "./analyst-quality-gate";
import {
  DIVLAB_ANALYST_SCHEMA_VERSION,
  divLabAnalystDraftSchema,
  type DivLabAnalystDraft,
} from "./analyst-schema";
import type { PersistedDivLabAnalysisBundle } from "./content-repository";
import type { DivLabResearchPacket } from "./deep-research";
import type { PublishedDivLabAnalysisVersion } from "./publication-service";
import { defaultAnalysisSlug } from "./repository";

export type FounderPublishedDivLabAnalysisBundle = {
  persistence: PersistedDivLabAnalysisBundle;
  publication: PublishedDivLabAnalysisVersion;
};

function uuid(value: unknown): string | null {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

function timestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

export async function founderPersistAndPublishDivLabAnalysis(input: {
  supabase: SupabaseClient;
  packet: DivLabResearchPacket;
  analystDraft: DivLabAnalystDraft;
  analystQualityGate: DivLabAnalystQualityGate;
  analystModel: ModelPortfolioAiModel;
  usage: DivLabAnalystUsage;
  generatedAt: string;
  slug?: string;
}): Promise<FounderPublishedDivLabAnalysisBundle> {
  const analystDraft = divLabAnalystDraftSchema.parse(input.analystDraft);
  if (!input.packet.qualityGate.publishable || !input.analystQualityGate.publishable) {
    throw new Error("divlab_analysis_founder_publish_requires_passing_quality_gates");
  }

  const slug = input.slug?.trim() || defaultAnalysisSlug(input.packet);
  if (!slug) throw new Error("divlab_analysis_slug_required");

  const generatedAt = new Date(input.generatedAt);
  if (!Number.isFinite(generatedAt.getTime())) {
    throw new Error("divlab_analysis_generated_at_required");
  }

  const { data, error } = await input.supabase.rpc(
    "founder_publish_divlab_analysis_bundle",
    {
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
      p_analyst_quality_gate_version: input.analystQualityGate.version,
      p_analyst_quality_gate: input.analystQualityGate,
      p_analyst_model: input.analystModel,
      p_analyst_draft: analystDraft,
      p_ai_usage: input.usage,
      p_generated_at: generatedAt.toISOString(),
    },
  );

  if (error) {
    const message = error.message ?? "";
    if (message.includes("divlab_analysis_founder_auth_required")) {
      throw new Error("divlab_analysis_founder_auth_required");
    }
    if (message.includes("divlab_analysis_founder_role_required")) {
      throw new Error("divlab_analysis_founder_role_required");
    }
    throw new Error(`divlab_analysis_founder_publish_failed:${error.code ?? "unknown"}`);
  }
  if (!data || typeof data !== "object") {
    throw new Error("divlab_analysis_founder_publish_invalid_result");
  }

  const row = data as Record<string, unknown>;
  const analysisId = uuid(row.analysis_id);
  const versionId = uuid(row.version_id);
  const contentId = uuid(row.content_id);
  const versionNumber = Number(row.version_number);
  const schemaVersion = typeof row.schema_version === "string" ? row.schema_version : null;
  const analystQualityGateVersion =
    typeof row.analyst_quality_gate_version === "string"
      ? row.analyst_quality_gate_version
      : null;
  const publishable = row.publishable === true;
  const publishedAt = timestamp(row.published_at);

  if (
    !analysisId ||
    !versionId ||
    !contentId ||
    !Number.isInteger(versionNumber) ||
    versionNumber <= 0 ||
    !schemaVersion ||
    !analystQualityGateVersion ||
    !publishable ||
    !publishedAt
  ) {
    throw new Error("divlab_analysis_founder_publish_invalid_result");
  }

  return {
    persistence: {
      analysisId,
      versionId,
      versionNumber,
      contentId,
      schemaVersion,
      analystQualityGateVersion,
      publishable,
    },
    publication: {
      analysisId,
      versionId,
      versionNumber,
      publishedAt,
    },
  };
}
