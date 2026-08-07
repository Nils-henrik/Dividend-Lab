/**
 * DivBrain Learning retrieval types (Ticket 1C-1).
 *
 * Pure domain shapes for the deterministic Learning corpus adapter
 * and citation-ready retrieval results. No UI, provider, or network.
 */

import type { DivBrainCitationLocation } from "../../citations";
import type { DivBrainSource } from "../../sources";

/** Searchable section candidate within a Learning article. */
export type DivBrainLearningCorpusSection = {
  /** 0-based section index in the published article. */
  sectionIndex: number;
  heading?: string;
  /** Plain-text body for this section (paragraphs, lists, callouts). */
  bodyText: string;
  /** Deterministic tokens for heading. */
  headingTokens: readonly string[];
  /** Deterministic tokens for section body. */
  bodyTokens: readonly string[];
};

/**
 * Bounded searchable record derived from a published Learning article.
 * Does not duplicate article prose storage — built from `data/learning`.
 */
export type DivBrainLearningCorpusRecord = {
  /** Stable internal identity: `learning:<slug>`. */
  recordId: string;
  slug: string;
  title: string;
  category?: string;
  publishedAt?: string;
  updatedAt?: string;
  /** Canonical safe internal route `/learning/<slug>`. */
  internalRoute: string;
  description: string;
  excerpt: string;
  /** Flattened intro text for body scoring. */
  introText: string;
  titleTokens: readonly string[];
  slugTokens: readonly string[];
  categoryTokens: readonly string[];
  descriptionTokens: readonly string[];
  excerptTokens: readonly string[];
  introTokens: readonly string[];
  sections: readonly DivBrainLearningCorpusSection[];
};

/**
 * Citation-ready inputs for a single retrieval hit.
 * Identifiers match the emitted `DivBrainSource` so later citation
 * builders can consume them without rewriting IDs.
 */
export type DivBrainLearningCitationInput = {
  sourceId: string;
  label: string;
  excerptRef?: string;
  location?: DivBrainCitationLocation;
};

/** One ranked Learning hit with structured source + citation inputs. */
export type DivBrainLearningRetrievalHit = {
  source: DivBrainSource;
  score: number;
  strongScore: number;
  slug: string;
  sectionIndex: number;
  matchedSectionHeading?: string;
  citation: DivBrainLearningCitationInput;
};

/**
 * Typed retrieval result for later wiring into context assembly /
 * citation machinery. Empty `hits` means honest no-match.
 */
export type DivBrainLearningRetrievalResult = {
  query: string;
  normalizedQuery: string;
  queryTokens: readonly string[];
  hits: readonly DivBrainLearningRetrievalHit[];
  /** Deduped sources in rank order — ready for `normalizeDivBrainSources`. */
  sources: readonly DivBrainSource[];
};

export type DivBrainLearningRetrieveOptions = {
  /** Override default max results (hard-capped by module constant). */
  maxResults?: number;
  /**
   * Optional corpus override for tests.
   * Production callers omit this and use the published Learning corpus.
   */
  corpus?: readonly DivBrainLearningCorpusRecord[];
};
