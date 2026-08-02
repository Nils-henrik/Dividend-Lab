/**
 * DivBrain context assembler (Ticket 1A-4).
 *
 * Deterministic, provider-neutral assembly of trusted instructions,
 * untrusted sources/history, and the current user request under budgets.
 *
 * Priority order (technical blueprint §9):
 * 1. identity
 * 2. financial safety policy
 * 3. response-format requirements
 * 4. verified sources (structured + delimited)
 * 5. relevant knowledge excerpts (same source pipeline in Alpha)
 * 6. user request
 * 7. optional user-owned context
 * 8. tool results
 * 9. freshness warnings
 * (+ unsupported capability notices when supplied)
 *
 * Conversation history is selected recent-first under its budget, then
 * emitted in chronological order as untrusted turns — never as system.
 *
 * This module must never be imported by client components.
 */

import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainSource } from "../../sources";
import { getDivBrainIdentityBlock } from "../identity";
import {
  getDivBrainPolicyBlock,
  getDivBrainResponseFormatBlock,
} from "../policy";
import {
  wrapUntrustedHistoryContent,
  wrapUntrustedSourceContent,
  wrapUntrustedToolResult,
  wrapUntrustedUserOwnedContext,
} from "./delimiters";
import {
  estimateDivBrainContextTokens,
  truncateToEstimatedTokenBudget,
} from "./estimate-size";
import {
  normalizeDivBrainContextAssemblyInput,
  type DivBrainNormalizedContextAssemblyInput,
} from "./normalize";
import type {
  DivBrainAssembledContext,
  DivBrainAssembledContextSection,
  DivBrainContextAssemblyDiagnostics,
  DivBrainContextAssemblyInput,
  DivBrainContextDiagnosticEntry,
  DivBrainContextSectionKind,
  DivBrainContextTrustLevel,
  DivBrainNormalizedConversationTurn,
} from "./types";

function sectionTrust(kind: DivBrainContextSectionKind): DivBrainContextTrustLevel {
  switch (kind) {
    case "identity":
    case "policy":
    case "response_format":
    case "freshness_warning":
    case "unsupported_capability":
      return "trusted_system";
    case "user_request":
      return "user_input";
    case "sources":
    case "knowledge":
    case "conversation_history":
    case "user_owned_context":
    case "tool_result":
      return "untrusted_context";
    default:
      return "untrusted_context";
  }
}

function makeSection(input: {
  kind: DivBrainContextSectionKind;
  content: string;
  order: number;
  truncated?: boolean;
  sourceId?: string;
  source?: DivBrainSource;
}): DivBrainAssembledContextSection {
  return {
    kind: input.kind,
    trust: sectionTrust(input.kind),
    content: input.content,
    estimatedTokens: estimateDivBrainContextTokens(input.content),
    truncated: input.truncated ?? false,
    order: input.order,
    sourceId: input.sourceId,
    source: input.source,
  };
}

/**
 * Select recent history that fits message-count and estimated-token budgets.
 * Returns turns in chronological order.
 */
export function selectDivBrainContextHistory(input: {
  turns: readonly DivBrainNormalizedConversationTurn[];
  maxMessages: number;
  budgetEstimatedTokens: number;
}): {
  selected: DivBrainNormalizedConversationTurn[];
  diagnostics: DivBrainContextDiagnosticEntry[];
  estimatedTokens: number;
} {
  const diagnostics: DivBrainContextDiagnosticEntry[] = [];
  const capped = input.turns.slice(-input.maxMessages);
  const droppedForCount = input.turns.length - capped.length;

  for (let i = 0; i < droppedForCount; i += 1) {
    diagnostics.push({
      kind: "history_turn",
      action: "excluded",
      reason: "max_count",
      detail: "older_than_max_history_messages",
    });
  }

  // Recent-first packing, then chronological emit.
  const recentFirst = [...capped].reverse();
  const keptRecentFirst: DivBrainNormalizedConversationTurn[] = [];
  let used = 0;

  for (const turn of recentFirst) {
    const delimited = wrapUntrustedHistoryContent(turn.role, turn.content);
    const cost = estimateDivBrainContextTokens(delimited);
    if (used + cost > input.budgetEstimatedTokens) {
      diagnostics.push({
        kind: "history_turn",
        action: "excluded",
        reason: "over_budget",
        role: turn.role,
        estimatedTokens: cost,
      });
      continue;
    }
    keptRecentFirst.push(turn);
    used += cost;
    diagnostics.push({
      kind: "history_turn",
      action: "included",
      role: turn.role,
      estimatedTokens: cost,
    });
  }

  const selected = [...keptRecentFirst].reverse();
  return { selected, diagnostics, estimatedTokens: used };
}

function classifySourceKind(source: DivBrainSource): "sources" | "knowledge" {
  if (
    source.category === "divlab_learning" ||
    source.category === "divlab_article" ||
    source.verificationState === "internally_curated"
  ) {
    return "knowledge";
  }
  return "sources";
}

/**
 * Select and optionally truncate sources under budget.
 * Preserves citation metadata; truncates excerpt content only.
 * Drops later sources first when the source budget is exhausted.
 */
export function selectDivBrainContextSources(input: {
  sources: readonly DivBrainSource[];
  maxSources: number;
  budgetEstimatedTokens: number;
  maxExcerptEstimatedTokens: number;
}): {
  selected: DivBrainSource[];
  sections: Omit<DivBrainAssembledContextSection, "order">[];
  diagnostics: DivBrainContextDiagnosticEntry[];
  estimatedTokens: number;
} {
  const diagnostics: DivBrainContextDiagnosticEntry[] = [];
  const limited = input.sources.slice(0, input.maxSources);

  for (let i = input.maxSources; i < input.sources.length; i += 1) {
    diagnostics.push({
      kind: "source_entry",
      action: "excluded",
      reason: "max_count",
      sourceId: input.sources[i]?.id,
    });
  }

  const selected: DivBrainSource[] = [];
  const sections: Omit<DivBrainAssembledContextSection, "order">[] = [];
  let used = 0;

  for (const source of limited) {
    const originalExcerpt = source.excerpt ?? "";
    const excerptTrim = truncateToEstimatedTokenBudget(
      originalExcerpt,
      input.maxExcerptEstimatedTokens,
    );

    const sourceForContext: DivBrainSource = { ...source };
    if (source.excerpt !== undefined) {
      if (excerptTrim.text) {
        sourceForContext.excerpt = excerptTrim.text;
      } else {
        delete sourceForContext.excerpt;
      }
    }

    const body = excerptTrim.text
      ? excerptTrim.text
      : `[Källa utan excerpt: ${source.title}]`;
    const delimited = wrapUntrustedSourceContent(source.id, body);
    const cost = estimateDivBrainContextTokens(delimited);

    if (used + cost > input.budgetEstimatedTokens) {
      diagnostics.push({
        kind: "source_entry",
        action: "excluded",
        reason: "over_budget",
        sourceId: source.id,
        estimatedTokens: cost,
      });
      continue;
    }

    used += cost;
    selected.push(sourceForContext);

    const kind = classifySourceKind(source);
    sections.push({
      kind,
      trust: "untrusted_context",
      content: delimited,
      estimatedTokens: cost,
      truncated: excerptTrim.truncated,
      sourceId: source.id,
      source: sourceForContext,
    });

    diagnostics.push({
      kind: "source_entry",
      action: excerptTrim.truncated ? "truncated" : "included",
      sourceId: source.id,
      estimatedTokens: cost,
      detail: excerptTrim.truncated ? "excerpt_truncated" : undefined,
    });
  }

  return { selected, sections, diagnostics, estimatedTokens: used };
}

function buildMandatorySections(
  normalized: DivBrainNormalizedContextAssemblyInput,
): {
  sections: DivBrainAssembledContextSection[];
  estimatedTokens: number;
  diagnostics: DivBrainContextDiagnosticEntry[];
} {
  const identity = getDivBrainIdentityBlock();
  const policy = getDivBrainPolicyBlock(normalized.guardrailConstraints);
  const format = getDivBrainResponseFormatBlock();
  const userRequest = normalized.currentUserMessage;

  const raw = [
    makeSection({ kind: "identity", content: identity.content, order: 0 }),
    makeSection({ kind: "policy", content: policy.content, order: 1 }),
    makeSection({
      kind: "response_format",
      content: format.content,
      order: 2,
    }),
    makeSection({ kind: "user_request", content: userRequest, order: 3 }),
  ];

  // Temporary orders; final assembly reassigns global order.
  const diagnostics: DivBrainContextDiagnosticEntry[] = raw.map((section) => ({
    kind: section.kind,
    action: "included",
    estimatedTokens: section.estimatedTokens,
  }));

  const estimatedTokens = raw.reduce(
    (sum, section) => sum + section.estimatedTokens,
    0,
  );

  return { sections: raw, estimatedTokens, diagnostics };
}

function buildOptionalSections(input: {
  optional: DivBrainNormalizedContextAssemblyInput["optional"];
  remainingBudget: number;
}): {
  sections: Omit<DivBrainAssembledContextSection, "order">[];
  diagnostics: DivBrainContextDiagnosticEntry[];
  estimatedTokens: number;
} {
  const sections: Omit<DivBrainAssembledContextSection, "order">[] = [];
  const diagnostics: DivBrainContextDiagnosticEntry[] = [];
  let used = 0;

  const candidates: {
    kind: DivBrainContextSectionKind;
    content: string;
  }[] = [];

  if (input.optional.userOwnedContext) {
    candidates.push({
      kind: "user_owned_context",
      content: wrapUntrustedUserOwnedContext(input.optional.userOwnedContext),
    });
  }

  for (const toolResult of input.optional.toolResults) {
    candidates.push({
      kind: "tool_result",
      content: wrapUntrustedToolResult(toolResult),
    });
  }

  for (const warning of input.optional.freshnessWarnings) {
    candidates.push({
      kind: "freshness_warning",
      content: warning,
    });
  }

  for (const notice of input.optional.unsupportedCapabilities) {
    candidates.push({
      kind: "unsupported_capability",
      content: `Otillgänglig förmåga: ${notice}`,
    });
  }

  for (const candidate of candidates) {
    const cost = estimateDivBrainContextTokens(candidate.content);
    if (used + cost > input.remainingBudget) {
      diagnostics.push({
        kind: candidate.kind,
        action: "excluded",
        reason: "over_budget",
        estimatedTokens: cost,
      });
      continue;
    }

    used += cost;
    sections.push({
      kind: candidate.kind,
      trust: sectionTrust(candidate.kind),
      content: candidate.content,
      estimatedTokens: cost,
      truncated: false,
    });
    diagnostics.push({
      kind: candidate.kind,
      action: "included",
      estimatedTokens: cost,
    });
  }

  return { sections, diagnostics, estimatedTokens: used };
}

/**
 * Assemble a deterministic provider-neutral context package.
 * Never silently returns an empty valid context when the user message is missing.
 */
export function assembleDivBrainContext(
  input: DivBrainContextAssemblyInput,
): DivBrainResult<DivBrainAssembledContext> {
  const normalizedResult = normalizeDivBrainContextAssemblyInput(input);
  if (!normalizedResult.ok) {
    return normalizedResult;
  }

  const normalized = normalizedResult.data;
  const config = normalized.config;
  const diagnosticsEntries: DivBrainContextDiagnosticEntry[] = [
    ...normalized.historyDiagnostics.map((entry) => ({
      kind: "history_turn" as const,
      action: entry.action,
      reason: entry.reason,
      detail: entry.detail,
    })),
  ];

  const mandatory = buildMandatorySections(normalized);
  diagnosticsEntries.push(...mandatory.diagnostics);

  if (mandatory.estimatedTokens > config.totalBudgetEstimatedTokens) {
    // Impossible: mandatory trusted sections + user request exceed total budget.
    return divBrainFailureFromCode("invalid_request");
  }

  // Reserve is a floor of capacity held for mandatory content. Actual mandatory
  // size may exceed the configured reserve; discretionary budget uses the max.
  const mandatoryHeldTokens = Math.max(
    mandatory.estimatedTokens,
    config.mandatoryReserveEstimatedTokens,
  );

  if (mandatoryHeldTokens > config.totalBudgetEstimatedTokens) {
    return divBrainFailureFromCode("invalid_request");
  }

  const remainingAfterMandatory =
    config.totalBudgetEstimatedTokens - mandatoryHeldTokens;

  const sourceBudget = Math.min(
    config.sourceBudgetEstimatedTokens,
    remainingAfterMandatory,
  );
  const sourcesResult = selectDivBrainContextSources({
    sources: normalized.sources,
    maxSources: config.maxSources,
    budgetEstimatedTokens: sourceBudget,
    maxExcerptEstimatedTokens: config.maxSourceExcerptEstimatedTokens,
  });
  diagnosticsEntries.push(...sourcesResult.diagnostics);

  const remainingAfterSources = remainingAfterMandatory - sourcesResult.estimatedTokens;

  const historyBudget = Math.min(
    config.historyBudgetEstimatedTokens,
    remainingAfterSources,
  );
  const historyResult = selectDivBrainContextHistory({
    turns: normalized.history,
    maxMessages: config.maxHistoryMessages,
    budgetEstimatedTokens: historyBudget,
  });
  diagnosticsEntries.push(...historyResult.diagnostics);

  const remainingAfterHistory =
    remainingAfterSources - historyResult.estimatedTokens;

  const optionalResult = buildOptionalSections({
    optional: normalized.optional,
    remainingBudget: remainingAfterHistory,
  });
  diagnosticsEntries.push(...optionalResult.diagnostics);

  // Final section order per blueprint: identity → policy → format →
  // sources/knowledge → user request → optional → tools → freshness.
  // History is represented as turns (and mirrored as delimited sections
  // after sources / before user request for explicit boundaries).
  const sections: DivBrainAssembledContextSection[] = [];
  let order = 0;

  const push = (
    partial: Omit<DivBrainAssembledContextSection, "order"> | DivBrainAssembledContextSection,
  ) => {
    sections.push({
      ...partial,
      order: order,
    });
    order += 1;
  };

  const byKind = (kind: DivBrainContextSectionKind) =>
    mandatory.sections.find((section) => section.kind === kind);

  push(byKind("identity")!);
  push(byKind("policy")!);
  push(byKind("response_format")!);

  for (const sourceSection of sourcesResult.sections) {
    push(sourceSection);
  }

  for (const turn of historyResult.selected) {
    const content = wrapUntrustedHistoryContent(turn.role, turn.content);
    push({
      kind: "conversation_history",
      trust: "untrusted_context",
      content,
      estimatedTokens: estimateDivBrainContextTokens(content),
      truncated: false,
    });
  }

  push(byKind("user_request")!);

  for (const optionalSection of optionalResult.sections) {
    push(optionalSection);
  }

  const estimatedTotalTokens = sections.reduce(
    (sum, section) => sum + section.estimatedTokens,
    0,
  );

  const truncated = diagnosticsEntries.some(
    (entry) =>
      entry.action === "truncated" ||
      (entry.action === "excluded" &&
        (entry.reason === "over_budget" || entry.reason === "max_count")),
  );

  const diagnostics: DivBrainContextAssemblyDiagnostics = {
    estimatedTotalTokens,
    budget: config,
    mandatoryEstimatedTokens: mandatory.estimatedTokens,
    historyEstimatedTokens: historyResult.estimatedTokens,
    sourceEstimatedTokens: sourcesResult.estimatedTokens,
    optionalEstimatedTokens: optionalResult.estimatedTokens,
    truncated,
    entries: diagnosticsEntries,
  };

  return divBrainSuccess({
    sections,
    historyTurns: historyResult.selected,
    currentUserMessage: normalized.currentUserMessage,
    includedSources: sourcesResult.selected,
    diagnostics,
  });
}
