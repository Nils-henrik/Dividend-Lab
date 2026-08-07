/**
 * DivBrain roadmap Ticket 1C-3 — Learning retrieval eval integrity.
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DIVBRAIN_LEARNING_EVAL_CASES,
  DIVBRAIN_LEARNING_EVAL_CATEGORIES,
  runDivBrainLearningEvals,
  type DivBrainLearningEvalCase,
} from "./learning-evals";

const EXPECTED_TOP_SLUGS = [
  "ta-kontroll-over-premiepensionen",
  "fire-ekonomisk-frihet",
  "sparkvot-budgetera-lonen-i-procent",
  "vad-ar-en-aktie",
  "borja-investera-pa-borsen",
  "vad-ar-en-indexfond",
  "tid-till-ekonomisk-frihet",
  "direktavkastning-och-utdelningssakerhet",
  "sparande-i-borjan",
] as const;

describe("DivBrain Learning retrieval eval fixture", () => {
  it("contains 36 curated cases with unique ids and full category coverage", () => {
    assert.equal(DIVBRAIN_LEARNING_EVAL_CASES.length, 36);

    const ids = DIVBRAIN_LEARNING_EVAL_CASES.map((evalCase) => evalCase.id);
    assert.equal(new Set(ids).size, ids.length);

    for (const category of DIVBRAIN_LEARNING_EVAL_CATEGORIES) {
      assert.equal(
        DIVBRAIN_LEARNING_EVAL_CASES.some(
          (evalCase) => evalCase.category === category,
        ),
        true,
        `missing category ${category}`,
      );
    }

    for (const slug of EXPECTED_TOP_SLUGS) {
      assert.equal(
        DIVBRAIN_LEARNING_EVAL_CASES.some(
          (evalCase) => evalCase.expectedTopSlug === slug,
        ),
        true,
        `missing expected slug ${slug}`,
      );
    }

    assert.equal(
      DIVBRAIN_LEARNING_EVAL_CASES.filter(
        (evalCase) => evalCase.expectedTopSlug === null,
      ).length,
      9,
    );
  });

  it("passes the complete deterministic retrieval suite", () => {
    const report = runDivBrainLearningEvals();

    assert.equal(report.total, 36);
    assert.equal(report.passed, 36);
    assert.equal(report.failed, 0);
    assert.equal(report.allPassed, true);
    assert.deepEqual(report.duplicateIds, []);
    assert.deepEqual(
      report.categoriesCovered,
      [...DIVBRAIN_LEARNING_EVAL_CATEGORIES],
    );
  });

  it("keeps prompts out of the eval report", () => {
    const report = runDivBrainLearningEvals();
    const serialized = JSON.stringify(report);

    for (const evalCase of DIVBRAIN_LEARNING_EVAL_CASES) {
      assert.equal(serialized.includes(evalCase.prompt), false);
    }
    assert.equal(serialized.includes('"prompt"'), false);
  });

  it("detects duplicate ids without echoing prompt text", () => {
    const base = DIVBRAIN_LEARNING_EVAL_CASES[0];
    const duplicateCases: DivBrainLearningEvalCase[] = [
      base,
      {
        ...base,
        prompt: "ANNAN HEMLIG TESTFRÅGA",
      },
    ];

    const report = runDivBrainLearningEvals(duplicateCases);
    assert.deepEqual(report.duplicateIds, [base.id]);
    assert.equal(report.allPassed, false);
    assert.equal(JSON.stringify(report).includes("ANNAN HEMLIG TESTFRÅGA"), false);
  });
});
