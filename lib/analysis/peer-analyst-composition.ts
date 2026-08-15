import type { DivLabAnalystDraft } from "./analyst-schema";
import type {
  DivLabPeerAnalystContext,
  PeerAnalystMetricContext,
} from "./peer-analyst-context";
import {
  divLabPeerAnalystDraftSchema,
  type DivLabPeerAnalystClaim,
  type DivLabPeerAnalystDraft,
} from "./peer-analyst-schema";

const METRIC_LABELS: Record<PeerAnalystMetricContext["metric"], string> = {
  pe: "P/E",
  priceToFcf: "P/FCF",
  evToEbit: "EV/EBIT",
  evToEbitda: "EV/EBITDA",
};

function swedishNumber(value: number, digits = 2): string {
  return value.toFixed(digits).replace(".", ",");
}

function direction(delta: number): string {
  if (delta > 0.005) return "över";
  if (delta < -0.005) return "under";
  return "nära";
}

function claimText(metric: PeerAnalystMetricContext): string {
  if (
    metric.status !== "ready" ||
    metric.targetValue === null ||
    metric.peerMedian === null ||
    metric.peerMin === null ||
    metric.peerMax === null ||
    metric.targetVsMedianPct === null
  ) {
    throw new Error(`divlab_peer_analyst_composition_metric_not_ready:${metric.metric}`);
  }

  const label = METRIC_LABELS[metric.metric];
  const relation = direction(metric.targetVsMedianPct);
  const deltaPct = Math.abs(metric.targetVsMedianPct) * 100;
  const deltaPhrase = relation === "nära"
    ? "nära peer-medianen"
    : `${swedishNumber(deltaPct, 1)} % ${relation} peer-medianen`;

  return `${label} är ${deltaPhrase}: target ${swedishNumber(metric.targetValue)}, median ${swedishNumber(metric.peerMedian)}, spann ${swedishNumber(metric.peerMin)}–${swedishNumber(metric.peerMax)} bland ${metric.peerSampleSize} verifierade peers. Detta är neutral relativ värderingskontext och inte en köp- eller säljsignal i sig.`;
}

export function buildDeterministicPeerInterpretation(
  context: DivLabPeerAnalystContext,
): DivLabPeerAnalystClaim[] {
  const ready = context.metrics.filter((metric) => metric.status === "ready");
  if (ready.length !== context.readyMetricCount || ready.length < 1) {
    throw new Error("divlab_peer_analyst_composition_ready_metric_count_invalid");
  }

  return ready.map((metric) => {
    if (
      metric.targetValue === null ||
      metric.peerMedian === null ||
      metric.peerMin === null ||
      metric.peerMax === null ||
      metric.targetVsMedianPct === null
    ) {
      throw new Error(`divlab_peer_analyst_composition_metric_not_ready:${metric.metric}`);
    }

    return {
      metric: metric.metric,
      text: claimText(metric),
      peerAuditId: context.auditId,
      targetValue: metric.targetValue,
      peerSampleSize: metric.peerSampleSize,
      peerMedian: metric.peerMedian,
      peerMin: metric.peerMin,
      peerMax: metric.peerMax,
      targetVsMedianPct: metric.targetVsMedianPct,
    };
  });
}

/**
 * Upgrade an already-generated Analyst v2 target-company draft into the explicit
 * v3-peer schema without a second model call.
 *
 * The AI-written target thesis remains untouched. Peer interpretation is a
 * deterministic neutral appendix grounded only in the persisted audit. This is
 * the conservative first integration step; peer data does not silently steer
 * view/scenarios until a later model-enabled contract is separately evaluated.
 */
export function composePeerAnalystDraft(input: {
  baseDraft: DivLabAnalystDraft;
  peerContext: DivLabPeerAnalystContext;
}): DivLabPeerAnalystDraft {
  return divLabPeerAnalystDraftSchema.parse({
    ...input.baseDraft,
    peerContextVersion: input.peerContext.version,
    peerAuditId: input.peerContext.auditId,
    peerInterpretation: buildDeterministicPeerInterpretation(input.peerContext),
  });
}
