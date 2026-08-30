import {
  assertHistoricalAnalystContextMatches,
  DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION,
  type HistoricalAnalystContext,
} from "./historical-analyst-context";
import {
  expectedHistoricalEvidenceBreadth,
  expectedHistoricalPositionBand,
} from "./historical-analyst-contract";
import {
  DIVLAB_HISTORICAL_ANALYST_INTERPRETATION_VERSION,
  type DivLabHistoricalAnalystInterpretation,
} from "./historical-analyst-schema";
import { DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION } from "./historical-valuation-claim";
import {
  DIVLAB_HISTORICAL_VALUATION_VERSION,
  type HistoricalValuationAnalysis,
} from "./historical-valuation";

export const DIVLAB_HISTORICAL_ANALYST_QUALITY_GATE_VERSION =
  "historical-analyst-quality-v1" as const;

export type DivLabHistoricalAnalystQualityGate = {
  version: typeof DIVLAB_HISTORICAL_ANALYST_QUALITY_GATE_VERSION;
  publishable: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  metrics: {
    readyHistoricalMetrics: number;
    interpretedHistoricalMetrics: number;
    minimumSampleSize: number;
    maximumSampleSize: number;
  };
  checks: {
    contextBinding: boolean;
    completeMetricCoverage: boolean;
    numericGrounding: boolean;
    positionGrounding: boolean;
    evidenceBreadthCalibration: boolean;
    neutralLanguage: boolean;
  };
};

const FORBIDDEN_CONCLUSION_LANGUAGE =
  /\b(köp|köpa|sälj|sälja|buy|sell|billig|billigt|dyr|dyrt|undervärderad|övervärderad|undervalued|overvalued|garanterad|garanterat|guaranteed|riskfri|risk-free)\b/i;

function sameIdentity(
  left: { symbol: string; exchange: string; name: string },
  right: { symbol: string; exchange: string; name: string },
): boolean {
  return (
    left.symbol.trim().toUpperCase() === right.symbol.trim().toUpperCase() &&
    left.exchange.trim().toUpperCase() === right.exchange.trim().toUpperCase() &&
    left.name.trim() === right.name.trim()
  );
}

function allStatisticsMatch(
  actual: DivLabHistoricalAnalystInterpretation["interpretations"][number]["statistics"],
  expected: HistoricalAnalystContext["claims"][number]["statistics"],
): boolean {
  const keys = [
    "min",
    "q1",
    "median",
    "q3",
    "max",
    "latest",
    "latestPercentile",
  ] as const;
  return keys.every((key) => Object.is(actual[key], expected[key]));
}

/**
 * Certifies only the historical interpretation appendix. It deliberately does
 * not infer investment attractiveness from the history. All ready metrics must
 * be covered, every structured number must match the audited context, and text
 * containing direct valuation/trading verdicts is blocked.
 */
export function evaluateHistoricalAnalystInterpretationQuality(input: {
  history: HistoricalValuationAnalysis;
  context: HistoricalAnalystContext;
  interpretation: DivLabHistoricalAnalystInterpretation;
}): DivLabHistoricalAnalystQualityGate {
  const blockers: string[] = [];
  const warnings: string[] = [];

  let contextValid = true;
  try {
    assertHistoricalAnalystContextMatches({
      context: input.context,
      history: input.history,
    });
  } catch {
    contextValid = false;
  }

  const contextBinding =
    contextValid &&
    input.interpretation.version ===
      DIVLAB_HISTORICAL_ANALYST_INTERPRETATION_VERSION &&
    input.interpretation.contextVersion ===
      DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION &&
    input.interpretation.historyVersion === DIVLAB_HISTORICAL_VALUATION_VERSION &&
    input.interpretation.claimVersion ===
      DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION &&
    input.interpretation.maxObservationAt === input.context.maxObservationAt &&
    sameIdentity(input.interpretation.instrument, input.context.instrument);
  if (!contextBinding) {
    blockers.push(
      "Historiktolkningen är inte bunden till rätt verifierade context, instrument och point-in-time-gräns.",
    );
  }

  const completeMetricCoverage =
    input.interpretation.interpretations.length === input.context.claims.length &&
    input.interpretation.interpretations.every(
      (claim, index) => claim.metric === input.context.claims[index]?.metric,
    );
  if (!completeMetricCoverage) {
    blockers.push(
      "Historiktolkningen måste täcka exakt alla verifierat ready historikmått i kanonisk ordning; cherry-picking är inte tillåtet.",
    );
  }

  const numericGrounding = input.interpretation.interpretations.every(
    (interpreted, index) => {
      const claim = input.context.claims[index];
      return Boolean(
        claim &&
          interpreted.metric === claim.metric &&
          interpreted.sampleSize === claim.sampleSize &&
          interpreted.observationVersionCount ===
            claim.observationAnalysisVersionIds.length &&
          interpreted.sourceCount === claim.sourceIds.length &&
          interpreted.latestAnalysisVersionId.toLowerCase() ===
            claim.latestAnalysisVersionId.toLowerCase() &&
          allStatisticsMatch(interpreted.statistics, claim.statistics),
      );
    },
  );
  if (!numericGrounding) {
    blockers.push(
      "Minst ett historiskt strukturerat värde eller versions-/källmått avviker från den verifierade claim-proveniensen.",
    );
  }

  const positionGrounding = input.interpretation.interpretations.every(
    (interpreted, index) => {
      const claim = input.context.claims[index];
      return Boolean(
        claim &&
          interpreted.positionBand ===
            expectedHistoricalPositionBand(claim.statistics.latestPercentile),
      );
    },
  );
  if (!positionGrounding) {
    blockers.push(
      "Historisk positionsklassning måste följa den deterministiska percentilindelningen.",
    );
  }

  const evidenceBreadthCalibration = input.interpretation.interpretations.every(
    (interpreted, index) => {
      const claim = input.context.claims[index];
      return Boolean(
        claim &&
          interpreted.evidenceBreadth ===
            expectedHistoricalEvidenceBreadth(claim.sampleSize),
      );
    },
  );
  if (!evidenceBreadthCalibration) {
    blockers.push(
      "Evidensbredden är för stark eller för svag i förhållande till antalet verkliga observationsdagar.",
    );
  }

  const neutralLanguage = input.interpretation.interpretations.every(
    (claim) => !FORBIDDEN_CONCLUSION_LANGUAGE.test(claim.text),
  );
  if (!neutralLanguage) {
    blockers.push(
      "Historisk percentil får inte ensam översättas till billig/dyr, köp/sälj eller annan direkt investeringsslutsats.",
    );
  }

  const samples = input.context.claims.map((claim) => claim.sampleSize);
  const checks = {
    contextBinding,
    completeMetricCoverage,
    numericGrounding,
    positionGrounding,
    evidenceBreadthCalibration,
    neutralLanguage,
  };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);

  return {
    version: DIVLAB_HISTORICAL_ANALYST_QUALITY_GATE_VERSION,
    publishable: blockers.length === 0,
    score,
    blockers,
    warnings,
    metrics: {
      readyHistoricalMetrics: input.context.claims.length,
      interpretedHistoricalMetrics: input.interpretation.interpretations.length,
      minimumSampleSize: samples.length ? Math.min(...samples) : 0,
      maximumSampleSize: samples.length ? Math.max(...samples) : 0,
    },
    checks,
  };
}
