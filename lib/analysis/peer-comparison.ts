import type { DivLabResearchPacket } from "./deep-research";

export const DIVLAB_PEER_COMPARISON_VERSION = "peer-comparison-v1" as const;

export type PeerValuationMetric =
  | "pe"
  | "priceToFcf"
  | "evToEbit"
  | "evToEbitda";

export type PeerBasisSource = {
  id: string;
  publisher: string;
  url: string;
  verifiedAt: string;
};

export type PeerResearchSnapshot = {
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
  };
  dataAsOf: string;
  measures: Record<
    PeerValuationMetric,
    {
      value: number | null;
      traceable: boolean;
      sourceIds: string[];
    }
  >;
};

export type VerifiedPeerInput = {
  snapshot: PeerResearchSnapshot;
  /** Explicit evidence for why this company belongs in the peer set. */
  relationshipSourceIds: string[];
};

export type PeerMetricComparison = {
  metric: PeerValuationMetric;
  status: "ready" | "insufficient";
  targetValue: number | null;
  peerSampleSize: number;
  peerMedian: number | null;
  peerMin: number | null;
  peerMax: number | null;
  targetVsMedianPct: number | null;
  peers: Array<{
    symbol: string;
    exchange: string;
    name: string;
    value: number;
    sourceIds: string[];
    relationshipSourceIds: string[];
  }>;
};

export type VerifiedPeerComparison = {
  version: typeof DIVLAB_PEER_COMPARISON_VERSION;
  status: "ready" | "insufficient";
  target: PeerResearchSnapshot["instrument"];
  dataAsOf: string;
  peerCount: number;
  relationshipSourceIds: string[];
  metrics: Record<PeerValuationMetric, PeerMetricComparison>;
  notes: string[];
};

const METRICS: readonly PeerValuationMetric[] = [
  "pe",
  "priceToFcf",
  "evToEbit",
  "evToEbitda",
] as const;

function finitePositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validDate(value: string): boolean {
  return Number.isFinite(new Date(value).getTime());
}

function validHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function identityKey(instrument: PeerResearchSnapshot["instrument"]): string {
  return `${instrument.exchange.trim().toUpperCase()}:${instrument.symbol.trim().toUpperCase()}`;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim()))];
}

function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const left = sorted[middle - 1];
  const right = sorted[middle];
  return left !== undefined && right !== undefined ? (left + right) / 2 : null;
}

function round(value: number | null, digits = 6): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function measureValue(
  packet: DivLabResearchPacket,
  metric: PeerValuationMetric,
): number | null {
  if (metric === "pe") return packet.valuation.trailing.pe;
  if (metric === "priceToFcf") return packet.valuation.trailing.priceToFcf;
  if (metric === "evToEbit") return packet.valuation.trailing.evToEbit;
  return packet.valuation.trailing.evToEbitda;
}

/**
 * Adapter from the full immutable research packet into the deliberately small
 * peer-comparison contract. Only deterministic, provenance-aware valuation
 * measures cross this boundary.
 */
export function peerSnapshotFromResearchPacket(
  packet: DivLabResearchPacket,
): PeerResearchSnapshot {
  const measures = Object.fromEntries(
    METRICS.map((metric) => {
      const provenance = packet.valuationProvenance.measures[metric];
      return [
        metric,
        {
          value: measureValue(packet, metric),
          traceable: provenance.traceable,
          sourceIds: [...provenance.sourceIds],
        },
      ];
    }),
  ) as PeerResearchSnapshot["measures"];

  return {
    instrument: {
      symbol: packet.instrument.symbol,
      exchange: packet.instrument.exchange,
      name: packet.instrument.name,
    },
    dataAsOf: packet.dataAsOf,
    measures,
  };
}

function validateBasisSources(sources: readonly PeerBasisSource[]): Map<string, PeerBasisSource> {
  const map = new Map<string, PeerBasisSource>();
  for (const source of sources) {
    if (
      !source.id.trim() ||
      !source.publisher.trim() ||
      !validHttpsUrl(source.url) ||
      !validDate(source.verifiedAt)
    ) {
      throw new Error(`peer_basis_source_invalid:${source.id || "missing"}`);
    }
    if (map.has(source.id)) throw new Error(`peer_basis_source_duplicate:${source.id}`);
    map.set(source.id, { ...source });
  }
  return map;
}

function validatePeerSet(input: {
  target: PeerResearchSnapshot;
  peers: readonly VerifiedPeerInput[];
  basisSources: Map<string, PeerBasisSource>;
}): void {
  const targetKey = identityKey(input.target.instrument);
  const seen = new Set<string>();

  for (const peer of input.peers) {
    const key = identityKey(peer.snapshot.instrument);
    if (!peer.snapshot.instrument.symbol.trim() || !peer.snapshot.instrument.exchange.trim() || !peer.snapshot.instrument.name.trim()) {
      throw new Error("peer_identity_required");
    }
    if (!validDate(peer.snapshot.dataAsOf)) throw new Error(`peer_data_as_of_invalid:${key}`);
    if (key === targetKey) throw new Error(`peer_set_contains_target:${key}`);
    if (seen.has(key)) throw new Error(`peer_set_duplicate_member:${key}`);
    seen.add(key);

    const relationshipIds = unique(peer.relationshipSourceIds);
    if (!relationshipIds.length) throw new Error(`peer_relationship_source_required:${key}`);
    for (const sourceId of relationshipIds) {
      if (!input.basisSources.has(sourceId)) {
        throw new Error(`peer_relationship_source_unknown:${key}:${sourceId}`);
      }
    }
  }
}

function metricComparison(input: {
  metric: PeerValuationMetric;
  target: PeerResearchSnapshot;
  peers: readonly VerifiedPeerInput[];
}): PeerMetricComparison {
  const targetMeasure = input.target.measures[input.metric];
  const targetValue =
    targetMeasure.traceable && finitePositive(targetMeasure.value)
      ? targetMeasure.value
      : null;

  const peers = input.peers.flatMap((peer) => {
    const measure = peer.snapshot.measures[input.metric];
    if (!measure.traceable || !finitePositive(measure.value)) return [];
    return [
      {
        symbol: peer.snapshot.instrument.symbol,
        exchange: peer.snapshot.instrument.exchange,
        name: peer.snapshot.instrument.name,
        value: measure.value,
        sourceIds: [...measure.sourceIds],
        relationshipSourceIds: unique(peer.relationshipSourceIds),
      },
    ];
  });

  const peerValues = peers.map((peer) => peer.value);
  const peerMedian = median(peerValues);
  const status = targetValue !== null && peerValues.length >= 3 ? "ready" : "insufficient";

  return {
    metric: input.metric,
    status,
    targetValue: round(targetValue, 4),
    peerSampleSize: peerValues.length,
    peerMedian: round(peerMedian, 4),
    peerMin: peerValues.length ? round(Math.min(...peerValues), 4) : null,
    peerMax: peerValues.length ? round(Math.max(...peerValues), 4) : null,
    targetVsMedianPct:
      targetValue !== null && peerMedian !== null && peerMedian > 0
        ? round(targetValue / peerMedian - 1, 6)
        : null,
    peers,
  };
}

/**
 * Deterministic comparison over an explicit, source-backed peer set.
 *
 * This function never discovers peers, never infers industry membership and
 * never converts a lower multiple into a "better stock" score. It only compares
 * traceable dimensionless valuation measures for a peer relationship that was
 * supplied and evidenced outside the model.
 */
export function buildVerifiedPeerComparison(input: {
  target: PeerResearchSnapshot;
  peers: readonly VerifiedPeerInput[];
  basisSources: readonly PeerBasisSource[];
}): VerifiedPeerComparison {
  if (!input.target.instrument.symbol.trim() || !input.target.instrument.exchange.trim() || !input.target.instrument.name.trim()) {
    throw new Error("peer_target_identity_required");
  }
  if (!validDate(input.target.dataAsOf)) throw new Error("peer_target_data_as_of_invalid");

  const basisSources = validateBasisSources(input.basisSources);
  validatePeerSet({ target: input.target, peers: input.peers, basisSources });

  const metrics = Object.fromEntries(
    METRICS.map((metric) => [
      metric,
      metricComparison({ metric, target: input.target, peers: input.peers }),
    ]),
  ) as VerifiedPeerComparison["metrics"];

  const peerCount = input.peers.length;
  const status = peerCount >= 3 ? "ready" : "insufficient";
  const allDates = [input.target.dataAsOf, ...input.peers.map((peer) => peer.snapshot.dataAsOf)]
    .map((value) => new Date(value))
    .filter((value) => Number.isFinite(value.getTime()));
  const oldestAsOf = allDates.length
    ? new Date(Math.min(...allDates.map((value) => value.getTime()))).toISOString()
    : input.target.dataAsOf;

  const notes: string[] = [];
  if (status === "insufficient") {
    notes.push("Minst tre explicit verifierade peer-bolag krävs för en meningsfull DivLab peer-jämförelse.");
  }
  for (const metric of METRICS) {
    if (metrics[metric].status === "insufficient") {
      notes.push(
        `${metric} har färre än tre peer-observationer med tillgänglig och fullt spårbar värdering, eller saknar ett spårbart target-värde.`,
      );
    }
  }

  return {
    version: DIVLAB_PEER_COMPARISON_VERSION,
    status,
    target: { ...input.target.instrument },
    dataAsOf: oldestAsOf,
    peerCount,
    relationshipSourceIds: unique(input.peers.flatMap((peer) => peer.relationshipSourceIds)),
    metrics,
    notes,
  };
}
