import assert from "node:assert/strict";
import { test } from "node:test";

import { planSimulatedSettlement } from "../lib/model-portfolios/engine/settlement";

test("model portfolio settlement can execute a target-sized fractional US buy", () => {
  const plan = planSimulatedSettlement({
    side: "buy",
    portfolioStatus: "active",
    executionAllowedAtDecisionTime: true,
    strategyKey: "high_risk",
    rules: {
      maxSinglePositionPct: 20,
      minCashPct: 3,
      maxEquityPct: 100,
    },
    now: new Date("2026-08-11T16:31:00.000Z"),
    cashMinor: 1_000_000,
    portfolioValueMinor: 1_000_000,
    investedMinor: 0,
    currentHolding: null,
    targetWeightPct: 12,
    quote: {
      symbol: "JPM",
      exchange: "US",
      instrumentName: "JPMorgan Chase & Co.",
      nativeCurrency: "USD",
      nativePriceMinor: 36_233,
      asOf: "2026-08-11T13:50:07.000Z",
      sourcePublisher: "Yahoo Finance market data",
      delayed: true,
    },
    fxRateToSek: {
      base: "USD",
      quote: "SEK",
      rate: 9.5,
      asOf: "2026-08-11T16:00:00.000Z",
      sourcePublisher: "European Central Bank via Frankfurter",
      provider: "frankfurter",
    },
    convictionScore: 0.72,
    materialThesisBreak: false,
    hoursSinceLastTradeInInstrument: null,
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;

  assert.ok(plan.quantity > 0 && plan.quantity < 1, "expected a fractional JPM quantity");
  assert.ok(plan.grossAmountSekMinor <= 120_000, "gross must not exceed the 12% target budget");
  assert.ok(plan.grossAmountSekMinor >= 119_990, "fractional sizing should closely match the target budget");
  assert.equal(plan.feeSekMinor, 1_000);
  assert.equal(plan.cashDeltaMinor, -(plan.grossAmountSekMinor + plan.feeSekMinor));
  assert.equal(plan.quantityAfter, plan.quantity);
});
