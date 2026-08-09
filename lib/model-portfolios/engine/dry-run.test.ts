import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODEL_PORTFOLIO_AI_BUDGET } from "./ai";
import { estimateDryRunCallCost } from "./dry-run";

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
});
