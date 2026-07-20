import { DEMO_NEWS_ARTICLES } from "@/data/news-demo";
import type { NewsArticle } from "@/types/news";

/**
 * Temporary article source for Börsnyheter.
 * Replace this module with a provider adapter (API fetch, cache, normalization).
 */
export function getNewsArticles(): NewsArticle[] {
  return DEMO_NEWS_ARTICLES;
}

export function getNewsArticleBySlug(slug: string): NewsArticle | undefined {
  return getNewsArticles().find((article) => article.slug === slug);
}

export function getNewsArticlesWithSlug(): NewsArticle[] {
  return getNewsArticles().filter((article) => Boolean(article.slug));
}

/** Internal detail href when the article has a slug; otherwise the external url. */
export function getNewsArticleHref(article: NewsArticle): string | null {
  if (article.slug) {
    return `/news/${article.slug}`;
  }

  return article.url;
}

export function isInternalNewsArticleHref(href: string) {
  return href.startsWith("/");
}
