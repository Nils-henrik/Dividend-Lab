import { evaluateAnalystContentQuality } from "./analyst-quality-gate";
import type { DivLabResearchPacket } from "./deep-research";
import type { DivLabPeerAnalystContext } from "./peer-analyst-context";
import type { DivLabPeerAnalystDraft } from "./peer-analyst-schema";

export const DIVLAB_PEER_ANALYST_QUALITY_GATE_VERSION =
  "peer-analyst-quality-v1" as const;

export type DivLabPeerAnalystQualityGate = {
  version: typeof DIVLAB_PEER_ANALYST_QUALITY_GATE_VERSION;
  publishable: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  metrics: {
    knownQualityFactors: number;
    totalQualityFactors: number;
    uniqueSourceIds: number;
    unknownQualityFactors: number;
    readyPeerMetrics: number;
    interpretedPeerMetrics: number;
  };
  checks: {
    qualityFactorCoverage: boolean;
    confidenceCalibration: boolean;
    sourceDiversity: boolean;
    scenarioDifferentiation: boolean;
    assumptionDifferentiation: boolean;
    viewValuationConsistency: boolean;
    peerContextReady: boolean;
    peerAuditBinding: boolean;
    peerMetricCoverage: boolean;
    peerNumericGrounding: boolean;
  };
};

function sameNumber(actual: number, expected: number | null): boolean {
  return expected !== null && actual === expected;
}

/**
 * Extends the existing Analyst v2 quality certification rather than replacing
 * it. A peer-enabled draft cannot become publishable unless the ordinary
 * target-company analysis is already publishable under analyst-quality-v1.
 */
export function evaluatePeerAnalystContentQuality(input: {
  packet: DivLabResearchPacket;
  targetAnalysisVersionId: string;
  peerContext: DivLabPeerAnalystContext;
  draft: DivLabPeerAnalystDraft;
}): DivLabPeerAnalystQualityGate {
  const base = evaluateAnalystContentQuality({
    packet: input.packet,
    draft: input.draft,
  });
  const blockers = [...base.blockers];
  const warnings = [...base.warnings];

  const readyMetrics = input.peerContext.metrics.filter(
    (metric) => metric.status === "ready",
  );
  const readyMetricNames = new Set(readyMetrics.map((metric) => metric.metric));
  const interpretedMetricNames = new Set(
    input.draft.peerInterpretation.map((claim) => claim.metric),
  );

  const peerContextReady =
    input.peerContext.readyMetricCount === readyMetrics.length && readyMetrics.length >= 1;
  if (!peerContextReady) {
    blockers.push("Peer-context saknar minst ett verifierat värderingsmått som kan tolkas.");
  }

  const peerAuditBinding =
    input.draft.peerContextVersion === input.peerContext.version &&
    input.draft.peerAuditId === input.peerContext.auditId &&
    input.peerContext.targetAnalysisVersionId ===
      input.targetAnalysisVersionId.trim().toLowerCase() &&
    input.draft.peerInterpretation.every(
      (claim) => claim.peerAuditId === input.peerContext.auditId,
    );
  if (!peerAuditBinding) {
    blockers.push("Peer-tolkningen är inte bunden till rätt immutable peer-audit/target-version.");
  }

  const peerMetricCoverage =
    interpretedMetricNames.size === readyMetricNames.size &&
    [...readyMetricNames].every((metric) => interpretedMetricNames.has(metric));
  if (!peerMetricCoverage) {
    blockers.push(
      "Peer-tolkningen måste täcka exakt alla värderingsmått som är verifierat ready; modellen får inte cherry-picka bland tillgängliga peer-mått.",
    );
  }

  const metricMap = new Map(input.peerContext.metrics.map((metric) => [metric.metric, metric]));
  const peerNumericGrounding = input.draft.peerInterpretation.every((claim) => {
    const metric = metricMap.get(claim.metric);
    return Boolean(
      metric &&
        metric.status === "ready" &&
        claim.peerSampleSize === metric.peerSampleSize &&
        sameNumber(claim.targetValue, metric.targetValue) &&
        sameNumber(claim.peerMedian, metric.peerMedian) &&
        sameNumber(claim.peerMin, metric.peerMin) &&
        sameNumber(claim.peerMax, metric.peerMax) &&
        sameNumber(claim.targetVsMedianPct, metric.targetVsMedianPct),
    );
  });
  if (!peerNumericGrounding) {
    blockers.push(
      "Minst ett strukturerat peer-värde avviker från den verifierade peer-auditen.",
    );
  }

  const checks = {
    ...base.checks,
    peerContextReady,
    peerAuditBinding,
    peerMetricCoverage,
    peerNumericGrounding,
  };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);

  return {
    version: DIVLAB_PEER_ANALYST_QUALITY_GATE_VERSION,
    publishable: blockers.length === 0,
    score,
    blockers,
    warnings,
    metrics: {
      ...base.metrics,
      readyPeerMetrics: readyMetrics.length,
      interpretedPeerMetrics: interpretedMetricNames.size,
    },
    checks,
  };
}
