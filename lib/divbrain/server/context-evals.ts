/**
 * Pure deterministic runner for DivBrain context-assembly eval fixtures.
 *
 * Safe reports omit raw prompt/source bodies. No network or provider calls.
 *
 * This module must never be imported by client components.
 */

import { assembleDivBrainContext } from "./context";
import {
  DIVBRAIN_CONTEXT_EVAL_CASES,
  DIVBRAIN_CONTEXT_EVAL_SCHEMA_VERSION,
  type DivBrainContextEvalCase,
  type DivBrainContextEvalCategory,
} from "./context-eval-fixtures";

export {
  DIVBRAIN_CONTEXT_EVAL_CASES,
  DIVBRAIN_CONTEXT_EVAL_SCHEMA_VERSION,
};
export type { DivBrainContextEvalCase, DivBrainContextEvalCategory };

export type DivBrainContextEvalCaseReport = {
  id: string;
  category: DivBrainContextEvalCategory;
  passed: boolean;
  failureReasons: string[];
};

export type DivBrainContextEvalReport = {
  schemaVersion: typeof DIVBRAIN_CONTEXT_EVAL_SCHEMA_VERSION;
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  duplicateIds: string[];
  cases: DivBrainContextEvalCaseReport[];
};

function findDuplicateIds(cases: readonly DivBrainContextEvalCase[]): string[] {
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

function evaluateCase(
  evalCase: DivBrainContextEvalCase,
): DivBrainContextEvalCaseReport {
  const failureReasons: string[] = [];
  const result = assembleDivBrainContext(evalCase.input);

  if (!result.ok) {
    return {
      id: evalCase.id,
      category: evalCase.category,
      passed: false,
      failureReasons: [`assembly_failed:${result.error.code}`],
    };
  }

  const assembled = result.data;
  const kinds = assembled.sections.map((section) => section.kind);

  for (const required of evalCase.expected.mustIncludeSectionKinds) {
    if (!kinds.includes(required as (typeof kinds)[number])) {
      failureReasons.push(`missing_section:${required}`);
    }
  }

  if (evalCase.expected.mustKeepUserRequest) {
    const userSection = assembled.sections.find(
      (section) => section.kind === "user_request",
    );
    if (!userSection || userSection.trust !== "user_input") {
      failureReasons.push("user_request_missing_or_wrong_trust");
    }
  }

  if (evalCase.expected.mustKeepPolicy) {
    const policySection = assembled.sections.find(
      (section) => section.kind === "policy",
    );
    if (!policySection || policySection.trust !== "trusted_system") {
      failureReasons.push("policy_missing_or_wrong_trust");
    }
  }

  if (evalCase.expected.historyMustNotBecomeSystem) {
    for (const section of assembled.sections) {
      if (
        section.kind === "conversation_history" &&
        section.trust !== "untrusted_context"
      ) {
        failureReasons.push("history_trust_violation");
      }
    }
    for (const turn of assembled.historyTurns) {
      if (turn.role !== "user" && turn.role !== "assistant") {
        failureReasons.push("history_role_violation");
      }
    }
  }

  if (evalCase.expected.sourceContentMustRemainUntrusted) {
    for (const section of assembled.sections) {
      if (
        (section.kind === "sources" || section.kind === "knowledge") &&
        section.trust !== "untrusted_context"
      ) {
        failureReasons.push("source_trust_violation");
      }
      if (
        (section.kind === "sources" || section.kind === "knowledge") &&
        !section.content.includes("<<<UNTRUSTED_SOURCE")
      ) {
        failureReasons.push("source_delimiter_missing");
      }
    }
  }

  if (
    evalCase.expected.expectTruncation === true &&
    !assembled.diagnostics.truncated
  ) {
    failureReasons.push("expected_truncation");
  }

  if (
    evalCase.expected.minIncludedSources !== undefined &&
    assembled.includedSources.length < evalCase.expected.minIncludedSources
  ) {
    failureReasons.push("too_few_sources");
  }

  if (
    evalCase.expected.maxIncludedSources !== undefined &&
    assembled.includedSources.length > evalCase.expected.maxIncludedSources
  ) {
    failureReasons.push("too_many_sources");
  }

  // Traceability: included sources must retain ids.
  for (const source of assembled.includedSources) {
    if (!source.id || !source.title) {
      failureReasons.push("source_metadata_lost");
    }
  }

  return {
    id: evalCase.id,
    category: evalCase.category,
    passed: failureReasons.length === 0,
    failureReasons,
  };
}

/**
 * Run context-assembly eval fixtures. Pure — no I/O, time, or randomness.
 */
export function runDivBrainContextEvals(
  cases: readonly DivBrainContextEvalCase[] = DIVBRAIN_CONTEXT_EVAL_CASES,
): DivBrainContextEvalReport {
  const duplicateIds = findDuplicateIds(cases);
  const reports = cases.map(evaluateCase);
  const passed = reports.filter((report) => report.passed).length;
  const failed = reports.length - passed;

  return {
    schemaVersion: DIVBRAIN_CONTEXT_EVAL_SCHEMA_VERSION,
    total: reports.length,
    passed,
    failed: failed + (duplicateIds.length > 0 ? 1 : 0),
    allPassed: failed === 0 && duplicateIds.length === 0,
    duplicateIds,
    cases: reports,
  };
}
