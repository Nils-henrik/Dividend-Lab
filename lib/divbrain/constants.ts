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

/**
 * Context assembly budgets (Ticket 1A-4).
 *
 * Limits are expressed as **estimated tokens** via a deterministic
 * char-based estimator — not an exact provider tokenizer.
 * See `docs/divbrain/context-assembly.md`.
 */

/** Approximate characters per estimated token (deterministic heuristic). */
export const DIVBRAIN_CONTEXT_CHARS_PER_ESTIMATED_TOKEN = 4;

/** Default total context budget (estimated tokens). */
export const DIVBRAIN_CONTEXT_TOTAL_BUDGET_ESTIMATED_TOKENS = 12_000;

/** Default reserved capacity for mandatory trusted sections. */
export const DIVBRAIN_CONTEXT_MANDATORY_RESERVE_ESTIMATED_TOKENS = 2_500;

/** Default history budget (estimated tokens). */
export const DIVBRAIN_CONTEXT_HISTORY_BUDGET_ESTIMATED_TOKENS = 3_000;

/** Default source/knowledge budget (estimated tokens). */
export const DIVBRAIN_CONTEXT_SOURCE_BUDGET_ESTIMATED_TOKENS = 4_500;

/** Max sources included in one assembly turn (Learning-first Alpha). */
export const DIVBRAIN_CONTEXT_MAX_SOURCES = 3;

/**
 * Soft per-source excerpt budget in estimated tokens.
 * Aligns with `DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH` (~1_500 chars ≈ 375 tokens).
 */
export const DIVBRAIN_CONTEXT_MAX_SOURCE_EXCERPT_ESTIMATED_TOKENS = 375;
