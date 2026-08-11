import "server-only";

import {
  MODEL_PORTFOLIO_AI_BUDGET,
  estimateAiCostUsdMicros,
  evaluateAiBudget,
  generatePortfolioAiDecision,
  type ModelPortfolioAiModel,
} from "./ai";
import {
  MODEL_PORTFOLIO_AI_PROVIDER,
  type ModelPortfolioAiUsage,
} from "./ai-usage";
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
  runId?: string | null;
};

export type PortfolioDryRunResult =
  | {
      ok: true;
      decision: ModelPortfolioDecision;
      rankedCandidates: ReturnType<typeof selectDeepResearchCandidates>;
      model: string;
      estimatedCostUsdMicros: number;
      usage: ModelPortfolioAiUsage;
      executionAllowed: false;
    }
  | {
      ok: false;
      reason:
        | "no_evidence"
        | "daily_ai_budget_exhausted"
        | "event_reserve_protected";
    };

// Tool-enabled runs may use up to three model steps: bounded inspection plus a
// final structured decision. Budget the full envelope up front.
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
        `marketCapSek=${candidate.marketCapSek ?? "n/a"}`,
        `quality=${candidate.qualityScore ?? "n/a"}`,
        `valuation=${candidate.valuationScore ?? "n/a"}`,
        `revisions=${candidate.earningsRevisionScore ?? "n/a"}`,
        `dividendQuality=${candidate.dividendQualityScore ?? "n/a"}`,
        `catalyst=${candidate.catalystScore ?? "n/a"}`,
        `balanceSheet=${candidate.balanceSheetScore ?? "n/a"}`,
        compactTechnical(candidate.technicalAnalysis),
      ].join(" | "),
    )
    .join("\n");
}

function failClosedHold(evidence: readonly ModelPortfolioEvidence[]): ModelPortfolioDecision {
  return {
    action: "hold",
    symbol: null,
    exchange: null,
    instrumentName: null,
    proposedPortfolioPct: 0,
    convictionScore: 0.25,
    materialThesisBreak: false,
    thesis:
      "Det finns screenade kandidater, men AI-svaret klarade inte DivLabs evidensvalidering och får därför inte ligga till grund för en affär.",
    bearCase:
      "Ett köp eller sälj utan fullständigt spårbara evidensreferenser kan skapa ett felaktigt eller otillräckligt underbyggt portföljbeslut.",
    catalyst:
      "Ny verifierad research eller ett nytt giltigt AI-beslut krävs innan portföljen ändras.",
    valuationView:
      "Ingen värderingsslutsats används när evidensreferenserna i AI-svaret inte kan valideras.",
    keyRisks: ["Otillräckligt spårbart beslutsunderlag i den aktuella AI-körningen."],
    evidenceIds: evidence.slice(0, 3).map((item) => item.id),
    disconfirmingEvidenceIds: [],
    rationale:
      "Körningen hittade kandidater men AI-svaret refererade inte evidensen på ett validerbart sätt. Portföljen gör därför ingen affär i denna körning; HOLD används som säkerhetsbeslut tills nästa sökning ger ett fullständigt spårbart underlag.",
  };
}

function noExecutableCandidatesHold(): ModelPortfolioDecision {
  return {
    action: "hold",
    symbol: null,
    exchange: null,
    instrumentName: null,
    proposedPortfolioPct: 0,
    convictionScore: 0.5,
    materialThesisBreak: false,
    thesis:
      "Ingen ny kandidat klarade portföljens deterministiska köpbarhetsfilter för hela aktier i den här körningen.",
    bearCase:
      "Att välja en aktie som inte kan köpas med hela aktier inom kassa- och riskramarna skulle skapa ett beslut som inte går att genomföra.",
    catalyst:
      "Nästa marknads- eller portföljförändring kan göra andra kandidater köpbara inom mandatet.",
    valuationView:
      "Ingen ny värderingsslutsats används som köpbeslut när kandidaten inte är exekverbar inom portföljens regler.",
    keyRisks: ["Kapital- och positionsgränser begränsar det köpbara universet när portföljen är liten."],
    evidenceIds: [],
    disconfirmingEvidenceIds: [],
    rationale:
      "HOLD. Efter helaktie-, kassa- och riskfiltrering fanns ingen ny kandidat som kunde köpas korrekt i den här portföljen. Systemet väljer därför ingen icke-exekverbar aktie.",
  };
}

function deterministicNoTradeUsage(runId: string | null): ModelPortfolioAiUsage {
  return {
    provider: MODEL_PORTFOLIO_AI_PROVIDER,
    model: "deterministic/no-executable-candidates",
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCostUsdMicros: 0,
    costSource: "catalog_estimate",
    timestamp: new Date().toISOString(),
    runId,
  };
}

export async function runPortfolioDryRun(request: PortfolioDryRunRequest): Promise<PortfolioDryRunResult> {
  const rankedCandidates = selectDeepResearchCandidates(
    rankResearchUniverse(request.candidates, request.strategyKey),
  );
  if (!rankedCandidates.length) {
    return {
      ok: true,
      decision: noExecutableCandidatesHold(),
      rankedCandidates,
      model: "deterministic/no-executable-candidates",
      estimatedCostUsdMicros: 0,
      usage: deterministicNoTradeUsage(request.runId ?? null),
      executionAllowed: false,
    };
  }
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
    runId: request.runId ?? null,
  });

  const evidenceValidation = validateEvidenceReferences(generated.decision, request.evidence);
  const decision = evidenceValidation.ok
    ? generated.decision
    : failClosedHold(request.evidence);

  return {
    ok: true,
    decision,
    rankedCandidates,
    model: generated.model,
    estimatedCostUsdMicros: generated.estimatedCostUsdMicros,
    usage: generated.usage,
    executionAllowed: false,
  };
}
