import { z } from "zod";
import { DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION } from "./historical-analyst-context";
import { DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION } from "./historical-valuation-claim";
import { DIVLAB_HISTORICAL_VALUATION_VERSION } from "./historical-valuation";

export const DIVLAB_HISTORICAL_ANALYST_INTERPRETATION_VERSION =
  "historical-analyst-interpretation-v1" as const;

export const divLabHistoricalAnalystMetricSchema = z.enum([
  "pe",
  "priceToFcf",
  "fcfYield",
  "evToEbit",
  "evToEbitda",
]);

export const divLabHistoricalPositionBandSchema = z.enum([
  "bottom_quartile",
  "middle_half",
  "top_quartile",
]);

export const divLabHistoricalEvidenceBreadthSchema = z.enum([
  "limited",
  "moderate",
  "broad",
]);

const statisticsSchema = z
  .object({
    min: z.number().finite().positive(),
    q1: z.number().finite().positive(),
    median: z.number().finite().positive(),
    q3: z.number().finite().positive(),
    max: z.number().finite().positive(),
    latest: z.number().finite().positive(),
    latestPercentile: z.number().finite().min(0).max(1),
  })
  .superRefine((statistics, ctx) => {
    if (
      statistics.min > statistics.q1 ||
      statistics.q1 > statistics.median ||
      statistics.median > statistics.q3 ||
      statistics.q3 > statistics.max ||
      statistics.latest < statistics.min ||
      statistics.latest > statistics.max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "historical_interpretation_statistics_order_invalid",
      });
    }
  });

export const divLabHistoricalAnalystInterpretationClaimSchema = z.object({
  metric: divLabHistoricalAnalystMetricSchema,
  text: z.string().trim().min(1).max(900),
  sampleSize: z.number().int().min(4).max(500),
  observationVersionCount: z.number().int().min(4).max(500),
  sourceCount: z.number().int().min(1).max(5000),
  latestAnalysisVersionId: z.string().uuid(),
  positionBand: divLabHistoricalPositionBandSchema,
  evidenceBreadth: divLabHistoricalEvidenceBreadthSchema,
  statistics: statisticsSchema,
});

export const divLabHistoricalAnalystInterpretationSchema = z
  .object({
    version: z.literal(DIVLAB_HISTORICAL_ANALYST_INTERPRETATION_VERSION),
    contextVersion: z.literal(DIVLAB_HISTORICAL_ANALYST_CONTEXT_VERSION),
    historyVersion: z.literal(DIVLAB_HISTORICAL_VALUATION_VERSION),
    claimVersion: z.literal(DIVLAB_HISTORICAL_VALUATION_CLAIM_VERSION),
    instrument: z.object({
      symbol: z.string().trim().min(1).max(40),
      exchange: z.string().trim().min(1).max(20),
      name: z.string().trim().min(1).max(180),
    }),
    maxObservationAt: z.string().datetime({ offset: true }),
    interpretations: z
      .array(divLabHistoricalAnalystInterpretationClaimSchema)
      .min(1)
      .max(5),
  })
  .superRefine((interpretation, ctx) => {
    const metrics = interpretation.interpretations.map((claim) => claim.metric);
    if (new Set(metrics).size !== metrics.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["interpretations"],
        message: "historical_interpretation_metric_must_be_unique",
      });
    }
  });

export type DivLabHistoricalAnalystMetric = z.infer<
  typeof divLabHistoricalAnalystMetricSchema
>;
export type DivLabHistoricalPositionBand = z.infer<
  typeof divLabHistoricalPositionBandSchema
>;
export type DivLabHistoricalEvidenceBreadth = z.infer<
  typeof divLabHistoricalEvidenceBreadthSchema
>;
export type DivLabHistoricalAnalystInterpretationClaim = z.infer<
  typeof divLabHistoricalAnalystInterpretationClaimSchema
>;
export type DivLabHistoricalAnalystInterpretation = z.infer<
  typeof divLabHistoricalAnalystInterpretationSchema
>;
