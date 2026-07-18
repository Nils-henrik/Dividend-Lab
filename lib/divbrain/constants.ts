/**
 * Stable DivBrain domain constants.
 * Shared by server and client — no secrets or Node-only APIs.
 */

export const DIVBRAIN_SCHEMA_VERSION = 1 as const;

/**
 * Canonical message roles. `system` is reserved for server-controlled
 * messages; client-facing inputs must not accept or invent system content.
 */
export const DIVBRAIN_MESSAGE_ROLES = ["user", "assistant", "system"] as const;

export const DIVBRAIN_COMPLETION_STATUSES = [
  "pending",
  "generating",
  "completed",
  "blocked",
  "failed",
  "cancelled",
  "provider_unavailable",
] as const;

/** Conversation title max length (blueprint §6). */
export const DIVBRAIN_TITLE_MAX_LENGTH = 120;

/** User message content max length (blueprint §17). */
export const DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH = 4_000;

/**
 * Hard cap on recent history messages included in context assembly.
 * Blueprint guidance: last ~10–20 turns (blueprint §17 / FAQ §8).
 */
export const DIVBRAIN_MAX_CONTEXT_HISTORY_MESSAGES = 20;
