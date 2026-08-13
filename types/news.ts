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

/** Caption segment under the cover image; optional href for credit/licence links. */
export type NewsImageCaptionPart = {
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
  /** ISO date-time for a material editorial update. Never set for SEO-only changes. */
  updatedAt?: string;
  url: string | null;
  featured: boolean;
  imageUrl?: string | null;
  /**
   * Optional list-card image. When set, `/news` cards use this instead of
   * `imageUrl` (e.g. a crop without embedded cover headline). Article pages
   * continue to use `imageUrl`.
   */
  thumbnailImageUrl?: string | null;
  /**
   * CSS object-position for Börsnyheter card/hero object-cover crops
   * (e.g. "center 40%" or "left 35%"). Falls back to component defaults
   * when omitted.
   */
  thumbnailObjectPosition?: string;
  /**
   * Optional mobile-only object-position for list cards and article hero
   * crops below the `md` breakpoint. Falls back to `thumbnailObjectPosition`
   * when omitted.
   */
  mobileThumbnailObjectPosition?: string;
  /**
   * When true, category + headline are rendered before the thumbnail on
   * mobile list rows. Desktop keeps the standard thumbnail-left layout.
   */
  mobileHeadlineFirst?: boolean;
  /**
   * Adds a small DivLab brand lockup on top of the cover image in list cards
   * and on the article hero. Intended for covers that do not contain branding.
   */
  showImageBrandOverlay?: boolean;
  /** When set, the article has an internal detail page at `/news/[slug]`. */
  slug?: string;
  /** Opening body paragraphs on the detail page (after the list ingress/summary). */
  intro?: string[];
  readingMinutes?: number;
  imageAlt?: string;
  /** Shown only when set — e.g. AI-illustration disclosure under the cover. */
  imageCaption?: string;
  /**
   * Rich caption segments with optional links. When set, rendered instead of
   * `imageCaption` (e.g. photographer credit + licence URL).
   */
  imageCaptionParts?: NewsImageCaptionPart[];
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  sections?: NewsArticleSection[];
  sources?: NewsArticleSource[];
  showDisclaimer?: boolean;
}
