/**
 * DivBrain Ticket 1A-3b — expanded guardrail evaluation fixtures and runner.
 *
 * Static fixtures (72) + pure deterministic runner. Safe reports never include
 * raw prompt text, matched substrings, or regex details.
 *
 * This module must never be imported by client components.
 * Executable CI wiring is deferred to an approved test-foundation ticket.
 */

import {
  DIVBRAIN_GUARDRAIL_POLICY_VERSION,
  isDivBrainGuardrailAssessment,
  normalizeDivBrainGuardrailConstraints,
  normalizeDivBrainGuardrailReasonCodes,
  type DivBrainGuardrailConstraint,
  type DivBrainGuardrailDecision,
  type DivBrainGuardrailPublicMessageKey,
  type DivBrainGuardrailReasonCode,
} from "../guardrails";
import { evaluateDivBrainGuardrails } from "./guardrails";
import {
  DIVBRAIN_GUARDRAIL_EVAL_CASES,
  DIVBRAIN_GUARDRAIL_EVAL_CATEGORIES,
  type DivBrainGuardrailEvalCase,
  type DivBrainGuardrailEvalCategory,
} from "./guardrail-eval-fixtures";

export const DIVBRAIN_GUARDRAIL_EVAL_SCHEMA_VERSION = 1 as const;

export {
  DIVBRAIN_GUARDRAIL_EVAL_CASES,
  DIVBRAIN_GUARDRAIL_EVAL_CATEGORIES,
};
export type { DivBrainGuardrailEvalCase, DivBrainGuardrailEvalCategory };

export type DivBrainGuardrailEvalCaseReport = {
  id: string;
  category: DivBrainGuardrailEvalCategory;
  passed: boolean;
  expectedDecision: DivBrainGuardrailDecision;
  actualDecision?: DivBrainGuardrailDecision;
  expectedReasonCodes: DivBrainGuardrailReasonCode[];
  actualReasonCodes?: DivBrainGuardrailReasonCode[];
  expectedConstraints: DivBrainGuardrailConstraint[];
  actualConstraints?: DivBrainGuardrailConstraint[];
  expectedPolicyVersion: typeof DIVBRAIN_GUARDRAIL_POLICY_VERSION;
  actualPolicyVersion?: typeof DIVBRAIN_GUARDRAIL_POLICY_VERSION;
  expectedPublicMessageKey: DivBrainGuardrailPublicMessageKey;
  actualPublicMessageKey?: DivBrainGuardrailPublicMessageKey;
  failureReasons: string[];
};

export type DivBrainGuardrailEvalReport = {
  schemaVersion: typeof DIVBRAIN_GUARDRAIL_EVAL_SCHEMA_VERSION;
  policyVersion: typeof DIVBRAIN_GUARDRAIL_POLICY_VERSION;
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  duplicateIds: string[];
  cases: DivBrainGuardrailEvalCaseReport[];
};

function findDuplicateIds(cases: readonly DivBrainGuardrailEvalCase[]): string[] {
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

function sameStringArray(actual: readonly string[], expected: readonly string[]): boolean {
  if (actual.length !== expected.length) {
    return false;
  }

  for (let i = 0; i < expected.length; i += 1) {
    if (actual[i] !== expected[i]) {
      return false;
    }
  }

  return true;
}

export function evaluateDivBrainGuardrailEvalCase(
  evalCase: DivBrainGuardrailEvalCase,
): DivBrainGuardrailEvalCaseReport {
  const failureReasons: string[] = [];
  const expectedReasonCodes = normalizeDivBrainGuardrailReasonCodes(
    evalCase.expectedReasonCodes,
  );
  const expectedConstraints = normalizeDivBrainGuardrailConstraints(
    evalCase.expectedConstraints,
  );
  const result = evaluateDivBrainGuardrails(evalCase.prompt);

  if (!result.ok) {
    return {
      id: evalCase.id,
      category: evalCase.category,
      passed: false,
      expectedDecision: evalCase.expectedDecision,
      expectedReasonCodes,
      expectedConstraints,
      expectedPolicyVersion: evalCase.expectedPolicyVersion,
      expectedPublicMessageKey: evalCase.expectedPublicMessageKey,
      failureReasons: [`technical_error:${result.error.code}`],
    };
  }

  const assessment = result.data;

  if (!isDivBrainGuardrailAssessment(assessment)) {
    failureReasons.push("assessment_shape_invalid");
  }

  if (assessment.policyVersion !== evalCase.expectedPolicyVersion) {
    failureReasons.push(
      `policyVersion expected ${String(evalCase.expectedPolicyVersion)}, got ${String(assessment.policyVersion)}`,
    );
  }

  if (assessment.decision !== evalCase.expectedDecision) {
    failureReasons.push(
      `decision expected ${evalCase.expectedDecision}, got ${assessment.decision}`,
    );
  }

  if (!sameStringArray(assessment.reasonCodes, expectedReasonCodes)) {
    failureReasons.push(
      `reasonCodes expected [${expectedReasonCodes.join(", ")}], got [${assessment.reasonCodes.join(", ")}]`,
    );
  }

  if (!sameStringArray(assessment.constraints, expectedConstraints)) {
    failureReasons.push(
      `constraints expected [${expectedConstraints.join(", ")}], got [${assessment.constraints.join(", ")}]`,
    );
  }

  if (assessment.publicMessageKey !== evalCase.expectedPublicMessageKey) {
    failureReasons.push(
      `publicMessageKey expected ${evalCase.expectedPublicMessageKey}, got ${assessment.publicMessageKey}`,
    );
  }

  const assessmentRecord = assessment as unknown as Record<string, unknown>;
  for (const leakedKey of [
    "prompt",
    "content",
    "userText",
    "rawPrompt",
    "matchedText",
    "regex",
    "ruleId",
  ]) {
    if (leakedKey in assessmentRecord) {
      failureReasons.push(`assessment_leaked_field:${leakedKey}`);
    }
  }

  return {
    id: evalCase.id,
    category: evalCase.category,
    passed: failureReasons.length === 0,
    expectedDecision: evalCase.expectedDecision,
    actualDecision: assessment.decision,
    expectedReasonCodes,
    actualReasonCodes: assessment.reasonCodes,
    expectedConstraints,
    actualConstraints: assessment.constraints,
    expectedPolicyVersion: evalCase.expectedPolicyVersion,
    actualPolicyVersion: assessment.policyVersion,
    expectedPublicMessageKey: evalCase.expectedPublicMessageKey,
    actualPublicMessageKey: assessment.publicMessageKey,
    failureReasons,
  };
}

/**
 * Run the expanded suite (or an injected case list).
 * Reports omit prompts by design and do not mutate fixtures.
 */
export function runDivBrainGuardrailEvals(
  cases: readonly DivBrainGuardrailEvalCase[] = DIVBRAIN_GUARDRAIL_EVAL_CASES,
): DivBrainGuardrailEvalReport {
  const duplicateIds = findDuplicateIds(cases);
  const caseReports = cases.map(evaluateDivBrainGuardrailEvalCase);
  const passed = caseReports.filter((report) => report.passed).length;
  const failed = caseReports.length - passed;

  return {
    schemaVersion: DIVBRAIN_GUARDRAIL_EVAL_SCHEMA_VERSION,
    policyVersion: DIVBRAIN_GUARDRAIL_POLICY_VERSION,
    total: caseReports.length,
    passed,
    failed: failed + (duplicateIds.length > 0 ? 1 : 0),
    allPassed: failed === 0 && duplicateIds.length === 0,
    duplicateIds,
    cases: caseReports,
  };
}
