export type NewsCategory =
  | "market"
  | "company"
  | "macro"
  | "funds-etfs"
  | "dividends"
  | "world-economy";

export type NewsCategoryFilter = NewsCategory | "all";

export type NewsArticleSource = {
  text: string;
  href?: string;
};

export type NewsArticleSection = {
  heading: string;
  paragraphs: string[];
};

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
  /** When set, the article has an internal detail page at `/news/[slug]`. */
  slug?: string;
  /** Opening body paragraphs on the detail page (after the list ingress/summary). */
  intro?: string[];
  readingMinutes?: number;
  imageAlt?: string;
  /** Shown only when set — e.g. AI-illustration disclosure under the cover. */
  imageCaption?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  sections?: NewsArticleSection[];
  sources?: NewsArticleSource[];
  showDisclaimer?: boolean;
}
