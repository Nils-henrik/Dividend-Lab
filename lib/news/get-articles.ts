import { DEMO_NEWS_ARTICLES } from "@/data/news-demo";
import type { NewsArticle } from "@/types/news";

/**
 * Temporary article source for Börsnyheter.
 * Replace this module with a provider adapter (API fetch, cache, normalization).
 */
export function getNewsArticles(): NewsArticle[] {
  return DEMO_NEWS_ARTICLES;
}
