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
  countLongCompoundTokenOverlap,
  countTokenOverlap,
  expandDivBrainLearningQueryTokens,
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

/**
 * Compound matches are intentionally weaker than exact lexical matches.
 * A long query term such as `utdelning` may match `utdelningssäkerhet`, but it
 * must not outrank a true exact title/heading hit solely because of fuzziness.
 */
const COMPOUND_MATCH_WEIGHT_FACTOR = 0.6;

/**
 * Longer, specific queries must match more than one distinct user-written term
 * in strong fields. Otherwise one repeated entity can be counted in several
 * fields (for example description + heading) and fabricate relevance.
 */
const MULTI_TERM_STRONG_COVERAGE_QUERY_LENGTH = 4;
const MULTI_TERM_MIN_DISTINCT_STRONG_MATCHES = 2;

function fieldScore(
  queryTokens: readonly string[],
  fieldTokens: readonly string[],
  weight: number,
): number {
  if (queryTokens.length === 0 || fieldTokens.length === 0 || weight <= 0) {
    return 0;
  }

  const freq = tokenFrequencyMap(fieldTokens);
  const exact = countTokenOverlap(queryTokens, freq) * weight;
  const compound =
    countLongCompoundTokenOverlap(queryTokens, fieldTokens) *
    weight *
    COMPOUND_MATCH_WEIGHT_FACTOR;

  return exact + compound;
}

function phraseBonus(normalizedQuery: string, fieldText: string, bonus: number): number {
  if (!normalizedQuery || !fieldText) {
    return 0;
  }
  const normalizedField = normalizeDivBrainLearningText(fieldText);
  return normalizedField.includes(normalizedQuery) ? bonus : 0;
}

function hasSufficientDistinctStrongMatches(
  originalQueryTokens: readonly string[],
  record: DivBrainLearningCorpusRecord,
  section: DivBrainLearningCorpusSection,
): boolean {
  if (originalQueryTokens.length < MULTI_TERM_STRONG_COVERAGE_QUERY_LENGTH) {
    return true;
  }

  const strongFieldTokens = [
    ...record.titleTokens,
    ...record.slugTokens,
    ...section.headingTokens,
    ...record.descriptionTokens,
  ];

  return (
    matchedUniqueQueryTokens(originalQueryTokens, strongFieldTokens) >=
    MULTI_TERM_MIN_DISTINCT_STRONG_MATCHES
  );
}

/**
 * Score one article section against a tokenized query.
 * Strong fields: title, slug, heading, description.
 * Soft fields: excerpt, category, intro, section body.
 *
 * `coverageQueryTokens` lets callers use query-expanded scoring terms while
 * calculating coverage only from terms the user actually wrote.
 */
export function scoreDivBrainLearningSection(
  queryTokens: readonly string[],
  normalizedQuery: string,
  record: DivBrainLearningCorpusRecord,
  section: DivBrainLearningCorpusSection,
  coverageQueryTokens: readonly string[] = queryTokens,
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
  const uniqueQuery = new Set(coverageQueryTokens).size;
  const coverage =
    uniqueQuery === 0
      ? 0
      : (matchedUniqueQueryTokens(coverageQueryTokens, coverageTokens) / uniqueQuery) *
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
 * Finance-equivalent terms are added only for scoring. Diagnostics continue to
 * expose the user's original normalized query tokens.
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
  const scoringTokens = expandDivBrainLearningQueryTokens(queryTokens);

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
        scoringTokens,
        normalizedQuery,
        record,
        synthetic,
        queryTokens,
      );
      if (
        meetsRetrievalThreshold(scored) &&
        hasSufficientDistinctStrongMatches(queryTokens, record, synthetic)
      ) {
        candidates.push(scored);
      }
      continue;
    }

    for (const section of record.sections) {
      const scored = scoreDivBrainLearningSection(
        scoringTokens,
        normalizedQuery,
        record,
        section,
        queryTokens,
      );
      if (
        meetsRetrievalThreshold(scored) &&
        hasSufficientDistinctStrongMatches(queryTokens, record, section)
      ) {
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
