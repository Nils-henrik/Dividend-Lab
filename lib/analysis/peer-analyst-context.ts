import type { StoredPeerComparisonAudit } from "./peer-comparison-audit-read";
import type { PeerValuationMetric } from "./peer-comparison";

export const DIVLAB_PEER_ANALYST_CONTEXT_VERSION = "peer-analyst-context-v1" as const;
export const DIVLAB_PEER_ANALYST_CONTEXT_MAX_CHARS = 8_000;

const METRICS: readonly PeerValuationMetric[] = [
  "pe",
  "priceToFcf",
  "evToEbit",
  "evToEbitda",
] as const;

export type PeerAnalystMetricContext = {
  metric: PeerValuationMetric;
  status: "ready" | "insufficient";
  targetValue: number | null;
  peerSampleSize: number;
  peerMedian: number | null;
  peerMin: number | null;
  peerMax: number | null;
  targetVsMedianPct: number | null;
};

export type DivLabPeerAnalystContext = {
  version: typeof DIVLAB_PEER_ANALYST_CONTEXT_VERSION;
  auditId: string;
  targetAnalysisVersionId: string;
  peerSetId: string;
  peerSetVersionNumber: number;
  dataAsOf: string;
  target: {
    symbol: string;
    exchange: string;
    name: string;
  };
  peerCount: number;
  readyMetricCount: number;
  metrics: PeerAnalystMetricContext[];
  notes: string[];
};

function finiteOrNull(value: number | null): number | null {
  return value === null || Number.isFinite(value) ? value : null;
}

/**
 * Build the bounded neutral peer facts that a future explicit analyst schema may
 * consume. Per-peer source ids and relationship evidence remain behind the
 * persisted audit reference rather than being mixed into the target company's
 * claim-source namespace.
 */
export function buildDivLabPeerAnalystContext(
  stored: StoredPeerComparisonAudit,
): DivLabPeerAnalystContext {
  const comparison = stored.audit.comparison;
  const metrics = METRICS.map((metric) => {
    const value = comparison.metrics[metric];
    if (!value || value.metric !== metric) {
      throw new Error(`divlab_peer_analyst_context_metric_invalid:${metric}`);
    }
    if (
      (value.status !== "ready" && value.status !== "insufficient") ||
      !Number.isInteger(value.peerSampleSize) ||
      value.peerSampleSize < 0 ||
      value.peerSampleSize > stored.audit.registry.registeredPeerCount
    ) {
      throw new Error(`divlab_peer_analyst_context_metric_contract_invalid:${metric}`);
    }

    return {
      metric,
      status: value.status,
      targetValue: finiteOrNull(value.targetValue),
      peerSampleSize: value.peerSampleSize,
      peerMedian: finiteOrNull(value.peerMedian),
      peerMin: finiteOrNull(value.peerMin),
      peerMax: finiteOrNull(value.peerMax),
      targetVsMedianPct: finiteOrNull(value.targetVsMedianPct),
    } satisfies PeerAnalystMetricContext;
  });

  const readyMetricCount = metrics.filter((metric) => metric.status === "ready").length;
  return {
    version: DIVLAB_PEER_ANALYST_CONTEXT_VERSION,
    auditId: stored.auditId,
    targetAnalysisVersionId: stored.targetAnalysisVersionId,
    peerSetId: stored.peerSetId,
    peerSetVersionNumber: stored.audit.registry.versionNumber,
    dataAsOf: comparison.dataAsOf,
    target: { ...comparison.target },
    peerCount: comparison.peerCount,
    readyMetricCount,
    metrics,
    notes: comparison.notes.slice(0, 8),
  };
}

export function serializeDivLabPeerAnalystContext(
  context: DivLabPeerAnalystContext,
): string {
  const serialized = JSON.stringify(context);
  if (serialized.length > DIVLAB_PEER_ANALYST_CONTEXT_MAX_CHARS) {
    throw new Error("divlab_peer_analyst_context_too_large");
  }
  return serialized;
}
