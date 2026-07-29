/**
 * Input normalisation for DivBrain context assembly (Ticket 1A-4).
 *
 * Pure validation — no database access. Persistence metadata is stripped.
 *
 * This module must never be imported by client components.
 */

import {
  DIVBRAIN_CONTEXT_HISTORY_BUDGET_ESTIMATED_TOKENS,
  DIVBRAIN_CONTEXT_MANDATORY_RESERVE_ESTIMATED_TOKENS,
  DIVBRAIN_CONTEXT_MAX_SOURCE_EXCERPT_ESTIMATED_TOKENS,
  DIVBRAIN_CONTEXT_MAX_SOURCES,
  DIVBRAIN_CONTEXT_SOURCE_BUDGET_ESTIMATED_TOKENS,
  DIVBRAIN_CONTEXT_TOTAL_BUDGET_ESTIMATED_TOKENS,
  DIVBRAIN_MAX_CONTEXT_HISTORY_MESSAGES,
  DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
} from "../../constants";
import {
  isDivBrainGuardrailConstraint,
  normalizeDivBrainGuardrailConstraints,
  type DivBrainGuardrailConstraint,
} from "../../guardrails";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import {
  normalizeDivBrainSources,
  type DivBrainSource,
} from "../../sources";
import { normalizeDivBrainMessageContent } from "../../validation";
import type {
  DivBrainContextAssemblyConfig,
  DivBrainContextAssemblyInput,
  DivBrainContextHistoryTurnInput,
  DivBrainNormalizedConversationTurn,
  DivBrainOptionalContextInput,
} from "./types";

const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export type DivBrainNormalizedContextAssemblyInput = {
  currentUserMessage: string;
  conversationId?: string;
  history: readonly DivBrainNormalizedConversationTurn[];
  historyDiagnostics: readonly {
    action: "excluded";
    reason: "unsupported_role" | "empty_content" | "conversation_mismatch";
    detail?: string;
  }[];
  sources: readonly DivBrainSource[];
  sourceIdAliases: Readonly<Record<string, string>>;
  guardrailConstraints: readonly DivBrainGuardrailConstraint[];
  optional: {
    userOwnedContext?: string;
    toolResults: readonly string[];
    freshnessWarnings: readonly string[];
    unsupportedCapabilities: readonly string[];
  };
  config: DivBrainContextAssemblyConfig;
};

function isPositiveInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value > 0
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

export function resolveDivBrainContextAssemblyConfig(
  partial?: Partial<DivBrainContextAssemblyConfig>,
): DivBrainResult<DivBrainContextAssemblyConfig> {
  const config: DivBrainContextAssemblyConfig = {
    totalBudgetEstimatedTokens:
      partial?.totalBudgetEstimatedTokens ??
      DIVBRAIN_CONTEXT_TOTAL_BUDGET_ESTIMATED_TOKENS,
    mandatoryReserveEstimatedTokens:
      partial?.mandatoryReserveEstimatedTokens ??
      DIVBRAIN_CONTEXT_MANDATORY_RESERVE_ESTIMATED_TOKENS,
    historyBudgetEstimatedTokens:
      partial?.historyBudgetEstimatedTokens ??
      DIVBRAIN_CONTEXT_HISTORY_BUDGET_ESTIMATED_TOKENS,
    sourceBudgetEstimatedTokens:
      partial?.sourceBudgetEstimatedTokens ??
      DIVBRAIN_CONTEXT_SOURCE_BUDGET_ESTIMATED_TOKENS,
    maxHistoryMessages:
      partial?.maxHistoryMessages ?? DIVBRAIN_MAX_CONTEXT_HISTORY_MESSAGES,
    maxSources: partial?.maxSources ?? DIVBRAIN_CONTEXT_MAX_SOURCES,
    maxSourceExcerptEstimatedTokens:
      partial?.maxSourceExcerptEstimatedTokens ??
      DIVBRAIN_CONTEXT_MAX_SOURCE_EXCERPT_ESTIMATED_TOKENS,
  };

  const values = [
    config.totalBudgetEstimatedTokens,
    config.mandatoryReserveEstimatedTokens,
    config.historyBudgetEstimatedTokens,
    config.sourceBudgetEstimatedTokens,
    config.maxHistoryMessages,
    config.maxSources,
    config.maxSourceExcerptEstimatedTokens,
  ];

  for (const value of values) {
    if (!isPositiveInteger(value) && value !== 0) {
      // max values may be 0 only for budgets that can be disabled? Ticket says
      // impossible budgets return error. Zero total budget is invalid.
      if (!isNonNegativeInteger(value)) {
        return divBrainFailureFromCode("invalid_request");
      }
    }
  }

  if (
    !isPositiveInteger(config.totalBudgetEstimatedTokens) ||
    !isPositiveInteger(config.maxHistoryMessages) ||
    !isPositiveInteger(config.maxSources) ||
    !isPositiveInteger(config.maxSourceExcerptEstimatedTokens) ||
    !isNonNegativeInteger(config.mandatoryReserveEstimatedTokens) ||
    !isNonNegativeInteger(config.historyBudgetEstimatedTokens) ||
    !isNonNegativeInteger(config.sourceBudgetEstimatedTokens)
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (
    config.mandatoryReserveEstimatedTokens > config.totalBudgetEstimatedTokens
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(config);
}

function normalizePlainTextField(
  value: unknown,
  maxLength: number,
): DivBrainResult<string | undefined> {
  if (value === undefined || value === null) {
    return divBrainSuccess(undefined);
  }

  if (typeof value !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const normalized = value.normalize("NFC").trim();
  if (!normalized) {
    return divBrainSuccess(undefined);
  }

  if (
    normalized.length > maxLength ||
    CONTROL_CHARS_PATTERN.test(normalized)
  ) {
    return divBrainFailureFromCode("invalid_request");
  }

  return divBrainSuccess(normalized);
}

function normalizeStringList(
  value: unknown,
  maxLength: number,
): DivBrainResult<readonly string[]> {
  if (value === undefined || value === null) {
    return divBrainSuccess([]);
  }

  if (!Array.isArray(value)) {
    return divBrainFailureFromCode("invalid_request");
  }

  const items: string[] = [];
  for (const entry of value) {
    const normalized = normalizePlainTextField(entry, maxLength);
    if (!normalized.ok) {
      return normalized;
    }
    if (normalized.data) {
      items.push(normalized.data);
    }
  }

  return divBrainSuccess(items);
}

/**
 * Normalize history turns:
 * - preserve chronological input order for valid turns
 * - drop unsupported roles (including system) from model history
 * - reject cross-conversation mixing when conversationId is set
 * - strip persistence-only metadata by not copying it
 */
export function normalizeDivBrainContextHistory(input: {
  history: readonly DivBrainContextHistoryTurnInput[] | undefined;
  conversationId?: string;
}): DivBrainResult<{
  turns: DivBrainNormalizedConversationTurn[];
  diagnostics: DivBrainNormalizedContextAssemblyInput["historyDiagnostics"];
}> {
  const history = input.history ?? [];
  if (!Array.isArray(history)) {
    return divBrainFailureFromCode("invalid_request");
  }

  const turns: DivBrainNormalizedConversationTurn[] = [];
  const diagnostics: Array<{
    action: "excluded";
    reason: "unsupported_role" | "empty_content" | "conversation_mismatch";
    detail?: string;
  }> = [];

  for (const turn of history) {
    if (typeof turn !== "object" || turn === null) {
      return divBrainFailureFromCode("invalid_request");
    }

    if (turn.conversationId !== undefined && turn.conversationId !== null) {
      if (typeof turn.conversationId !== "string") {
        return divBrainFailureFromCode("invalid_request");
      }
      const turnConversationId = turn.conversationId.trim();
      if (
        input.conversationId &&
        turnConversationId &&
        turnConversationId !== input.conversationId
      ) {
        diagnostics.push({
          action: "excluded",
          reason: "conversation_mismatch",
          detail: "history_turn_conversation_mismatch",
        });
        continue;
      }
    }

    if (turn.role !== "user" && turn.role !== "assistant") {
      diagnostics.push({
        action: "excluded",
        reason: "unsupported_role",
        detail:
          typeof turn.role === "string" ? `role:${turn.role}` : "role:invalid",
      });
      continue;
    }

    if (typeof turn.content !== "string") {
      return divBrainFailureFromCode("invalid_request");
    }

    const content = turn.content.normalize("NFC").trim();
    if (!content) {
      diagnostics.push({
        action: "excluded",
        reason: "empty_content",
      });
      continue;
    }

    if (
      content.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH ||
      CONTROL_CHARS_PATTERN.test(content)
    ) {
      return divBrainFailureFromCode("invalid_request");
    }

    turns.push({
      role: turn.role,
      content,
    });
  }

  return divBrainSuccess({ turns, diagnostics });
}

function normalizeOptionalContext(
  optional: DivBrainOptionalContextInput | undefined,
): DivBrainResult<DivBrainNormalizedContextAssemblyInput["optional"]> {
  if (optional === undefined) {
    return divBrainSuccess({
      toolResults: [],
      freshnessWarnings: [],
      unsupportedCapabilities: [],
    });
  }

  if (typeof optional !== "object" || optional === null) {
    return divBrainFailureFromCode("invalid_request");
  }

  const userOwned = normalizePlainTextField(
    optional.userOwnedContext,
    DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
  );
  if (!userOwned.ok) {
    return userOwned;
  }

  const toolResults = normalizeStringList(
    optional.toolResults,
    DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
  );
  if (!toolResults.ok) {
    return toolResults;
  }

  const freshnessWarnings = normalizeStringList(
    optional.freshnessWarnings,
    DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
  );
  if (!freshnessWarnings.ok) {
    return freshnessWarnings;
  }

  const unsupportedCapabilities = normalizeStringList(
    optional.unsupportedCapabilities,
    DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH,
  );
  if (!unsupportedCapabilities.ok) {
    return unsupportedCapabilities;
  }

  return divBrainSuccess({
    userOwnedContext: userOwned.data,
    toolResults: toolResults.data,
    freshnessWarnings: freshnessWarnings.data,
    unsupportedCapabilities: unsupportedCapabilities.data,
  });
}

/**
 * Validate and normalize assembly input into a deterministic working shape.
 */
export function normalizeDivBrainContextAssemblyInput(
  input: DivBrainContextAssemblyInput,
): DivBrainResult<DivBrainNormalizedContextAssemblyInput> {
  if (typeof input !== "object" || input === null) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (typeof input.currentUserMessage !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const messageResult = normalizeDivBrainMessageContent(
    input.currentUserMessage.normalize("NFC"),
  );
  if (!messageResult.ok) {
    return messageResult;
  }

  let conversationId: string | undefined;
  if (input.conversationId !== undefined && input.conversationId !== null) {
    if (typeof input.conversationId !== "string") {
      return divBrainFailureFromCode("invalid_request");
    }
    const trimmed = input.conversationId.trim();
    if (!trimmed) {
      return divBrainFailureFromCode("invalid_request");
    }
    conversationId = trimmed;
  }

  const historyResult = normalizeDivBrainContextHistory({
    history: input.history,
    conversationId,
  });
  if (!historyResult.ok) {
    return historyResult;
  }

  let sources: readonly DivBrainSource[] = [];
  let sourceIdAliases: Readonly<Record<string, string>> = {};
  if (input.sources !== undefined) {
    if (!Array.isArray(input.sources)) {
      return divBrainFailureFromCode("invalid_request");
    }
    if (input.sources.length > 0) {
      const normalizedSources = normalizeDivBrainSources(input.sources);
      if (!normalizedSources.ok) {
        return normalizedSources;
      }
      sources = normalizedSources.data.sources;
      sourceIdAliases = normalizedSources.data.sourceIdAliases;
    }
  }

  let guardrailConstraints: DivBrainGuardrailConstraint[] = [];
  if (input.guardrailConstraints !== undefined) {
    if (!Array.isArray(input.guardrailConstraints)) {
      return divBrainFailureFromCode("invalid_request");
    }
    for (const constraint of input.guardrailConstraints) {
      if (!isDivBrainGuardrailConstraint(constraint)) {
        return divBrainFailureFromCode("invalid_request");
      }
    }
    guardrailConstraints = normalizeDivBrainGuardrailConstraints(
      input.guardrailConstraints,
    );
  }

  const optionalResult = normalizeOptionalContext(input.optional);
  if (!optionalResult.ok) {
    return optionalResult;
  }

  const configResult = resolveDivBrainContextAssemblyConfig(input.config);
  if (!configResult.ok) {
    return configResult;
  }

  return divBrainSuccess({
    currentUserMessage: messageResult.data,
    conversationId,
    history: historyResult.data.turns,
    historyDiagnostics: historyResult.data.diagnostics,
    sources,
    sourceIdAliases,
    guardrailConstraints,
    optional: optionalResult.data,
    config: configResult.data,
  });
}
