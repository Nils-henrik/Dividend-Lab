import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { VersionBoundPeerComparisonAudit } from "./peer-comparison-audit";

export type PersistedPeerComparisonAudit = {
  auditId: string;
  targetAnalysisVersionId: string;
  peerSetId: string;
  peerCount: number;
  idempotent: boolean;
};

function readPersistResult(value: unknown): PersistedPeerComparisonAudit {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("divlab_peer_comparison_audit_invalid_result");
  }
  const row = value as Record<string, unknown>;
  const auditId = typeof row.audit_id === "string" ? row.audit_id : null;
  const targetAnalysisVersionId =
    typeof row.target_analysis_version_id === "string"
      ? row.target_analysis_version_id
      : null;
  const peerSetId = typeof row.peer_set_id === "string" ? row.peer_set_id : null;
  const peerCount = Number(row.peer_count);
  const idempotent = row.idempotent;

  if (
    !auditId ||
    !targetAnalysisVersionId ||
    !peerSetId ||
    !Number.isInteger(peerCount) ||
    peerCount < 3 ||
    peerCount > 25 ||
    typeof idempotent !== "boolean"
  ) {
    throw new Error("divlab_peer_comparison_audit_invalid_result");
  }

  return {
    auditId,
    targetAnalysisVersionId,
    peerSetId,
    peerCount,
    idempotent,
  };
}

/**
 * Persist one already-built version-bound peer comparison audit.
 *
 * PostgreSQL remains authoritative for matching the audit against the exact
 * immutable peer-set version and exact immutable research-version rows. The
 * RPC is idempotent only when the existing stored audit JSON is byte-for-byte
 * equivalent at PostgreSQL jsonb semantics; conflicting history is rejected.
 */
export async function persistVersionBoundPeerComparisonAudit(input: {
  supabase: SupabaseClient;
  audit: VersionBoundPeerComparisonAudit;
}): Promise<PersistedPeerComparisonAudit> {
  const { data, error } = await input.supabase.rpc(
    "persist_divlab_peer_comparison_audit",
    { p_audit: input.audit },
  );

  if (error) {
    throw new Error(
      `divlab_peer_comparison_audit_persist_failed:${error.code ?? "unknown"}`,
    );
  }

  return readPersistResult(data);
}
