import {
  assertHistoricalAnalystContextMatches,
  DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION,
  type HistoricalAnalystContext,
} from "./historical-analyst-context";
import {
  divLabHistoricalAnalystInterpretationSchema,
  DIVLAB_HISTORICAL_ANALYST_INTERPRETATION_VERSION,
  type DivLabHistoricalAnalystInterpretation,
  type DivLabHistoricalEvidenceBreadth,
  type DivLabHistoricalPositionBand,
} from "./historical-analyst-schema";
import { DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION } from "./historical-valuation-claim";
import {
  DIVLAB_HISTORICAL_VALUATION_VERSION,
  type HistoricalValuationAnalysis,
} from "./historical-valuation";
import { normalizeAnalysisVersionId } from "./research-version-read";

function identity(input: { symbol: string; exchange: string; name: string }) {
  return {
    symbol: input.symbol.trim().toUpperCase(),
    exchange: input.exchange.trim().toUpperCase(),
    name: input.name.trim(),
  };
}

export function expectedHistoricalPositionBand(
  percentile: number,
): DivLabHistoricalPositionBand {
  if (!Number.isFinite(percentile) || percentile < 0 || percentile > 1) {
    throw new Error("historical_analyst_percentile_invalid");
  }
  if (percentile < 0.25) return "bottom_quartile";
  if (percentile < 0.75) return "middle_half";
  return "top_quartile";
}

export function expectedHistoricalEvidenceBreadth(
  sampleSize: number,
): DivLabHistoricalEvidenceBreadth {
  if (!Number.isInteger(sampleSize) || sampleSize < 4 || sampleSize > 500) {
    throw new Error("historical_analyst_sample_size_invalid");
  }
  if (sampleSize < 8) return "limited";
  if (sampleSize < 20) return "moderate";
  return "broad";
}

function exactNumber(input: {
  metric: string;
  field: string;
  actual: number;
  expected: number;
}): void {
  if (!Number.isFinite(input.actual) || !Object.is(input.actual, input.expected)) {
    throw new Error(
      `historical_analyst_numeric_mismatch:${input.metric}:${input.field}`,
    );
  }
}

/**
 * Validates a bounded historical interpretation against the exact originating
 * point-in-time history and neutral historical Analyst context.
 *
 * Every ready context metric must be represented exactly once. The contract
 * validates structured historical position only; it does not infer cheap/expensive
 * or buy/sell conclusions from the historical distribution.
 */
export function validateHistoricalAnalystInterpretation(input: {
  history: HistoricalValuationAnalysis;
  context: HistoricalAnalystContext;
  interpretation: DivLabHistoricalAnalystInterpretation;
}): void {
  divLabHistoricalAnalystInterpretationSchema.parse(input.interpretation);
  assertHistoricalAnalystContextMatches({
    context: input.context,
    history: input.history,
  });

  if (
    input.interpretation.version !==
    DIVLAB_HISTORICAL_ANALYST_INTERPRETATION_VERSION
  ) {
    throw new Error("historical_analyst_interpretation_version_invalid");
  }
  if (
    input.interpretation.contextVersion !==
    DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION
  ) {
    throw new Error("historical_analyst_context_version_invalid");
  }
  if (
    input.interpretation.historyVersion !== DIVLAB_HISTORICAL_VALUATION_VERSION ||
    input.interpretation.claimVersion !==
      DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION
  ) {
    throw new Error("historical_analyst_provenance_version_invalid");
  }

  const expectedIdentity = identity(input.context.instrument);
  const actualIdentity = identity(input.interpretation.instrument);
  if (
    actualIdentity.symbol !== expectedIdentity.symbol ||
    actualIdentity.exchange !== expectedIdentity.exchange ||
    actualIdentity.name !== expectedIdentity.name
  ) {
    throw new Error("historical_analyst_instrument_mismatch");
  }
  if (input.interpretation.maxObservationAt !== input.context.maxObservationAt) {
    throw new Error("historical_analyst_boundary_mismatch");
  }

  if (input.interpretation.interpretations.length !== input.context.claims.length) {
    throw new Error("historical_analyst_metric_coverage_mismatch");
  }

  for (const [index, interpreted] of input.interpretation.interpretations.entries()) {
    const claim = input.context.claims[index];
    if (!claim || interpreted.metric !== claim.metric) {
      throw new Error("historical_analyst_metric_coverage_mismatch");
    }
    if (interpreted.sampleSize !== claim.sampleSize) {
      throw new Error(
        `historical_analyst_numeric_mismatch:${interpreted.metric}:sampleSize`,
      );
    }
    if (
      interpreted.observationVersionCount !==
      claim.observationAnalysisVersionIds.length
    ) {
      throw new Error(
        `historical_analyst_numeric_mismatch:${interpreted.metric}:observationVersionCount`,
      );
    }
    if (interpreted.sourceCount !== claim.sourceIds.length) {
      throw new Error(
        `historical_analyst_numeric_mismatch:${interpreted.metric}:sourceCount`,
      );
    }
    if (
      normalizeAnalysisVersionId(interpreted.latestAnalysisVersionId) !==
      claim.latestAnalysisVersionId
    ) {
      throw new Error(
        `historical_analyst_latest_version_mismatch:${interpreted.metric}`,
      );
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
      exactNumber({
        metric: interpreted.metric,
        field: key,
        actual: interpreted.statistics[key],
        expected: claim.statistics[key],
      });
    }

    const expectedPosition = expectedHistoricalPositionBand(
      claim.statistics.latestPercentile,
    );
    if (interpreted.positionBand !== expectedPosition) {
      throw new Error(
        `historical_analyst_position_band_mismatch:${interpreted.metric}`,
      );
    }

    const expectedBreadth = expectedHistoricalEvidenceBreadth(claim.sampleSize);
    if (interpreted.evidenceBreadth !== expectedBreadth) {
      throw new Error(
        `historical_analyst_evidence_breadth_mismatch:${interpreted.metric}`,
      );
    }
  }
}
