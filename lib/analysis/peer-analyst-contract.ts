import { validateAnalystDraftAgainstPacket } from "./analyst-contract";
import type { DivLabResearchPacket } from "./deep-research";
import type { DivLabPeerAnalystContext, PeerAnalystMetricContext } from "./peer-analyst-context";
import type { DivLabPeerAnalystClaim, DivLabPeerAnalystDraft } from "./peer-analyst-schema";

function canonicalIdentity(value: string): string {
  return value.trim().toUpperCase();
}

function exactNumber(input: {
  metric: string;
  field: string;
  actual: number;
  expected: number | null;
}): void {
  if (input.expected === null || input.actual !== input.expected) {
    throw new Error(
      `divlab_peer_analyst_numeric_mismatch:${input.metric}:${input.field}`,
    );
  }
}

function validatePeerClaim(input: {
  claim: DivLabPeerAnalystClaim;
  metric: PeerAnalystMetricContext;
  auditId: string;
}): void {
  if (input.claim.peerAuditId !== input.auditId) {
    throw new Error(`divlab_peer_analyst_audit_mismatch:${input.claim.metric}`);
  }
  if (input.metric.status !== "ready") {
    throw new Error(`divlab_peer_analyst_metric_not_ready:${input.claim.metric}`);
  }
  if (input.claim.peerSampleSize !== input.metric.peerSampleSize) {
    throw new Error(
      `divlab_peer_analyst_numeric_mismatch:${input.claim.metric}:peerSampleSize`,
    );
  }

  exactNumber({
    metric: input.claim.metric,
    field: "targetValue",
    actual: input.claim.targetValue,
    expected: input.metric.targetValue,
  });
  exactNumber({
    metric: input.claim.metric,
    field: "peerMedian",
    actual: input.claim.peerMedian,
    expected: input.metric.peerMedian,
  });
  exactNumber({
    metric: input.claim.metric,
    field: "peerMin",
    actual: input.claim.peerMin,
    expected: input.metric.peerMin,
  });
  exactNumber({
    metric: input.claim.metric,
    field: "peerMax",
    actual: input.claim.peerMax,
    expected: input.metric.peerMax,
  });
  exactNumber({
    metric: input.claim.metric,
    field: "targetVsMedianPct",
    actual: input.claim.targetVsMedianPct,
    expected: input.metric.targetVsMedianPct,
  });
}

/**
 * Validate Analyst v3-peer without weakening the existing Analyst v2 source
 * contract. Ordinary target-company claims still pass the v2 validator first;
 * only the dedicated peer section is allowed to use the separate peer-audit
 * provenance namespace.
 */
export function validatePeerAnalystDraft(input: {
  packet: DivLabResearchPacket;
  targetAnalysisVersionId: string;
  peerContext: DivLabPeerAnalystContext;
  draft: DivLabPeerAnalystDraft;
}): void {
  validateAnalystDraftAgainstPacket({
    packet: input.packet,
    draft: input.draft,
  });

  if (
    input.draft.peerContextVersion !== input.peerContext.version ||
    input.draft.peerAuditId !== input.peerContext.auditId
  ) {
    throw new Error("divlab_peer_analyst_context_binding_invalid");
  }
  if (
    input.peerContext.targetAnalysisVersionId !== input.targetAnalysisVersionId.trim().toLowerCase()
  ) {
    throw new Error("divlab_peer_analyst_target_version_mismatch");
  }
  if (
    canonicalIdentity(input.packet.instrument.symbol) !==
      canonicalIdentity(input.peerContext.target.symbol) ||
    canonicalIdentity(input.packet.instrument.exchange) !==
      canonicalIdentity(input.peerContext.target.exchange)
  ) {
    throw new Error("divlab_peer_analyst_target_identity_mismatch");
  }
  if (new Date(input.peerContext.dataAsOf).getTime() > new Date(input.packet.dataAsOf).getTime()) {
    throw new Error("divlab_peer_analyst_context_lookahead");
  }

  const metrics = new Map(input.peerContext.metrics.map((metric) => [metric.metric, metric]));
  for (const claim of input.draft.peerInterpretation) {
    const metric = metrics.get(claim.metric);
    if (!metric) {
      throw new Error(`divlab_peer_analyst_metric_unknown:${claim.metric}`);
    }
    validatePeerClaim({
      claim,
      metric,
      auditId: input.peerContext.auditId,
    });
  }
}
