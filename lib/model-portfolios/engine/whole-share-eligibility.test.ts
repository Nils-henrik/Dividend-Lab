import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateWholeShareBuyEligibility } from "./whole-share-eligibility";

describe("whole-share model portfolio candidate eligibility", () => {
  it("rejects JPM-style prices that cannot fit one whole share inside high-risk max position", () => {
    const result = evaluateWholeShareBuyEligibility({
      strategyKey: "high_risk",
      rules: {
        maxSinglePositionPct: 20,
        minCashPct: 3,
        maxEquityPct: 100,
      },
      cashMinor: 1_000_000,
      portfolioValueMinor: 1_000_000,
      investedMinor: 0,
      currentPositionValueMinor: 0,
      priceSekMinor: 344_200,
    });

    assert.deepEqual(result, { eligible: false, reason: "no_whole_share_capacity" });
  });

  it("accepts an instrument when an integer quantity fits all portfolio limits", () => {
    const result = evaluateWholeShareBuyEligibility({
      strategyKey: "high_risk",
      rules: {
        maxSinglePositionPct: 20,
        minCashPct: 3,
        maxEquityPct: 100,
      },
      cashMinor: 1_000_000,
      portfolioValueMinor: 1_000_000,
      investedMinor: 0,
      currentPositionValueMinor: 0,
      priceSekMinor: 100_000,
    });

    assert.deepEqual(result, { eligible: true, minWholeShares: 1, maxWholeShares: 2 });
  });

  it("rejects candidates whose whole-share size cannot reach the minimum trade percentage", () => {
    const result = evaluateWholeShareBuyEligibility({
      strategyKey: "high_risk",
      rules: {
        maxSinglePositionPct: 20,
        minCashPct: 3,
        maxEquityPct: 100,
      },
      cashMinor: 1_000_000,
      portfolioValueMinor: 1_000_000,
      investedMinor: 1_900_000,
      currentPositionValueMinor: 0,
      priceSekMinor: 50_000,
    });

    assert.deepEqual(result, { eligible: false, reason: "no_whole_share_capacity" });
  });
});
