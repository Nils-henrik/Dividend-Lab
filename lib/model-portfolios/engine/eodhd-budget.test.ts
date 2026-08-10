import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EODHD_FREE_ACCOUNT_DAILY_LIMIT,
  MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT,
  EodhdCallBudget,
  createDryRunEodhdBudget,
} from "./eodhd-budget";

describe("EODHD call budget", () => {
  it("keeps four weekday dry runs below the free account ceiling", () => {
    assert.equal(EODHD_FREE_ACCOUNT_DAILY_LIMIT, 20);
    assert.equal(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT, 4);
    assert.ok(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT * 4 < EODHD_FREE_ACCOUNT_DAILY_LIMIT);
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
      limit: 4,
      used: 0,
      remaining: 4,
    });
  });
});
