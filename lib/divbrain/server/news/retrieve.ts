import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainSource } from "../../sources";
import { rankAndDedupeLearningCandidates, scoreDivBrainLearningCorpus } from "../learning/score";
import { getDivBrainNewsCorpus } from "./corpus";
import { newsCandidateToDivBrainSource } from "./to-source";

const DIVBRAIN_NEWS_MAX_RESULTS = 2;
/** Slightly stricter than Learning: dated news should need a clear topic match. */
const DIVBRAIN_NEWS_MIN_SCORE = 20;
const DIVBRAIN_NEWS_MIN_STRONG_SCORE = 12;

export type DivBrainNewsRetrievalResult = {
  query: string;
  sources: readonly DivBrainSource[];
};

export function retrieveDivBrainNewsSources(
  query: string,
): DivBrainResult<DivBrainNewsRetrievalResult> {
  if (typeof query !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const corpus = getDivBrainNewsCorpus();
  const { queryTokens, candidates } = scoreDivBrainLearningCorpus(query, corpus);

  if (queryTokens.length === 0) {
    return divBrainSuccess({ query, sources: [] });
  }

  const eligible = candidates.filter(
    (candidate) =>
      candidate.score >= DIVBRAIN_NEWS_MIN_SCORE &&
      candidate.strongScore >= DIVBRAIN_NEWS_MIN_STRONG_SCORE,
  );
  const ranked = rankAndDedupeLearningCandidates(
    eligible,
    DIVBRAIN_NEWS_MAX_RESULTS,
  );

  const sources: DivBrainSource[] = [];
  for (const candidate of ranked) {
    const source = newsCandidateToDivBrainSource(candidate);
    if (!source.ok) {
      return source;
    }
    if (
      !source.data.internalRoute?.startsWith("/news/") ||
      source.data.category !== "divlab_article" ||
      source.data.freshnessState !== "dated"
    ) {
      return divBrainFailureFromCode("invalid_request");
    }
    sources.push(source.data);
  }

  return divBrainSuccess({ query, sources });
}
