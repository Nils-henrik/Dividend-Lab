/**
 * Server-only DivBrain /brain shell operational diagnostics.
 *
 * Logs fixed allowlisted failure categories only. Never accepts or logs
 * dynamic values, secrets, actor ids, URLs, or raw errors.
 *
 * Temporary-safe for production: fixed categories, one entry per failed
 * request when used with the once-wrapper, no browser exposure.
 */

export const DIVBRAIN_SHELL_DIAGNOSTIC_CATEGORIES = [
  "runtime_configuration_missing",
  "runtime_client_creation_failed",
  "conversation_list_unavailable",
  "conversation_list_query_failed",
  "conversation_list_malformed_response",
  "conversation_list_unknown_failure",
  "shell_mapping_failure",
  "conversation_list_permission_denied",
  "conversation_list_relation_missing",
  "conversation_list_column_missing",
  "conversation_list_auth_rejected",
  "conversation_list_postgrest_other",
] as const;

export type DivBrainShellDiagnosticCategory =
  (typeof DIVBRAIN_SHELL_DIAGNOSTIC_CATEGORIES)[number];

/**
 * Receives only an allowlisted category string.
 * Callers must never pass raw errors, ids, or environment values.
 */
export type DivBrainShellDiagnosticSink = (
  category: DivBrainShellDiagnosticCategory,
) => void;

export function isDivBrainShellDiagnosticCategory(
  value: unknown,
): value is DivBrainShellDiagnosticCategory {
  return (
    typeof value === "string" &&
    (DIVBRAIN_SHELL_DIAGNOSTIC_CATEGORIES as readonly string[]).includes(value)
  );
}

/** No-op sink — default for tests and non-production wiring. */
export const noopDivBrainShellDiagnosticSink: DivBrainShellDiagnosticSink =
  () => {};

/**
 * Production logger: emits exactly one fixed-category object.
 * Shape is intentional and must not gain additional fields.
 */
export function createDivBrainShellDiagnosticLogger(): DivBrainShellDiagnosticSink {
  return (category) => {
    if (!isDivBrainShellDiagnosticCategory(category)) {
      return;
    }

    console.error("[DivBrain shell diagnostic]", { category });
  };
}

/**
 * Emit at most one category for a request lifecycle.
 * Avoids duplicate logging for the same failure path.
 */
export function createOnceDivBrainShellDiagnosticSink(
  sink: DivBrainShellDiagnosticSink,
): DivBrainShellDiagnosticSink {
  let reported = false;

  return (category) => {
    if (reported) {
      return;
    }

    if (!isDivBrainShellDiagnosticCategory(category)) {
      return;
    }

    reported = true;
    sink(category);
  };
}

/**
 * Map a persistence failure kind from listConversations to a shell category.
 * Receives only the internal kind label — never a raw PostgREST payload.
 */
export function mapListConversationsPersistenceKindToDiagnosticCategory(
  kind: string,
): DivBrainShellDiagnosticCategory {
  switch (kind) {
    case "unavailable":
      return "conversation_list_unavailable";
    case "query_failed":
      return "conversation_list_query_failed";
    case "malformed_response":
      return "conversation_list_malformed_response";
    case "permission_denied":
      return "conversation_list_permission_denied";
    case "relation_missing":
      return "conversation_list_relation_missing";
    case "column_missing":
      return "conversation_list_column_missing";
    case "auth_rejected":
      return "conversation_list_auth_rejected";
    case "postgrest_other":
      return "conversation_list_postgrest_other";
    default:
      return "conversation_list_unknown_failure";
  }
}
