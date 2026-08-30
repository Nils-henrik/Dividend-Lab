import { forumCategories } from "@/data/forum";
import { learningArticles } from "@/data/learning";
import { MODEL_PORTFOLIO_INDEXABLE_PATHS } from "@/lib/model-portfolios/public";
import { getNewsArticlesWithSlug } from "@/lib/news/get-articles";
import { INDEXABLE_STATIC_PUBLIC_PATHS } from "@/lib/seo/public-routes";
import { absoluteUrl } from "@/lib/seo/site";

export type SitemapEntry = {
  url: string;
  lastModified?: Date;
  images?: string[];
};

/**
 * Stable public marketing, legal, listing, forum hub and public product paths.
 * Auth, dashboard, settings, messages and API routes are intentionally omitted.
 * Public profile URLs are discovered dynamically below.
 * Prefer INDEXABLE_STATIC_PUBLIC_PATHS as the authoritative static registry.
 */
export const STATIC_PUBLIC_PATHS = INDEXABLE_STATIC_PUBLIC_PATHS;

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

function latestReliableDate(values: Array<Date | undefined>): Date | undefined {
  let latest: Date | undefined;

  for (const value of values) {
    if (!value) {
      continue;
    }

    if (!latest || value.getTime() > latest.getTime()) {
      latest = value;
    }
  }

  return latest;
}

function absoluteAssetUrl(value: string | null | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  return value.startsWith("http") ? value : absoluteUrl(value);
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

async function loadDynamicPublicEntries(): Promise<SitemapEntry[]> {
  try {
    const [
      { listPublicForumThreadSitemapEntries },
      { listActiveForumCompanySitemapEntries },
      { listPublicProfileSitemapEntries },
      { listPublishedAnalysisSitemapEntries },
    ] = await Promise.all([
      import("@/lib/seo/sitemap-forum-threads"),
      import("@/lib/seo/sitemap-forum-companies"),
      import("@/lib/seo/sitemap-profiles"),
      import("@/lib/seo/sitemap-analyses"),
    ]);

    const [
      forumThreadEntries,
      forumCompanyEntries,
      profileEntries,
      analysisEntries,
    ] = await Promise.all([
      listPublicForumThreadSitemapEntries(),
      listActiveForumCompanySitemapEntries(),
      listPublicProfileSitemapEntries(),
      listPublishedAnalysisSitemapEntries(),
    ]);

    return [
      ...forumThreadEntries,
      ...forumCompanyEntries,
      ...profileEntries,
      ...analysisEntries,
    ];
  } catch {
    // Fail-soft outside the Next.js server runtime (unit tests) or when DB is unavailable.
    return [];
  }
}

/** Build the canonical public sitemap entry list for production. */
export async function buildSitemapEntries(): Promise<SitemapEntry[]> {
  const newsArticles = getNewsArticlesWithSlug();
  const latestNewsModified = latestReliableDate(
    newsArticles.map(
      (article) =>
        parseReliableDate(article.updatedAt) ??
        parseReliableDate(article.publishedAt),
    ),
  );

  const staticEntries: SitemapEntry[] = STATIC_PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    ...(path === "/news" && latestNewsModified
      ? { lastModified: latestNewsModified }
      : {}),
  }));

  const forumCategoryEntries: SitemapEntry[] = forumCategories.map(
    (category) => ({
      url: absoluteUrl(`/forum/kategorier/${category.slug}`),
    }),
  );

  const newsEntries: SitemapEntry[] = newsArticles.flatMap((article) => {
    if (!article.slug) {
      return [];
    }

    const imageUrl = absoluteAssetUrl(article.imageUrl);

    return [
      {
        url: absoluteUrl(`/news/${article.slug}`),
        lastModified:
          parseReliableDate(article.updatedAt) ??
          parseReliableDate(article.publishedAt),
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    ];
  });

  const learningEntries: SitemapEntry[] = learningArticles.map((article) => {
    const imageUrl = absoluteAssetUrl(article.coverImage);

    return {
      url: absoluteUrl(`/learning/${article.slug}`),
      lastModified:
        parseReliableDate(article.updatedAt) ??
        parseReliableDate(article.publishedAt),
      ...(imageUrl ? { images: [imageUrl] } : {}),
    };
  });

  const dynamicEntries = await loadDynamicPublicEntries();

  return uniqueByUrl([
    ...staticEntries,
    ...forumCategoryEntries,
    ...newsEntries,
    ...learningEntries,
    ...dynamicEntries,
  ]);
}

/** Paths that SEO regression tests expect to remain indexable product routes. */
export const REQUIRED_INDEXABLE_PRODUCT_PATHS = [
  ...MODEL_PORTFOLIO_INDEXABLE_PATHS,
  "/analyses",
] as const;
