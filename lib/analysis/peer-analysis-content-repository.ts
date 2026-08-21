import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DivLabAnalystUsage } from "./analyst";
import type { DivLabPeerAnalystQualityGate } from "./peer-analyst-quality-gate";
import type { DivLabPeerAnalystDraft } from "./peer-analyst-schema";

export type PersistedDivLabPeerAnalysisContent = {
  contentId: string;
  analysisVersionId: string;
  peerAuditId: string;
  schemaVersion: "analyst-v3-peer";
  analystQualityGateVersion: "peer-analyst-quality-v1";
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(value: string, reason: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) throw new Error(reason);
  return normalized;
}

function persistedResult(value: unknown): PersistedDivLabPeerAnalysisContent {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("divlab_peer_analysis_content_invalid_result");
  }
  const row = value as Record<string, unknown>;
  const contentId = typeof row.content_id === "string" ? row.content_id : "";
  const analysisVersionId =
    typeof row.analysis_version_id === "string" ? row.analysis_version_id : "";
  const peerAuditId = typeof row.peer_audit_id === "string" ? row.peer_audit_id : "";

  if (
    row.schema_version !== "analyst-v3-peer" ||
    row.analyst_quality_gate_version !== "peer-analyst-quality-v1"
  ) {
    throw new Error("divlab_peer_analysis_content_invalid_result");
  }

  return {
    contentId: uuid(contentId, "divlab_peer_analysis_content_invalid_result"),
    analysisVersionId: uuid(
      analysisVersionId,
      "divlab_peer_analysis_content_invalid_result",
    ),
    peerAuditId: uuid(peerAuditId, "divlab_peer_analysis_content_invalid_result"),
    schemaVersion: "analyst-v3-peer",
    analystQualityGateVersion: "peer-analyst-quality-v1",
  };
}

/**
 * Persist one already-validated Analyst v3-peer draft onto the exact immutable
 * research version used by its peer audit.
 *
 * The dedicated RPC fixes schema/quality versions in PostgreSQL and the table
 * trigger independently revalidates target sourceIds, the audit↔target FK,
 * ready-metric coverage and every structured peer number before insert.
 */
export async function persistDivLabPeerAnalysisContent(input: {
  supabase: SupabaseClient;
  analysisVersionId: string;
  peerAuditId: string;
  analystModel: string;
  draft: DivLabPeerAnalystDraft;
  qualityGate: DivLabPeerAnalystQualityGate;
  usage: DivLabAnalystUsage;
  generatedAt: string;
}): Promise<PersistedDivLabPeerAnalysisContent> {
  const analysisVersionId = uuid(
    input.analysisVersionId,
    "divlab_peer_analysis_content_analysis_version_invalid",
  );
  const peerAuditId = uuid(
    input.peerAuditId,
    "divlab_peer_analysis_content_peer_audit_invalid",
  );
  const analystModel = input.analystModel.trim();
  const generatedAt = new Date(input.generatedAt);

  if (!analystModel) {
    throw new Error("divlab_peer_analysis_content_model_required");
  }
  if (!Number.isFinite(generatedAt.getTime())) {
    throw new Error("divlab_peer_analysis_content_generated_at_invalid");
  }
  if (
    input.qualityGate.version !== "peer-analyst-quality-v1" ||
    !input.qualityGate.publishable ||
    input.qualityGate.score !== 100 ||
    input.qualityGate.blockers.length > 0
  ) {
    throw new Error("divlab_peer_analysis_content_quality_gate_failed");
  }
  if (
    input.draft.peerAuditId.toLowerCase() !== peerAuditId ||
    input.draft.peerContextVersion !== "peer-analyst-context-v1"
  ) {
    throw new Error("divlab_peer_analysis_content_audit_binding_invalid");
  }

  const { data, error } = await input.supabase.rpc(
    "persist_divlab_peer_analysis_content",
    {
      p_analysis_version_id: analysisVersionId,
      p_peer_audit_id: peerAuditId,
      p_analyst_model: analystModel,
      p_analyst_draft: input.draft,
      p_analyst_quality_gate: input.qualityGate,
      p_ai_usage: input.usage,
      p_generated_at: generatedAt.toISOString(),
    },
  );

  if (error) {
    throw new Error(
      `divlab_peer_analysis_content_persist_failed:${error.code ?? "unknown"}`,
    );
  }

  const persisted = persistedResult(data);
  if (
    persisted.analysisVersionId !== analysisVersionId ||
    persisted.peerAuditId !== peerAuditId
  ) {
    throw new Error("divlab_peer_analysis_content_result_binding_mismatch");
  }
  return persisted;
}
