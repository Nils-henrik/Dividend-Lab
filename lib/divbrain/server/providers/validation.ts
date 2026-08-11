/**
 * Deterministic DivBrain provider-request validation (Ticket 1A-5).
 *
 * Structural checks only — no network, env, time, randomness, or SDK calls.
 * This module must never be imported by client components.
 */

import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "../../constants";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import { isDivBrainMessageRole } from "../../validation";
import {
  DIVBRAIN_PROVIDER_CONTEXT_BLOCK_KINDS,
  DIVBRAIN_PROVIDER_TIMEOUT_MS_MAX,
  DIVBRAIN_PROVIDER_TIMEOUT_MS_MIN,
  type DivBrainProviderContextBlock,
  type DivBrainProviderContextBlockKind,
  type DivBrainProviderMessage,
  type DivBrainProviderRequest,
  type DivBrainProviderUsage,
} from "./types";

export type { DivBrainProviderMessage };

const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function isProviderContextBlockKind(
  value: unknown,
): value is DivBrainProviderContextBlockKind {
  return (
    typeof value === "string" &&
    (DIVBRAIN_PROVIDER_CONTEXT_BLOCK_KINDS as readonly string[]).includes(value)
  );
}

/** User-owned attachment extracts may exceed ordinary message length. */
const USER_OWNED_CONTEXT_MAX_LENGTH = 50_000;

function normalizeProviderText(
  content: unknown,
  maxLength: number = DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
): string | null {
  if (typeof content !== "string") {
    return null;
  }

  const normalized = content.normalize("NFC").trim();

  if (!normalized || normalized.length > maxLength) {
    return null;
  }

  if (CONTROL_CHARS_PATTERN.test(normalized)) {
    return null;
  }

  return normalized;
}

function validateContentParts(
  value: unknown,
): DivBrainProviderMessage["content"] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const parts: Array<
    | { type: "text"; text: string }
    | { type: "file"; mediaType: string; data: Uint8Array; filename?: string }
  > = [];

  for (const part of value) {
    if (typeof part !== "object" || part === null) {
      return null;
    }
    const candidate = part as Record<string, unknown>;
    if (candidate.type === "text") {
      const text = normalizeProviderText(candidate.text);
      if (text === null) {
        return null;
      }
      parts.push({ type: "text", text });
      continue;
    }
    if (candidate.type === "file") {
      if (
        typeof candidate.mediaType !== "string" ||
        candidate.mediaType.trim().length === 0 ||
        candidate.mediaType.length > 120
      ) {
        return null;
      }
      if (!(candidate.data instanceof Uint8Array) || candidate.data.byteLength === 0) {
        return null;
      }
      if (
        candidate.filename !== undefined &&
        (typeof candidate.filename !== "string" ||
          candidate.filename.trim().length === 0 ||
          candidate.filename.length > 200)
      ) {
        return null;
      }
      parts.push({
        type: "file",
        mediaType: candidate.mediaType.trim(),
        data: candidate.data,
        ...(typeof candidate.filename === "string"
          ? { filename: candidate.filename.trim() }
          : {}),
      });
      continue;
    }
    return null;
  }

  return parts;
}

function validateContextBlock(
  value: unknown,
): DivBrainProviderContextBlock | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<DivBrainProviderContextBlock>;
  if (!isProviderContextBlockKind(candidate.kind)) {
    return null;
  }

  const maxLength =
    candidate.kind === "user_owned_context"
      ? USER_OWNED_CONTEXT_MAX_LENGTH
      : DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH;

  const content = normalizeProviderText(candidate.content, maxLength);
  if (content === null) {
    return null;
  }

  return { kind: candidate.kind, content };
}

function validateProviderMessage(
  value: unknown,
): DivBrainProviderMessage | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<DivBrainProviderMessage>;
  if (!isDivBrainMessageRole(candidate.role)) {
    return null;
  }

  if (typeof candidate.content === "string") {
    const content = normalizeProviderText(candidate.content);
    if (content === null) {
      return null;
    }
    return { role: candidate.role, content };
  }

  // Multimodal content is only valid on user messages.
  if (candidate.role !== "user") {
    return null;
  }

  const parts = validateContentParts(candidate.content);
  if (parts === null) {
    return null;
  }

  return { role: candidate.role, content: parts };
}

/**
 * Normalize optional token-usage hooks. Invalid or negative numbers are dropped.
 * Does not compute cost.
 */
export function normalizeDivBrainProviderUsage(
  usage: unknown,
): DivBrainProviderUsage {
  if (typeof usage !== "object" || usage === null) {
    return {};
  }

  const candidate = usage as Record<string, unknown>;
  const normalized: DivBrainProviderUsage = {};

  for (const key of ["inputTokens", "outputTokens", "totalTokens"] as const) {
    const value = candidate[key];
    if (
      typeof value === "number" &&
      Number.isFinite(value) &&
      value >= 0 &&
      Number.isInteger(value)
    ) {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Validate and normalize a provider request.
 * Returns `invalid_request` on structural failure — never throws.
 */
export function validateDivBrainProviderRequest(
  input: unknown,
): DivBrainResult<DivBrainProviderRequest> {
  if (typeof input !== "object" || input === null) {
    return divBrainFailureFromCode("invalid_request");
  }

  const candidate = input as Partial<DivBrainProviderRequest>;

  if (
    typeof candidate.timeoutMs !== "number" ||
    !Number.isFinite(candidate.timeoutMs) ||
    !Number.isInteger(candidate.timeoutMs) ||
    candidate.timeoutMs < DIVBRAIN_PROVIDER_TIMEOUT_MS_MIN ||
    candidate.timeoutMs > DIVBRAIN_PROVIDER_TIMEOUT_MS_MAX
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (!Array.isArray(candidate.contextBlocks)) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (!Array.isArray(candidate.messages) || candidate.messages.length === 0) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (!Array.isArray(candidate.sources)) {
    return divBrainFailureFromCode("invalid_request");
  }

  // Sources are typed by the assembler; require plain objects only here.
  for (const source of candidate.sources) {
    if (typeof source !== "object" || source === null) {
      return divBrainFailureFromCode("invalid_request");
    }
  }

  if (candidate.signal !== undefined) {
    if (typeof AbortSignal !== "undefined") {
      if (!(candidate.signal instanceof AbortSignal)) {
        return divBrainFailureFromCode("invalid_request");
      }
    } else if (
      typeof candidate.signal !== "object" ||
      candidate.signal === null ||
      typeof (candidate.signal as { aborted?: unknown }).aborted !== "boolean"
    ) {
      return divBrainFailureFromCode("invalid_request");
    }
  }

  const contextBlocks: DivBrainProviderContextBlock[] = [];
  for (const block of candidate.contextBlocks) {
    const validated = validateContextBlock(block);
    if (!validated) {
      return divBrainFailureFromCode("invalid_request");
    }
    contextBlocks.push(validated);
  }

  const messages: DivBrainProviderMessage[] = [];
  for (const message of candidate.messages) {
    const validated = validateProviderMessage(message);
    if (!validated) {
      return divBrainFailureFromCode("invalid_request");
    }
    messages.push(validated);
  }

  return divBrainSuccess({
    contextBlocks,
    messages,
    sources: candidate.sources,
    signal: candidate.signal,
    timeoutMs: candidate.timeoutMs,
  });
}
