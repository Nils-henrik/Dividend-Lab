import {
  buildHistoricalValuationClaim,
  assertHistoricalValuationClaimMatches,
  DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION,
  type HistoricalValuationClaim,
} from "./historical-valuation-claim";
import {
  DIVLAB_HISTORICAL_VALUATION_VERSION,
  type HistoricalValuationAnalysis,
  type HistoricalValuationMetric,
} from "./historical-valuation";

export const DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION =
  "historical-analyst-context-v1" as const;

const METRIC_ORDER: readonly HistoricalValuationMetric[] = [
  "pe",
  "priceToFcf",
  "fcfYield",
  "evToEbit",
  "evToEbitda",
];

export type HistoricalAnalystContext = {
  version: typeof DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION;
  historyVersion: typeof DIVLAB_HISTORICAL_VALUATION_VERSION;
  claimVersion: typeof DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION;
  instrument: {
    symbol: string;
    exchange: string;
    name: string;
  };
  maxObservationAt: string;
  claims: HistoricalValuationClaim[];
};

function identity(input: { symbol: string; exchange: string; name: string }) {
  return {
    symbol: input.symbol.trim().toUpperCase(),
    exchange: input.exchange.trim().toUpperCase(),
    name: input.name.trim(),
  };
}

function selectedMetrics(input?: readonly HistoricalValuationMetric[]): HistoricalValuationMetric[] {
  if (!input) return [...METRIC_ORDER];
  const allowed = new Set(METRIC_ORDER);
  const seen = new Set<HistoricalValuationMetric>();
  for (const metric of input) {
    if (!allowed.has(metric)) {
      throw new Error("historical_analyst_context_metric_invalid");
    }
    if (seen.has(metric)) {
      throw new Error(`historical_analyst_context_duplicate_metric:${metric}`);
    }
    seen.add(metric);
  }
  return METRIC_ORDER.filter((metric) => seen.has(metric));
}

/**
 * Builds a neutral, version-bound input surface for future Analyst consumption.
 * Only metrics that are already ready in historical-valuation-v1 may enter the
 * context. If explicit metrics are requested, every requested metric must be
 * ready; callers cannot silently ask for an insufficient metric and omit it.
 *
 * No model call or qualitative cheap/expensive interpretation occurs here.
 */
export function buildHistoricalAnalystContext(input: {
  history: HistoricalValuationAnalysis;
  metrics?: readonly HistoricalValuationMetric[];
}): HistoricalAnalystContext | null {
  if (input.history.version !== DIVLAB_HISTORICAL_VALUATION_VERSION) {
    throw new Error("historical_analyst_context_history_version_invalid");
  }

  const explicit = input.metrics !== undefined;
  const metrics = selectedMetrics(input.metrics);
  const claims: HistoricalValuationClaim[] = [];

  for (const metric of metrics) {
    const range = input.history.ranges[metric];
    if (range.status !== "ready") {
      if (explicit) {
        throw new Error(`historical_analyst_context_metric_not_ready:${metric}`);
      }
      continue;
    }
    claims.push(buildHistoricalValuationClaim({ history: input.history, metric }));
  }

  if (!claims.length) return null;

  return {
    version: DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION,
    historyVersion: DIVLAB_HISTORICAL_VALUATION_VERSION,
    claimVersion: DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION,
    instrument: identity(input.history.instrument),
    maxObservationAt: input.history.maxObservationAt,
    claims,
  };
}

/** Revalidates every claim against the same originating point-in-time history. */
export function assertHistoricalAnalystContextMatches(input: {
  context: HistoricalAnalystContext;
  history: HistoricalValuationAnalysis;
}): void {
  if (input.context.version !== DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION) {
    throw new Error("historical_analyst_context_version_invalid");
  }
  if (input.context.historyVersion !== DIVLAB_HISTORICAL_VALUATION_VERSION) {
    throw new Error("historical_analyst_context_history_version_invalid");
  }
  if (input.context.claimVersion !== DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION) {
    throw new Error("historical_analyst_context_claim_version_invalid");
  }

  const expectedIdentity = identity(input.history.instrument);
  const actualIdentity = identity(input.context.instrument);
  if (
    actualIdentity.symbol !== expectedIdentity.symbol ||
    actualIdentity.exchange !== expectedIdentity.exchange ||
    actualIdentity.name !== expectedIdentity.name
  ) {
    throw new Error("historical_analyst_context_instrument_mismatch");
  }
  if (input.context.maxObservationAt !== input.history.maxObservationAt) {
    throw new Error("historical_analyst_context_boundary_mismatch");
  }
  if (!input.context.claims.length) {
    throw new Error("historical_analyst_context_claims_required");
  }

  const seen = new Set<HistoricalValuationMetric>();
  let previousOrder = -1;
  for (const claim of input.context.claims) {
    if (seen.has(claim.metric)) {
      throw new Error(`historical_analyst_context_duplicate_metric:${claim.metric}`);
    }
    seen.add(claim.metric);

    const order = METRIC_ORDER.indexOf(claim.metric);
    if (order < 0 || order <= previousOrder) {
      throw new Error("historical_analyst_context_metric_order_invalid");
    }
    previousOrder = order;

    if (claim.maxObservationAt !== input.context.maxObservationAt) {
      throw new Error(`historical_analyst_context_claim_boundary_mismatch:${claim.metric}`);
    }
    assertHistoricalValuationClaimMatches({ claim, history: input.history });
  }
}
