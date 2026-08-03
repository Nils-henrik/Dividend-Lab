/**
 * Strict parser for DIVBRAIN_ALPHA_USER_IDS (Ticket 1A-8).
 *
 * Fail-closed: any malformed entry rejects the entire configuration.
 * Never returns the raw environment string in errors.
 *
 * This module must never be imported by client components.
 */

import { isDivBrainUuid } from "../repository/ids";
import {
  DIVBRAIN_ALPHA_USER_IDS_MAX_ENTRIES,
  type DivBrainAlphaAllowlistParseResult,
} from "./types";

/**
 * Parse an unknown allowlist configuration value into canonical lowercase UUIDs.
 *
 * Delimiter: comma. Entries are trimmed. Duplicates are removed.
 * Partial acceptance of malformed lists is never performed.
 */
export function parseDivBrainAlphaUserIds(
  value: unknown,
): DivBrainAlphaAllowlistParseResult {
  if (value === undefined || value === null) {
    return { ok: false, reason: "missing" };
  }

  if (typeof value !== "string") {
    return { ok: false, reason: "invalid_type" };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }

  const tokens = trimmed.split(",");
  if (tokens.length > DIVBRAIN_ALPHA_USER_IDS_MAX_ENTRIES) {
    return { ok: false, reason: "too_many_entries" };
  }

  const normalized = new Set<string>();

  for (const token of tokens) {
    const entry = token.trim();
    if (!entry) {
      return { ok: false, reason: "malformed_entry" };
    }

    if (!isDivBrainUuid(entry)) {
      return { ok: false, reason: "malformed_entry" };
    }

    normalized.add(entry.toLowerCase());
  }

  if (normalized.size === 0) {
    return { ok: false, reason: "empty" };
  }

  if (normalized.size > DIVBRAIN_ALPHA_USER_IDS_MAX_ENTRIES) {
    return { ok: false, reason: "too_many_entries" };
  }

  return { ok: true, userIds: normalized };
}
