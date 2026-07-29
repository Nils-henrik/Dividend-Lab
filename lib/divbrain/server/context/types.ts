/**
 * Provider-neutral DivBrain context assembly types (Ticket 1A-4).
 *
 * Domain assembly shapes — not provider SDK types. Mapping to
 * `DivBrainProviderRequest` lives in `to-provider-request.ts`.
 *
 * This module must never be imported by client components.
 */

import type { DivBrainGuardrailConstraint } from "../../guardrails";
import type { DivBrainSource } from "../../sources";

/**
 * Assembly section kinds aligned with the technical blueprint order and
 * provider context-block vocabulary where applicable.
 */
export const DIVBRAIN_CONTEXT_SECTION_KINDS = [
  "identity",
  "policy",
  "response_format",
  "sources",
  "knowledge",
  "user_request",
  "conversation_history",
  "user_owned_context",
  "tool_result",
  "freshness_warning",
  "unsupported_capability",
] as const;

export type DivBrainContextSectionKind =
  (typeof DIVBRAIN_CONTEXT_SECTION_KINDS)[number];

/**
 * Trust classification for prompt-boundary enforcement.
 * Untrusted content must never become system policy.
 */
export const DIVBRAIN_CONTEXT_TRUST_LEVELS = [
  "trusted_system",
  "user_input",
  "untrusted_context",
] as const;

export type DivBrainContextTrustLevel =
  (typeof DIVBRAIN_CONTEXT_TRUST_LEVELS)[number];

/** Roles permitted in assembled conversation history. */
export const DIVBRAIN_CONTEXT_HISTORY_ROLES = ["user", "assistant"] as const;

export type DivBrainContextHistoryRole =
  (typeof DIVBRAIN_CONTEXT_HISTORY_ROLES)[number];

export type DivBrainContextAssemblyConfig = {
  totalBudgetEstimatedTokens: number;
  mandatoryReserveEstimatedTokens: number;
  historyBudgetEstimatedTokens: number;
  sourceBudgetEstimatedTokens: number;
  maxHistoryMessages: number;
  maxSources: number;
  maxSourceExcerptEstimatedTokens: number;
};

/**
 * Application-layer history turn input.
 * Persistence-only fields (ids, timestamps, owner) are ignored if present.
 */
export type DivBrainContextHistoryTurnInput = {
  role: unknown;
  content: unknown;
  conversationId?: unknown;
};

export type DivBrainNormalizedConversationTurn = {
  role: DivBrainContextHistoryRole;
  content: string;
};

/**
 * Optional lower-priority labeled context. Not treated as a citable source.
 */
export type DivBrainOptionalContextInput = {
  userOwnedContext?: string;
  toolResults?: readonly string[];
  freshnessWarnings?: readonly string[];
  unsupportedCapabilities?: readonly string[];
};

/**
 * Validated application-domain assembly input.
 * No database access — callers supply domain values.
 */
export type DivBrainContextAssemblyInput = {
  currentUserMessage: string;
  /** When set, every history turn with a conversationId must match. */
  conversationId?: string;
  history?: readonly DivBrainContextHistoryTurnInput[];
  sources?: readonly DivBrainSource[];
  /** Turn-level guardrail constraints to embed in trusted policy. */
  guardrailConstraints?: readonly DivBrainGuardrailConstraint[];
  optional?: DivBrainOptionalContextInput;
  config?: Partial<DivBrainContextAssemblyConfig>;
};

export type DivBrainAssembledContextSection = {
  kind: DivBrainContextSectionKind;
  trust: DivBrainContextTrustLevel;
  content: string;
  estimatedTokens: number;
  truncated: boolean;
  /** Stable order index within the assembled package (0-based). */
  order: number;
  /** Present for source/knowledge sections — citation metadata preserved. */
  sourceId?: string;
  source?: DivBrainSource;
};

export type DivBrainContextExclusionReason =
  | "over_budget"
  | "max_count"
  | "unsupported_role"
  | "empty_content"
  | "conversation_mismatch"
  | "duplicate_source"
  | "optional_unavailable";

export type DivBrainContextDiagnosticEntry = {
  kind: DivBrainContextSectionKind | "history_turn" | "source_entry";
  action: "included" | "excluded" | "truncated";
  reason?: DivBrainContextExclusionReason;
  estimatedTokens?: number;
  sourceId?: string;
  role?: DivBrainContextHistoryRole;
  detail?: string;
};

export type DivBrainContextAssemblyDiagnostics = {
  estimatedTotalTokens: number;
  budget: DivBrainContextAssemblyConfig;
  mandatoryEstimatedTokens: number;
  historyEstimatedTokens: number;
  sourceEstimatedTokens: number;
  optionalEstimatedTokens: number;
  truncated: boolean;
  entries: readonly DivBrainContextDiagnosticEntry[];
};

/**
 * Provider-neutral assembled context package.
 * Separates trusted sections, history turns, user message, and sources.
 */
export type DivBrainAssembledContext = {
  sections: readonly DivBrainAssembledContextSection[];
  historyTurns: readonly DivBrainNormalizedConversationTurn[];
  currentUserMessage: string;
  includedSources: readonly DivBrainSource[];
  diagnostics: DivBrainContextAssemblyDiagnostics;
};
