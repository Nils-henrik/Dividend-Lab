/**
 * DivBrain Learning lexical retriever (Ticket 1C-1).
 *
 * Deterministic, pure, offline retrieval over the DivLab Learning corpus.
 * Does not call models, providers, or external search services.
 * Does not wire into the live `/brain` UI — callers pass sources into
 * context assembly later.
 */

import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainSource } from "../../sources";
import { DIVBRAIN_LEARNING_RETRIEVAL_MAX_RESULTS } from "./constants";
import { getDivBrainLearningCorpus } from "./corpus";
import {
  rankAndDedupeLearningCandidates,
  scoreDivBrainLearningCorpus,
} from "./score";
import {
  learningCandidateToSource,
  toLearningCitationInput,
} from "./to-source";
import type {
  DivBrainLearningRetrievalHit,
  DivBrainLearningRetrievalResult,
  DivBrainLearningRetrieveOptions,
} from "./types";

function resolveMaxResults(maxResults: number | undefined): number {
  if (maxResults === undefined) {
    return DIVBRAIN_LEARNING_RETRIEVAL_MAX_RESULTS;
  }
  if (
    typeof maxResults !== "number" ||
    !Number.isInteger(maxResults) ||
    maxResults < 0
  ) {
    return -1;
  }
  return Math.min(maxResults, DIVBRAIN_LEARNING_RETRIEVAL_MAX_RESULTS);
}

/**
 * Retrieve Learning articles/sections for a user query.
 *
 * Returns a citation-ready result with validated `DivBrainSource` objects.
 * Unrelated or weak queries return an empty hit list (honest no-match).
 *
 * Future integration: pass `result.sources` into
 * `assembleDivBrainContext({ sources })` and build citations via
 * `buildDivBrainCitationsFromSources` / hit `citation` inputs.
 */
export function retrieveDivBrainLearningSources(
  query: string,
  options: DivBrainLearningRetrieveOptions = {},
): DivBrainResult<DivBrainLearningRetrievalResult> {
  if (typeof query !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const maxResults = resolveMaxResults(options.maxResults);
  if (maxResults < 0) {
    return divBrainFailureFromCode("invalid_request");
  }

  const corpus = options.corpus ?? getDivBrainLearningCorpus();
  const { queryTokens, normalizedQuery, candidates } =
    scoreDivBrainLearningCorpus(query, corpus);

  if (maxResults === 0 || queryTokens.length === 0) {
    return divBrainSuccess({
      query,
      normalizedQuery,
      queryTokens,
      hits: [],
      sources: [],
    });
  }

  const ranked = rankAndDedupeLearningCandidates(candidates, maxResults);
  const hits: DivBrainLearningRetrievalHit[] = [];
  const sources: DivBrainSource[] = [];

  for (const candidate of ranked) {
    const sourceResult = learningCandidateToSource(candidate);
    if (!sourceResult.ok) {
      return sourceResult;
    }

    const source = sourceResult.data;
    if (
      !source.internalRoute?.startsWith("/learning/") ||
      source.canonicalUrl !== undefined
    ) {
      return divBrainFailureFromCode("invalid_request");
    }

    const citation = toLearningCitationInput(candidate);
    if (citation.sourceId !== source.id) {
      return divBrainFailureFromCode("invalid_request");
    }

    hits.push({
      source,
      score: candidate.score,
      strongScore: candidate.strongScore,
      slug: candidate.record.slug,
      sectionIndex: candidate.section.sectionIndex,
      matchedSectionHeading: candidate.section.heading,
      citation,
    });
    sources.push(source);
  }

  return divBrainSuccess({
    query,
    normalizedQuery,
    queryTokens,
    hits,
    sources,
  });
}
