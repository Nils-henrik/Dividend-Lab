import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT } from "./eodhd-budget";

// The orchestrator is intentionally integration-heavy (Supabase + EODHD + AI Gateway).
// One batched quote request covers the whole seven-name universe; the remaining
// budget allows three historical-series requests while the other names still
// participate with delayed quote data.
describe("model portfolio dry-run orchestration budget", () => {
  it("fits one batched quote request plus three bounded history requests", () => {
    const expectedCalls = 1 + 3;
    assert.equal(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT, 4);
    assert.equal(expectedCalls, MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT);
  });
});
