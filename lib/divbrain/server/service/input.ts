/**
 * Strict browser-input boundary for DivBrain submitMessage (Ticket 1A-7b / #166).
 *
 * Exact-key allowlist only. Ownership, role, provider and policy injection
 * fields are rejected. Never includes raw input in errors.
 *
 * This module must never be imported by client components.
 */

import { formatDivBrainAttachmentOnlyLabel } from "../../attachments";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "../../constants";
import { isDivBrainUuid } from "../repository/ids";

const ALLOWED_KEYS = new Set([
  "conversationId",
  "content",
  "attachmentIds",
] as const);

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
  attachmentIds: readonly string[];
};

/**
 * Accept only plain objects:
 * - prototype `Object.prototype`, or
 * - prototype `null` (`Object.create(null)`), treated as a plain dictionary
 *
 * Reject class instances, Date, Map, Set, RegExp, boxed primitives, etc.
 * Prototype inspection failures become `invalid_request` (never throw).
 */
export function isPlainDivBrainSubmitMessageObject(
  value: unknown,
): value is Record<string, unknown> {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }

    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  } catch {
    return false;
  }
}

function parseAttachmentIds(value: unknown): DivBrainResult<readonly string[]> {
  if (value === undefined) {
    return divBrainSuccess([]);
  }
  if (!Array.isArray(value)) {
    return divBrainFailureFromCode("invalid_request");
  }
  if (value.length > 4) {
    return divBrainFailureFromCode("invalid_request");
  }

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || !isDivBrainUuid(entry)) {
      return divBrainFailureFromCode("invalid_request");
    }
    const normalized = entry.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    ids.push(normalized);
  }
  return divBrainSuccess(ids);
}

function normalizeOptionalContent(content: unknown): DivBrainResult<string> {
  if (typeof content !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }
  const normalized = content.normalize("NFC").trim();
  if (normalized.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
    return divBrainFailureFromCode("invalid_request");
  }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) {
    return divBrainFailureFromCode("invalid_request");
  }
  return divBrainSuccess(normalized);
}

/**
 * Parse unknown browser input with an exact-key allowlist, then run shared
 * domain validation/normalization.
 *
 * Attachment-only submits are allowed when `attachmentIds` is non-empty; the
 * service synthesizes a clear Swedish label before persistence.
 */
export function parseDivBrainSubmitMessageInput(
  input: unknown,
): DivBrainResult<DivBrainParsedSubmitMessageInput> {
  try {
    if (!isPlainDivBrainSubmitMessageObject(input)) {
      return divBrainFailureFromCode("invalid_request");
    }

    const record = input;
    const keys = Object.keys(record);

    for (const key of keys) {
      if (
        !ALLOWED_KEYS.has(
          key as "conversationId" | "content" | "attachmentIds",
        )
      ) {
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

    if (keys.length < 2 || keys.length > 3) {
      return divBrainFailureFromCode("invalid_request");
    }

    if (
      keys.length === 3 &&
      !Object.prototype.hasOwnProperty.call(record, "attachmentIds")
    ) {
      return divBrainFailureFromCode("invalid_request");
    }

    if (
      typeof record.conversationId !== "string" ||
      !isDivBrainUuid(record.conversationId)
    ) {
      return divBrainFailureFromCode("invalid_request");
    }

    const contentResult = normalizeOptionalContent(record.content);
    if (!contentResult.ok) {
      return contentResult;
    }

    const attachmentIdsResult = parseAttachmentIds(record.attachmentIds);
    if (!attachmentIdsResult.ok) {
      return attachmentIdsResult;
    }

    if (
      contentResult.data.length === 0 &&
      attachmentIdsResult.data.length === 0
    ) {
      return divBrainFailureFromCode("invalid_request");
    }

    return divBrainSuccess({
      conversationId: record.conversationId.toLowerCase(),
      content: contentResult.data,
      attachmentIds: attachmentIdsResult.data,
    });
  } catch {
    return divBrainFailureFromCode("invalid_request");
  }
}

/**
 * Build the persisted user-message label when the composer sent attachments.
 * Text content wins when present; otherwise a clear Swedish attachment label.
 */
export function resolveDivBrainSubmitMessageContent(params: {
  content: string;
  filenames: readonly string[];
}): DivBrainResult<string> {
  if (params.content.length > 0) {
    if (params.content.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
      return divBrainFailureFromCode("invalid_request");
    }
    return divBrainSuccess(params.content);
  }

  if (params.filenames.length === 0) {
    return divBrainFailureFromCode("invalid_request");
  }

  const label = formatDivBrainAttachmentOnlyLabel(params.filenames);
  if (label.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
    return divBrainFailureFromCode("invalid_request");
  }
  return divBrainSuccess(label);
}
