/**
 * Strict browser-input boundary for DivBrain submitMessage (Ticket 1A-7b).
 *
 * Exact-key allowlist only. Ownership, role, provider and policy injection
 * fields are rejected. Never includes raw input in errors.
 *
 * This module must never be imported by client components.
 */

import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import { validateSubmitMessageInput } from "../../validation";
import { isDivBrainUuid } from "../repository/ids";

const ALLOWED_KEYS = new Set(["conversationId", "content"] as const);

const FORBIDDEN_KEYS = [
  "actorId",
  "actor_id",
  "userId",
  "user_id",
  "ownerId",
  "owner_id",
  "role",
  "completionStatus",
  "completion_status",
  "safetyClassification",
  "safety_classification",
  "sources",
  "errorCode",
  "error_code",
  "system",
  "policy",
  "context",
  "contextBlocks",
  "provider",
  "providerId",
  "timeout",
  "timeoutMs",
  "signal",
  "userMessage",
  "assistantMessage",
  "createdAt",
  "created_at",
  "updatedAt",
  "updated_at",
] as const;

export type DivBrainParsedSubmitMessageInput = {
  conversationId: string;
  content: string;
};

/**
 * Parse unknown browser input with an exact-key allowlist, then run shared
 * domain validation/normalization.
 */
export function parseDivBrainSubmitMessageInput(
  input: unknown,
): DivBrainResult<DivBrainParsedSubmitMessageInput> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return divBrainFailureFromCode("invalid_request");
  }

  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);

  for (const key of keys) {
    if (!ALLOWED_KEYS.has(key as "conversationId" | "content")) {
      return divBrainFailureFromCode("invalid_request");
    }
  }

  for (const key of FORBIDDEN_KEYS) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      return divBrainFailureFromCode("invalid_request");
    }
  }

  if (!("conversationId" in record) || !("content" in record)) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (keys.length !== 2) {
    return divBrainFailureFromCode("invalid_request");
  }

  const validated = validateSubmitMessageInput({
    conversationId: record.conversationId as string,
    content: record.content as string,
  });

  if (!validated.ok) {
    return validated;
  }

  if (!isDivBrainUuid(validated.data.conversationId)) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess({
    conversationId: validated.data.conversationId.toLowerCase(),
    content: validated.data.content,
  });
}
