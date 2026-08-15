import {
  DIVLAB_HISTORICAL_VALUATION_VERSION,
  HISTORICAL_VALUATION_MIN_OBSERVATIONS,
  type HistoricalValuationAnalysis,
  type HistoricalValuationMetric,
} from "./historical-valuation";
import { normalizeAnalysisVersionId } from "./research-version-read";

export const DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION =
  "historical-valuation-claim-v1" as const;

export type HistoricalValuationClaimStatistics = {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  latest: number;
  latestPercentile: number;
};

export type HistoricalValuationClaim = {
  version: typeof DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION;
  historyVersion: typeof DIVLAB_HISTORICAL_VALUATION_VERSION;
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
  };
  metric: HistoricalValuationMetric;
  maxObservationAt: string;
  sampleSize: number;
  latestAnalysisVersionId: string;
  observationAnalysisVersionIds: string[];
  sourceIds: string[];
  statistics: HistoricalValuationClaimStatistics;
};

function timestamp(value: string, error: string): number {
  const parsed = new Date(value).getTime();
  if (!Number.isFinite(parsed)) throw new Error(error);
  return parsed;
}

function finite(value: number, error: string): number {
  if (!Number.isFinite(value)) throw new Error(error);
  return value;
}

function exactNumber(left: number, right: number): boolean {
  return Number.isFinite(left) && Number.isFinite(right) && Object.is(left, right);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function exactStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizedIdentity(input: { symbol: string; exchange: string; name: string }) {
  const symbol = input.symbol.trim().toUpperCase();
  const exchange = input.exchange.trim().toUpperCase();
  const name = input.name.trim();
  if (!symbol || !exchange || !name) {
    throw new Error("historical_valuation_claim_instrument_invalid");
  }
  return { symbol, exchange, name };
}

function readyRange(input: HistoricalValuationAnalysis, metric: HistoricalValuationMetric) {
  if (input.version !== DIVLAB_HISTORICAL_VALUATION_VERSION) {
    throw new Error("historical_valuation_claim_history_version_invalid");
  }

  const range = input.ranges[metric];
  if (!range || range.metric !== metric) {
    throw new Error("historical_valuation_claim_metric_invalid");
  }
  if (range.status !== "ready" || !range.statistics) {
    throw new Error("historical_valuation_claim_history_not_ready");
  }
  if (
    range.sampleSize < HISTORICAL_VALUATION_MIN_OBSERVATIONS ||
    range.sampleSize !== range.observations.length
  ) {
    throw new Error("historical_valuation_claim_sample_invalid");
  }

  return range;
}

function validateHistoryBindings(
  history: HistoricalValuationAnalysis,
  metric: HistoricalValuationMetric,
) {
  const range = readyRange(history, metric);
  const maxObservationAtMs = timestamp(
    history.maxObservationAt,
    "historical_valuation_claim_max_observation_at_invalid",
  );

  const versionIds: string[] = [];
  const seenVersionIds = new Set<string>();
  const sourceIds: string[] = [];
  let previousObservationAtMs = Number.NEGATIVE_INFINITY;

  for (const observation of range.observations) {
    const analysisVersionId = normalizeAnalysisVersionId(observation.analysisVersionId);
    if (seenVersionIds.has(analysisVersionId)) {
      throw new Error(
        `historical_valuation_claim_duplicate_analysis_version:${analysisVersionId}`,
      );
    }
    seenVersionIds.add(analysisVersionId);
    versionIds.push(analysisVersionId);

    const observationAtMs = timestamp(
      observation.observationAt,
      "historical_valuation_claim_observation_at_invalid",
    );
    const dataAsOfMs = timestamp(
      observation.dataAsOf,
      "historical_valuation_claim_data_as_of_invalid",
    );
    if (observationAtMs > maxObservationAtMs || dataAsOfMs > observationAtMs) {
      throw new Error("historical_valuation_claim_lookahead");
    }
    if (observationAtMs <= previousObservationAtMs) {
      throw new Error("historical_valuation_claim_observation_order_invalid");
    }
    previousObservationAtMs = observationAtMs;

    if (!Number.isFinite(observation.value) || observation.value <= 0) {
      throw new Error("historical_valuation_claim_observation_value_invalid");
    }
    if (!observation.sourceIds.length) {
      throw new Error("historical_valuation_claim_source_binding_missing");
    }
    sourceIds.push(...observation.sourceIds);
  }

  const latest = range.observations.at(-1)!;
  if (!exactNumber(latest.value, range.statistics.latest)) {
    throw new Error("historical_valuation_claim_latest_value_mismatch");
  }

  const statistics: HistoricalValuationClaimStatistics = {
    min: finite(range.statistics.min, "historical_valuation_claim_statistics_invalid"),
    q1: finite(range.statistics.q1, "historical_valuation_claim_statistics_invalid"),
    median: finite(range.statistics.median, "historical_valuation_claim_statistics_invalid"),
    q3: finite(range.statistics.q3, "historical_valuation_claim_statistics_invalid"),
    max: finite(range.statistics.max, "historical_valuation_claim_statistics_invalid"),
    latest: finite(range.statistics.latest, "historical_valuation_claim_statistics_invalid"),
    latestPercentile: finite(
      range.statistics.latestPercentile,
      "historical_valuation_claim_statistics_invalid",
    ),
  };

  if (
    statistics.min > statistics.q1 ||
    statistics.q1 > statistics.median ||
    statistics.median > statistics.q3 ||
    statistics.q3 > statistics.max ||
    statistics.latest < statistics.min ||
    statistics.latest > statistics.max ||
    statistics.latestPercentile < 0 ||
    statistics.latestPercentile > 1
  ) {
    throw new Error("historical_valuation_claim_statistics_order_invalid");
  }

  return {
    range,
    maxObservationAt: new Date(maxObservationAtMs).toISOString(),
    versionIds,
    sourceIds: uniqueSorted(sourceIds),
    latestAnalysisVersionId: versionIds.at(-1)!,
    statistics,
  };
}

/**
 * Builds the only historical-valuation shape intended for future concrete
 * Analyst claims. It binds the claim to the exact point-in-time history,
 * immutable research versions and source IDs that produced the statistics.
 *
 * This function does not interpret whether a percentile is "cheap" or
 * "expensive" and does not call a model. Qualitative interpretation remains a
 * separate, later contract.
 */
export function buildHistoricalValuationClaim(input: {
  history: HistoricalValuationAnalysis;
  metric: HistoricalValuationMetric;
}): HistoricalValuationClaim {
  const binding = validateHistoryBindings(input.history, input.metric);
  const instrument = normalizedIdentity(input.history.instrument);

  return {
    version: DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION,
    historyVersion: DIVLAB_HISTORICAL_VALUATION_VERSION,
    instrument,
    metric: input.metric,
    maxObservationAt: binding.maxObservationAt,
    sampleSize: binding.range.sampleSize,
    latestAnalysisVersionId: binding.latestAnalysisVersionId,
    observationAnalysisVersionIds: [...binding.versionIds],
    sourceIds: [...binding.sourceIds],
    statistics: { ...binding.statistics },
  };
}

/**
 * Recomputes every binding from the originating historical analysis and rejects
 * any altered metric, percentile, source/version set or point-in-time boundary.
 */
export function assertHistoricalValuationClaimMatches(input: {
  claim: HistoricalValuationClaim;
  history: HistoricalValuationAnalysis;
}): void {
  if (input.claim.version !== DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION) {
    throw new Error("historical_valuation_claim_version_invalid");
  }
  if (input.claim.historyVersion !== DIVLAB_HISTORICAL_VALUATION_VERSION) {
    throw new Error("historical_valuation_claim_history_version_invalid");
  }

  const expected = buildHistoricalValuationClaim({
    history: input.history,
    metric: input.claim.metric,
  });
  const claimInstrument = normalizedIdentity(input.claim.instrument);

  if (
    claimInstrument.symbol !== expected.instrument.symbol ||
    claimInstrument.exchange !== expected.instrument.exchange ||
    claimInstrument.name !== expected.instrument.name
  ) {
    throw new Error("historical_valuation_claim_instrument_mismatch");
  }
  if (input.claim.maxObservationAt !== expected.maxObservationAt) {
    throw new Error("historical_valuation_claim_boundary_mismatch");
  }
  if (input.claim.sampleSize !== expected.sampleSize) {
    throw new Error("historical_valuation_claim_sample_mismatch");
  }
  if (
    normalizeAnalysisVersionId(input.claim.latestAnalysisVersionId) !==
    expected.latestAnalysisVersionId
  ) {
    throw new Error("historical_valuation_claim_latest_version_mismatch");
  }

  const claimVersionIds = input.claim.observationAnalysisVersionIds.map(
    normalizeAnalysisVersionId,
  );
  if (!exactStringArray(claimVersionIds, expected.observationAnalysisVersionIds)) {
    throw new Error("historical_valuation_claim_version_bindings_mismatch");
  }
  if (!exactStringArray(uniqueSorted(input.claim.sourceIds), expected.sourceIds)) {
    throw new Error("historical_valuation_claim_source_bindings_mismatch");
  }

  const keys = [
    "min",
    "q1",
    "median",
    "q3",
    "max",
    "latest",
    "latestPercentile",
  ] as const;
  for (const key of keys) {
    if (!exactNumber(input.claim.statistics[key], expected.statistics[key])) {
      throw new Error(`historical_valuation_claim_statistic_mismatch:${key}`);
    }
  }
}
