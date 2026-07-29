/**
 * Explicit untrusted-content delimiters for DivBrain context assembly.
 *
 * Structural separation is the primary prompt-injection boundary.
 * Delimiters make source/history boundaries visible to the model.
 *
 * Untrusted payloads are neutralized before wrapping so forged marker
 * sequences cannot prematurely close or open DivBrain delimiter blocks.
 *
 * This module must never be imported by client components.
 */

import type { DivBrainContextHistoryRole } from "./types";

const SOURCE_ID_SAFE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;

/**
 * Sanitize a source id for delimiter attributes.
 * Rejects characters that could break delimiter parsing.
 */
export function sanitizeDivBrainContextDelimiterId(sourceId: string): string {
  const trimmed = sourceId.trim();
  if (SOURCE_ID_SAFE_PATTERN.test(trimmed)) {
    return trimmed;
  }

  // Deterministic fallback — never invent a new citation identity.
  return "invalid_source_id";
}

/**
 * Break DivBrain delimiter marker tokens inside untrusted payloads.
 * Applied before wrapping so content cannot forge open/close markers.
 * Deterministic; does not alter structured citation metadata.
 */
export function neutralizeDivBrainDelimiterMarkers(content: string): string {
  return content.replaceAll("<<<", "<!<").replaceAll(">>>", ">!>");
}

/**
 * Wrap source excerpt as untrusted data. Metadata stays on the structured
 * source object; this is prompt text only.
 */
export function wrapUntrustedSourceContent(
  sourceId: string,
  content: string,
): string {
  const id = sanitizeDivBrainContextDelimiterId(sourceId);
  const safeContent = neutralizeDivBrainDelimiterMarkers(content);
  return [
    `<<<UNTRUSTED_SOURCE id="${id}">>>`,
    safeContent,
    `<<<END_UNTRUSTED_SOURCE>>>`,
  ].join("\n");
}

/**
 * Wrap a conversation-history turn as untrusted context data.
 * Role is informational only — not a system instruction grant.
 */
export function wrapUntrustedHistoryContent(
  role: DivBrainContextHistoryRole,
  content: string,
): string {
  const safeContent = neutralizeDivBrainDelimiterMarkers(content);
  return [
    `<<<UNTRUSTED_HISTORY role="${role}">>>`,
    safeContent,
    `<<<END_UNTRUSTED_HISTORY>>>`,
  ].join("\n");
}

/**
 * Wrap optional user-owned context (portfolio later) as untrusted labeled data.
 */
export function wrapUntrustedUserOwnedContext(content: string): string {
  const safeContent = neutralizeDivBrainDelimiterMarkers(content);
  return [
    `<<<UNTRUSTED_USER_OWNED_CONTEXT>>>`,
    safeContent,
    `<<<END_UNTRUSTED_USER_OWNED_CONTEXT>>>`,
  ].join("\n");
}

/**
 * Wrap tool results as untrusted labeled data (Phase 3+ hooks).
 */
export function wrapUntrustedToolResult(content: string): string {
  const safeContent = neutralizeDivBrainDelimiterMarkers(content);
  return [
    `<<<UNTRUSTED_TOOL_RESULT>>>`,
    safeContent,
    `<<<END_UNTRUSTED_TOOL_RESULT>>>`,
  ].join("\n");
}
