/**
 * DivBrain roadmap Ticket 1C-3 — pure Learning retrieval eval runner.
 *
 * Reports are prompt-free by design. No network/provider/current-time usage.
 */

import { retrieveDivBrainLearningSources } from "./retrieve";
import {
  DIVBRAIN_LEARNING_EVAL_CASES,
  DIVBRAIN_LEARNING_EVAL_CATEGORIES,
  type DivBrainLearningEvalCase,
  type DivBrainLearningEvalCategory,
} from "./learning-eval-fixtures";

export const DIVBRAIN_LEARNING_EVAL_SCHEMA_VERSION = 1 as const;

export {
  DIVBRAIN_LEARNING_EVAL_CASES,
  DIVBRAIN_LEARNING_EVAL_CATEGORIES,
};
export type { DivBrainLearningEvalCase, DivBrainLearningEvalCategory };

export type DivBrainLearningEvalCaseReport = {
  readonly id: string;
  readonly category: DivBrainLearningEvalCategory;
  readonly passed: boolean;
  readonly expectedTopSlug: string | null;
  readonly actualTopSlug: string | null;
  readonly hitCount: number;
  readonly failureReasons: readonly string[];
};

export type DivBrainLearningEvalReport = {
  readonly schemaVersion: typeof DIVBRAIN_LEARNING_EVAL_SCHEMA_VERSION;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly allPassed: boolean;
  readonly duplicateIds: readonly string[];
  readonly categoriesCovered: readonly DivBrainLearningEvalCategory[];
  readonly cases: readonly DivBrainLearningEvalCaseReport[];
};

function findDuplicateIds(cases: readonly DivBrainLearningEvalCase[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const evalCase of cases) {
    if (seen.has(evalCase.id)) {
      duplicates.add(evalCase.id);
    }
    seen.add(evalCase.id);
  }

  return [...duplicates].sort();
}

export function evaluateDivBrainLearningEvalCase(
  evalCase: DivBrainLearningEvalCase,
): DivBrainLearningEvalCaseReport {
  const retrieval = retrieveDivBrainLearningSources(evalCase.prompt);
  const failureReasons: string[] = [];

  if (!retrieval.ok) {
    return {
      id: evalCase.id,
      category: evalCase.category,
      passed: false,
      expectedTopSlug: evalCase.expectedTopSlug,
      actualTopSlug: null,
      hitCount: 0,
      failureReasons: [`technical_error:${retrieval.error.code}`],
    };
  }

  const hitCount = retrieval.data.hits.length;
  const actualTopSlug = retrieval.data.hits[0]?.slug ?? null;

  if (evalCase.expectedTopSlug === null) {
    if (hitCount !== 0) {
      failureReasons.push(
        `expected_no_match:got_${actualTopSlug ?? "unknown"}`,
      );
    }
  } else {
    if (hitCount === 0) {
      failureReasons.push("expected_match:got_none");
    } else if (actualTopSlug !== evalCase.expectedTopSlug) {
      failureReasons.push(
        `top_slug_expected_${evalCase.expectedTopSlug}:got_${actualTopSlug ?? "none"}`,
      );
    }
  }

  if (hitCount > 3) {
    failureReasons.push(`result_bound_exceeded:${hitCount}`);
  }

  if (retrieval.data.sources.length !== hitCount) {
    failureReasons.push(
      `source_hit_count_mismatch:${retrieval.data.sources.length}:${hitCount}`,
    );
  }

  for (let index = 0; index < retrieval.data.hits.length; index += 1) {
    const hit = retrieval.data.hits[index];
    const source = retrieval.data.sources[index];
    if (!source || source.id !== hit.source.id) {
      failureReasons.push(`source_order_mismatch:${index}`);
      continue;
    }
    if (source.internalRoute !== `/learning/${hit.slug}`) {
      failureReasons.push(`route_mismatch:${index}`);
    }
    if (source.category !== "divlab_learning") {
      failureReasons.push(`category_mismatch:${index}`);
    }
  }

  return {
    id: evalCase.id,
    category: evalCase.category,
    passed: failureReasons.length === 0,
    expectedTopSlug: evalCase.expectedTopSlug,
    actualTopSlug,
    hitCount,
    failureReasons,
  };
}

/** Run the fixture (or injected cases) without exposing prompt text in output. */
export function runDivBrainLearningEvals(
  cases: readonly DivBrainLearningEvalCase[] = DIVBRAIN_LEARNING_EVAL_CASES,
): DivBrainLearningEvalReport {
  const duplicateIds = findDuplicateIds(cases);
  const caseReports = cases.map(evaluateDivBrainLearningEvalCase);
  const passed = caseReports.filter((report) => report.passed).length;
  const rawFailed = caseReports.length - passed;
  const categoriesCovered = DIVBRAIN_LEARNING_EVAL_CATEGORIES.filter((category) =>
    cases.some((evalCase) => evalCase.category === category),
  );

  return {
    schemaVersion: DIVBRAIN_LEARNING_EVAL_SCHEMA_VERSION,
    total: caseReports.length,
    passed,
    failed: rawFailed + (duplicateIds.length > 0 ? 1 : 0),
    allPassed: rawFailed === 0 && duplicateIds.length === 0,
    duplicateIds,
    categoriesCovered,
    cases: caseReports,
  };
}
