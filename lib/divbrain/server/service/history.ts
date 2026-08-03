/**
 * Bounded conversation-history loading for DivBrain turns (Ticket 1A-7b).
 *
 * Uses repository cursors to reach the transcript tail, then retains only the
 * most recent completed user/assistant turns for context assembly.
 *
 * This module must never be imported by client components.
 */

import { DIVBRAIN_MAX_CONTEXT_HISTORY_MESSAGES } from "../../constants";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainMessage } from "../../types";
import type { DivBrainContextHistoryTurnInput } from "../context/types";
import {
  DIVBRAIN_REPOSITORY_MAX_PAGE_SIZE,
  type DivBrainConversationRepository,
  type DivBrainTrustedActorId,
} from "../repository";

/**
 * Maximum listMessages page rounds while seeking the transcript tail.
 * Phase 1A Internal Alpha bound: 10 × max page size (50) = 500 rows scanned.
 * Fail safely before user-message persistence if the bound is exceeded.
 */
export const DIVBRAIN_HISTORY_MAX_PAGE_ROUNDS = 10;

export type LoadBoundedDivBrainHistoryParams = {
  repository: DivBrainConversationRepository;
  actorId: DivBrainTrustedActorId;
  conversationId: string;
  /** Defaults to `DIVBRAIN_MAX_CONTEXT_HISTORY_MESSAGES`. */
  maxHistoryMessages?: number;
};

/** Eligible prior turns: same conversation, user/assistant, completed only. */
export function isEligibleDivBrainHistoryMessage(
  message: DivBrainMessage,
  conversationId: string,
): boolean {
  if (message.conversationId !== conversationId) {
    return false;
  }

  if (message.role !== "user" && message.role !== "assistant") {
    return false;
  }

  if (message.completionStatus !== "completed") {
    return false;
  }

  if (message.content.trim().length === 0) {
    return false;
  }

  return true;
}

/**
 * Map eligible persisted messages to context-assembly history turns.
 * Does not mutate the input array or message objects.
 */
export function mapMessagesToContextHistoryTurns(
  messages: readonly DivBrainMessage[],
  conversationId: string,
): DivBrainContextHistoryTurnInput[] {
  const turns: DivBrainContextHistoryTurnInput[] = [];

  for (const message of messages) {
    if (!isEligibleDivBrainHistoryMessage(message, conversationId)) {
      continue;
    }

    turns.push({
      role: message.role,
      content: message.content,
      conversationId: message.conversationId,
    });
  }

  return turns;
}

/**
 * Load a bounded recent history window for context assembly.
 * Chronological order (oldest → newest) is preserved within the window.
 */
export async function loadBoundedDivBrainHistory(
  params: LoadBoundedDivBrainHistoryParams,
): Promise<DivBrainResult<readonly DivBrainContextHistoryTurnInput[]>> {
  const maxHistory =
    typeof params.maxHistoryMessages === "number" &&
    Number.isInteger(params.maxHistoryMessages) &&
    params.maxHistoryMessages > 0
      ? Math.min(
          params.maxHistoryMessages,
          DIVBRAIN_MAX_CONTEXT_HISTORY_MESSAGES,
        )
      : DIVBRAIN_MAX_CONTEXT_HISTORY_MESSAGES;

  const collected: DivBrainMessage[] = [];
  let cursor: string | undefined;
  let rounds = 0;
  const seenCursors = new Set<string>();
  let unfinished = true;

  while (rounds < DIVBRAIN_HISTORY_MAX_PAGE_ROUNDS) {
    rounds += 1;

    if (cursor !== undefined) {
      if (seenCursors.has(cursor)) {
        return divBrainFailureFromCode("internal_error");
      }
      seenCursors.add(cursor);
    }

    const pageBeforeCount = collected.length;

    const page = await params.repository.listMessages({
      actorId: params.actorId,
      conversationId: params.conversationId,
      pageSize: DIVBRAIN_REPOSITORY_MAX_PAGE_SIZE,
      ...(cursor !== undefined ? { cursor } : {}),
    });

    if (!page.ok) {
      return page;
    }

    collected.push(...page.data.items);

    if (page.data.nextCursor === null) {
      unfinished = false;
      break;
    }

    if (collected.length === pageBeforeCount) {
      return divBrainFailureFromCode("internal_error");
    }

    if (page.data.nextCursor === cursor) {
      return divBrainFailureFromCode("internal_error");
    }

    cursor = page.data.nextCursor;
  }

  if (unfinished) {
    return divBrainFailureFromCode("internal_error");
  }

  const eligible = collected.filter((message) =>
    isEligibleDivBrainHistoryMessage(message, params.conversationId),
  );

  const window =
    eligible.length > maxHistory
      ? eligible.slice(eligible.length - maxHistory)
      : eligible;

  return divBrainSuccess(
    mapMessagesToContextHistoryTurns(window, params.conversationId),
  );
}
