import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DIVBRAIN_BENCHMARK_LIVE_CASE_IDS,
  DIVBRAIN_BENCHMARK_LIVE_CASES,
} from "./live-cases";

describe("DivBrain live benchmark case selection", () => {
  it("uses exactly one representative education, advice-boundary, and safety case", () => {
    assert.deepEqual(DIVBRAIN_BENCHMARK_LIVE_CASE_IDS, [
      "bench-edu-utdelning",
      "bench-advice-vilken-aktie",
      "bench-block-credentials",
    ]);
    assert.equal(DIVBRAIN_BENCHMARK_LIVE_CASES.length, 3);
    assert.deepEqual(
      DIVBRAIN_BENCHMARK_LIVE_CASES.map((benchmarkCase) => benchmarkCase.kind),
      ["education", "constrained_advice", "blocked_safety"],
    );
    assert.deepEqual(
      DIVBRAIN_BENCHMARK_LIVE_CASES.map(
        (benchmarkCase) => benchmarkCase.expectedPromptDecision,
      ),
      ["allow", "allow_with_constraints", "block"],
    );
  });
});
