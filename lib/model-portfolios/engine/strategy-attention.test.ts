import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { RESEARCH_BUDGET } from "./research";
import {
  ATTENTION_BUDGET,
  MODEL_PORTFOLIO_ATTENTION_POLICIES,
  compareFourManagerAttentionSets,
  evaluateNewEntryAttention,
  selectDryRunAttentionSnapshot,
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

  it("rejects balanced new entries when known quality and balance sheet are both clearly weak", () => {
    const decision = evaluateNewEntryAttention(
      {
        symbol: "WEAKFUND",
        exchange: "ST",
        marketCapSek: 8_000_000_000,
        avgDailyTurnoverSek: 20_000_000,
        qualityScore: 0.04,
        balanceSheetScore: 0.29,
        valuationScore: 0.32,
        earningsRevisionScore: 1,
        catalystScore: 1,
        volatility20d: 0.28,
      },
      "balanced",
    );
    assert.equal(decision.eligible, false);
    assert.ok(decision.reasons.includes("rejected_weak_fundamentals"));
  });

  it("does not let missing balanced quality pass as a synthetic 0.5 floor", () => {
    const decision = evaluateNewEntryAttention(
      {
        symbol: "MISSINGQ",
        exchange: "ST",
        marketCapSek: 40_000_000_000,
        avgDailyTurnoverSek: 40_000_000,
        earningsRevisionScore: 1,
        catalystScore: 1,
      },
      "balanced",
    );
    assert.equal(decision.eligible, false);
    assert.ok(decision.reasons.includes("rejected_missing_quality"));
  });

  it("keeps a held out-of-profile name in the dry-run snapshot without expanding the new-entry cap", () => {
    const snapshot = selectDryRunAttentionSnapshot({
      universe: [
        {
          symbol: "QUALITY",
          exchange: "ST",
          marketCapSek: 120_000_000_000,
          avgDailyTurnoverSek: 80_000_000,
          qualityScore: 0.93,
          balanceSheetScore: 0.91,
          valuationScore: 0.72,
          volatility20d: 0.12,
        },
        {
          symbol: "SPEC",
          exchange: "ST",
          marketCapSek: 8_000_000_000,
          avgDailyTurnoverSek: 20_000_000,
          qualityScore: 0.48,
          balanceSheetScore: 0.42,
          volatility20d: 0.56,
          catalystScore: 0.96,
        },
      ],
      strategyKey: "conservative",
      heldInstruments: [{ symbol: "SPEC", exchange: "ST" }],
    });
    assert.ok(snapshot.heldMonitoringCandidates.some((item) => item.symbol === "SPEC"));
    assert.ok(snapshot.snapshot.some((item) => item.symbol === "SPEC"));
    assert.ok(!snapshot.newEntryCandidates.some((item) => item.symbol === "SPEC"));
    assert.ok(snapshot.newEntryCandidates.length <= RESEARCH_BUDGET.maxDeepResearchCandidates);
    assert.equal(RESEARCH_BUDGET.maxDeepResearchCandidates, 6);
  });

  it("lets Dividend monitor a held non-income name without admitting the identical non-held name as a new entry", () => {
    const held = selectPortfolioAttentionCandidates({
      universe: [{
        symbol: "QUALITY",
        exchange: "ST",
        marketCapSek: 120_000_000_000,
        avgDailyTurnoverSek: 80_000_000,
        qualityScore: 0.93,
        balanceSheetScore: 0.91,
      }],
      strategyKey: "dividend",
      heldInstruments: [{ symbol: "QUALITY", exchange: "ST" }],
    });
    const fresh = selectPortfolioAttentionCandidates({
      universe: [{
        symbol: "QUALITY",
        exchange: "ST",
        marketCapSek: 120_000_000_000,
        avgDailyTurnoverSek: 80_000_000,
        qualityScore: 0.93,
        balanceSheetScore: 0.91,
      }],
      strategyKey: "dividend",
      heldInstruments: [],
    });
    assert.equal(held.candidates.find((item) => item.symbol === "QUALITY")?.attentionEligibility, "held_for_monitoring");
    assert.ok(!fresh.candidates.some((item) => item.symbol === "QUALITY" && item.attentionEligibility === "new_entry"));
    assert.ok(fresh.rejectedNewEntries.some((item) => item.symbol === "QUALITY" && item.reasons.includes("rejected_non_income")));
  });

  it("produces four different new-entry sets from the same universe in a non-settling shadow comparison", () => {
    const universe = [
      {
        symbol: "QUALITY",
        exchange: "ST",
        marketCapSek: 120_000_000_000,
        avgDailyTurnoverSek: 80_000_000,
        qualityScore: 0.93,
        balanceSheetScore: 0.91,
        valuationScore: 0.72,
        volatility20d: 0.12,
        catalystScore: 0.34,
        earningsRevisionScore: 0.56,
      },
      {
        symbol: "SPEC",
        exchange: "ST",
        marketCapSek: 8_000_000_000,
        avgDailyTurnoverSek: 20_000_000,
        qualityScore: 0.48,
        balanceSheetScore: 0.42,
        volatility20d: 0.56,
        catalystScore: 0.96,
        earningsRevisionScore: 0.4,
        priceMomentum20d: 0.19,
      },
      {
        symbol: "SAGA-D",
        exchange: "ST",
        marketCapSek: 18_000_000_000,
        avgDailyTurnoverSek: 40_000_000,
        qualityScore: 0.68,
        balanceSheetScore: 0.66,
        dividendQualityScore: 0.74,
      },
      {
        symbol: "GARP",
        exchange: "ST",
        marketCapSek: 95_000_000_000,
        avgDailyTurnoverSek: 50_000_000,
        qualityScore: 0.64,
        valuationScore: 0.7,
        earningsRevisionScore: 0.71,
        catalystScore: 0.57,
        balanceSheetScore: 0.63,
        volatility20d: 0.24,
      },
    ];
    const comparison = compareFourManagerAttentionSets({ universe });
    assert.notDeepEqual(comparison.conservative.newEntrySymbols, comparison.high_risk.newEntrySymbols);
    assert.notDeepEqual(comparison.conservative.newEntrySymbols, comparison.dividend.newEntrySymbols);
    assert.notDeepEqual(comparison.balanced.newEntrySymbols, comparison.high_risk.newEntrySymbols);
    assert.ok(comparison.conservative.newEntrySymbols.includes("QUALITY"));
    assert.ok(comparison.dividend.newEntrySymbols.includes("SAGA-D"));
    assert.ok(!comparison.dividend.newEntrySymbols.includes("QUALITY"));
    const again = compareFourManagerAttentionSets({ universe });
    assert.deepEqual(again, comparison);
  });
});
