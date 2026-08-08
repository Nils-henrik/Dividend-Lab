/**
 * DivBrain internal-content-aware context assembly (Learning + Börsnyheter).
 *
 * Retrieves relevant published DivLab Learning and dated Börsnyheter sources
 * for an allowed user request and delegates all trust/budget/delimiter
 * enforcement to the existing context assembler. Retrieved editorial prose
 * always remains untrusted context; it never becomes system policy.
 *
 * Intelligence v1 adds bounded, deterministic follow-up retrieval from the
 * most recent same-conversation user turn. Intelligence v3 extends that same
 * mechanism to DivLab Börsnyheter and adds an explicit freshness warning when
 * dated news is included. No extra model call, embedding service or network
 * dependency is added.
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
import {
  retrieveDivBrainNewsSources,
  type DivBrainNewsRetrievalResult,
} from "../news/retrieve";
import { retrieveDivBrainLearningSources } from "./retrieve";
import type {
  DivBrainLearningRetrievalResult,
  DivBrainLearningRetrieveOptions,
} from "./types";

export type CreateDivBrainLearningContextAssemblerOptions = {
  /** Optional deterministic Learning retrieval override for tests. */
  retrievalOptions?: DivBrainLearningRetrieveOptions;
};

const DIVBRAIN_LEARNING_FOLLOW_UP_MAX_CHARS = 240;
const DIVBRAIN_LEARNING_FALLBACK_HISTORY_MAX_CHARS = 600;
const DIVBRAIN_DATED_NEWS_WARNING =
  "DivLab Börsnyheter i underlaget är daterad redaktionell information med angivet publiceringsdatum. Behandla den inte som livekurs, live-marknadsdata eller som bekräftelse på vad som hänt efter publiceringen.";

const REFERENTIAL_FOLLOW_UP_PATTERN =
  /(?:^|[^\p{L}\p{N}_])(?:det|den|detta|denna|där|då|samma|sådan|sådant|sådana|it|that|this|there|then|same)(?=$|[^\p{L}\p{N}_])/iu;

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

function contextualQuery(input: DivBrainContextAssemblyInput): string | null {
  if (!isReferentialFollowUp(input.currentUserMessage)) {
    return null;
  }
  const previousUserContent = getLatestUserHistoryContent(input);
  return previousUserContent
    ? `${previousUserContent}\n${input.currentUserMessage}`
    : null;
}

function retrieveLearningForContext(
  input: DivBrainContextAssemblyInput,
  options: DivBrainLearningRetrieveOptions | undefined,
): DivBrainResult<DivBrainLearningRetrievalResult> {
  const primary = retrieveDivBrainLearningSources(input.currentUserMessage, options);
  if (!primary.ok) {
    return primary;
  }

  const contextualText = contextualQuery(input);
  if (!contextualText) {
    return primary;
  }

  const contextual = retrieveDivBrainLearningSources(contextualText, options);
  return contextual.ok && contextual.data.sources.length > 0 ? contextual : primary;
}

function retrieveNewsForContext(
  input: DivBrainContextAssemblyInput,
): DivBrainResult<DivBrainNewsRetrievalResult> {
  const primary = retrieveDivBrainNewsSources(input.currentUserMessage);
  if (!primary.ok) {
    return primary;
  }

  const contextualText = contextualQuery(input);
  if (!contextualText) {
    return primary;
  }

  const contextual = retrieveDivBrainNewsSources(contextualText);
  return contextual.ok && contextual.data.sources.length > 0 ? contextual : primary;
}

/**
 * Retrieve DivLab internal sources and assemble one provider-neutral context.
 *
 * If dated news is relevant, reserve up to two of the three default source
 * slots for news and one for Learning. Otherwise Learning keeps its existing
 * source capacity. Caller-supplied sources always remain first.
 */
export function assembleDivBrainLearningContext(
  input: DivBrainContextAssemblyInput,
  options: CreateDivBrainLearningContextAssemblerOptions = {},
): DivBrainResult<DivBrainAssembledContext> {
  const learning = retrieveLearningForContext(input, options.retrievalOptions);
  if (!learning.ok) {
    return learning;
  }

  const news = retrieveNewsForContext(input);
  if (!news.ok) {
    return news;
  }

  const hasNews = news.data.sources.length > 0;
  const learningSources = hasNews
    ? learning.data.sources.slice(0, 1)
    : learning.data.sources;

  const existingWarnings = input.optional?.freshnessWarnings ?? [];
  const optional = hasNews
    ? {
        ...(input.optional ?? {}),
        freshnessWarnings: [
          ...existingWarnings,
          DIVBRAIN_DATED_NEWS_WARNING,
        ],
      }
    : input.optional;

  return assembleDivBrainContext({
    ...input,
    ...(optional !== undefined ? { optional } : {}),
    sources: [
      ...(input.sources ?? []),
      ...learningSources,
      ...news.data.sources,
    ],
  });
}

/**
 * Application-service compatible internal-content assembler used by Alpha.
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
