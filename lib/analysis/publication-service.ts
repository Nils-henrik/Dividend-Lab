import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type PublishedDivLabAnalysisVersion = {
  analysisId: string;
  versionId: string;
  versionNumber: number;
  publishedAt: string;
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

/**
 * Publish exactly one already-persisted analysis version through the guarded
 * database RPC, then verify the public state from storage before returning.
 */
export async function publishDivLabAnalysisVersion(input: {
  supabase: SupabaseClient;
  analysisId: string;
  versionId: string;
}): Promise<PublishedDivLabAnalysisVersion> {
  const analysisId = uuid(input.analysisId);
  const versionId = uuid(input.versionId);
  if (!analysisId || !versionId) {
    throw new Error("divlab_analysis_publish_identity_invalid");
  }

  const { data, error } = await input.supabase.rpc("publish_divlab_analysis_version", {
    p_analysis_id: analysisId,
    p_version_id: versionId,
  });
  if (error) {
    throw new Error(`divlab_analysis_publish_failed:${error.code ?? "unknown"}`);
  }
  if (!data || typeof data !== "object") {
    throw new Error("divlab_analysis_publish_invalid_result");
  }

  const result = data as Record<string, unknown>;
  const returnedAnalysisId = uuid(result.analysis_id);
  const returnedVersionId = uuid(result.version_id);
  const versionNumber = Number(result.version_number);
  const publishedAt = timestamp(result.published_at);
  if (
    returnedAnalysisId !== analysisId ||
    returnedVersionId !== versionId ||
    !Number.isInteger(versionNumber) ||
    versionNumber <= 0 ||
    !publishedAt
  ) {
    throw new Error("divlab_analysis_publish_invalid_result");
  }

  const [{ data: analysis, error: analysisError }, { data: version, error: versionError }] =
    await Promise.all([
      input.supabase
        .from("divlab_analyses")
        .select("id,status")
        .eq("id", analysisId)
        .eq("status", "published")
        .maybeSingle(),
      input.supabase
        .from("divlab_analysis_versions")
        .select("id,analysis_id,version_number,publishable,published_at")
        .eq("id", versionId)
        .eq("analysis_id", analysisId)
        .eq("publishable", true)
        .not("published_at", "is", null)
        .maybeSingle(),
    ]);

  if (analysisError || versionError || !analysis || !version) {
    throw new Error("divlab_analysis_publish_readback_failed");
  }
  const readbackPublishedAt = timestamp(version.published_at);
  if (
    version.id !== versionId ||
    version.analysis_id !== analysisId ||
    Number(version.version_number) !== versionNumber ||
    version.publishable !== true ||
    !readbackPublishedAt ||
    readbackPublishedAt !== publishedAt
  ) {
    throw new Error("divlab_analysis_publish_readback_mismatch");
  }

  return {
    analysisId,
    versionId,
    versionNumber,
    publishedAt,
  };
}
