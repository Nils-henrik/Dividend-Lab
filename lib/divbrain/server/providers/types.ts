/**
 * Server-owned DivBrain provider request/response types (Ticket 1A-5).
 *
 * Provider-neutral shapes for later adapters. No SDK types, raw vendor
 * payloads, secrets, or browser-facing policy text.
 *
 * This module must never be imported by client components.
 */

import type { DivBrainError } from "../../errors";
import type { DivBrainMessageRole } from "../../types";
import type { DivBrainSource } from "../../sources";

/** Stable id for the Phase 1A unconfigured provider. */
export const DIVBRAIN_PROVIDER_UNCONFIGURED_ID = "unconfigured" as const;

/** Inclusive timeout bounds for provider requests (milliseconds). */
export const DIVBRAIN_PROVIDER_TIMEOUT_MS_MIN = 1 as const;
export const DIVBRAIN_PROVIDER_TIMEOUT_MS_MAX = 120_000 as const;

/**
 * Context-block kinds for later assembly (identity → policy → sources → …).
 * Assembly itself is out of scope for 1A-5.
 */
export const DIVBRAIN_PROVIDER_CONTEXT_BLOCK_KINDS = [
  "identity",
  "policy",
  "response_format",
  "sources",
  "knowledge",
  "user_request",
  "user_owned_context",
  "tool_result",
  "freshness_warning",
  "other",
] as const;

export type DivBrainProviderContextBlockKind =
  (typeof DIVBRAIN_PROVIDER_CONTEXT_BLOCK_KINDS)[number];

/**
 * Already-assembled context unit. Content is opaque text for the provider;
 * untrusted excerpts must be delimited by the assembler (later ticket).
 */
export type DivBrainProviderContextBlock = {
  kind: DivBrainProviderContextBlockKind;
  content: string;
};

/**
 * Role + content only. `system` is server-assembled only — never from browser
 * input at the application boundary.
 */
export type DivBrainProviderMessage = {
  role: DivBrainMessageRole;
  content: string;
};

/**
 * Optional normalized token counts. Cost/pricing is out of scope —
 * later layers may estimate cost from these hooks.
 */
export type DivBrainProviderUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

/**
 * Provider-neutral generation request.
 * Callers (future context assembly / service) supply ordered blocks and
 * messages; this ticket does not build prompts or call networks.
 */
export type DivBrainProviderRequest = {
  contextBlocks: readonly DivBrainProviderContextBlock[];
  messages: readonly DivBrainProviderMessage[];
  sources: readonly DivBrainSource[];
  /** Optional cancellation. Streaming is not implemented in 1A-5. */
  signal?: AbortSignal;
  timeoutMs: number;
};

export const DIVBRAIN_PROVIDER_RESULT_STATUSES = [
  "completed",
  "cancelled",
  "provider_unavailable",
  "failed",
] as const;

export type DivBrainProviderResultStatus =
  (typeof DIVBRAIN_PROVIDER_RESULT_STATUSES)[number];

/**
 * Normalized provider outcome. Never includes raw SDK payloads, stack traces,
 * secrets, or fabricated assistant text from an unconfigured provider.
 */
export type DivBrainProviderResult =
  | {
      status: "completed";
      text: string;
      usage: DivBrainProviderUsage;
      sources?: readonly DivBrainSource[];
    }
  | {
      status: "cancelled";
    }
  | {
      status: "provider_unavailable";
      error: DivBrainError;
    }
  | {
      status: "failed";
      error: DivBrainError;
    };
