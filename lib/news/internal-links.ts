import type { LearningArticleWithReadingTime } from "@/data/learning";
import type { NewsArticle } from "@/types/news";

export type RelatedContentKind = "news" | "learning";

export type RelatedContentLink = {
  href: string;
  title: string;
  kind: RelatedContentKind;
};

type LearningLinkCandidate = Pick<
  LearningArticleWithReadingTime,
  | "slug"
  | "title"
  | "seoTitle"
  | "description"
  | "excerpt"
  | "category"
  | "publishedAt"
>;

type InternalLinkOptions = {
  newsArticles: readonly NewsArticle[];
  learningArticles: readonly LearningLinkCandidate[];
  limit?: number;
};

type ContentSignals = {
  tokens: Set<string>;
  phrases: Set<string>;
  canonicalTopics: Set<string>;
  editorialTopics: Set<string>;
  companies: Set<string>;
  tickers: Set<string>;
};

type ScoredRelatedContent = RelatedContentLink & {
  score: number;
  publishedAt?: string;
};

const STOP_WORDS = new Set([
  "aktie",
  "aktien",
  "aktier",
  "augusti",
  "bors",
  "borsen",
  "borsnyheter",
  "borssverige",
  "centrum",
  "dagens",
  "efter",
  "eller",
  "fran",
  "idag",
  "inför",
  "infor",
  "marknad",
  "marknaden",
  "norden",
  "nordiska",
  "procent",
  "rapport",
  "rapporter",
  "sverige",
  "svenska",
  "under",
]);

const GENERIC_PHRASES = new Set([
  "borsnyheter",
  "q1",
  "q1 2026",
  "q2",
  "q2 2026",
  "q3",
  "q3 2026",
  "q4",
  "q4 2026",
]);

const SHORT_SIGNAL_TOKENS = new Set(["ai", "fed", "q1", "q2", "q3", "q4", "usa"]);

const CANONICAL_TOPIC_PATTERNS: ReadonlyArray<{
  topic: string;
  patterns: readonly RegExp[];
}> = [
  {
    topic: "rapport",
    patterns: [
      /\bq[1-4]\b/,
      /\bkvartalsrapport\b/,
      /\bdelarsrapport\b/,
      /\bbokslut\b/,
      /\barsrapport\b/,
      /\brapport\b/,
    ],
  },
  {
    topic: "utdelning",
    patterns: [/\butdelning/, /\bdirektavkastning/],
  },
  {
    topic: "vardering",
    patterns: [/\bvardering/, /\bsubstansvarde/, /\bp e\b/, /\bpe tal\b/],
  },
  {
    topic: "fond",
    patterns: [/\betf\b/, /\bindexfond/, /\bfond\b/, /\bfonder\b/],
  },
  {
    topic: "sparande",
    patterns: [
      /\bekonomisk frihet\b/,
      /\bfire\b/,
      /\branta pa ranta\b/,
      /\bsparande\b/,
      /\bsparkvot\b/,
    ],
  },
];

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("sv-SE")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " och ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizedSet(values: readonly string[] | undefined) {
  const normalized = new Set<string>();

  for (const value of values ?? []) {
    const signal = normalizeText(value);
    if (signal) {
      normalized.add(signal);
    }
  }

  return normalized;
}

function phraseSet(values: readonly string[] | undefined) {
  const phrases = normalizedSet(values);

  for (const phrase of phrases) {
    if (GENERIC_PHRASES.has(phrase)) {
      phrases.delete(phrase);
    }
  }

  return phrases;
}

function tokenize(values: readonly string[]) {
  const tokens = new Set<string>();

  for (const value of values) {
    for (const token of normalizeText(value).split(/\s+/)) {
      if (
        !token ||
        /^\d+$/.test(token) ||
        STOP_WORDS.has(token) ||
        (token.length < 4 && !SHORT_SIGNAL_TOKENS.has(token))
      ) {
        continue;
      }

      tokens.add(token);
    }
  }

  return tokens;
}

function canonicalTopics(values: readonly string[]) {
  const topics = new Set<string>();
  const text = normalizeText(values.join(" "));

  for (const group of CANONICAL_TOPIC_PATTERNS) {
    if (group.patterns.some((pattern) => pattern.test(text))) {
      topics.add(group.topic);
    }
  }

  return topics;
}

function newsSignals(article: NewsArticle): ContentSignals {
  const internal = article.internalLinking;
  const values = [
    article.title,
    article.summary,
    article.seoTitle ?? "",
    article.seoDescription ?? "",
    ...(article.seoKeywords ?? []),
    ...(internal?.topics ?? []),
    ...(internal?.companies ?? []),
    ...(internal?.tickers ?? []),
  ];

  return {
    tokens: tokenize(values),
    phrases: phraseSet([
      ...(article.seoKeywords ?? []),
      ...(internal?.topics ?? []),
      ...(internal?.companies ?? []),
      ...(internal?.tickers ?? []),
    ]),
    canonicalTopics: canonicalTopics(values),
    editorialTopics: normalizedSet(internal?.topics),
    companies: normalizedSet(internal?.companies),
    tickers: normalizedSet(internal?.tickers),
  };
}

function learningSignals(article: LearningLinkCandidate): ContentSignals {
  const values = [
    article.title,
    article.seoTitle ?? "",
    article.description,
    article.excerpt,
    article.category ?? "",
  ];

  return {
    tokens: tokenize(values),
    phrases: phraseSet([article.title, article.seoTitle ?? "", article.category ?? ""]),
    canonicalTopics: canonicalTopics(values),
    editorialTopics: new Set(),
    companies: new Set(),
    tickers: new Set(),
  };
}

function overlapCount(left: Set<string>, right: Set<string>) {
  let count = 0;

  for (const value of left) {
    if (right.has(value)) {
      count += 1;
    }
  }

  return count;
}

function sharedTokenScore(left: Set<string>, right: Set<string>) {
  let score = 0;

  for (const token of left) {
    if (!right.has(token)) {
      continue;
    }

    if (/^q[1-4]$/.test(token)) {
      score += 3;
    } else if (token === "ai") {
      score += 16;
    } else if (token === "usa") {
      score += 5;
    } else if (token === "fed") {
      score += 10;
    } else {
      score += 8;
    }
  }

  return Math.min(score, 64);
}

function scoreNewsCandidate(
  current: NewsArticle,
  currentSignals: ContentSignals,
  candidate: NewsArticle,
) {
  if (!candidate.slug || candidate.slug === current.slug) {
    return 0;
  }

  const candidateSignals = newsSignals(candidate);
  const explicit = current.internalLinking?.relatedNewsSlugs?.includes(candidate.slug) ?? false;

  let score = explicit ? 1_000 : 0;
  score += overlapCount(currentSignals.tickers, candidateSignals.tickers) * 180;
  score += overlapCount(currentSignals.companies, candidateSignals.companies) * 160;
  score += overlapCount(currentSignals.editorialTopics, candidateSignals.editorialTopics) * 70;
  score += overlapCount(currentSignals.phrases, candidateSignals.phrases) * 30;
  score += overlapCount(currentSignals.canonicalTopics, candidateSignals.canonicalTopics) * 18;
  score += sharedTokenScore(currentSignals.tokens, candidateSignals.tokens);

  if (current.category === candidate.category && score >= 20) {
    score += 6;
  }

  return explicit || score >= 30 ? score : 0;
}

function scoreLearningCandidate(
  current: NewsArticle,
  currentSignals: ContentSignals,
  candidate: LearningLinkCandidate,
) {
  const candidateSignals = learningSignals(candidate);
  const explicit =
    current.internalLinking?.relatedLearningSlugs?.includes(candidate.slug) ?? false;

  let score = explicit ? 1_000 : 0;
  score += overlapCount(currentSignals.canonicalTopics, candidateSignals.canonicalTopics) * 55;
  score += overlapCount(currentSignals.phrases, candidateSignals.phrases) * 30;
  score += sharedTokenScore(currentSignals.tokens, candidateSignals.tokens);

  return explicit || score >= 35 ? score : 0;
}

function compareRelatedContent(left: ScoredRelatedContent, right: ScoredRelatedContent) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  const rightTime = right.publishedAt ? Date.parse(right.publishedAt) : 0;
  const leftTime = left.publishedAt ? Date.parse(left.publishedAt) : 0;

  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  return left.title.localeCompare(right.title, "sv-SE");
}

/**
 * Builds a small, deterministic set of crawlable internal links for a news article.
 * Explicit editorial relationships win. Automatic matches must clear a relevance
 * threshold; otherwise the function returns no link rather than a weak fallback.
 */
export function getRelatedContentForNewsArticle(
  current: NewsArticle,
  options: InternalLinkOptions,
): RelatedContentLink[] {
  if (!current.slug) {
    return [];
  }

  const limit = Math.min(Math.max(options.limit ?? 4, 0), 6);
  if (limit === 0) {
    return [];
  }

  const currentSignals = newsSignals(current);
  const scored: ScoredRelatedContent[] = [];

  for (const candidate of options.newsArticles) {
    const score = scoreNewsCandidate(current, currentSignals, candidate);
    if (score === 0 || !candidate.slug) {
      continue;
    }

    scored.push({
      href: `/news/${candidate.slug}`,
      title: candidate.title,
      kind: "news",
      score,
      publishedAt: candidate.publishedAt,
    });
  }

  for (const candidate of options.learningArticles) {
    const score = scoreLearningCandidate(current, currentSignals, candidate);
    if (score === 0) {
      continue;
    }

    scored.push({
      href: `/learning/${candidate.slug}`,
      title: candidate.title,
      kind: "learning",
      score,
      publishedAt: candidate.publishedAt,
    });
  }

  scored.sort(compareRelatedContent);

  const selected: RelatedContentLink[] = [];
  const seen = new Set<string>();
  let newsCount = 0;
  let learningCount = 0;

  for (const candidate of scored) {
    if (selected.length >= limit || seen.has(candidate.href)) {
      continue;
    }

    if (candidate.kind === "news" && newsCount >= 3) {
      continue;
    }

    if (candidate.kind === "learning" && learningCount >= 2) {
      continue;
    }

    seen.add(candidate.href);
    selected.push({
      href: candidate.href,
      title: candidate.title,
      kind: candidate.kind,
    });

    if (candidate.kind === "news") {
      newsCount += 1;
    } else {
      learningCount += 1;
    }
  }

  return selected;
}
