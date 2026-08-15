import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildStoredPeerComparisonAudit,
  type StoredPeerComparisonAudit,
} from "./peer-comparison-audit-read";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function auditId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!UUID_PATTERN.test(normalized)) {
    throw new Error("divlab_peer_comparison_audit_read_id_invalid");
  }
  return normalized;
}

/** Load one exact persisted peer-comparison audit plus its normalized bindings. */
export async function loadStoredPeerComparisonAuditById(input: {
  supabase: SupabaseClient;
  auditId: string;
}): Promise<StoredPeerComparisonAudit | null> {
  const id = auditId(input.auditId);
  const auditResult = await input.supabase
    .from("divlab_peer_comparison_audits")
    .select(
      "id,target_analysis_version_id,peer_set_id,audit_version,methodology_version,peer_set_version_number,audit",
    )
    .eq("id", id)
    .maybeSingle();

  if (auditResult.error) {
    throw new Error(
      `divlab_peer_comparison_audit_read_failed:${auditResult.error.code ?? "unknown"}`,
    );
  }
  if (!auditResult.data) return null;

  const memberResult = await input.supabase
    .from("divlab_peer_comparison_audit_members")
    .select("audit_id,peer_set_id,peer_analysis_version_id")
    .eq("audit_id", id);

  if (memberResult.error) {
    throw new Error(
      `divlab_peer_comparison_audit_members_read_failed:${memberResult.error.code ?? "unknown"}`,
    );
  }

  return buildStoredPeerComparisonAudit({
    auditRow: auditResult.data,
    memberRows: memberResult.data ?? [],
  });
}
