import type { NewsArticle, NewsCategory, NewsCategoryFilter } from "@/types/news";
import { NEWS_CATEGORY_FILTERS } from "@/lib/news/categories";

export const NEWS_PAGE_SIZE = 10;

export type NewsListQuery = {
  category: NewsCategoryFilter;
  page: number;
};

export type NewsListPageResult = {
  category: NewsCategoryFilter;
  page: number;
  totalCount: number;
  totalPages: number;
  /** Newest article on page 1 only; otherwise null. */
  featuredArticle: NewsArticle | null;
  rowArticles: NewsArticle[];
};

const CATEGORY_VALUES = new Set(
  NEWS_CATEGORY_FILTERS.map((option) => option.value),
);

export function parseNewsCategoryParam(
  value: string | string[] | undefined,
): NewsCategoryFilter {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw || !CATEGORY_VALUES.has(raw as NewsCategoryFilter)) {
    return "all";
  }

  return raw as NewsCategoryFilter;
}

/** Invalid, missing, zero or negative values resolve to page 1. */
export function parseNewsPageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw) {
    return 1;
  }

  const parsed = Number.parseInt(raw, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

/**
 * Newest first by publishedAt. Equal timestamps use slug ascending, then id,
 * for a deterministic secondary order without mutating the source array.
 */
export function sortNewsArticlesByPublishedAt(
  articles: NewsArticle[],
): NewsArticle[] {
  return [...articles].sort((left, right) => {
    const timeDelta =
      new Date(right.publishedAt).getTime() -
      new Date(left.publishedAt).getTime();

    if (timeDelta !== 0) {
      return timeDelta;
    }

    const leftKey = left.slug ?? left.id;
    const rightKey = right.slug ?? right.id;
    return leftKey.localeCompare(rightKey, "sv");
  });
}

export function filterNewsArticlesByCategory(
  articles: NewsArticle[],
  category: NewsCategoryFilter,
): NewsArticle[] {
  if (category === "all") {
    return articles;
  }

  return articles.filter((article) => article.category === (category as NewsCategory));
}

export function buildNewsListHref({
  category = "all",
  page = 1,
}: {
  category?: NewsCategoryFilter;
  page?: number;
}): string {
  const params = new URLSearchParams();

  if (category !== "all") {
    params.set("category", category);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/news?${query}` : "/news";
}

export function getNewsListPage(
  articles: NewsArticle[],
  query: NewsListQuery,
): NewsListPageResult {
  const filtered = filterNewsArticlesByCategory(articles, query.category);
  const sorted = sortNewsArticlesByPublishedAt(filtered);
  const totalCount = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / NEWS_PAGE_SIZE));
  const page =
    totalCount === 0 ? 1 : Math.min(Math.max(query.page, 1), totalPages);

  const start = (page - 1) * NEWS_PAGE_SIZE;
  const pageArticles = sorted.slice(start, start + NEWS_PAGE_SIZE);

  if (page === 1 && pageArticles.length > 0) {
    const [featuredArticle, ...rowArticles] = pageArticles;
    return {
      category: query.category,
      page,
      totalCount,
      totalPages: totalCount === 0 ? 0 : totalPages,
      featuredArticle,
      rowArticles,
    };
  }

  return {
    category: query.category,
    page,
    totalCount,
    totalPages: totalCount === 0 ? 0 : totalPages,
    featuredArticle: null,
    rowArticles: pageArticles,
  };
}

/**
 * Compact page window for large archives, e.g. `1 … 4 5 6 … 20`.
 */
export function getNewsPaginationItems(
  currentPage: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 0) {
    return [];
  }

  if (totalPages === 1) {
    return [1];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pageSet = new Set<number>([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ]);

  const pages = [...pageSet]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);

  const items: Array<number | "ellipsis"> = [];

  for (let index = 0; index < pages.length; index += 1) {
    const page = pages[index];
    const previous = pages[index - 1];

    if (previous !== undefined && page - previous > 1) {
      items.push("ellipsis");
    }

    items.push(page);
  }

  return items;
}
