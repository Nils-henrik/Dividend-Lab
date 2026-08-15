import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPortfolioDeepResearchDispatchPlan,
  PORTFOLIO_DEEP_RESEARCH_DISPATCH_BUDGET,
} from "../lib/analysis/portfolio-deep-research-dispatch";
import type { AttentionCandidate } from "../lib/model-portfolios/engine/strategy-attention";

function candidate(input: {
  symbol: string;
  score: number;
  eligibility?: "new_entry" | "held_for_monitoring";
  reasons?: string[];
}): AttentionCandidate {
  return {
    symbol: input.symbol,
    exchange: "ST",
    deterministicScore: input.score,
    reasons: ["fixture"],
    marketCapSegment: "mid_cap",
    recoverySetup: {
      state: "not_recovery",
      score: 0,
      drawdownFrom52WeekHigh: null,
      fundamentalIntegrityScore: 0.7,
      entryConfirmationScore: 0.6,
      reasons: [],
    },
    attentionEligibility: input.eligibility ?? "new_entry",
    attentionReasons: input.reasons ?? ["new_entry_eligible"],
  } as AttentionCandidate;
}

function plan(
  managerSelections: Parameters<typeof buildPortfolioDeepResearchDispatchPlan>[0]["managerSelections"],
) {
  return buildPortfolioDeepResearchDispatchPlan({
    runKey: "run-2026-08-15-portfolio-research",
    asOf: "2026-08-15T12:45:00.000Z",
    researchPass: "nordic_morning",
    managerSelections,
    names: new Map([
      ["ATCO-A.ST", "Atlas Copco A"],
      ["SAND.ST", "Sandvik"],
      ["EVO.ST", "Evolution"],
      ["PDX.ST", "Paradox Interactive"],
      ["CIBUS.ST", "Cibus Nordic Real Estate"],
    ]),
  });
}

describe("portfolio Deep Research dispatch", () => {
  it("selects at most one whole-share/risk-eligible new entry per manager and never a holding", () => {
    const result = plan([
      {
        strategyKey: "conservative",
        candidates: [
          candidate({
            symbol: "ATCO-A",
            score: 0.95,
            eligibility: "held_for_monitoring",
            reasons: ["held_for_monitoring"],
          }),
          candidate({ symbol: "SAND", score: 0.81 }),
          candidate({ symbol: "EVO", score: 0.79 }),
        ],
      },
    ]);

    assert.equal(PORTFOLIO_DEEP_RESEARCH_DISPATCH_BUDGET.maxCandidatesPerManager, 1);
    assert.equal(result.jobs.length, 1);
    assert.equal(result.jobs[0]?.symbol, "SAND");
    assert.equal(result.jobs[0]?.name, "Sandvik");
    assert.deepEqual(result.jobs[0]?.triggerStrategies, ["conservative"]);
    assert.equal(result.jobs.some((job) => job.symbol === "ATCO-A"), false);
    assert.equal(result.jobs.some((job) => job.symbol === "EVO"), false);
  });

  it("deduplicates one company selected independently by multiple managers", () => {
    const result = plan([
      {
        strategyKey: "balanced",
        candidates: [
          candidate({ symbol: "EVO", score: 0.77, reasons: ["new_entry_eligible", "garp_alignment"] }),
        ],
      },
      {
        strategyKey: "high_risk",
        candidates: [
          candidate({ symbol: "EVO", score: 0.91, reasons: ["new_entry_eligible", "catalyst_revision_fit"] }),
        ],
      },
    ]);

    assert.equal(result.stats.managerSelections, 2);
    assert.equal(result.stats.uniqueJobs, 1);
    assert.equal(result.stats.deduplicatedSelections, 1);
    assert.equal(result.jobs[0]?.deterministicScore, 0.91);
    assert.deepEqual(result.jobs[0]?.triggerStrategies, ["balanced", "high_risk"]);
    assert.deepEqual(result.jobs[0]?.attentionReasonsByStrategy.balanced, [
      "new_entry_eligible",
      "garp_alignment",
    ]);
    assert.deepEqual(result.jobs[0]?.attentionReasonsByStrategy.high_risk, [
      "new_entry_eligible",
      "catalyst_revision_fit",
    ]);
  });

  it("never exceeds the four-manager/four-job hard budget", () => {
    const result = plan([
      { strategyKey: "conservative", candidates: [candidate({ symbol: "SAND", score: 0.8 })] },
      { strategyKey: "balanced", candidates: [candidate({ symbol: "EVO", score: 0.82 })] },
      { strategyKey: "high_risk", candidates: [candidate({ symbol: "PDX", score: 0.86 })] },
      { strategyKey: "dividend", candidates: [candidate({ symbol: "CIBUS", score: 0.84 })] },
    ]);

    assert.equal(result.jobs.length, 4);
    assert.equal(result.jobs.length, PORTFOLIO_DEEP_RESEARCH_DISPATCH_BUDGET.maxJobs);
    assert.deepEqual(
      result.jobs.map((job) => job.symbol),
      ["PDX", "CIBUS", "EVO", "SAND"],
    );
  });

  it("produces no job when a manager only has holdings for monitoring", () => {
    const result = plan([
      {
        strategyKey: "dividend",
        candidates: [
          candidate({
            symbol: "CIBUS",
            score: 0.9,
            eligibility: "held_for_monitoring",
            reasons: ["held_for_monitoring"],
          }),
        ],
      },
    ]);
    assert.equal(result.jobs.length, 0);
    assert.equal(result.stats.managerSelections, 0);
  });

  it("fails closed on duplicate manager input or invalid timestamps", () => {
    assert.throws(
      () =>
        plan([
          { strategyKey: "balanced", candidates: [candidate({ symbol: "EVO", score: 0.8 })] },
          { strategyKey: "balanced", candidates: [candidate({ symbol: "SAND", score: 0.7 })] },
        ]),
      /portfolio_deep_research_dispatch_duplicate_manager:balanced/,
    );

    assert.throws(
      () =>
        buildPortfolioDeepResearchDispatchPlan({
          runKey: "run-x",
          asOf: "not-a-date",
          researchPass: "us_1550",
          managerSelections: [],
          names: new Map(),
        }),
      /portfolio_deep_research_dispatch_as_of_invalid/,
    );
  });
});
