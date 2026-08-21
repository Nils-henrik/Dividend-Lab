import {
  assertHistoricalAnalystContextMatches,
  DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION,
  type HistoricalAnalystContext,
} from "./historical-analyst-context";
import {
  expectedHistoricalEvidenceBreadth,
  expectedHistoricalPositionBand,
  validateHistoricalAnalystInterpretation,
} from "./historical-analyst-contract";
import {
  DIVLAB_HISTORICAL_ANALYST_INTERPRETATION_VERSION,
  type DivLabHistoricalAnalystInterpretation,
} from "./historical-analyst-schema";
import { DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION } from "./historical-valuation-claim";
import {
  DIVLAB_HISTORICAL_VALUATION_VERSION,
  type HistoricalValuationAnalysis,
  type HistoricalValuationMetric,
} from "./historical-valuation";

const METRIC_LABELS: Record<HistoricalValuationMetric, string> = {
  pe: "P/E",
  priceToFcf: "P/FCF",
  fcfYield: "FCF-yield",
  evToEbit: "EV/EBIT",
  evToEbitda: "EV/EBITDA",
};

const POSITION_LABELS = {
  bottom_quartile: "den lägre kvartilen",
  middle_half: "mittenhalvan",
  top_quartile: "den övre kvartilen",
} as const;

/**
 * Creates a deterministic, neutral historical appendix from already validated
 * point-in-time context. No model call occurs here and the text intentionally
 * avoids translating a historical percentile into cheap/expensive or a trading
 * recommendation.
 */
export function composeHistoricalAnalystInterpretation(input: {
  history: HistoricalValuationAnalysis;
  context: HistoricalAnalystContext;
}): DivLabHistoricalAnalystInterpretation {
  assertHistoricalAnalystContextMatches({
    context: input.context,
    history: input.history,
  });

  const interpretation: DivLabHistoricalAnalystInterpretation = {
    version: DIVLAB_HISTORICAL_ANALYST_INTERPRETATION_VERSION,
    contextVersion: DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION,
    historyVersion: DIVLAB_HISTORICAL_VALUATION_VERSION,
    claimVersion: DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION,
    instrument: { ...input.context.instrument },
    maxObservationAt: input.context.maxObservationAt,
    interpretations: input.context.claims.map((claim) => {
      const positionBand = expectedHistoricalPositionBand(
        claim.statistics.latestPercentile,
      );
      const evidenceBreadth = expectedHistoricalEvidenceBreadth(claim.sampleSize);
      const metricLabel = METRIC_LABELS[claim.metric];
      const positionLabel = POSITION_LABELS[positionBand];

      return {
        metric: claim.metric,
        text: `${metricLabel} ligger i ${positionLabel} av DivLabs verifierade historiska observationer, baserat på ${claim.sampleSize} separata observationsdagar. Detta är beskrivande historisk kontext, inte en investeringsrekommendation.`,
        sampleSize: claim.sampleSize,
        observationVersionCount: claim.observationAnalysisVersionIds.length,
        sourceCount: claim.sourceIds.length,
        latestAnalysisVersionId: claim.latestAnalysisVersionId,
        positionBand,
        evidenceBreadth,
        statistics: { ...claim.statistics },
      };
    }),
  };

  validateHistoricalAnalystInterpretation({
    history: input.history,
    context: input.context,
    interpretation,
  });

  return interpretation;
}
