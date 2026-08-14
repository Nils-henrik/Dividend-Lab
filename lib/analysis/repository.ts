import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivLabResearchPacket } from "./deep-research";

export type PersistedDivLabAnalysisVersion = {
  analysisId: string;
  versionId: string;
  versionNumber: number;
  publishable: boolean;
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function defaultAnalysisSlug(packet: DivLabResearchPacket): string {
  const instrument = slugify(packet.instrument.name) || slugify(packet.instrument.symbol);
  const date = packet.createdAt.slice(0, 10);
  return `${instrument}-${date}`;
}

function readPersistResult(value: unknown): PersistedDivLabAnalysisVersion {
  if (!value || typeof value !== "object") {
    throw new Error("divlab_analysis_persist_invalid_result");
  }
  const row = value as Record<string, unknown>;
  const analysisId = typeof row.analysis_id === "string" ? row.analysis_id : null;
  const versionId = typeof row.version_id === "string" ? row.version_id : null;
  const versionNumber = Number(row.version_number);
  const publishable = row.publishable === true;
  if (!analysisId || !versionId || !Number.isInteger(versionNumber) || versionNumber <= 0) {
    throw new Error("divlab_analysis_persist_invalid_result");
  }
  return {
    analysisId,
    versionId,
    versionNumber,
    publishable,
  };
}

export async function persistDivLabResearchPacket(input: {
  supabase: SupabaseClient;
  packet: DivLabResearchPacket;
  slug?: string;
}): Promise<PersistedDivLabAnalysisVersion> {
  const slug = input.slug?.trim() || defaultAnalysisSlug(input.packet);
  if (!slug) throw new Error("divlab_analysis_slug_required");

  const { data, error } = await input.supabase.rpc("persist_divlab_analysis_version", {
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
  });

  if (error) {
    throw new Error(`divlab_analysis_persist_failed:${error.code ?? "unknown"}`);
  }

  return readPersistResult(data);
}
