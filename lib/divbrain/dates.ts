/**
 * Deterministic Swedish date formatting for DivBrain UI.
 * Safe for server and client — no hydration-sensitive relative times.
 */

import { parseDate, STOCKHOLM_LOCALE, STOCKHOLM_TIME_ZONE } from "@/lib/time";

const UNKNOWN_TIME = "Okänd tid";

const conversationListFormatter = new Intl.DateTimeFormat(STOCKHOLM_LOCALE, {
  timeZone: STOCKHOLM_TIME_ZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
});

const messageTimestampFormatter = new Intl.DateTimeFormat(STOCKHOLM_LOCALE, {
  timeZone: STOCKHOLM_TIME_ZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Concise Swedish timestamp for conversation-list rows.
 * Malformed values map to a safe fallback — never throws.
 */
export function formatDivBrainConversationTimestamp(
  value: string | null | undefined,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return UNKNOWN_TIME;
  }

  const date = parseDate(value);
  if (!date) {
    return UNKNOWN_TIME;
  }

  try {
    return conversationListFormatter.format(date);
  } catch {
    return UNKNOWN_TIME;
  }
}

/**
 * Secondary Swedish timestamp for transcript messages.
 * Malformed values map to a safe fallback — never throws.
 */
export function formatDivBrainMessageTimestamp(
  value: string | null | undefined,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    return UNKNOWN_TIME;
  }

  const date = parseDate(value);
  if (!date) {
    return UNKNOWN_TIME;
  }

  try {
    return messageTimestampFormatter.format(date);
  } catch {
    return UNKNOWN_TIME;
  }
}
