export type LearningArticleSubsection = {
  subheading: string;
  paragraphs?: string[];
  bullets?: string[];
  numberedItems?: string[];
  paragraphsAfterLists?: string[];
};

export type LearningArticleTable = {
  headers: string[];
  rows: string[][];
};

export type LearningArticleSection = {
  heading?: string;
  intro?: string[];
  paragraphs?: string[];
  bullets?: string[];
  numberedItems?: string[];
  paragraphsAfterLists?: string[];
  subsections?: LearningArticleSubsection[];
  callout?: string;
  calculation?: {
    title: string;
    lines: string[];
  };
  table?: LearningArticleTable;
  relatedLinks?: {
    slug: string;
    text: string;
  }[];
  externalLinks?: {
    href: string;
    text: string;
  }[];
};

export type LearningArticle = {
  slug: string;
  title: string;
  seoTitle?: string;
  description: string;
  excerpt: string;
  intro: string | string[];
  category?: string;
  level?: string;
  /** ISO date string (YYYY-MM-DD) */
  publishedAt?: string;
  /** ISO date string (YYYY-MM-DD) */
  updatedAt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  /**
   * Optional list-card image. When set, `/learning` cards use this instead of
   * `coverImage`. Article pages continue to use `coverImage`.
   */
  thumbnailImageUrl?: string;
  /**
   * CSS object-position for the Learning list-card crop (e.g. "center top").
   * Falls back to centered cover when omitted.
   */
  thumbnailObjectPosition?: string;
  /** Slugs of other published Learning articles to show in "Relaterade ämnen". */
  relatedArticleSlugs?: string[];
  /** Compact source list rendered near the end of the article. */
  sources?: {
    href: string;
    text: string;
  }[];
  showDefaultDisclaimer?: boolean;
  sections: LearningArticleSection[];
};

export const learningDisclaimer =
  "DivLab publicerar informationellt och redaktionellt utbildningsmaterial. Innehållet utgör inte personlig finansiell rådgivning och inte heller en individuell investeringsrekommendation. Marknadsinformation kan förändras efter publicering. Du ansvarar själv för dina beslut. Investeringar innebär risk och du kan förlora hela eller delar av ditt kapital.";
