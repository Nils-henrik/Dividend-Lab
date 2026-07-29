/**
 * Deterministic context size estimation (Ticket 1A-4).
 *
 * This is **not** an exact model tokenizer. It provides a stable
 * estimated-token heuristic for budgeting and truncation tests.
 *
 * This module must never be imported by client components.
 */

import { DIVBRAIN_CONTEXT_CHARS_PER_ESTIMATED_TOKEN } from "../../constants";

/**
 * Estimate size in tokens from UTF-16 string length.
 * Empty/whitespace-only strings estimate to 0.
 */
export function estimateDivBrainContextTokens(text: string): number {
  const length = text.length;
  if (length <= 0) {
    return 0;
  }

  return Math.ceil(length / DIVBRAIN_CONTEXT_CHARS_PER_ESTIMATED_TOKEN);
}

/**
 * Truncate text to a maximum estimated-token budget without splitting
 * below a character boundary mid-grapheme cluster best-effort (code units).
 * Returns the truncated text and whether truncation occurred.
 *
 * Does not attempt to preserve partial citation identifiers inside free text
 * beyond whole-string truncation at a character index.
 */
export function truncateToEstimatedTokenBudget(
  text: string,
  maxEstimatedTokens: number,
): { text: string; truncated: boolean; estimatedTokens: number } {
  if (maxEstimatedTokens <= 0) {
    return { text: "", truncated: text.length > 0, estimatedTokens: 0 };
  }

  const maxChars =
    maxEstimatedTokens * DIVBRAIN_CONTEXT_CHARS_PER_ESTIMATED_TOKEN;
  if (text.length <= maxChars) {
    return {
      text,
      truncated: false,
      estimatedTokens: estimateDivBrainContextTokens(text),
    };
  }

  const truncatedText = text.slice(0, maxChars).trimEnd();
  return {
    text: truncatedText,
    truncated: true,
    estimatedTokens: estimateDivBrainContextTokens(truncatedText),
  };
}
