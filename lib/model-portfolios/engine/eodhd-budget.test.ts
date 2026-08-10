import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EODHD_FREE_ACCOUNT_DAILY_LIMIT,
  MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT,
  MODEL_PORTFOLIO_EODHD_MAX_HISTORY_CALLS,
  MODEL_PORTFOLIO_EODHD_PASS_LIMITS,
  MODEL_PORTFOLIO_EODHD_RESERVED_FUNDAMENTALS_CALLS,
  EodhdCallBudget,
  canFetchHistoryWithFundamentalsReserve,
  createDryRunEodhdBudget,
  createScheduledEodhdBudget,
  scheduledEodhdDailyLimit,
} from "./eodhd-budget";

describe("EODHD call budget", () => {
  it("allocates exactly the free-account daily ceiling across scheduled passes", () => {
    assert.equal(EODHD_FREE_ACCOUNT_DAILY_LIMIT, 20);
    assert.equal(MODEL_PORTFOLIO_EODHD_PASS_LIMITS.nordic_morning, 0);
    assert.equal(MODEL_PORTFOLIO_EODHD_PASS_LIMITS.us_1550, 7);
    assert.equal(MODEL_PORTFOLIO_EODHD_PASS_LIMITS.us_1830, 6);
    assert.equal(MODEL_PORTFOLIO_EODHD_PASS_LIMITS.us_2130, 7);
    assert.equal(scheduledEodhdDailyLimit(), EODHD_FREE_ACCOUNT_DAILY_LIMIT);
  });

  it("keeps the legacy dry-run budget isolated", () => {
    assert.equal(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT, 5);
    assert.equal(MODEL_PORTFOLIO_EODHD_RESERVED_FUNDAMENTALS_CALLS, 1);
    assert.equal(MODEL_PORTFOLIO_EODHD_MAX_HISTORY_CALLS, 3);
  });

  it("tracks usage and stops before an extra external call", () => {
    const budget = new EodhdCallBudget(2);
    budget.consume();
    budget.consume();
    assert.deepEqual(budget.snapshot(), { limit: 2, used: 2, remaining: 0 });
    assert.throws(() => budget.consume(), /eodhd_call_budget_exhausted/);
  });

  it("creates the standard dry-run budget", () => {
    assert.deepEqual(createDryRunEodhdBudget().snapshot(), {
      limit: 5,
      used: 0,
      remaining: 5,
    });
  });

  it("enforces each scheduled pass allocation including a zero-call Nordic pass", () => {
    const evening = createScheduledEodhdBudget("us_1830");
    evening.consume(6);
    assert.equal(evening.snapshot().remaining, 0);
    assert.throws(() => evening.consume(), /eodhd_call_budget_exhausted/);

    const nordic = createScheduledEodhdBudget("nordic_morning");
    assert.equal(nordic.snapshot().limit, 0);
    assert.equal(nordic.snapshot().used, 0);
    assert.throws(() => nordic.consume(), /eodhd_call_budget_exhausted/);
    assert.equal(nordic.snapshot().used, 0);
  });

  it("keeps US afternoon/evening passes functional and bounded within the daily ceiling", () => {
    const usPasses = ["us_1550", "us_1830", "us_2130"] as const;
    let allocated = 0;
    for (const pass of usPasses) {
      const budget = createScheduledEodhdBudget(pass);
      assert.ok(budget.snapshot().limit > 0);
      allocated += budget.snapshot().limit;
      for (let index = 0; index < budget.snapshot().limit; index += 1) budget.consume();
      assert.equal(budget.snapshot().remaining, 0);
    }
    assert.equal(allocated + MODEL_PORTFOLIO_EODHD_PASS_LIMITS.nordic_morning, EODHD_FREE_ACCOUNT_DAILY_LIMIT);
  });

  it("reserves the final call for fundamentals after quote + max histories", () => {
    const budget = createDryRunEodhdBudget();
    budget.consume(); // batched quote
    let historyCalls = 0;
    while (canFetchHistoryWithFundamentalsReserve(budget.snapshot())) {
      budget.consume();
      historyCalls += 1;
    }
    assert.equal(historyCalls, MODEL_PORTFOLIO_EODHD_MAX_HISTORY_CALLS);
    assert.deepEqual(budget.snapshot(), {
      limit: MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT,
      used: 1 + MODEL_PORTFOLIO_EODHD_MAX_HISTORY_CALLS,
      remaining: MODEL_PORTFOLIO_EODHD_RESERVED_FUNDAMENTALS_CALLS,
    });
    assert.equal(canFetchHistoryWithFundamentalsReserve(budget.snapshot()), false);
    budget.consume(); // reserved fundamentals enrichment
    assert.deepEqual(budget.snapshot(), {
      limit: 5,
      used: 5,
      remaining: 0,
    });
  });
});
