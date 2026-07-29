/**
 * Map Ticket 1A-6 persistence rows to DivBrain domain models.
 * Mapping never mutates source objects and never leaks ownership ids.
 */

import type { DivBrainConversation, DivBrainMessage } from "../../types";
import {
  isDivBrainCompletionStatus,
  isDivBrainMessageRole,
} from "../../validation";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type {
  DivBrainConversationRow,
  DivBrainMessageRow,
} from "./rows";
import { isDivBrainUuid } from "./ids";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  return Number.isFinite(Date.parse(value));
}

/** Map a conversation row to the shared domain conversation (no user_id). */
export function mapConversationRowToDomain(
  row: DivBrainConversationRow,
): DivBrainResult<DivBrainConversation> {
  if (
    !isDivBrainUuid(row.id) ||
    !isNonEmptyString(row.title) ||
    !isIsoTimestamp(row.created_at) ||
    !isIsoTimestamp(row.updated_at) ||
    (row.summary !== null && typeof row.summary !== "string") ||
    (row.archived_at !== null && !isIsoTimestamp(row.archived_at))
  ) {
    return divBrainFailureFromCode("persistence_failed");
  }

  const conversation: DivBrainConversation = {
    id: row.id.toLowerCase(),
    title: row.title,
    summary: row.summary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
  };

  return divBrainSuccess(conversation);
}

/**
 * Map a message row to the shared domain message.
 * Omits DB-only fields: safety_classification, sources, error_code.
 */
export function mapMessageRowToDomain(
  row: DivBrainMessageRow,
): DivBrainResult<DivBrainMessage> {
  if (
    !isDivBrainUuid(row.id) ||
    !isDivBrainUuid(row.conversation_id) ||
    !isDivBrainMessageRole(row.role) ||
    typeof row.content !== "string" ||
    !isDivBrainCompletionStatus(row.completion_status) ||
    !isIsoTimestamp(row.created_at)
  ) {
    return divBrainFailureFromCode("persistence_failed");
  }

  const message: DivBrainMessage = {
    id: row.id.toLowerCase(),
    conversationId: row.conversation_id.toLowerCase(),
    role: row.role,
    content: row.content,
    completionStatus: row.completion_status,
    createdAt: row.created_at,
  };

  return divBrainSuccess(message);
}

/** Type guard used when validating unknown DB payloads. */
export function isConversationRow(
  value: unknown,
): value is DivBrainConversationRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Partial<DivBrainConversationRow>;
  return (
    typeof row.id === "string" &&
    typeof row.user_id === "string" &&
    typeof row.title === "string" &&
    (row.summary === null || typeof row.summary === "string") &&
    typeof row.schema_version === "number" &&
    typeof row.created_at === "string" &&
    typeof row.updated_at === "string" &&
    (row.archived_at === null || typeof row.archived_at === "string")
  );
}

export function isMessageRow(value: unknown): value is DivBrainMessageRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const row = value as Partial<DivBrainMessageRow>;
  return (
    typeof row.id === "string" &&
    typeof row.conversation_id === "string" &&
    typeof row.role === "string" &&
    typeof row.content === "string" &&
    typeof row.completion_status === "string" &&
    (row.safety_classification === null ||
      typeof row.safety_classification === "string") &&
    row.sources !== undefined &&
    (row.error_code === null || typeof row.error_code === "string") &&
    typeof row.created_at === "string"
  );
}
