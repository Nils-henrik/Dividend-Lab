export type NewsCategory =
  | "market"
  | "company"
  | "macro"
  | "funds-etfs"
  | "dividends";

export type NewsCategoryFilter = NewsCategory | "all";

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  category: NewsCategory;
  source: string;
  publishedAt: string;
  url: string | null;
  featured: boolean;
  imageUrl?: string | null;
}
