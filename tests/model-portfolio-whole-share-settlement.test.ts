import assert from "node:assert/strict";
import { test } from "node:test";

import { planSimulatedSettlement } from "../lib/model-portfolios/engine/settlement";

test("model portfolio settlement rejects a US buy when target budget cannot buy one whole share", () => {
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

  assert.deepEqual(plan, { ok: false, reason: "trade_too_small" });
});

test("model portfolio settlement rounds a minimum-size buy up to the smallest valid whole-share quantity", () => {
  const plan = planSimulatedSettlement({
    side: "buy",
    portfolioStatus: "active",
    executionAllowedAtDecisionTime: true,
    strategyKey: "dividend",
    rules: {
      maxSinglePositionPct: 100,
      minCashPct: 5,
      maxEquityPct: 95,
    },
    now: new Date("2026-08-17T08:20:00.000Z"),
    cashMinor: 1_000_000,
    portfolioValueMinor: 1_000_000,
    investedMinor: 0,
    currentHolding: null,
    targetWeightPct: 10,
    quote: {
      symbol: "TEST",
      exchange: "ST",
      instrumentName: "Whole Share Test AB",
      nativeCurrency: "SEK",
      nativePriceMinor: 33_000,
      asOf: "2026-08-17T08:00:00.000Z",
      sourcePublisher: "Yahoo Finance market data",
      delayed: true,
    },
    fxRateToSek: null,
    convictionScore: 0.72,
    materialThesisBreak: false,
    hoursSinceLastTradeInInstrument: null,
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.quantity, 4);
  assert.equal(plan.grossAmountSekMinor, 132_000);
  assert.equal(plan.feeSekMinor, 1_000);
  assert.equal(plan.cashDeltaMinor, -133_000);
});

test("model portfolio settlement can buy one whole share when it is above the 10% target but within risk caps", () => {
  const plan = planSimulatedSettlement({
    side: "buy",
    portfolioStatus: "active",
    executionAllowedAtDecisionTime: true,
    strategyKey: "balanced",
    rules: {
      maxSinglePositionPct: 50,
      minCashPct: 5,
      maxEquityPct: 95,
    },
    now: new Date("2026-08-17T08:20:00.000Z"),
    cashMinor: 1_000_000,
    portfolioValueMinor: 1_000_000,
    investedMinor: 0,
    currentHolding: null,
    targetWeightPct: 10,
    quote: {
      symbol: "TEST",
      exchange: "ST",
      instrumentName: "Large Whole Share AB",
      nativeCurrency: "SEK",
      nativePriceMinor: 145_600,
      asOf: "2026-08-17T08:00:00.000Z",
      sourcePublisher: "Yahoo Finance market data",
      delayed: true,
    },
    fxRateToSek: null,
    convictionScore: 0.72,
    materialThesisBreak: false,
    hoursSinceLastTradeInInstrument: null,
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(plan.quantity, 1);
  assert.equal(plan.grossAmountSekMinor, 145_600);
  assert.equal(plan.feeSekMinor, 1_000);
});

test("model portfolio settlement buys only integer quantities and charges SEK 10 brokerage", () => {
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
    targetWeightPct: 20,
    quote: {
      symbol: "TEST",
      exchange: "US",
      instrumentName: "Test Corp",
      nativeCurrency: "USD",
      nativePriceMinor: 5_000,
      asOf: "2026-08-11T13:50:07.000Z",
      sourcePublisher: "Yahoo Finance market data",
      delayed: true,
    },
    fxRateToSek: {
      base: "USD",
      quote: "SEK",
      rate: 10,
      asOf: "2026-08-11T16:00:00.000Z",
      sourcePublisher: "European Central Bank via Frankfurter",
      provider: "frankfurter",
    },
    convictionScore: 0.8,
    materialThesisBreak: false,
    hoursSinceLastTradeInInstrument: null,
  });

  assert.equal(plan.ok, true);
  if (!plan.ok) return;
  assert.equal(Number.isInteger(plan.quantity), true);
  assert.equal(plan.quantity, 4);
  assert.equal(plan.grossAmountSekMinor, 200_000);
  assert.equal(plan.feeSekMinor, 1_000);
  assert.equal(plan.cashDeltaMinor, -201_000);
});
