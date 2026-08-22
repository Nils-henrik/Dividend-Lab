import "server-only";

import {
  MODEL_PORTFOLIO_AI_MODELS,
  estimateAiCostUsdMicros,
  type ModelPortfolioAiModel,
} from "@/lib/model-portfolios/engine/ai";
import type { DivLabAnalysisEngine } from "./analysis-engine-dispatch";
import type { DivLabAnalysisDepth } from "./analysis-entitlement";
import { DIVLAB_ANALYST_AI_BUDGET } from "./analyst";
import { DIVLAB_BANK_ANALYST_AI_BUDGET } from "./bank-analyst-prompt";
import { DIVLAB_FINANCIAL_SPECIALIST_ANALYST_AI_BUDGET } from "./financial-specialist-analyst";

/**
 * Cost-projection contract v1.
 *
 * This is a conservative admission envelope, not expected COGS and not a user
 * price. The future worker may reserve this amount before the first paid model
 * call, then reconcile observed usage without lowering the hard-limit reserve.
 *
 * Input-side reasoning:
 * - dynamic Analysis prompts are source-bounded in the corresponding engines;
 * - v1 reserves for at most 100k UTF-16 code units of local system+prompt text;
 * - four UTF-8 bytes per UTF-16 code unit is a deliberately conservative text
 *   expansion ceiling;
 * - an additional 32k input-token allowance is held for output-schema / gateway
 *   protocol framing that is not represented by the local prompt string.
 *
 * The repository contract test verifies that the currently bounded dynamic
 * prompt components plus their complete source-file text remain below the
 * 100k local-text envelope. If an engine grows beyond it, the test must fail
 * and this profile version must be reviewed before a worker can use it.
 */
export const DIVLAB_ANALYSIS_COST_PROJECTION_V1 = {
  version: "analysis-cost-projection-v1",
  maxLocalTextCharsPerCall: 100_000,
  utf8BytesPerUtf16CodeUnitCeiling: 4,
  providerProtocolInputTokenAllowance: 32_000,
  primaryFirstRequired: true,
} as const;

export const DIVLAB_ANALYSIS_INPUT_TOKEN_CEILING_PER_CALL =
  DIVLAB_ANALYSIS_COST_PROJECTION_V1.maxLocalTextCharsPerCall *
    DIVLAB_ANALYSIS_COST_PROJECTION_V1.utf8BytesPerUtf16CodeUnitCeiling +
  DIVLAB_ANALYSIS_COST_PROJECTION_V1.providerProtocolInputTokenAllowance;

export type DivLabAnalysisProjectedAttempt = Readonly<{
  purpose: "primary" | "structured_repair" | "quality_repair";
  model: ModelPortfolioAiModel;
  inputTokenCeiling: number;
  outputTokenCeiling: number;
  projectedCostUsdMicros: number;
}>;

export type DivLabAnalysisCostProjection =
  | Readonly<{
      ok: true;
      depth: "deep";
      engine: DivLabAnalysisEngine;
      profile: string;
      primaryFirstRequired: true;
      attempts: readonly DivLabAnalysisProjectedAttempt[];
      projectedCostUsdMicros: number;
      accountingMode: "fail_closed_ceiling";
    }>
  | Readonly<{
      ok: false;
      depth: DivLabAnalysisDepth;
      engine: DivLabAnalysisEngine;
      reason: "light_engine_not_implemented";
    }>;

function projectedAttempt(input: {
  purpose: DivLabAnalysisProjectedAttempt["purpose"];
  model: ModelPortfolioAiModel;
  outputTokenCeiling: number;
}): DivLabAnalysisProjectedAttempt {
  const inputTokenCeiling = DIVLAB_ANALYSIS_INPUT_TOKEN_CEILING_PER_CALL;
  return {
    purpose: input.purpose,
    model: input.model,
    inputTokenCeiling,
    outputTokenCeiling: input.outputTokenCeiling,
    projectedCostUsdMicros: estimateAiCostUsdMicros({
      model: input.model,
      inputTokens: inputTokenCeiling,
      outputTokens: input.outputTokenCeiling,
    }),
  };
}

function sumProjectedCost(attempts: readonly DivLabAnalysisProjectedAttempt[]): number {
  return attempts.reduce((sum, attempt) => sum + attempt.projectedCostUsdMicros, 0);
}

function deepAttempts(engine: DivLabAnalysisEngine): readonly DivLabAnalysisProjectedAttempt[] {
  if (engine === "bank") {
    return [
      projectedAttempt({
        purpose: "primary",
        model: MODEL_PORTFOLIO_AI_MODELS.primary,
        outputTokenCeiling: DIVLAB_BANK_ANALYST_AI_BUDGET.maxOutputTokens,
      }),
    ];
  }

  if (engine === "financial_specialist") {
    return [
      projectedAttempt({
        purpose: "primary",
        model: MODEL_PORTFOLIO_AI_MODELS.primary,
        outputTokenCeiling:
          DIVLAB_FINANCIAL_SPECIALIST_ANALYST_AI_BUDGET.maxOutputTokens,
      }),
      projectedAttempt({
        purpose: "structured_repair",
        model: MODEL_PORTFOLIO_AI_MODELS.escalation,
        outputTokenCeiling:
          DIVLAB_FINANCIAL_SPECIALIST_ANALYST_AI_BUDGET.retryMaxOutputTokens,
      }),
    ];
  }

  return [
    projectedAttempt({
      purpose: "primary",
      model: MODEL_PORTFOLIO_AI_MODELS.primary,
      outputTokenCeiling: DIVLAB_ANALYST_AI_BUDGET.maxOutputTokens,
    }),
    projectedAttempt({
      purpose: "structured_repair",
      model: MODEL_PORTFOLIO_AI_MODELS.escalation,
      outputTokenCeiling: DIVLAB_ANALYST_AI_BUDGET.retryMaxOutputTokens,
    }),
    projectedAttempt({
      purpose: "quality_repair",
      model: MODEL_PORTFOLIO_AI_MODELS.escalation,
      // The quality-repair service currently has its own 12k cap. The static
      // contract test intentionally pins that source value to this profile.
      outputTokenCeiling: 12_000,
    }),
  ];
}

export function projectDivLabAnalysisAiCost(input: {
  depth: DivLabAnalysisDepth;
  engine: DivLabAnalysisEngine;
}): DivLabAnalysisCostProjection {
  if (input.depth === "light") {
    return {
      ok: false,
      depth: input.depth,
      engine: input.engine,
      reason: "light_engine_not_implemented",
    };
  }

  const attempts = deepAttempts(input.engine);
  return {
    ok: true,
    depth: "deep",
    engine: input.engine,
    profile: `${DIVLAB_ANALYSIS_COST_PROJECTION_V1.version}.${input.engine}`,
    primaryFirstRequired: true,
    attempts,
    projectedCostUsdMicros: sumProjectedCost(attempts),
    accountingMode: "fail_closed_ceiling",
  };
}
