/**
 * Cursor pagination for DivBrain repository lists.
 *
 * Conversations: updated_at DESC, id DESC
 * Messages: created_at ASC, id ASC
 *
 * Cursors are base64url JSON of opaque timestamp + id pairs — no secrets.
 */

import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import { isDivBrainUuid } from "./ids";

export const DIVBRAIN_REPOSITORY_DEFAULT_PAGE_SIZE = 20;
export const DIVBRAIN_REPOSITORY_MAX_PAGE_SIZE = 50;

export type DivBrainConversationCursor = {
  updatedAt: string;
  id: string;
};

export type DivBrainMessageCursor = {
  createdAt: string;
  id: string;
};

export type DivBrainPageSize = number;

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function encodeCursorPayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursorPayload(cursor: string): unknown {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

export function normalizeDivBrainPageSize(
  pageSize: unknown,
): DivBrainResult<DivBrainPageSize> {
  if (pageSize === undefined || pageSize === null) {
    return divBrainSuccess(DIVBRAIN_REPOSITORY_DEFAULT_PAGE_SIZE);
  }

  if (
    typeof pageSize !== "number" ||
    !Number.isInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > DIVBRAIN_REPOSITORY_MAX_PAGE_SIZE
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(pageSize);
}

export function encodeConversationCursor(
  cursor: DivBrainConversationCursor,
): string {
  return encodeCursorPayload({
    v: 1,
    k: "conversation",
    u: cursor.updatedAt,
    i: cursor.id,
  });
}

export function decodeConversationCursor(
  cursor: unknown,
): DivBrainResult<DivBrainConversationCursor> {
  if (typeof cursor !== "string" || cursor.trim().length === 0) {
    return divBrainFailureFromCode("invalid_request");
  }

  const payload = decodeCursorPayload(cursor.trim());
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("v" in payload) ||
    !("k" in payload) ||
    !("u" in payload) ||
    !("i" in payload)
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  const record = payload as {
    v: unknown;
    k: unknown;
    u: unknown;
    i: unknown;
  };

  if (
    record.v !== 1 ||
    record.k !== "conversation" ||
    !isIsoTimestamp(record.u) ||
    !isDivBrainUuid(record.i)
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess({
    updatedAt: record.u,
    id: record.i.toLowerCase(),
  });
}

export function encodeMessageCursor(cursor: DivBrainMessageCursor): string {
  return encodeCursorPayload({
    v: 1,
    k: "message",
    c: cursor.createdAt,
    i: cursor.id,
  });
}

export function decodeMessageCursor(
  cursor: unknown,
): DivBrainResult<DivBrainMessageCursor> {
  if (typeof cursor !== "string" || cursor.trim().length === 0) {
    return divBrainFailureFromCode("invalid_request");
  }

  const payload = decodeCursorPayload(cursor.trim());
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("v" in payload) ||
    !("k" in payload) ||
    !("c" in payload) ||
    !("i" in payload)
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  const record = payload as {
    v: unknown;
    k: unknown;
    c: unknown;
    i: unknown;
  };

  if (
    record.v !== 1 ||
    record.k !== "message" ||
    !isIsoTimestamp(record.c) ||
    !isDivBrainUuid(record.i)
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess({
    createdAt: record.c,
    id: record.i.toLowerCase(),
  });
}
