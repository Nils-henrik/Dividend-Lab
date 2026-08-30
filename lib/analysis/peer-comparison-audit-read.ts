import {
  DIVLAB_PEER_COMPARISON_AUDIT_VERSION,
  type VersionBoundPeerComparisonAudit,
} from "./peer-comparison-audit";
import { DIVLAB_PEER_COMPARISON_VERSION } from "./peer-comparison";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StoredPeerComparisonAudit = {
  auditId: string;
  targetAnalysisVersionId: string;
  peerSetId: string;
  audit: VersionBoundPeerComparisonAudit;
};

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function uuid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return UUID_PATTERN.test(normalized) ? normalized : null;
}

function integer(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function peerVersionIds(audit: Record<string, unknown>): string[] {
  if (!Array.isArray(audit.peerResearch)) {
    throw new Error("divlab_peer_comparison_audit_read_peer_research_invalid");
  }
  const ids = audit.peerResearch.map((entry) => {
    const peer = record(entry);
    const id = peer ? uuid(peer.analysisVersionId) : null;
    if (!id) throw new Error("divlab_peer_comparison_audit_read_peer_version_invalid");
    return id;
  });
  if (new Set(ids).size !== ids.length) {
    throw new Error("divlab_peer_comparison_audit_read_peer_version_duplicate");
  }
  return ids.sort();
}

/**
 * Verify that persisted audit JSON is still bound to the normalized relational
 * history rows before exposing it to an analyst-facing context.
 */
export function buildStoredPeerComparisonAudit(input: {
  auditRow: unknown;
  memberRows: readonly unknown[];
}): StoredPeerComparisonAudit {
  const row = record(input.auditRow);
  if (!row) throw new Error("divlab_peer_comparison_audit_read_row_invalid");

  const auditId = uuid(row.id);
  const targetAnalysisVersionId = uuid(row.target_analysis_version_id);
  const peerSetId = uuid(row.peer_set_id);
  const peerSetVersionNumber = integer(row.peer_set_version_number);
  const audit = record(row.audit);
  if (
    !auditId ||
    !targetAnalysisVersionId ||
    !peerSetId ||
    row.audit_version !== DIVLAB_PEER_COMPARISON_AUDIT_VERSION ||
    row.methodology_version !== DIVLAB_PEER_COMPARISON_VERSION ||
    !peerSetVersionNumber ||
    peerSetVersionNumber <= 0 ||
    !audit
  ) {
    throw new Error("divlab_peer_comparison_audit_read_contract_invalid");
  }

  const registry = record(audit.registry);
  const targetResearch = record(audit.targetResearch);
  const comparison = record(audit.comparison);
  const registryPeerSetId = registry ? uuid(registry.peerSetId) : null;
  const registryVersion = registry ? integer(registry.versionNumber) : null;
  const registeredPeerCount = registry ? integer(registry.registeredPeerCount) : null;
  const auditTargetVersion = targetResearch
    ? uuid(targetResearch.analysisVersionId)
    : null;
  const comparisonPeerCount = comparison ? integer(comparison.peerCount) : null;

  if (
    audit.version !== DIVLAB_PEER_COMPARISON_AUDIT_VERSION ||
    registryPeerSetId !== peerSetId ||
    registryVersion !== peerSetVersionNumber ||
    auditTargetVersion !== targetAnalysisVersionId ||
    !registeredPeerCount ||
    registeredPeerCount < 3 ||
    registeredPeerCount > 25 ||
    comparison?.version !== DIVLAB_PEER_COMPARISON_VERSION ||
    comparison?.status !== "ready" ||
    comparisonPeerCount !== registeredPeerCount ||
    !record(comparison.metrics)
  ) {
    throw new Error("divlab_peer_comparison_audit_read_payload_mismatch");
  }

  const auditPeerVersionIds = peerVersionIds(audit);
  if (auditPeerVersionIds.length !== registeredPeerCount) {
    throw new Error("divlab_peer_comparison_audit_read_peer_count_mismatch");
  }

  const normalizedMemberIds = input.memberRows.map((value) => {
    const member = record(value);
    const memberAuditId = member ? uuid(member.audit_id) : null;
    const memberPeerSetId = member ? uuid(member.peer_set_id) : null;
    const peerAnalysisVersionId = member ? uuid(member.peer_analysis_version_id) : null;
    if (
      memberAuditId !== auditId ||
      memberPeerSetId !== peerSetId ||
      !peerAnalysisVersionId
    ) {
      throw new Error("divlab_peer_comparison_audit_read_member_mismatch");
    }
    return peerAnalysisVersionId;
  });

  if (
    normalizedMemberIds.length !== registeredPeerCount ||
    new Set(normalizedMemberIds).size !== normalizedMemberIds.length ||
    normalizedMemberIds.sort().join("|") !== auditPeerVersionIds.join("|")
  ) {
    throw new Error("divlab_peer_comparison_audit_read_member_set_mismatch");
  }

  return {
    auditId,
    targetAnalysisVersionId,
    peerSetId,
    audit: audit as unknown as VersionBoundPeerComparisonAudit,
  };
}
