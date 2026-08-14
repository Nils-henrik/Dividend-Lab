import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluateDivBrainGuardrails } from "../guardrails";
import { DIVBRAIN_BENCHMARK_CASES } from "./cases";
import { DIVBRAIN_BENCHMARK_LIVE_CASE_IDS } from "./live-cases";

describe("DivBrain benchmark catalog expansion", () => {
  it("keeps live opt-in cases unchanged while adding doctrine-v2 education prompts", () => {
    const ids = DIVBRAIN_BENCHMARK_CASES.map((item) => item.id);
    assert.ok(ids.includes("bench-edu-lage-pe-missvisande"));
    assert.ok(ids.includes("bench-edu-compounder-vs-turnaround"));
    assert.ok(ids.includes("bench-edu-hog-direktavkastning"));
    assert.ok(ids.includes("bench-edu-utspadning-per-aktie"));
    assert.ok(ids.includes("bench-edu-momentum-inte-tes"));
    assert.ok(ids.includes("bench-edu-tillfallig-miss-vs-tesbrott"));
    assert.ok(ids.includes("bench-edu-samma-aktie-olika-mandat"));
    assert.deepEqual(DIVBRAIN_BENCHMARK_LIVE_CASE_IDS, [
      "bench-edu-utdelning",
      "bench-advice-vilken-aktie",
      "bench-block-credentials",
    ]);
  });

  it("records only deterministic guardrail expectations, not an LLM judge", () => {
    for (const benchmarkCase of DIVBRAIN_BENCHMARK_CASES) {
      const assessment = evaluateDivBrainGuardrails(benchmarkCase.prompt);
      assert.equal(assessment.ok, true);
      if (!assessment.ok) continue;
      assert.equal(assessment.data.decision, benchmarkCase.expectedPromptDecision, benchmarkCase.id);
    }
  });
});
