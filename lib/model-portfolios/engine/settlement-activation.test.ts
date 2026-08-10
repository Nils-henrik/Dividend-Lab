import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveModelPortfolioExecutionConfig } from "./config";
import { planSimulatedSettlement } from "./settlement";
import { buildFollowerTradePayload } from "./pricing";

describe("model portfolio settlement activation gate", () => {
  it("enables live simulation only when MODEL_PORTFOLIO_EXECUTION_ENABLED=true", () => {
    assert.deepEqual(
      resolveModelPortfolioExecutionConfig({
        MODEL_PORTFOLIO_DRY_RUN_ENABLED: "true",
        MODEL_PORTFOLIO_EXECUTION_ENABLED: "true",
      }),
      { dryRunEnabled: true, executionEnabled: true },
    );
    assert.deepEqual(
      resolveModelPortfolioExecutionConfig({
        MODEL_PORTFOLIO_DRY_RUN_ENABLED: "true",
      }),
      { dryRunEnabled: true, executionEnabled: false },
    );
  });

  it("never settles decisions audited with execution_allowed_at_decision_time=false", () => {
    const plan = planSimulatedSettlement({
      side: "buy",
      portfolioStatus: "active",
      executionAllowedAtDecisionTime: false,
      strategyKey: "balanced",
      rules: { maxSinglePositionPct: 15, minCashPct: 5, maxEquityPct: 95 },
      now: new Date("2026-08-10T10:00:00.000Z"),
      cashMinor: 1_000_000,
      portfolioValueMinor: 1_000_000,
      investedMinor: 0,
      currentHolding: null,
      targetWeightPct: 8,
      quote: {
        symbol: "INVE-B",
        exchange: "ST",
        instrumentName: "Investor AB ser. B",
        nativeCurrency: "SEK",
        nativePriceMinor: 32_000,
        asOf: "2026-08-10T09:55:00.000Z",
        sourcePublisher: "EODHD delayed quote",
        delayed: true,
      },
      fxRateToSek: null,
      convictionScore: 0.8,
      materialThesisBreak: false,
      hoursSinceLastTradeInInstrument: null,
    });
    assert.equal(plan.ok, false);
    if (plan.ok) return;
    assert.equal(plan.reason, "execution_not_allowed");
  });

  it("builds a follower trade event from an executed simulated fill", () => {
    const payload = buildFollowerTradePayload({
      symbol: "INVE-B",
      exchange: "ST",
      currency: "SEK",
      side: "buy",
      executionPriceMinor: 32_000,
      priceBasis: "last_trade",
      marketTimestamp: "2026-08-10T09:55:00.000Z",
      receivedAt: "2026-08-10T10:00:00.000Z",
      provider: "eodhd",
      transactionId: "tx-1",
      portfolioId: "portfolio-1",
      quantity: 10,
      executedAt: "2026-08-10T10:00:00.000Z",
      rationale: "Verifierad simulerad köporder.",
    });
    assert.equal(payload.type, "model_portfolio_trade");
    assert.equal(payload.executionPriceMinor, 32_000);
    assert.equal(payload.publicationTargetMs, 30_000);
  });
});
