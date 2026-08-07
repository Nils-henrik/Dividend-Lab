/**
 * DivBrain Learning retrieval constants (Ticket 1C-1).
 *
 * Lexical scoring weights and hard bounds for the deterministic
 * DivLab Learning corpus retriever. Documented in
 * `docs/divbrain/learning-retrieval.md`.
 */

/** Max Learning sources returned for one query. */
export const DIVBRAIN_LEARNING_RETRIEVAL_MAX_RESULTS = 3 as const;

/**
 * Hard excerpt length for retrieved Learning sources.
 * Must stay ≤ `DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH` (1_500).
 */
export const DIVBRAIN_LEARNING_RETRIEVAL_MAX_EXCERPT_LENGTH = 800 as const;

/**
 * Minimum total lexical score for a hit to be returned.
 * Below this threshold the retriever returns no result rather than
 * inventing weak relevance from generic body text.
 */
export const DIVBRAIN_LEARNING_RETRIEVAL_MIN_SCORE = 16 as const;

/**
 * Minimum score from strong fields (title / slug / heading / description).
 * Body-only matches never qualify on their own.
 */
export const DIVBRAIN_LEARNING_RETRIEVAL_MIN_STRONG_SCORE = 10 as const;

/** Stable publisher label for DivLab Learning sources. */
export const DIVBRAIN_LEARNING_SOURCE_PUBLISHER = "DivLab" as const;

/** Canonical internal Learning route prefix. */
export const DIVBRAIN_LEARNING_ROUTE_PREFIX = "/learning/" as const;

/**
 * Explicit field weights for lexical scoring.
 * Prefer exact/strong topic signals over generic body prose.
 */
export const DIVBRAIN_LEARNING_SCORE_WEIGHTS = {
  title: 12,
  slug: 9,
  heading: 8,
  description: 5,
  excerpt: 4,
  category: 2,
  body: 1,
  /** Bonus when the full normalized query appears in the title. */
  titlePhrase: 15,
  /** Bonus when the full normalized query appears in a heading. */
  headingPhrase: 10,
  /** Max bonus for query-token coverage over title+heading+slug. */
  coverage: 8,
} as const;
