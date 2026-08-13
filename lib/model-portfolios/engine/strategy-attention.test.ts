import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RESEARCH_BUDGET } from "./research";
import {
  ATTENTION_BUDGET,
  MODEL_PORTFOLIO_ATTENTION_POLICIES,
  evaluateNewEntryAttention,
  selectPortfolioAttentionCandidates,
} from "./strategy-attention";

describe("strategy attention policies", () => {
  it("defines four materially different attention policies", () => {
    const biases = Object.values(MODEL_PORTFOLIO_ATTENTION_POLICIES).map((policy) => policy.searchBias);
    assert.equal(new Set(biases).size, 4);
    assert.equal(MODEL_PORTFOLIO_ATTENTION_POLICIES.conservative.searchBias, "quality_capital_preservation");
    assert.equal(MODEL_PORTFOLIO_ATTENTION_POLICIES.balanced.searchBias, "garp_revisions_catalyst");
    assert.equal(MODEL_PORTFOLIO_ATTENTION_POLICIES.high_risk.searchBias, "small_mid_catalyst_recovery");
    assert.equal(MODEL_PORTFOLIO_ATTENTION_POLICIES.dividend.searchBias, "income_cashflow_safety");
  });

  it("includes a held name that is absent from the shared universe", () => {
    const attention = selectPortfolioAttentionCandidates({
      universe: [{ symbol: "OTHER", exchange: "ST", qualityScore: 0.9, balanceSheetScore: 0.9, marketCapSek: 90_000_000_000, avgDailyTurnoverSek: 40_000_000, volatility20d: 0.15 }],
      strategyKey: "conservative",
      heldInstruments: [{ symbol: "HELDX", exchange: "ST" }],
    });
    const held = attention.candidates.find((item) => item.symbol === "HELDX");
    assert.ok(held);
    assert.equal(held.attentionEligibility, "held_for_monitoring");
  });

  it("degrades missing conservative quality as a rejection instead of a 0.5 pass", () => {
    const decision = evaluateNewEntryAttention(
      {
        symbol: "UNKNOWNQ",
        exchange: "ST",
        marketCapSek: 90_000_000_000,
        avgDailyTurnoverSek: 40_000_000,
        balanceSheetScore: 0.9,
        volatility20d: 0.12,
      },
      "conservative",
    );
    assert.equal(decision.eligible, false);
    assert.ok(decision.reasons.includes("rejected_missing_quality"));
  });

  it("does not raise the research or attention shortlist budgets", () => {
    assert.equal(RESEARCH_BUDGET.maxDeepResearchCandidates, 6);
    assert.equal(ATTENTION_BUDGET.maxNewEntryCandidates, RESEARCH_BUDGET.maxShortlistSize);
  });
});
