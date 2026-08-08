import { getNewsArticles } from "@/lib/news/get-articles";
import type { NewsArticle } from "@/types/news";
import type {
  DivBrainLearningCorpusRecord,
  DivBrainLearningCorpusSection,
} from "../learning/types";
import { tokenizeDivBrainLearningText } from "../learning/normalize";

function join(parts: readonly (string | undefined)[]): string {
  return parts
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join("\n");
}

function articleSlug(article: NewsArticle): string | null {
  const slug = article.slug?.trim();
  return slug ? slug : null;
}

export function newsArticleToDivBrainSearchRecord(
  article: NewsArticle,
): DivBrainLearningCorpusRecord | null {
  const slug = articleSlug(article);
  if (!slug) {
    return null;
  }

  const introText = join(article.intro ?? []);
  const sections: DivBrainLearningCorpusSection[] = (article.sections ?? []).map(
    (section, sectionIndex) => {
      const bodyText = join(section.paragraphs);
      return {
        sectionIndex,
        heading: section.heading,
        bodyText,
        headingTokens: tokenizeDivBrainLearningText(section.heading),
        bodyTokens: tokenizeDivBrainLearningText(bodyText),
      };
    },
  );

  return {
    recordId: `news:${slug}`,
    slug,
    title: article.title,
    category: article.category,
    publishedAt: article.publishedAt,
    updatedAt: article.publishedAt,
    internalRoute: `/news/${slug}`,
    description: article.summary,
    excerpt: article.summary,
    introText,
    titleTokens: tokenizeDivBrainLearningText(article.title),
    slugTokens: tokenizeDivBrainLearningText(slug.replace(/-/g, " ")),
    categoryTokens: tokenizeDivBrainLearningText(article.category),
    descriptionTokens: tokenizeDivBrainLearningText(article.summary),
    excerptTokens: tokenizeDivBrainLearningText(article.summary),
    introTokens: tokenizeDivBrainLearningText(introText),
    sections,
  };
}

let cachedNewsCorpus: readonly DivBrainLearningCorpusRecord[] | null = null;

export function getDivBrainNewsCorpus(): readonly DivBrainLearningCorpusRecord[] {
  if (cachedNewsCorpus === null) {
    cachedNewsCorpus = getNewsArticles()
      .map(newsArticleToDivBrainSearchRecord)
      .filter((record): record is DivBrainLearningCorpusRecord => record !== null);
  }
  return cachedNewsCorpus;
}
