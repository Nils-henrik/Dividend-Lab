import {
  DIVLAB_DEEP_RESEARCH_VERSION,
  type DivLabResearchPacket,
} from "./deep-research";
import type { VersionedResearchPacket } from "./peer-comparison-audit";
import { normalizeAnalysisVersionId } from "./research-version-read";
import {
  DIVLAB_VALUATION_PROVENANCE_VERSION,
  type ValuationMeasureKey,
} from "./valuation-provenance";

export const DIVLAB_HISTORICAL_VALUATION_VERSION =
  "historical-valuation-v1" as const;

export const HISTORICAL_VALUATION_MIN_OBSERVATIONS = 4;

export type HistoricalValuationMetric =
  | "pe"
  | "priceToFcf"
  | "fcfYield"
  | "evToEbit"
  | "evToEbitda";

export type HistoricalValuationObservation = {
  analysisVersionId: string;
  observationAt: string;
  dataAsOf: string;
  value: number;
  sourceIds: string[];
};

export type HistoricalValuationRange = {
  metric: HistoricalValuationMetric;
  status: "ready" | "insufficient";
  sampleSize: number;
  observations: HistoricalValuationObservation[];
  statistics: null | {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    latest: number;
    latestPercentile: number;
  };
};

export type HistoricalValuationAnalysis = {
  version: typeof DIVLAB_HISTORICAL_VALUATION_VERSION;
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
  };
  observationPolicy: "immutable_research_versions_only";
  generatedAt: string;
  maxObservationAt: string;
  ranges: Record<HistoricalValuationMetric, HistoricalValuationRange>;
};

const METRICS: readonly HistoricalValuationMetric[] = [
  "pe",
  "priceToFcf",
  "fcfYield",
  "evToEbit",
  "evToEbitda",
] as const;

function finitePositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function timestamp(value: string, error: string): number {
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) throw new Error(error);
  return parsed;
}

function identity(packet: DivLabResearchPacket): string {
  return `${packet.instrument.exchange.trim().toUpperCase()}:${packet.instrument.symbol.trim().toUpperCase()}`;
}

function valueForMetric(
  packet: DivLabResearchPacket,
  metric: HistoricalValuationMetric,
): number | null {
  const trailing = packet.valuation.trailing;
  if (metric === "pe") return trailing.pe;
  if (metric === "priceToFcf") return trailing.priceToFcf;
  if (metric === "fcfYield") return trailing.fcfYield;
  if (metric === "evToEbit") return trailing.evToEbit;
  return trailing.evToEbitda;
}

function quantile(sorted: readonly number[], q: number): number {
  if (!sorted.length) throw new Error("historical_valuation_quantile_empty");
  if (sorted.length === 1) return sorted[0]!;
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower]!;
  const weight = position - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

function round(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentileRank(values: readonly number[], value: number): number {
  if (!values.length) return 0;
  const below = values.filter((candidate) => candidate < value).length;
  const equal = values.filter((candidate) => candidate === value).length;
  return round((below + equal * 0.5) / values.length, 6);
}

function validatePacket(input: {
  versioned: VersionedResearchPacket;
  maxObservationAtMs: number;
  expectedIdentity: string | null;
}): {
  analysisVersionId: string;
  packet: DivLabResearchPacket;
  observationAtMs: number;
  observationAt: string;
  dataAsOf: string;
  identity: string;
} {
  const packet = input.versioned.packet;
  const analysisVersionId = normalizeAnalysisVersionId(
    input.versioned.analysisVersionId,
  );

  if (packet.version !== DIVLAB_DEEP_RESEARCH_VERSION) {
    throw new Error("historical_valuation_engine_version_invalid");
  }
  if (packet.qualityGate.publishable !== true) {
    throw new Error("historical_valuation_requires_publishable_research");
  }
  if (packet.valuationProvenance.version !== DIVLAB_VALUATION_PROVENANCE_VERSION) {
    throw new Error("historical_valuation_provenance_version_invalid");
  }

  const observationAtMs = timestamp(
    packet.createdAt,
    "historical_valuation_created_at_invalid",
  );
  const dataAsOfMs = timestamp(
    packet.dataAsOf,
    "historical_valuation_data_as_of_invalid",
  );
  if (observationAtMs > input.maxObservationAtMs) {
    throw new Error("historical_valuation_observation_lookahead");
  }
  if (dataAsOfMs > observationAtMs) {
    throw new Error("historical_valuation_data_as_of_lookahead");
  }

  for (const source of packet.sources) {
    const verifiedAtMs = timestamp(
      source.verifiedAt,
      `historical_valuation_source_verified_at_invalid:${source.id}`,
    );
    const publishedAtMs = timestamp(
      source.publishedAt,
      `historical_valuation_source_published_at_invalid:${source.id}`,
    );
    if (verifiedAtMs > observationAtMs || publishedAtMs > observationAtMs) {
      throw new Error(`historical_valuation_source_lookahead:${source.id}`);
    }
  }

  const packetIdentity = identity(packet);
  if (input.expectedIdentity && packetIdentity !== input.expectedIdentity) {
    throw new Error("historical_valuation_mixed_instruments");
  }

  return {
    analysisVersionId,
    packet,
    observationAtMs,
    observationAt: new Date(observationAtMs).toISOString(),
    dataAsOf: new Date(dataAsOfMs).toISOString(),
    identity: packetIdentity,
  };
}

function canonicalDailyVersions(
  versions: readonly ReturnType<typeof validatePacket>[],
): ReturnType<typeof validatePacket>[] {
  const byDay = new Map<string, ReturnType<typeof validatePacket>>();
  for (const version of [...versions].sort(
    (left, right) => left.observationAtMs - right.observationAtMs,
  )) {
    const day = version.observationAt.slice(0, 10);
    const current = byDay.get(day);
    if (!current || version.observationAtMs >= current.observationAtMs) {
      byDay.set(day, version);
    }
  }
  return [...byDay.values()].sort(
    (left, right) => left.observationAtMs - right.observationAtMs,
  );
}

function buildRange(input: {
  metric: HistoricalValuationMetric;
  versions: readonly ReturnType<typeof validatePacket>[];
}): HistoricalValuationRange {
  const observations: HistoricalValuationObservation[] = [];

  for (const version of input.versions) {
    const provenance = version.packet.valuationProvenance.measures[
      input.metric as ValuationMeasureKey
    ];
    const value = valueForMetric(version.packet, input.metric);
    if (!finitePositive(value)) continue;
    if (!provenance.available || !provenance.traceable) continue;
    if (!provenance.sourceIds.length) continue;

    const knownSourceIds = new Set(version.packet.sources.map((source) => source.id));
    if (provenance.sourceIds.some((sourceId) => !knownSourceIds.has(sourceId))) {
      throw new Error(
        `historical_valuation_unknown_source:${input.metric}:${version.analysisVersionId}`,
      );
    }

    observations.push({
      analysisVersionId: version.analysisVersionId,
      observationAt: version.observationAt,
      dataAsOf: version.dataAsOf,
      value,
      sourceIds: [...new Set(provenance.sourceIds)],
    });
  }

  if (observations.length < HISTORICAL_VALUATION_MIN_OBSERVATIONS) {
    return {
      metric: input.metric,
      status: "insufficient",
      sampleSize: observations.length,
      observations,
      statistics: null,
    };
  }

  const values = observations.map((observation) => observation.value);
  const sorted = [...values].sort((a, b) => a - b);
  const latest = observations.at(-1)!.value;
  return {
    metric: input.metric,
    status: "ready",
    sampleSize: observations.length,
    observations,
    statistics: {
      min: round(sorted[0]!),
      q1: round(quantile(sorted, 0.25)),
      median: round(quantile(sorted, 0.5)),
      q3: round(quantile(sorted, 0.75)),
      max: round(sorted.at(-1)!),
      latest: round(latest),
      latestPercentile: percentileRank(values, latest),
    },
  };
}

/**
 * Build genuine point-in-time valuation ranges from research that actually
 * existed at each observation date.
 *
 * No historical financial period is backfilled into a date when the research
 * had not yet been created. This intentionally starts sparse and accumulates
 * history prospectively as immutable Deep Research versions are persisted.
 */
export function buildHistoricalValuationAnalysis(input: {
  versions: readonly VersionedResearchPacket[];
  generatedAt?: string;
  maxObservationAt?: string;
}): HistoricalValuationAnalysis | null {
  if (!input.versions.length) return null;

  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const generatedAtMs = timestamp(
    generatedAt,
    "historical_valuation_generated_at_invalid",
  );
  const maxObservationAt = input.maxObservationAt ?? generatedAt;
  const maxObservationAtMs = timestamp(
    maxObservationAt,
    "historical_valuation_max_observation_at_invalid",
  );
  if (maxObservationAtMs > generatedAtMs) {
    throw new Error("historical_valuation_generation_lookahead");
  }

  let expectedIdentity: string | null = null;
  const validated = input.versions.map((versioned) => {
    const value = validatePacket({
      versioned,
      maxObservationAtMs,
      expectedIdentity,
    });
    expectedIdentity ??= value.identity;
    return value;
  });
  const versions = canonicalDailyVersions(validated);
  const latest = versions.at(-1)!;

  return {
    version: DIVLAB_HISTORICAL_VALUATION_VERSION,
    instrument: {
      symbol: latest.packet.instrument.symbol.trim().toUpperCase(),
      exchange: latest.packet.instrument.exchange.trim().toUpperCase(),
      name: latest.packet.instrument.name.trim(),
    },
    observationPolicy: "immutable_research_versions_only",
    generatedAt: new Date(generatedAtMs).toISOString(),
    maxObservationAt: new Date(maxObservationAtMs).toISOString(),
    ranges: {
      pe: buildRange({ metric: "pe", versions }),
      priceToFcf: buildRange({ metric: "priceToFcf", versions }),
      fcfYield: buildRange({ metric: "fcfYield", versions }),
      evToEbit: buildRange({ metric: "evToEbit", versions }),
      evToEbitda: buildRange({ metric: "evToEbitda", versions }),
    },
  };
}
