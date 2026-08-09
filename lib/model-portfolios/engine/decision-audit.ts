import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioDecision, ModelPortfolioEvidence } from "./decision";
import type { RankedResearchCandidate } from "./research";

export const MODEL_PORTFOLIO_PROMPT_VERSION = "portfolio-manager-tools-v1" as const;
export const MODEL_PORTFOLIO_MODEL_PROVIDER = "vercel-ai-gateway" as const;

export type PersistDecisionAuditInput = {
  supabase: SupabaseClient;
  runId: string;
  portfolioId: string;
  strategyKey: string;
  decision: ModelPortfolioDecision;
  evidence: readonly ModelPortfolioEvidence[];
  rankedCandidates: readonly RankedResearchCandidate[];
  modelName: string;
  estimatedCostUsdMicros: number;
  usage: { inputTokens: number; outputTokens: number };
  portfolioSnapshot: string;
  executionAllowed: false;
};

function databaseDecisionType(action: ModelPortfolioDecision["action"]): "hold" | "buy" | "sell" | "rebalance" {
  if (action === "trim") return "rebalance";
  return action;
}

function latestMarketDataTimestamp(evidence: readonly ModelPortfolioEvidence[]): string | null {
  let latest: { ms: number; iso: string } | null = null;
  for (const item of evidence) {
    if (item.kind !== "market_data") continue;
    const ms = Date.parse(item.publishedAt);
    if (!Number.isFinite(ms)) continue;
    if (!latest || ms > latest.ms) latest = { ms, iso: new Date(ms).toISOString() };
  }
  return latest?.iso ?? null;
}

function candidateAuditSnapshot(candidates: readonly RankedResearchCandidate[]) {
  return candidates.slice(0, 6).map((candidate) => ({
    symbol: candidate.symbol,
    exchange: candidate.exchange,
    deterministicScore: candidate.deterministicScore,
    reasons: candidate.reasons,
    marketCapSek: candidate.marketCapSek ?? null,
    avgDailyTurnoverSek: candidate.avgDailyTurnoverSek ?? null,
    priceMomentum20d: candidate.priceMomentum20d ?? null,
    priceMomentum60d: candidate.priceMomentum60d ?? null,
    volatility20d: candidate.volatility20d ?? null,
    qualityScore: candidate.qualityScore ?? null,
    valuationScore: candidate.valuationScore ?? null,
    earningsRevisionScore: candidate.earningsRevisionScore ?? null,
    dividendQualityScore: candidate.dividendQualityScore ?? null,
    catalystScore: candidate.catalystScore ?? null,
    balanceSheetScore: candidate.balanceSheetScore ?? null,
    technicalAnalysis: candidate.technicalAnalysis ?? null,
  }));
}

function referencedEvidence(
  decision: ModelPortfolioDecision,
  evidence: readonly ModelPortfolioEvidence[],
): ModelPortfolioEvidence[] {
  const ids = new Set([...decision.evidenceIds, ...decision.disconfirmingEvidenceIds]);
  return evidence.filter((item) => ids.has(item.id));
}

export async function persistDecisionAudit(input: PersistDecisionAuditInput): Promise<string> {
  if (!input.runId.trim() || !input.portfolioId.trim()) throw new Error("invalid_decision_audit_identity");

  const status = input.decision.action === "hold" ? "skipped" : "proposed";
  const marketDataAsOf = latestMarketDataTimestamp(input.evidence);
  const evidence = referencedEvidence(input.decision, input.evidence);

  const { data, error } = await input.supabase
    .from("model_portfolio_decisions")
    .insert({
      portfolio_id: input.portfolioId,
      run_id: input.runId,
      decision_type: databaseDecisionType(input.decision.action),
      status,
      instrument_symbol: input.decision.symbol,
      exchange: input.decision.exchange,
      instrument_name: input.decision.instrumentName,
      rationale: input.decision.rationale,
      model_provider: MODEL_PORTFOLIO_MODEL_PROVIDER,
      model_name: input.modelName,
      prompt_version: MODEL_PORTFOLIO_PROMPT_VERSION,
      market_data_as_of: marketDataAsOf,
      evidence,
      input_snapshot: {
        audit_version: 1,
        strategy_key: input.strategyKey,
        execution_allowed_at_decision_time: input.executionAllowed,
        original_action: input.decision.action,
        proposed_portfolio_pct: input.decision.proposedPortfolioPct,
        conviction_score: input.decision.convictionScore,
        material_thesis_break: input.decision.materialThesisBreak,
        thesis: input.decision.thesis,
        bear_case: input.decision.bearCase,
        catalyst: input.decision.catalyst,
        valuation_view: input.decision.valuationView,
        key_risks: input.decision.keyRisks,
        evidence_ids: input.decision.evidenceIds,
        disconfirming_evidence_ids: input.decision.disconfirmingEvidenceIds,
        portfolio_snapshot: input.portfolioSnapshot,
        ranked_candidates: candidateAuditSnapshot(input.rankedCandidates),
        ai_usage: {
          input_tokens: input.usage.inputTokens,
          output_tokens: input.usage.outputTokens,
          estimated_cost_usd_micros: input.estimatedCostUsdMicros,
        },
      },
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(`decision_audit_insert_failed:${error?.code ?? "unknown"}`);
  }
  return String(data.id);
}
