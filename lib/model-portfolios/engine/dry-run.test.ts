import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODEL_PORTFOLIO_AI_BUDGET } from "./ai";
import { estimateDryRunCallCost, guardBuyAgainstHeldMonitoring } from "./dry-run";
import { RESEARCH_BUDGET } from "./research";
import { selectDryRunAttentionSnapshot } from "./strategy-attention";

describe("model portfolio dry-run planning", () => {
  it("keeps the normal Luna dry-run estimate well below the daily hard cap", () => {
    const cost = estimateDryRunCallCost(false);
    assert.ok(cost > 0);
    assert.ok(cost < MODEL_PORTFOLIO_AI_BUDGET.hardDailyUsdMicros / 4);
  });

  it("makes escalation materially more expensive so it stays exceptional", () => {
    const normal = estimateDryRunCallCost(false);
    const escalation = estimateDryRunCallCost(true);
    assert.ok(escalation > normal * 5);
  });

  it("blocks a BUY when held status is the only reason a name is in the snapshot", () => {
    const snapshot = selectDryRunAttentionSnapshot({
      universe: [{
        symbol: "SPEC",
        exchange: "ST",
        marketCapSek: 8_000_000_000,
        avgDailyTurnoverSek: 20_000_000,
        qualityScore: 0.48,
        balanceSheetScore: 0.42,
        volatility20d: 0.56,
        catalystScore: 0.96,
      }],
      strategyKey: "conservative",
      heldInstruments: [{ symbol: "SPEC", exchange: "ST" }],
    }).snapshot;
    assert.ok(snapshot.some((item) => item.symbol === "SPEC"));
    assert.ok(snapshot.every((item) => item.attentionEligibility === "held_for_monitoring"));
    assert.ok(snapshot.filter((item) => item.attentionEligibility === "new_entry").length <= RESEARCH_BUDGET.maxDeepResearchCandidates);

    const guarded = guardBuyAgainstHeldMonitoring({
      decision: {
        action: "buy",
        symbol: "SPEC",
        exchange: "ST",
        instrumentName: "Speculative AB",
        proposedPortfolioPct: 8,
        convictionScore: 0.8,
        materialThesisBreak: false,
        thesis: "Momentum.",
        bearCase: "Volatility.",
        catalyst: "Breakout.",
        valuationView: "Secondary.",
        keyRisks: ["Speculation"],
        evidenceIds: [],
        disconfirmingEvidenceIds: [],
        rationale: "Buy the holding because it is already owned.",
      },
      snapshot,
      strategyKey: "conservative",
      evidence: [],
    });
    assert.equal(guarded.action, "hold");
    assert.match(guarded.rationale, /Innehavsstatus får inte/);
  });
});
