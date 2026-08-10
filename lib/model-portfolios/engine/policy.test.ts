import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  evaluateModelPortfolioRunEligibility,
  MODEL_PORTFOLIO_TURNOVER_POLICY,
  shouldAllowPortfolioChange,
} from "./policy";
import { buildModelPortfolioSystemMandate } from "./mandates";

describe("model portfolio manager policy", () => {
  it("allows one primary scan and only event-driven extra runs", () => {
    assert.deepEqual(
      evaluateModelPortfolioRunEligibility({
        strategyKey: "balanced",
        slotId: "open",
        completedRunsToday: 0,
        completedEventRunsToday: 0,
        hasMaterialEvent: false,
        duplicateEvent: false,
      }),
      { allowed: true, runKind: "primary" },
    );

    assert.deepEqual(
      evaluateModelPortfolioRunEligibility({
        strategyKey: "balanced",
        slotId: "midday",
        completedRunsToday: 1,
        completedEventRunsToday: 0,
        hasMaterialEvent: false,
        duplicateEvent: false,
      }),
      { allowed: false, reason: "event_required" },
    );

    assert.deepEqual(
      evaluateModelPortfolioRunEligibility({
        strategyKey: "balanced",
        slotId: "midday",
        completedRunsToday: 1,
        completedEventRunsToday: 0,
        hasMaterialEvent: true,
        eventKind: "profit_warning",
        duplicateEvent: false,
      }),
      { allowed: true, runKind: "event" },
    );
  });

  it("enforces the hard four-runs-per-day cap and event dedupe", () => {
    assert.deepEqual(
      evaluateModelPortfolioRunEligibility({
        strategyKey: "high_risk",
        slotId: "close",
        completedRunsToday: 4,
        completedEventRunsToday: 3,
        hasMaterialEvent: true,
        eventKind: "large_price_move",
        duplicateEvent: false,
      }),
      { allowed: false, reason: "daily_run_cap" },
    );

    assert.deepEqual(
      evaluateModelPortfolioRunEligibility({
        strategyKey: "high_risk",
        slotId: "us-open",
        completedRunsToday: 2,
        completedEventRunsToday: 1,
        hasMaterialEvent: true,
        eventKind: "earnings_surprise",
        duplicateEvent: true,
      }),
      { allowed: false, reason: "duplicate_event" },
    );
  });

  it("makes conservative materially harder to churn than high risk", () => {
    const common = {
      action: "sell" as const,
      convictionScore: 0.65,
      tradeValueMinor: 40_000,
      portfolioValueMinor: 1_000_000,
      hoursSinceLastTradeInInstrument: 80,
      materialThesisBreak: false,
    };

    assert.deepEqual(shouldAllowPortfolioChange({ strategyKey: "conservative", ...common }), {
      allowed: false,
      reason: "instrument_cooldown",
    });
    assert.deepEqual(shouldAllowPortfolioChange({ strategyKey: "high_risk", ...common }), {
      allowed: true,
    });

    assert.ok(
      MODEL_PORTFOLIO_TURNOVER_POLICY.conservative.replacementThresholdScore >
        MODEL_PORTFOLIO_TURNOVER_POLICY.high_risk.replacementThresholdScore,
    );
  });

  it("still allows urgent thesis-break action through profile turnover thresholds", () => {
    assert.deepEqual(
      shouldAllowPortfolioChange({
        strategyKey: "dividend",
        action: "sell",
        convictionScore: 0.2,
        tradeValueMinor: 100_000,
        portfolioValueMinor: 1_000_000,
        hoursSinceLastTradeInInstrument: 4,
        materialThesisBreak: true,
      }),
      { allowed: true },
    );
  });

  it("builds mandates that explicitly accept hold and prohibit validator bypass", () => {
    const conservative = buildModelPortfolioSystemMandate("conservative");
    const highRisk = buildModelPortfolioSystemMandate("high_risk");
    assert.match(conservative, /inte göra någon affär/i);
    assert.match(conservative, /aldrig kringgå den deterministiska riskvalidatorn/i);
    assert.match(conservative, /10,00 SEK/i);
    assert.match(conservative, /Onödig omsättning/i);
    assert.match(highRisk, /högre omsättning/i);
    assert.match(highRisk, /okontrollerad daytrading/i);
  });
});
