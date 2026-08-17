import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModelPortfolioDecision, ModelPortfolioEvidence } from "./decision";
import type { ModelPortfolioAiUsage } from "./ai-usage";
import { MODEL_PORTFOLIO_AI_PROVIDER } from "./ai-usage";
import { buildInvestorFacingDecisionRationale } from "./decision-narrative";
import { canonicalizeInstrumentSymbol } from "./instrument-symbol";
import type {
  ResearchCandidate,
  ResearchMarketCapSegment,
  ResearchRecoverySetup,
} from "./research";

export const MODEL_PORTFOLIO_PROMPT_VERSION = "portfolio-manager-tools-v3" as const;
export const MODEL_PORTFOLIO_MODEL_PROVIDER = MODEL_PORTFOLIO_AI_PROVIDER;
const MODEL_PORTFOLIO_RATIONALE_MAX_CHARS = 2000;

/**
 * The audit layer only requires the long-standing candidate score contract.
 * New ranking diagnostics are optional here so historical fixtures and stored
 * candidate snapshots remain readable while live rankResearchUniverse output
 * can carry the richer recovery metadata.
 */
export type DecisionAuditCandidate = ResearchCandidate & {
  deterministicScore: number;
  reasons: readonly string[];
  marketCapSegment?: ResearchMarketCapSegment;
  recoverySetup?: ResearchRecoverySetup;
};

export type DecisionEvidenceValidationAudit = {
  ok: boolean;
  reason: "unknown_evidence" | null;
  repairedReferences: readonly { from: string; to: string }[];
  unknownEvidenceIds: readonly string[];
};

export type DecisionAuditInput = {
  runId: string;
  portfolioId: string;
  strategyKey: string;
  decision: ModelPortfolioDecision;
  generatedDecision?: ModelPortfolioDecision;
  evidenceValidation?: DecisionEvidenceValidationAudit;
  evidence: readonly ModelPortfolioEvidence[];
  rankedCandidates: readonly DecisionAuditCandidate[];
  modelName: string;
  estimatedCostUsdMicros: number;
  usage: ModelPortfolioAiUsage;
  portfolioSnapshot: string;
  executionAllowed: boolean;
  researchSummary?: string;
  /** Internal/admin diagnostics only; never prepended to public Senaste beslut copy. */
  operationalSummary?: string;
};

export type DecisionAuditRow = {
  portfolio_id: string;
  run_id: string;
  decision_type: "hold" | "buy" | "sell";
  status: "skipped" | "proposed";
  instrument_symbol: string | null;
  exchange: string | null;
  instrument_name: string | null;
  rationale: string;
  model_provider: typeof MODEL_PORTFOLIO_MODEL_PROVIDER;
  model_name: string;
  prompt_version: typeof MODEL_PORTFOLIO_PROMPT_VERSION;
  market_data_as_of: string | null;
  evidence: ModelPortfolioEvidence[];
  input_snapshot: Record<string, unknown>;
};

function databaseDecisionType(action: ModelPortfolioDecision["action"]): "hold" | "buy" | "sell" {
  // The settlement planner treats buy as the only buy-side action; trim and
  // rebalance are reductions on the sell side. The DB audit contract only stores
  // buy/sell/hold, while input_snapshot.original_action preserves the final action.
  if (action === "trim" || action === "rebalance") return "sell";
  return action;
}

function databaseRationale(value: string): string {
  // PostgreSQL char_length counts Unicode characters, while String#slice counts
  // UTF-16 code units. Array.from keeps this guard aligned with the DB <= 2000
  // character check and avoids cutting a surrogate pair in half.
  return Array.from(value).slice(0, MODEL_PORTFOLIO_RATIONALE_MAX_CHARS).join("");
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

function candidateAuditSnapshot(candidates: readonly DecisionAuditCandidate[]) {
  return candidates.slice(0, 6).map((candidate) => ({
    symbol: candidate.symbol,
    exchange: candidate.exchange,
    deterministicScore: candidate.deterministicScore,
    reasons: candidate.reasons,
    marketCapSegment: candidate.marketCapSegment ?? null,
    recoverySetup: candidate.recoverySetup ?? null,
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

function serializedDecision(decision: ModelPortfolioDecision) {
  return {
    action: decision.action,
    symbol: decision.symbol,
    exchange: decision.exchange,
    instrument_name: decision.instrumentName,
    proposed_portfolio_pct: decision.proposedPortfolioPct,
    conviction_score: decision.convictionScore,
    material_thesis_break: decision.materialThesisBreak,
    thesis: decision.thesis,
    bear_case: decision.bearCase,
    catalyst: decision.catalyst,
    valuation_view: decision.valuationView,
    key_risks: decision.keyRisks,
    evidence_ids: decision.evidenceIds,
    disconfirming_evidence_ids: decision.disconfirmingEvidenceIds,
    rationale: decision.rationale,
  };
}

export function buildDecisionAuditRow(input: DecisionAuditInput): DecisionAuditRow {
  if (!input.runId.trim() || !input.portfolioId.trim()) throw new Error("invalid_decision_audit_identity");
  const researchSummary = input.researchSummary?.trim() ?? "";
  const operationalSummary = input.operationalSummary?.trim() ?? "";
  const rationale = researchSummary
    ? buildInvestorFacingDecisionRationale({
        researchSummary,
        decision: input.decision,
      })
    : input.decision.rationale;
  const canonicalInstrument = input.decision.symbol && input.decision.exchange
    ? canonicalizeInstrumentSymbol(input.decision.symbol, input.decision.exchange)
    : null;
  const generatedDecision = input.generatedDecision ?? input.decision;
  const evidenceValidation = input.evidenceValidation ?? {
    ok: true,
    reason: null,
    repairedReferences: [],
    unknownEvidenceIds: [],
  };

  return {
    portfolio_id: input.portfolioId,
    run_id: input.runId,
    decision_type: databaseDecisionType(input.decision.action),
    status: input.decision.action === "hold" ? "skipped" : "proposed",
    instrument_symbol: canonicalInstrument?.baseSymbol ?? null,
    exchange: canonicalInstrument?.exchange ?? null,
    instrument_name: input.decision.instrumentName,
    rationale: databaseRationale(rationale),
    model_provider: MODEL_PORTFOLIO_MODEL_PROVIDER,
    model_name: input.modelName,
    prompt_version: MODEL_PORTFOLIO_PROMPT_VERSION,
    market_data_as_of: latestMarketDataTimestamp(input.evidence),
    evidence: referencedEvidence(input.decision, input.evidence),
    input_snapshot: {
      audit_version: 4,
      strategy_key: input.strategyKey,
      execution_allowed_at_decision_time: input.executionAllowed,
      research_summary: researchSummary || null,
      operational_summary: operationalSummary || null,
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
      ai_generated_decision: serializedDecision(generatedDecision),
      evidence_validation: {
        ok: evidenceValidation.ok,
        reason: evidenceValidation.reason,
        repaired_references: evidenceValidation.repairedReferences,
        unknown_evidence_ids: evidenceValidation.unknownEvidenceIds,
      },
      portfolio_snapshot: input.portfolioSnapshot,
      ranked_candidates: candidateAuditSnapshot(input.rankedCandidates),
      ai_usage: {
        provider: input.usage.provider,
        model: input.usage.model,
        input_tokens: input.usage.inputTokens,
        cached_input_tokens: input.usage.cachedInputTokens,
        output_tokens: input.usage.outputTokens,
        total_tokens: input.usage.totalTokens,
        estimated_cost_usd_micros: input.usage.estimatedCostUsdMicros,
        estimated_cost_usd: input.usage.estimatedCostUsdMicros / 1_000_000,
        cost_source: input.usage.costSource,
        timestamp: input.usage.timestamp,
        run_id: input.usage.runId ?? input.runId,
      },
    },
  };
}

export async function persistDecisionAuditBatch(input: {
  supabase: SupabaseClient;
  rows: readonly DecisionAuditRow[];
}): Promise<Map<string, string>> {
  if (!input.rows.length) return new Map();
  const { data, error } = await input.supabase
    .from("model_portfolio_decisions")
    .insert([...input.rows])
    .select("id,portfolio_id");
  if (error || !data || data.length !== input.rows.length) {
    throw new Error(`decision_audit_batch_insert_failed:${error?.code ?? "incomplete"}`);
  }
  return new Map(data.map((row) => [String(row.portfolio_id), String(row.id)]));
}
