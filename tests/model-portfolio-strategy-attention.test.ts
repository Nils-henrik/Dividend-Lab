import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DIVBRAIN_BENCHMARK_LIVE_MAX_CASES } from "../lib/divbrain/server/providers/candidates";
import { DIVBRAIN_BENCHMARK_CASES } from "../lib/divbrain/server/benchmark/cases";
import { evaluateDivBrainGuardrails } from "../lib/divbrain/server/guardrails";
import { getDivBrainPolicyBlock } from "../lib/divbrain/server/policy";
import {
  DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV,
  DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_VERSION,
} from "../lib/investment-analysis/doctrine";
import { buildInvestorFacingResearchSummary } from "../lib/model-portfolios/engine/decision-narrative";
import {
  MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT,
  MODEL_PORTFOLIO_EODHD_PASS_LIMITS,
} from "../lib/model-portfolios/engine/eodhd-budget";
import { buildModelPortfolioSystemMandate } from "../lib/model-portfolios/engine/mandates";
import { RESEARCH_BUDGET, type ResearchCandidate } from "../lib/model-portfolios/engine/research";
import {
  ATTENTION_BUDGET,
  evaluateNewEntryAttention,
  selectPortfolioAttentionCandidates,
  type AttentionCandidate,
} from "../lib/model-portfolios/engine/strategy-attention";
import type { TechnicalAnalysisSnapshot } from "../lib/model-portfolios/engine/technical-analysis";

const base = {
  exchange: "ST",
  marketCapSek: 40_000_000_000,
  avgDailyTurnoverSek: 80_000_000,
  qualityScore: 0.7,
  valuationScore: 0.62,
  earningsRevisionScore: 0.6,
  catalystScore: 0.5,
  balanceSheetScore: 0.7,
  volatility20d: 0.22,
  priceMomentum20d: 0.03,
  priceMomentum60d: 0.06,
} satisfies Omit<ResearchCandidate, "symbol">;

function technical(input: {
  distanceFromHigh?: number;
  regime?: TechnicalAnalysisSnapshot["trend"]["regime"];
  trend?: number;
  momentum?: number;
  volume?: number;
  breakout?: number;
  stability?: number;
  composite?: number;
  rsi14?: number;
} = {}): TechnicalAnalysisSnapshot {
  return {
    version: "ta-v1",
    asOf: "2026-08-13",
    sessions: 252,
    toolsUsed: [],
    trend: { regime: input.regime ?? "uptrend" },
    momentum: { rsi14: input.rsi14 },
    volatility: {},
    volume: {},
    levels: { distanceFrom52WeekHighPct: input.distanceFromHigh ?? -0.08 },
    meanReversion: {},
    patterns: { doji: false, hammer: false, bullishEngulfing: false, bearishEngulfing: false },
    scores: {
      trend: input.trend ?? 0.68,
      momentum: input.momentum ?? 0.6,
      volume: input.volume ?? 0.58,
      breakout: input.breakout ?? 0.55,
      meanReversion: 0.55,
      stability: input.stability ?? 0.7,
      composite: input.composite ?? 0.64,
    },
    signals: [],
  };
}

const MIXED_UNIVERSE: ResearchCandidate[] = [
  {
    ...base,
    symbol: "QUALITY",
    marketCapSek: 120_000_000_000,
    qualityScore: 0.93,
    balanceSheetScore: 0.91,
    valuationScore: 0.72,
    volatility20d: 0.12,
    catalystScore: 0.34,
    earningsRevisionScore: 0.56,
    technicalAnalysis: technical({ stability: 0.88, trend: 0.7, distanceFromHigh: -0.06 }),
  },
  {
    ...base,
    symbol: "SPEC",
    marketCapSek: 8_000_000_000,
    qualityScore: 0.48,
    balanceSheetScore: 0.42,
    valuationScore: 0.4,
    volatility20d: 0.56,
    catalystScore: 0.96,
    earningsRevisionScore: 0.4,
    priceMomentum20d: 0.19,
    technicalAnalysis: technical({
      rsi14: 78,
      breakout: 0.88,
      momentum: 0.9,
      volume: 0.86,
      trend: 0.84,
      distanceFromHigh: -0.02,
    }),
  },
  {
    ...base,
    symbol: "RECOVERY",
    marketCapSek: 9_000_000_000,
    qualityScore: 0.82,
    balanceSheetScore: 0.8,
    valuationScore: 0.78,
    earningsRevisionScore: 0.76,
    catalystScore: 0.84,
    priceMomentum20d: 0.05,
    technicalAnalysis: technical({
      distanceFromHigh: -0.3,
      trend: 0.66,
      momentum: 0.64,
      volume: 0.68,
      breakout: 0.6,
      composite: 0.65,
    }),
  },
  {
    ...base,
    symbol: "KNIFE",
    marketCapSek: 25_000_000_000,
    qualityScore: 0.8,
    balanceSheetScore: 0.76,
    valuationScore: 0.74,
    earningsRevisionScore: 0.42,
    catalystScore: 0.3,
    priceMomentum20d: -0.18,
    priceMomentum60d: -0.26,
    technicalAnalysis: technical({
      distanceFromHigh: -0.44,
      regime: "strong_downtrend",
      trend: 0.16,
      momentum: 0.18,
      volume: 0.28,
      breakout: 0.16,
      composite: 0.2,
    }),
  },
  {
    ...base,
    symbol: "SAGA-D",
    marketCapSek: 18_000_000_000,
    qualityScore: 0.68,
    balanceSheetScore: 0.66,
    valuationScore: 0.64,
    dividendQualityScore: 0.74,
    catalystScore: 0.32,
    technicalAnalysis: technical({ stability: 0.72, distanceFromHigh: -0.07 }),
  },
  {
    ...base,
    symbol: "DIVORD",
    marketCapSek: 55_000_000_000,
    qualityScore: 0.68,
    balanceSheetScore: 0.66,
    valuationScore: 0.64,
    dividendQualityScore: 0.74,
    catalystScore: 0.32,
    technicalAnalysis: technical({ stability: 0.72, distanceFromHigh: -0.07 }),
  },
  {
    ...base,
    symbol: "MEGA",
    exchange: "US",
    marketCapSek: 320_000_000_000,
    qualityScore: 0.92,
    balanceSheetScore: 0.9,
    valuationScore: 0.7,
    earningsRevisionScore: 0.5,
    catalystScore: 0.38,
    volatility20d: 0.16,
    technicalAnalysis: technical({ stability: 0.84, trend: 0.62, distanceFromHigh: -0.05 }),
  },
  {
    ...base,
    symbol: "GARP",
    marketCapSek: 95_000_000_000,
    qualityScore: 0.64,
    valuationScore: 0.7,
    earningsRevisionScore: 0.71,
    catalystScore: 0.57,
    balanceSheetScore: 0.63,
    volatility20d: 0.24,
    technicalAnalysis: technical({ trend: 0.64, distanceFromHigh: -0.09 }),
  },
];

function newEntrySymbols(candidates: readonly AttentionCandidate[]): string[] {
  return candidates
    .filter((item) => item.attentionEligibility === "new_entry")
    .map((item) => item.symbol);
}

function allSymbols(candidates: readonly AttentionCandidate[]): string[] {
  return candidates.map((item) => item.symbol);
}

function select(strategyKey: "conservative" | "balanced" | "high_risk" | "dividend", held: string[] = []) {
  return selectPortfolioAttentionCandidates({
    universe: MIXED_UNIVERSE,
    strategyKey,
    heldInstruments: held.map((symbol) => ({
      symbol,
      exchange: MIXED_UNIVERSE.find((item) => item.symbol === symbol)?.exchange ?? "ST",
    })),
  });
}

describe("model portfolio strategy attention", () => {
  it("1. produces deterministically different conservative/high-risk/dividend new-entry sets", () => {
    const conservative = newEntrySymbols(select("conservative").candidates);
    const highRisk = newEntrySymbols(select("high_risk").candidates);
    const dividend = newEntrySymbols(select("dividend").candidates);

    assert.notDeepEqual(conservative, highRisk);
    assert.notDeepEqual(conservative, dividend);
    assert.notDeepEqual(highRisk, dividend);
    assert.ok(conservative.includes("QUALITY"));
    assert.ok(highRisk.includes("RECOVERY"));
    assert.ok(dividend.includes("SAGA-D"));
  });

  it("2. keeps a held out-of-profile candidate for monitoring", () => {
    const attention = select("conservative", ["SPEC"]);
    const held = attention.candidates.find((item) => item.symbol === "SPEC");
    assert.ok(held);
    assert.equal(held.attentionEligibility, "held_for_monitoring");
    assert.deepEqual([...held.attentionReasons], ["held_for_monitoring"]);
  });

  it("3. can reject a non-held out-of-profile candidate", () => {
    const attention = select("conservative");
    assert.equal(evaluateNewEntryAttention(MIXED_UNIVERSE[1]!, "conservative").eligible, false);
    assert.ok(!newEntrySymbols(attention.candidates).includes("SPEC"));
    assert.ok(attention.rejectedNewEntries.some((item) => item.symbol === "SPEC"));
  });

  it("4. keeps non-income names out of the dividend new-entry set", () => {
    const dividend = select("dividend");
    const entries = newEntrySymbols(dividend.candidates);
    assert.deepEqual(entries.sort(), ["DIVORD", "SAGA-D"]);
    assert.ok(dividend.rejectedNewEntries.some((item) => item.symbol === "QUALITY" && item.reasons.includes("rejected_non_income")));
    assert.ok(dividend.rejectedNewEntries.some((item) => item.symbol === "MEGA" && item.reasons.includes("rejected_non_income")));
  });

  it("5. ranks a pref/D candidate above an otherwise similar ordinary dividend name", () => {
    const dividend = select("dividend");
    const entries = dividend.candidates.filter((item) => item.attentionEligibility === "new_entry");
    assert.equal(entries[0]?.symbol, "SAGA-D");
    assert.ok(entries.some((item) => item.symbol === "DIVORD"));
    assert.ok((entries[0]?.deterministicScore ?? 0) > (entries.find((item) => item.symbol === "DIVORD")?.deterministicScore ?? 1));
    assert.ok(evaluateNewEntryAttention(MIXED_UNIVERSE[4]!, "dividend").reasons.includes("pref_d_priority"));
  });

  it("6. lets a high-risk small/mid catalyst-recovery fixture beat a generic mega-cap", () => {
    const highRisk = select("high_risk");
    const entries = newEntrySymbols(highRisk.candidates);
    assert.ok(entries.includes("RECOVERY"));
    assert.ok(!entries.includes("MEGA"));
    assert.ok(highRisk.rejectedNewEntries.some((item) => item.symbol === "MEGA" && item.reasons.includes("rejected_generic_large_cap")));
    assert.ok(highRisk.candidates.find((item) => item.symbol === "RECOVERY")?.attentionReasons.includes("small_mid_preferred"));
  });

  it("7. rejects or deprioritizes a high-risk falling knife for new entry", () => {
    const decision = evaluateNewEntryAttention(MIXED_UNIVERSE[3]!, "high_risk");
    assert.equal(decision.eligible, false);
    assert.ok(decision.reasons.includes("rejected_falling_knife"));
    assert.ok(!newEntrySymbols(select("high_risk").candidates).includes("KNIFE"));
  });

  it("8. lets conservative prefer low-vol quality over high-vol speculation", () => {
    const conservative = select("conservative");
    const entries = newEntrySymbols(conservative.candidates);
    assert.ok(entries.includes("QUALITY"));
    assert.ok(!entries.includes("SPEC"));
    assert.equal(entries[0], "QUALITY");
  });

  it("9. lets balanced accept a GARP case between the conservative and high-risk extremes", () => {
    assert.equal(evaluateNewEntryAttention(MIXED_UNIVERSE[7]!, "conservative").eligible, false);
    assert.equal(evaluateNewEntryAttention(MIXED_UNIVERSE[7]!, "high_risk").eligible, false);
    assert.equal(evaluateNewEntryAttention(MIXED_UNIVERSE[7]!, "balanced").eligible, true);
    assert.ok(newEntrySymbols(select("balanced").candidates).includes("GARP"));
  });

  it("10. is deterministic and bounded", () => {
    const first = select("high_risk", ["QUALITY"]);
    const second = select("high_risk", ["QUALITY"]);
    assert.deepEqual(allSymbols(first.candidates), allSymbols(second.candidates));
    assert.deepEqual(first.rejectedNewEntries, second.rejectedNewEntries);
    assert.ok(first.candidates.length <= ATTENTION_BUDGET.maxAttentionSet);
    assert.ok(newEntrySymbols(first.candidates).length <= ATTENTION_BUDGET.maxNewEntryCandidates);
    assert.equal(ATTENTION_BUDGET.maxNewEntryCandidates, RESEARCH_BUDGET.maxShortlistSize);
  });

  it("11. builds a strategy-specific investor research summary after attention filtering", () => {
    const conservative = select("conservative");
    const highRisk = select("high_risk");
    const dividend = select("dividend");
    const toNarrative = (attention: ReturnType<typeof select>, name: string) =>
      buildInvestorFacingResearchSummary({
        pass: "us_1550",
        strategyName: name,
        investigated: attention.candidates.map((item) => ({
          symbol: item.symbol,
          exchange: item.exchange,
          name: item.symbol,
          reasons: item.reasons,
        })),
        topCandidates: attention.candidates.slice(0, 4).map((item) => ({
          symbol: item.symbol,
          exchange: item.exchange,
          name: item.symbol,
        })),
      });

    const conservativeSummary = toNarrative(conservative, "Försiktig");
    const highRiskSummary = toNarrative(highRisk, "Högrisk");
    const dividendSummary = toNarrative(dividend, "Utdelning");

    assert.match(conservativeSummary, /Försiktig:/);
    assert.match(highRiskSummary, /Högrisk:/);
    assert.match(dividendSummary, /Utdelning:/);
    assert.notEqual(conservativeSummary, highRiskSummary);
    assert.notEqual(conservativeSummary, dividendSummary);
    assert.match(conservativeSummary, /QUALITY/);
    assert.doesNotMatch(conservativeSummary, /RECOVERY/);
    assert.match(highRiskSummary, /RECOVERY/);
    assert.match(dividendSummary, /SAGA-D/);
  });

  it("12. injects doctrine v2 into every model-portfolio mandate", () => {
    assert.equal(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_VERSION, 2);
    assert.match(DIVLAB_INVESTMENT_ANALYSIS_DOCTRINE_SV, /ANALYSDISCIPLIN V2/);
    for (const strategyKey of ["conservative", "balanced", "high_risk", "dividend"] as const) {
      const system = buildModelPortfolioSystemMandate(strategyKey);
      assert.match(system, /GEMENSAM ANALYSDISCIPLIN/);
      assert.match(system, /ANALYSDISCIPLIN V2/);
      assert.match(system, /Casetyp före värdering/);
      assert.match(system, /Per-aktie-ekonomi och utspädning/);
      assert.match(system, /Evidenskalibrering/);
      assert.match(system, /Processkvalitet före utfallsbias/);
    }
  });

  it("13. keeps DivBrain policy on the shared doctrine core plus financial safety", () => {
    const policy = getDivBrainPolicyBlock();
    assert.match(policy.content, /Finansiell säkerhetspolicy/);
    assert.match(policy.content, /inte personlig finansiell rådgivning/);
    assert.match(policy.content, /affärskvalitet och kassaflöde/);
    assert.match(policy.content, /Okänd data är okänd/);
    assert.match(policy.content, /ingen metod kan garantera vinst/);
    assert.doesNotMatch(policy.content, /ANALYSDISCIPLIN V2/);
  });

  it("14. preserves expected guardrail decisions for the expanded benchmark catalog", () => {
    for (const benchmarkCase of DIVBRAIN_BENCHMARK_CASES) {
      const assessment = evaluateDivBrainGuardrails(benchmarkCase.prompt);
      assert.equal(assessment.ok, true);
      if (assessment.ok) {
        assert.equal(
          assessment.data.decision,
          benchmarkCase.expectedPromptDecision,
          benchmarkCase.id,
        );
      }
    }
    const doctrineCases = DIVBRAIN_BENCHMARK_CASES.filter((item) =>
      item.id.startsWith("bench-edu-") && item.id !== "bench-edu-utdelning" && item.id !== "bench-edu-diversifiering" && item.id !== "bench-edu-pe-tal",
    );
    assert.ok(doctrineCases.length >= 7);
    assert.ok(doctrineCases.every((item) => item.expectedPromptDecision === "allow"));
  });

  it("15. does not raise current AI, research or external-call budget constants", () => {
    assert.equal(RESEARCH_BUDGET.maxDeepResearchCandidates, 6);
    assert.equal(RESEARCH_BUDGET.maxShortlistSize, 20);
    assert.equal(RESEARCH_BUDGET.maxAiCallsPerPortfolioRun, 2);
    assert.equal(RESEARCH_BUDGET.maxTradeProposalsPerRun, 3);
    assert.equal(ATTENTION_BUDGET.maxNewEntryCandidates, 20);
    assert.equal(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT, 5);
    assert.equal(MODEL_PORTFOLIO_EODHD_PASS_LIMITS.nordic_morning, 0);
    assert.equal(MODEL_PORTFOLIO_EODHD_PASS_LIMITS.us_1550, 7);
    assert.equal(MODEL_PORTFOLIO_EODHD_PASS_LIMITS.us_1830, 6);
    assert.equal(MODEL_PORTFOLIO_EODHD_PASS_LIMITS.us_2130, 7);
    assert.equal(DIVBRAIN_BENCHMARK_LIVE_MAX_CASES, 3);
  });
});
