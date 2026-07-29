/**
 * Map assembled DivBrain context to the Ticket 1A-5 provider request shape.
 *
 * Keeps the domain assembly result immutable: mapping creates a new request.
 * Does not call providers or networks.
 *
 * This module must never be imported by client components.
 */

import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "../../constants";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode } from "../../results";
import type {
  DivBrainProviderContextBlock,
  DivBrainProviderContextBlockKind,
  DivBrainProviderMessage,
  DivBrainProviderRequest,
} from "../providers/types";
import { validateDivBrainProviderRequest } from "../providers/validation";
import type { DivBrainAssembledContext, DivBrainContextSectionKind } from "./types";

const SECTION_TO_PROVIDER_KIND: Partial<
  Record<DivBrainContextSectionKind, DivBrainProviderContextBlockKind>
> = {
  identity: "identity",
  policy: "policy",
  response_format: "response_format",
  sources: "sources",
  knowledge: "knowledge",
  user_owned_context: "user_owned_context",
  tool_result: "tool_result",
  freshness_warning: "freshness_warning",
  unsupported_capability: "other",
  // user_request and conversation_history map to messages, not blocks
};

export type MapAssembledContextToProviderRequestOptions = {
  timeoutMs: number;
  signal?: AbortSignal;
  /**
   * When true (default), include delimited history turns as provider messages
   * and the current user message as the final user message.
   */
  includeHistoryMessages?: boolean;
};

/**
 * Convert a provider-neutral assembled context into a provider request.
 * Does not mutate `assembled`.
 */
export function mapAssembledContextToProviderRequest(
  assembled: DivBrainAssembledContext,
  options: MapAssembledContextToProviderRequestOptions,
): DivBrainResult<DivBrainProviderRequest> {
  if (typeof options.timeoutMs !== "number") {
    return divBrainFailureFromCode("invalid_request");
  }

  const contextBlocks: DivBrainProviderContextBlock[] = [];

  for (const section of assembled.sections) {
    const providerKind = SECTION_TO_PROVIDER_KIND[section.kind];
    if (!providerKind) {
      continue;
    }

    if (section.content.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
      return divBrainFailureFromCode("invalid_request");
    }

    contextBlocks.push({
      kind: providerKind,
      content: section.content,
    });
  }

  const messages: DivBrainProviderMessage[] = [];
  const includeHistory = options.includeHistoryMessages !== false;

  if (includeHistory) {
    for (const turn of assembled.historyTurns) {
      if (turn.content.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
        return divBrainFailureFromCode("invalid_request");
      }
      messages.push({
        role: turn.role,
        content: turn.content,
      });
    }
  }

  if (assembled.currentUserMessage.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
    return divBrainFailureFromCode("invalid_request");
  }

  messages.push({
    role: "user",
    content: assembled.currentUserMessage,
  });

  const request: DivBrainProviderRequest = {
    contextBlocks,
    messages,
    sources: assembled.includedSources,
    timeoutMs: options.timeoutMs,
    signal: options.signal,
  };

  // Validate through the existing provider contract without network I/O.
  return validateDivBrainProviderRequest(request);
}

/**
 * Convenience: ensure mapping does not mutate the domain assembly object.
 * Returns shallow snapshots of key arrays for equality checks in tests.
 */
export function snapshotAssembledContextArrays(
  assembled: DivBrainAssembledContext,
): {
  sectionCount: number;
  historyCount: number;
  sourceCount: number;
  diagnosticCount: number;
} {
  return {
    sectionCount: assembled.sections.length,
    historyCount: assembled.historyTurns.length,
    sourceCount: assembled.includedSources.length,
    diagnosticCount: assembled.diagnostics.entries.length,
  };
}
