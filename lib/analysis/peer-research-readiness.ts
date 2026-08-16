import type { DivLabResearchPacket } from "./deep-research";
import { DIVLAB_VALUATION_PROVENANCE_VERSION } from "./valuation-provenance";

export const DIVLAB_PEER_RESEARCH_READINESS_VERSION =
  "peer-research-readiness-v1" as const;

export const PEER_RESEARCH_METRICS = [
  "pe",
  "priceToFcf",
  "evToEbit",
  "evToEbitda",
] as const;

export type PeerResearchMetric = (typeof PEER_RESEARCH_METRICS)[number];

export type DivLabPeerResearchReadiness = {
  version: typeof DIVLAB_PEER_RESEARCH_READINESS_VERSION;
  ready: boolean;
  blockers: string[];
  eligibleMetrics: PeerResearchMetric[];
  checks: {
    companyClassificationCoverage: boolean;
    fundamentalMethodologyCoverage: boolean;
    fundamentalCoverage: boolean;
    multiYearFundamentalCoverage: boolean;
    freshPrimarySource: boolean;
    sourceTraceability: boolean;
    primaryEvidenceCoverage: boolean;
    valuationTraceability: boolean;
    valuationProvenanceVersion: boolean;
    peerMetricCoverage: boolean;
  };
};

function finitePositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function metricValue(packet: DivLabResearchPacket, metric: PeerResearchMetric): number | null {
  if (metric === "pe") return packet.valuation?.trailing?.pe ?? null;
  if (metric === "priceToFcf") return packet.valuation?.trailing?.priceToFcf ?? null;
  if (metric === "evToEbit") return packet.valuation?.trailing?.evToEbit ?? null;
  return packet.valuation?.trailing?.evToEbitda ?? null;
}

/**
 * Certification boundary for facts-only research used as a peer observation.
 *
 * A peer packet is intentionally not required to be a publishable DivLab
 * Analysis. Peer comparison does not consume Bear/Base/Bull scenarios or
 * technical levels, so forcing those checks would require unnecessary analyst
 * model calls and manufacture assumptions that are irrelevant to the comparison.
 *
 * Instead we require the exact deterministic/source checks that underpin the
 * peer valuation metrics plus at least two traceable positive peer measures.
 */
export function evaluatePeerResearchReadiness(
  packet: DivLabResearchPacket,
): DivLabPeerResearchReadiness {
  const blockers: string[] = [];
  const base = packet.qualityGate?.checks;
  const valuationProvenanceVersion =
    packet.valuationProvenance?.version === DIVLAB_VALUATION_PROVENANCE_VERSION;

  const eligibleMetrics = PEER_RESEARCH_METRICS.filter((metric) => {
    const provenance = packet.valuationProvenance?.measures?.[metric];
    return Boolean(
      provenance?.available &&
        provenance.traceable &&
        finitePositive(metricValue(packet, metric)),
    );
  });
  const peerMetricCoverage = eligibleMetrics.length >= 2;

  const checks = {
    companyClassificationCoverage: base?.companyClassificationCoverage === true,
    fundamentalMethodologyCoverage: base?.fundamentalMethodologyCoverage === true,
    fundamentalCoverage: base?.fundamentalCoverage === true,
    multiYearFundamentalCoverage: base?.multiYearFundamentalCoverage === true,
    freshPrimarySource: base?.freshPrimarySource === true,
    sourceTraceability: base?.sourceTraceability === true,
    primaryEvidenceCoverage: base?.primaryEvidenceCoverage === true,
    valuationTraceability: base?.valuationTraceability === true,
    valuationProvenanceVersion,
    peerMetricCoverage,
  };

  for (const [name, passed] of Object.entries(checks)) {
    if (!passed) blockers.push(`peer_research_readiness_failed:${name}`);
  }

  return {
    version: DIVLAB_PEER_RESEARCH_READINESS_VERSION,
    ready: blockers.length === 0,
    blockers,
    eligibleMetrics: [...eligibleMetrics],
    checks,
  };
}

export function assertPeerResearchReady(packet: DivLabResearchPacket): void {
  const readiness = evaluatePeerResearchReadiness(packet);
  if (!readiness.ready) {
    throw new Error(
      `peer_research_not_ready:${readiness.blockers.join(",") || "unknown"}`,
    );
  }
}
