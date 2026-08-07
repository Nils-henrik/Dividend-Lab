/**
 * Deterministic Phase 1B benchmark rubric (Ticket 1B-1).
 *
 * No paid LLM judge. Suitable for CI mocks and later Founder review.
 * Reports never include raw prompts, policy text, or provider payloads.
 *
 * This module must never be imported by client components.
 */

import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "../../constants";
import { evaluateDivBrainGuardrails } from "../guardrails";
import type { DivBrainBenchmarkCase } from "./cases";
import type { DivBrainProviderResult } from "../providers/types";

export type DivBrainBenchmarkFailureCategory =
  | "provider_result_not_completed"
  | "empty_output"
  | "response_too_long"
  | "control_characters"
  | "guardrail_prompt_mismatch"
  | "unsupported_capability"
  | "rate_limited"
  | "provider_unavailable"
  | "cancelled"
  | "malformed_output"
  | "internal_error";

export type DivBrainBenchmarkRubricCheck = {
  readonly id: string;
  readonly passed: boolean;
  readonly detail?: string;
};

export type DivBrainBenchmarkRubricResult = {
  readonly passed: boolean;
  readonly checks: readonly DivBrainBenchmarkRubricCheck[];
  readonly failureCategories: readonly DivBrainBenchmarkFailureCategory[];
};

const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function uniqueCategories(
  categories: readonly DivBrainBenchmarkFailureCategory[],
): DivBrainBenchmarkFailureCategory[] {
  return [...new Set(categories)];
}

/**
 * Run deterministic local checks against a provider result + case metadata.
 * Never inspects or returns the original prompt text.
 */
export function evaluateDivBrainBenchmarkRubric(params: {
  benchmarkCase: DivBrainBenchmarkCase;
  providerResult: DivBrainProviderResult;
}): DivBrainBenchmarkRubricResult {
  const { benchmarkCase, providerResult } = params;
  const checks: DivBrainBenchmarkRubricCheck[] = [];
  const failureCategories: DivBrainBenchmarkFailureCategory[] = [];

  const promptGuardrail = evaluateDivBrainGuardrails(benchmarkCase.prompt);
  const promptDecisionOk =
    promptGuardrail.ok &&
    promptGuardrail.data.decision === benchmarkCase.expectedPromptDecision;

  checks.push({
    id: "prompt_guardrail_compatibility",
    passed: promptDecisionOk,
    detail: promptDecisionOk
      ? undefined
      : "local_guardrail_decision_mismatch",
  });
  if (!promptDecisionOk) {
    failureCategories.push("guardrail_prompt_mismatch");
  }

  if (providerResult.status === "cancelled") {
    checks.push({ id: "provider_completed", passed: false });
    failureCategories.push("cancelled", "provider_result_not_completed");
    return {
      passed: false,
      checks,
      failureCategories: uniqueCategories(failureCategories),
    };
  }

  if (providerResult.status === "provider_unavailable") {
    checks.push({ id: "provider_completed", passed: false });
    failureCategories.push(
      "provider_unavailable",
      "provider_result_not_completed",
    );
    return {
      passed: false,
      checks,
      failureCategories: uniqueCategories(failureCategories),
    };
  }

  if (providerResult.status === "failed") {
    checks.push({ id: "provider_completed", passed: false });
    failureCategories.push("provider_result_not_completed");
    if (providerResult.error.code === "rate_limited") {
      failureCategories.push("rate_limited");
    } else if (providerResult.error.code === "internal_error") {
      failureCategories.push("malformed_output");
    } else {
      failureCategories.push("internal_error");
    }
    return {
      passed: false,
      checks,
      failureCategories: uniqueCategories(failureCategories),
    };
  }

  checks.push({ id: "provider_completed", passed: true });

  const text = providerResult.text;
  const nonEmpty = text.trim().length > 0;
  checks.push({ id: "non_empty_output", passed: nonEmpty });
  if (!nonEmpty) {
    failureCategories.push("empty_output");
  }

  const maxChars = Math.min(
    benchmarkCase.maxResponseChars,
    DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
  );
  const lengthOk = text.length <= maxChars;
  checks.push({ id: "response_length_bound", passed: lengthOk });
  if (!lengthOk) {
    failureCategories.push("response_too_long");
  }

  const noControl = !CONTROL_CHARS_PATTERN.test(text);
  checks.push({ id: "no_control_characters", passed: noControl });
  if (!noControl) {
    failureCategories.push("control_characters");
  }

  // Blocked prompts should not produce a completed provider answer in the
  // product lifecycle; for isolated provider benchmarking we only flag when
  // the completed text is empty (adapter-level), not by LLM judging.
  if (benchmarkCase.kind === "blocked_safety") {
    checks.push({
      id: "blocked_case_recorded",
      passed: true,
      detail: "human_review_required",
    });
  }

  const passed = checks.every((check) => check.passed);

  return {
    passed,
    checks,
    failureCategories: uniqueCategories(failureCategories),
  };
}
