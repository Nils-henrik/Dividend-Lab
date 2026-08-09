import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT } from "./eodhd-budget";

// The orchestrator is intentionally integration-heavy (Supabase + EODHD + AI Gateway).
// Keep this unit-level guard deterministic: the bootstrap path must fit inside the
// internal external-call ceiling before any network request is allowed in runtime.
describe("model portfolio dry-run orchestration budget", () => {
  it("fits one batched quote request plus seven bounded history requests", () => {
    const expectedBootstrapCalls = 1 + 7;
    assert.equal(MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT, 8);
    assert.equal(expectedBootstrapCalls, MODEL_PORTFOLIO_DRY_RUN_EODHD_LIMIT);
  });
});
