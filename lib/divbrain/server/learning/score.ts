/**
 * Deterministic lexical scoring for DivBrain Learning retrieval (1C-1).
 *
 * Explicit, testable weighted overlap — no vectors, embeddings, or models.
 */

import {
  DIVBRAIN_LEARNING_RETRIEVAL_MIN_SCORE,
  DIVBRAIN_LEARNING_RETRIEVAL_MIN_STRONG_SCORE,
  DIVBRAIN_LEARNING_SCORE_WEIGHTS as W,
} from "./constants";
import {
  countTokenOverlap,
  matchedUniqueQueryTokens,
  normalizeDivBrainLearningText,
  tokenizeDivBrainLearningText,
  tokenFrequencyMap,
} from "./normalize";
import type {
  DivBrainLearningCorpusRecord,
  DivBrainLearningCorpusSection,
} from "./types";

export type DivBrainLearningScoredCandidate = {
  record: DivBrainLearningCorpusRecord;
  section: DivBrainLearningCorpusSection;
  score: number;
  strongScore: number;
};

function fieldScore(
  queryTokens: readonly string[],
  fieldTokens: readonly string[],
  weight: number,
): number {
  if (queryTokens.length === 0 || fieldTokens.length === 0 || weight <= 0) {
    return 0;
  }
  const freq = tokenFrequencyMap(fieldTokens);
  return countTokenOverlap(queryTokens, freq) * weight;
}

function phraseBonus(normalizedQuery: string, fieldText: string, bonus: number): number {
  if (!normalizedQuery || !fieldText) {
    return 0;
  }
  const normalizedField = normalizeDivBrainLearningText(fieldText);
  return normalizedField.includes(normalizedQuery) ? bonus : 0;
}

/**
 * Score one article section against a tokenized query.
 * Strong fields: title, slug, heading, description.
 * Soft fields: excerpt, category, intro, section body.
 */
export function scoreDivBrainLearningSection(
  queryTokens: readonly string[],
  normalizedQuery: string,
  record: DivBrainLearningCorpusRecord,
  section: DivBrainLearningCorpusSection,
): DivBrainLearningScoredCandidate {
  const titleScore = fieldScore(queryTokens, record.titleTokens, W.title);
  const slugScore = fieldScore(queryTokens, record.slugTokens, W.slug);
  const headingScore = fieldScore(queryTokens, section.headingTokens, W.heading);
  const descriptionScore = fieldScore(
    queryTokens,
    record.descriptionTokens,
    W.description,
  );

  const strongScore =
    titleScore +
    slugScore +
    headingScore +
    descriptionScore +
    phraseBonus(normalizedQuery, record.title, W.titlePhrase) +
    phraseBonus(normalizedQuery, section.heading ?? "", W.headingPhrase);

  const softScore =
    fieldScore(queryTokens, record.excerptTokens, W.excerpt) +
    fieldScore(queryTokens, record.categoryTokens, W.category) +
    fieldScore(queryTokens, record.introTokens, W.body) +
    fieldScore(queryTokens, section.bodyTokens, W.body);

  const coverageTokens = [
    ...record.titleTokens,
    ...record.slugTokens,
    ...section.headingTokens,
  ];
  const uniqueQuery = new Set(queryTokens).size;
  const coverage =
    uniqueQuery === 0
      ? 0
      : (matchedUniqueQueryTokens(queryTokens, coverageTokens) / uniqueQuery) *
        W.coverage;

  const score = strongScore + softScore + coverage;

  return {
    record,
    section,
    score,
    strongScore,
  };
}

/**
 * Score every section in the corpus; return candidates above threshold.
 */
export function scoreDivBrainLearningCorpus(
  query: string,
  corpus: readonly DivBrainLearningCorpusRecord[],
): {
  queryTokens: string[];
  normalizedQuery: string;
  candidates: DivBrainLearningScoredCandidate[];
} {
  const normalizedQuery = normalizeDivBrainLearningText(query);
  const queryTokens = tokenizeDivBrainLearningText(query);

  if (queryTokens.length === 0) {
    return { queryTokens, normalizedQuery, candidates: [] };
  }

  const candidates: DivBrainLearningScoredCandidate[] = [];

  for (const record of corpus) {
    if (record.sections.length === 0) {
      const synthetic: DivBrainLearningCorpusSection = {
        sectionIndex: 0,
        bodyText: record.introText || record.excerpt,
        headingTokens: [],
        bodyTokens: record.introTokens,
      };
      const scored = scoreDivBrainLearningSection(
        queryTokens,
        normalizedQuery,
        record,
        synthetic,
      );
      if (meetsRetrievalThreshold(scored)) {
        candidates.push(scored);
      }
      continue;
    }

    for (const section of record.sections) {
      const scored = scoreDivBrainLearningSection(
        queryTokens,
        normalizedQuery,
        record,
        section,
      );
      if (meetsRetrievalThreshold(scored)) {
        candidates.push(scored);
      }
    }
  }

  return { queryTokens, normalizedQuery, candidates };
}

export function meetsRetrievalThreshold(
  candidate: Pick<DivBrainLearningScoredCandidate, "score" | "strongScore">,
): boolean {
  return (
    candidate.score >= DIVBRAIN_LEARNING_RETRIEVAL_MIN_SCORE &&
    candidate.strongScore >= DIVBRAIN_LEARNING_RETRIEVAL_MIN_STRONG_SCORE
  );
}

/**
 * Stable ranking:
 * 1. higher total score
 * 2. higher strong score
 * 3. slug ascending
 * 4. section index ascending
 */
export function compareLearningCandidates(
  a: DivBrainLearningScoredCandidate,
  b: DivBrainLearningScoredCandidate,
): number {
  if (b.score !== a.score) {
    return b.score - a.score;
  }
  if (b.strongScore !== a.strongScore) {
    return b.strongScore - a.strongScore;
  }
  const slugCmp = a.record.slug.localeCompare(b.record.slug, "sv");
  if (slugCmp !== 0) {
    return slugCmp;
  }
  return a.section.sectionIndex - b.section.sectionIndex;
}

/**
 * Dedupe to one best section per article slug, then take top N.
 */
export function rankAndDedupeLearningCandidates(
  candidates: readonly DivBrainLearningScoredCandidate[],
  maxResults: number,
): DivBrainLearningScoredCandidate[] {
  const sorted = [...candidates].sort(compareLearningCandidates);
  const seenSlugs = new Set<string>();
  const deduped: DivBrainLearningScoredCandidate[] = [];

  for (const candidate of sorted) {
    if (seenSlugs.has(candidate.record.slug)) {
      continue;
    }
    seenSlugs.add(candidate.record.slug);
    deduped.push(candidate);
    if (deduped.length >= maxResults) {
      break;
    }
  }

  return deduped;
}
