/**
 * DivBrain Learning corpus adapter (Ticket 1C-1).
 *
 * Converts the canonical `data/learning` article structures into a
 * bounded searchable corpus. Does not modify article content.
 */

import {
  learningArticles,
  type LearningArticle,
  type LearningArticleSection,
  type LearningArticleSubsection,
} from "@/data/learning";
import { DIVBRAIN_LEARNING_ROUTE_PREFIX } from "./constants";
import {
  normalizeDivBrainLearningText,
  tokenizeDivBrainLearningText,
} from "./normalize";
import type {
  DivBrainLearningCorpusRecord,
  DivBrainLearningCorpusSection,
} from "./types";

function joinTextParts(parts: readonly (string | undefined)[]): string {
  return parts
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n");
}

function subsectionText(subsection: LearningArticleSubsection): string {
  return joinTextParts([
    subsection.subheading,
    ...(subsection.paragraphs ?? []),
    ...(subsection.bullets ?? []),
    ...(subsection.numberedItems ?? []),
    ...(subsection.paragraphsAfterLists ?? []),
  ]);
}

function sectionBodyText(section: LearningArticleSection): string {
  const tableText = section.table
    ? [
        ...section.table.headers,
        ...section.table.rows.flatMap((row) => row),
      ].join(" ")
    : undefined;

  const calculationText = section.calculation
    ? [section.calculation.title, ...section.calculation.lines].join(" ")
    : undefined;

  return joinTextParts([
    ...(section.intro ?? []),
    ...(section.paragraphs ?? []),
    ...(section.bullets ?? []),
    ...(section.numberedItems ?? []),
    ...(section.paragraphsAfterLists ?? []),
    section.callout,
    calculationText,
    tableText,
    ...(section.subsections ?? []).map(subsectionText),
  ]);
}

function introToText(intro: LearningArticle["intro"]): string {
  return Array.isArray(intro) ? joinTextParts(intro) : intro;
}

function learningRecordId(slug: string): string {
  return `learning:${slug}`;
}

function learningInternalRoute(slug: string): string {
  return `${DIVBRAIN_LEARNING_ROUTE_PREFIX}${slug}`;
}

/**
 * Convert one published Learning article into a searchable corpus record.
 */
export function learningArticleToCorpusRecord(
  article: LearningArticle,
): DivBrainLearningCorpusRecord {
  const introText = introToText(article.intro);
  const sections: DivBrainLearningCorpusSection[] = article.sections.map(
    (section, sectionIndex) => {
      const bodyText = sectionBodyText(section);
      return {
        sectionIndex,
        heading: section.heading,
        bodyText,
        headingTokens: section.heading
          ? tokenizeDivBrainLearningText(section.heading)
          : [],
        bodyTokens: tokenizeDivBrainLearningText(bodyText),
      };
    },
  );

  return {
    recordId: learningRecordId(article.slug),
    slug: article.slug,
    title: article.title,
    category: article.category,
    publishedAt: article.publishedAt,
    updatedAt: article.updatedAt,
    internalRoute: learningInternalRoute(article.slug),
    description: article.description,
    excerpt: article.excerpt,
    introText,
    titleTokens: tokenizeDivBrainLearningText(article.title),
    slugTokens: tokenizeDivBrainLearningText(article.slug.replace(/-/g, " ")),
    categoryTokens: article.category
      ? tokenizeDivBrainLearningText(article.category)
      : [],
    descriptionTokens: tokenizeDivBrainLearningText(article.description),
    excerptTokens: tokenizeDivBrainLearningText(article.excerpt),
    introTokens: tokenizeDivBrainLearningText(introText),
    sections,
  };
}

let cachedCorpus: readonly DivBrainLearningCorpusRecord[] | null = null;

/**
 * Build (or return cached) searchable corpus from published Learning articles.
 * New articles under `data/learning` become searchable automatically via
 * `learningArticles` export — no separate index file.
 */
export function getDivBrainLearningCorpus(): readonly DivBrainLearningCorpusRecord[] {
  if (cachedCorpus === null) {
    cachedCorpus = learningArticles.map(learningArticleToCorpusRecord);
  }
  return cachedCorpus;
}

/**
 * Build a corpus from an explicit article list (tests / fixtures).
 */
export function buildDivBrainLearningCorpus(
  articles: readonly LearningArticle[],
): DivBrainLearningCorpusRecord[] {
  return articles.map(learningArticleToCorpusRecord);
}

/** Expose normalize helper for callers that need the same query form. */
export function normalizeLearningQuery(query: string): string {
  return normalizeDivBrainLearningText(query);
}
