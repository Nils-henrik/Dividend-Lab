/**
 * DivBrain Learning-aware context assembly (Tickets 1C-2 / Intelligence v1).
 *
 * Retrieves relevant published DivLab Learning sources for an allowed user
 * request and delegates all trust/budget/delimiter enforcement to the existing
 * context assembler. Retrieved article prose never becomes trusted policy.
 *
 * Intelligence v1 adds a bounded, deterministic follow-up fallback: when the
 * current question is referential and has no direct Learning match, the most
 * recent completed user turn may be combined with it for retrieval. This adds
 * no model call, embedding service or network dependency.
 *
 * Server-only — must never be imported by client components.
 */

import type { DivBrainResult } from "../../results";
import { assembleDivBrainContext } from "../context/assemble";
import type {
  DivBrainAssembledContext,
  DivBrainContextAssemblyInput,
  DivBrainContextHistoryTurnInput,
} from "../context/types";
import { retrieveDivBrainLearningSources } from "./retrieve";
import type {
  DivBrainLearningRetrievalResult,
  DivBrainLearningRetrieveOptions,
} from "./types";

export type CreateDivBrainLearningContextAssemblerOptions = {
  /** Optional deterministic retrieval override for tests. */
  retrievalOptions?: DivBrainLearningRetrieveOptions;
};

const DIVBRAIN_LEARNING_FOLLOW_UP_MAX_CHARS = 240;
const DIVBRAIN_LEARNING_FALLBACK_HISTORY_MAX_CHARS = 600;

const REFERENTIAL_FOLLOW_UP_PATTERN =
  /\b(det|den|detta|denna|där|då|samma|sådan|sådant|sådana|it|that|this|there|then|same)\b/iu;

function isReferentialFollowUp(message: string): boolean {
  const normalized = message.normalize("NFC").trim();
  return (
    normalized.length > 0 &&
    normalized.length <= DIVBRAIN_LEARNING_FOLLOW_UP_MAX_CHARS &&
    REFERENTIAL_FOLLOW_UP_PATTERN.test(normalized)
  );
}

function isHistoryTurnFromCurrentConversation(
  turn: DivBrainContextHistoryTurnInput,
  conversationId: string | undefined,
): boolean {
  if (conversationId === undefined || turn.conversationId === undefined) {
    return true;
  }
  return turn.conversationId === conversationId;
}

function getLatestUserHistoryContent(
  input: DivBrainContextAssemblyInput,
): string | null {
  const history = input.history ?? [];

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const turn = history[index];
    if (
      !turn ||
      turn.role !== "user" ||
      typeof turn.content !== "string" ||
      !isHistoryTurnFromCurrentConversation(turn, input.conversationId)
    ) {
      continue;
    }

    const content = turn.content.normalize("NFC").trim();
    if (!content) {
      continue;
    }

    return content.slice(0, DIVBRAIN_LEARNING_FALLBACK_HISTORY_MAX_CHARS);
  }

  return null;
}

function retrieveLearningForContext(
  input: DivBrainContextAssemblyInput,
  options: DivBrainLearningRetrieveOptions | undefined,
): DivBrainResult<DivBrainLearningRetrievalResult> {
  const primary = retrieveDivBrainLearningSources(
    input.currentUserMessage,
    options,
  );

  if (
    !primary.ok ||
    primary.data.sources.length > 0 ||
    !isReferentialFollowUp(input.currentUserMessage)
  ) {
    return primary;
  }

  const previousUserContent = getLatestUserHistoryContent(input);
  if (!previousUserContent) {
    return primary;
  }

  const fallback = retrieveDivBrainLearningSources(
    `${previousUserContent}\n${input.currentUserMessage}`,
    options,
  );

  if (!fallback.ok || fallback.data.sources.length === 0) {
    return primary;
  }

  return fallback;
}

/**
 * Retrieve Learning sources and assemble one provider-neutral DivBrain context.
 *
 * Existing caller-supplied sources are preserved and Learning sources are added
 * after them. The canonical assembler validates, deduplicates, budgets and wraps
 * every source as `untrusted_context`.
 */
export function assembleDivBrainLearningContext(
  input: DivBrainContextAssemblyInput,
  options: CreateDivBrainLearningContextAssemblerOptions = {},
): DivBrainResult<DivBrainAssembledContext> {
  const retrieval = retrieveLearningForContext(
    input,
    options.retrievalOptions,
  );

  if (!retrieval.ok) {
    return retrieval;
  }

  return assembleDivBrainContext({
    ...input,
    sources: [
      ...(input.sources ?? []),
      ...retrieval.data.sources,
    ],
  });
}

/**
 * Application-service compatible context assembler used by Internal Alpha.
 * Retrieval is local/deterministic and performs no model or network calls.
 */
export function createDivBrainLearningContextAssembler(
  options: CreateDivBrainLearningContextAssemblerOptions = {},
): {
  assemble(
    input: DivBrainContextAssemblyInput,
  ): DivBrainResult<DivBrainAssembledContext>;
} {
  return {
    assemble(input) {
      return assembleDivBrainLearningContext(input, options);
    },
  };
}
