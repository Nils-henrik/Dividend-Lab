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

const EXPECTED_PRIMARY_INPUT_TOKENS = 18_000;
const EXPECTED_ESCALATION_INPUT_TOKENS = 24_000;

export function estimateDryRunCallCost(useEscalationModel: boolean): number {
  const model: ModelPortfolioAiModel = useEscalationModel
    ? "openai/gpt-5.6-terra"
    : "openai/gpt-5.6-luna";
  return estimateAiCostUsdMicros({
    model,
    inputTokens: useEscalationModel ? EXPECTED_ESCALATION_INPUT_TOKENS : EXPECTED_PRIMARY_INPUT_TOKENS,
    outputTokens: MODEL_PORTFOLIO_AI_BUDGET.maxOutputTokensPerCall,
  });
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
