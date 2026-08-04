/**
 * Safe PostgREST failure classification for DivBrain persistence.
 *
 * Maps known stable error codes to fixed internal kinds.
 * A present unknown code always takes precedence over message heuristics.
 * Never logs or returns raw messages, URLs, or identifiers.
 *
 * Server-only — must never be imported by client components.
 */

import type { DivBrainPersistenceError } from "./persistence";

/**
 * Narrow internal classification used by the persistence adapter.
 * A subset of `DivBrainPersistenceError["kind"]` produced from PostgREST.
 */
export type DivBrainPostgrestFailureClassification = Extract<
  DivBrainPersistenceError["kind"],
  | "unavailable"
  | "permission_denied"
  | "relation_missing"
  | "column_missing"
  | "auth_rejected"
  | "postgrest_other"
  | "query_failed"
>;

/**
 * Classify a PostgREST/Postgres error using stable codes first.
 * Message-based network heuristics apply only when no usable code is present.
 * The message itself is never returned or logged.
 */
export function classifyPostgrestFailure(error: {
  message?: string;
  code?: string;
} | null): DivBrainPostgrestFailureClassification {
  if (!error) {
    return "postgrest_other";
  }

  const trimmedCode =
    typeof error.code === "string" ? error.code.trim() : "";
  const hasUsableCode = trimmedCode.length > 0;

  if (hasUsableCode) {
    switch (trimmedCode) {
      case "42501":
        return "permission_denied";
      case "42P01":
      case "PGRST205":
        return "relation_missing";
      case "42703":
      case "PGRST204":
        return "column_missing";
      case "PGRST301":
        return "auth_rejected";
      default:
        // Present but unknown codes must not be reinterpreted by message text.
        return "postgrest_other";
    }
  }

  const message =
    typeof error.message === "string" ? error.message.toLowerCase() : "";

  if (
    message.includes("fetch failed") ||
    message.includes("network") ||
    message.includes("timeout")
  ) {
    return "unavailable";
  }

  return "postgrest_other";
}
