/**
 * Foundational DivBrain input validation.
 * Deterministic length/role/status checks only — no guardrails, HTML, or finance analysis.
 */

import {
  DIVBRAIN_COMPLETION_STATUSES,
  DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
  DIVBRAIN_MESSAGE_ROLES,
  DIVBRAIN_TITLE_MAX_LENGTH,
} from "./constants";
import type {
  CreateConversationInput,
  DivBrainCompletionStatus,
  DivBrainMessageRole,
  RenameConversationInput,
  SubmitMessageInput,
} from "./types";
import type { DivBrainResult } from "./results";
import { divBrainFailureFromCode, divBrainSuccess } from "./results";

export function isDivBrainMessageRole(
  value: unknown,
): value is DivBrainMessageRole {
  return (
    typeof value === "string" &&
    (DIVBRAIN_MESSAGE_ROLES as readonly string[]).includes(value)
  );
}

export function isDivBrainCompletionStatus(
  value: unknown,
): value is DivBrainCompletionStatus {
  return (
    typeof value === "string" &&
    (DIVBRAIN_COMPLETION_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeDivBrainTitle(
  title: string,
): DivBrainResult<string> {
  const normalized = title.trim();

  if (!normalized) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (normalized.length > DIVBRAIN_TITLE_MAX_LENGTH) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(normalized);
}

export function normalizeDivBrainMessageContent(
  content: string,
): DivBrainResult<string> {
  const normalized = content.trim();

  if (!normalized) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (normalized.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(normalized);
}

export function validateCreateConversationInput(
  input: CreateConversationInput,
): DivBrainResult<{ title?: string }> {
  if (input.title === undefined) {
    return divBrainSuccess({});
  }

  if (typeof input.title !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const titleResult = normalizeDivBrainTitle(input.title);
  if (!titleResult.ok) {
    return titleResult;
  }

  return divBrainSuccess({ title: titleResult.data });
}

export function validateRenameConversationInput(
  input: RenameConversationInput,
): DivBrainResult<{ conversationId: string; title: string }> {
  if (
    typeof input.conversationId !== "string" ||
    input.conversationId.trim().length === 0
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (typeof input.title !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const titleResult = normalizeDivBrainTitle(input.title);
  if (!titleResult.ok) {
    return titleResult;
  }

  return divBrainSuccess({
    conversationId: input.conversationId.trim(),
    title: titleResult.data,
  });
}

export function validateSubmitMessageInput(
  input: SubmitMessageInput,
): DivBrainResult<{ conversationId: string; content: string }> {
  if (
    typeof input.conversationId !== "string" ||
    input.conversationId.trim().length === 0
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (typeof input.content !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const contentResult = normalizeDivBrainMessageContent(input.content);
  if (!contentResult.ok) {
    return contentResult;
  }

  return divBrainSuccess({
    conversationId: input.conversationId.trim(),
    content: contentResult.data,
  });
}

export function validateDivBrainMessageRole(
  value: unknown,
): DivBrainResult<DivBrainMessageRole> {
  if (!isDivBrainMessageRole(value)) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(value);
}

export function validateDivBrainCompletionStatus(
  value: unknown,
): DivBrainResult<DivBrainCompletionStatus> {
  if (!isDivBrainCompletionStatus(value)) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(value);
}
