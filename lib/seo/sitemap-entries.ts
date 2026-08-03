import { forumCategories } from "@/data/forum";
import { learningArticles } from "@/data/learning";
import { getNewsArticlesWithSlug } from "@/lib/news/get-articles";
import { absoluteUrl } from "@/lib/seo/site";

export type SitemapEntry = {
  url: string;
  lastModified?: Date;
};

/**
 * Stable public marketing, legal, listing and forum hub paths.
 * Auth, dashboard, settings, messages, profiles and API routes are intentionally omitted.
 */
export const STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/features",
  "/contact",
  "/disclaimer",
  "/privacy",
  "/terms",
  "/cookies",
  "/news",
  "/learning",
  "/forum",
  "/forum/senaste",
  "/forum/populart",
  "/forum/regler",
  "/forum/kategorier",
  "/forum/bolag",
] as const;

function parseReliableDate(value: string | undefined): Date | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }

  return parsed;
}

function uniqueByUrl(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  const unique: SitemapEntry[] = [];

  for (const entry of entries) {
    if (seen.has(entry.url)) {
      continue;
    }

    seen.add(entry.url);
    unique.push(entry);
  }

  return unique;
}

/** Build the canonical public sitemap entry list for production. */
export function buildSitemapEntries(): SitemapEntry[] {
  const staticEntries: SitemapEntry[] = STATIC_PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
  }));

  const forumCategoryEntries: SitemapEntry[] = forumCategories.map(
    (category) => ({
      url: absoluteUrl(`/forum/kategorier/${category.slug}`),
    }),
  );

  const newsEntries: SitemapEntry[] = getNewsArticlesWithSlug().flatMap(
    (article) => {
      if (!article.slug) {
        return [];
      }

      return [
        {
          url: absoluteUrl(`/news/${article.slug}`),
          lastModified: parseReliableDate(article.publishedAt),
        },
      ];
    },
  );

  const learningEntries: SitemapEntry[] = learningArticles.map((article) => ({
    url: absoluteUrl(`/learning/${article.slug}`),
    lastModified:
      parseReliableDate(article.updatedAt) ??
      parseReliableDate(article.publishedAt),
  }));

  return uniqueByUrl([
    ...staticEntries,
    ...forumCategoryEntries,
    ...newsEntries,
    ...learningEntries,
  ]);
}
