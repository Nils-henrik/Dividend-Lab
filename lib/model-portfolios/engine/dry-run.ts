import "server-only";

import {
  MODEL_PORTFOLIO_AI_BUDGET,
  estimateAiCostUsdMicros,
  evaluateAiBudget,
  generatePortfolioAiDecision,
  type ModelPortfolioAiModel,
} from "./ai";
import { validateEvidenceReferences, type ModelPortfolioDecision, type ModelPortfolioEvidence } from "./decision";
import type { ModelPortfolioStrategyKey } from "./policy";
import { rankResearchUniverse, selectDeepResearchCandidates, type ResearchCandidate } from "./research";
import type { TechnicalAnalysisSnapshot } from "./technical-analysis";

export type PortfolioDryRunRequest = {
  strategyKey: ModelPortfolioStrategyKey;
  runKind: "primary" | "event";
  portfolioSnapshot: string;
  candidates: readonly ResearchCandidate[];
  evidence: readonly ModelPortfolioEvidence[];
  spentTodayUsdMicros: number;
  useEscalationModel?: boolean;
};

export type PortfolioDryRunResult =
  | {
      ok: true;
      decision: ModelPortfolioDecision;
      rankedCandidates: ReturnType<typeof selectDeepResearchCandidates>;
      model: ModelPortfolioAiModel;
      estimatedCostUsdMicros: number;
      usage: { inputTokens: number; outputTokens: number };
      executionAllowed: false;
    }
  | {
      ok: false;
      reason:
        | "no_candidates"
        | "no_evidence"
        | "daily_ai_budget_exhausted"
        | "event_reserve_protected"
        | "invalid_evidence_references";
    };

// Tool-enabled runs may use two model steps: one bounded tool-inspection step
// and one final structured-decision step. Budget the full envelope up front.
const EXPECTED_PRIMARY_INPUT_TOKENS_PER_STEP = 18_000;
const EXPECTED_ESCALATION_INPUT_TOKENS_PER_STEP = 24_000;

export function estimateDryRunCallCost(useEscalationModel: boolean): number {
  const model: ModelPortfolioAiModel = useEscalationModel
    ? "openai/gpt-5.6-terra"
    : "openai/gpt-5.6-luna";
  const maxSteps = MODEL_PORTFOLIO_AI_BUDGET.maxCallsPerPortfolioRun;
  return estimateAiCostUsdMicros({
    model,
    inputTokens:
      (useEscalationModel
        ? EXPECTED_ESCALATION_INPUT_TOKENS_PER_STEP
        : EXPECTED_PRIMARY_INPUT_TOKENS_PER_STEP) * maxSteps,
    outputTokens: MODEL_PORTFOLIO_AI_BUDGET.maxOutputTokensPerCall * maxSteps,
  });
}

function formatNumber(value: number | undefined, digits = 4): string {
  return Number.isFinite(value) ? (value as number).toFixed(digits) : "n/a";
}

function compactTechnical(technical: TechnicalAnalysisSnapshot | undefined): string {
  if (!technical || technical.sessions === 0) return "technical=n/a";
  return [
    `taVersion=${technical.version}`,
    `taRegime=${technical.trend.regime}`,
    `taComposite=${formatNumber(technical.scores.composite, 3)}`,
    `taTrend=${formatNumber(technical.scores.trend, 3)}`,
    `taMomentum=${formatNumber(technical.scores.momentum, 3)}`,
    `taVolume=${formatNumber(technical.scores.volume, 3)}`,
    `taBreakout=${formatNumber(technical.scores.breakout, 3)}`,
    `taStability=${formatNumber(technical.scores.stability, 3)}`,
    `rsi14=${formatNumber(technical.momentum.rsi14, 1)}`,
    `macdHist=${formatNumber(technical.trend.macdHistogram, 4)}`,
    `adx14=${formatNumber(technical.trend.adx14, 1)}`,
    `atrPct14=${formatNumber(technical.volatility.atrPct14, 4)}`,
    `stoch14=${formatNumber(technical.momentum.stochastic14, 1)}`,
    `volRatio20=${formatNumber(technical.volume.volumeRatio20, 2)}`,
    `cmf20=${formatNumber(technical.volume.chaikinMoneyFlow20, 3)}`,
    `range55=${formatNumber(technical.levels.rangePosition55, 3)}`,
    `z20=${formatNumber(technical.meanReversion.zScore20, 2)}`,
    `drawdown252=${formatNumber(technical.volatility.maxDrawdown252, 3)}`,
    `taSignals=${technical.signals.slice(0, 5).join(" / ")}`,
  ].join(" | ");
}

function compactCandidates(candidates: ReturnType<typeof selectDeepResearchCandidates>): string {
  return candidates
    .map((candidate, index) =>
      [
        `#${index + 1} ${candidate.symbol}.${candidate.exchange}`,
        `score=${candidate.deterministicScore}`,
        `reasons=${candidate.reasons.join(", ")}`,
        `momentum20=${candidate.priceMomentum20d ?? "n/a"}`,
        `momentum60=${candidate.priceMomentum60d ?? "n/a"}`,
        `volatility20=${candidate.volatility20d ?? "n/a"}`,
        `turnoverSek=${candidate.avgDailyTurnoverSek ?? "n/a"}`,
        compactTechnical(candidate.technicalAnalysis),
      ].join(" | "),
    )
    .join("\n");
}

export async function runPortfolioDryRun(request: PortfolioDryRunRequest): Promise<PortfolioDryRunResult> {
  const rankedCandidates = selectDeepResearchCandidates(
    rankResearchUniverse(request.candidates, request.strategyKey),
  );
  if (!rankedCandidates.length) return { ok: false, reason: "no_candidates" };
  if (!request.evidence.length) return { ok: false, reason: "no_evidence" };

  const expectedCallUsdMicros = estimateDryRunCallCost(Boolean(request.useEscalationModel));
  const budget = evaluateAiBudget({
    spentTodayUsdMicros: request.spentTodayUsdMicros,
    expectedCallUsdMicros,
    runKind: request.runKind,
  });
  if (!budget.allowed) return { ok: false, reason: budget.reason };

  const generated = await generatePortfolioAiDecision({
    strategyKey: request.strategyKey,
    runKind: request.runKind,
    portfolioSnapshot: request.portfolioSnapshot,
    candidateSnapshot: compactCandidates(rankedCandidates),
    candidates: rankedCandidates,
    evidence: request.evidence,
    useEscalationModel: Boolean(request.useEscalationModel),
  });

  const evidenceValidation = validateEvidenceReferences(generated.decision, request.evidence);
  if (!evidenceValidation.ok) return { ok: false, reason: "invalid_evidence_references" };

  return {
    ok: true,
    decision: generated.decision,
    rankedCandidates,
    model: generated.model,
    estimatedCostUsdMicros: generated.estimatedCostUsdMicros,
    usage: generated.usage,
    executionAllowed: false,
  };
}
