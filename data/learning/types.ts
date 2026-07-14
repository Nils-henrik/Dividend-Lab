export type LearningArticleSubsection = {
  subheading: string;
  paragraphs?: string[];
  bullets?: string[];
  numberedItems?: string[];
  paragraphsAfterLists?: string[];
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
  /** Slugs of other published Learning articles to show in "Relaterade ämnen". */
  relatedArticleSlugs?: string[];
  /** Compact source list rendered near the end of the article. */
  sources?: {
    href: string;
    text: string;
  }[];
  showDefaultDisclaimer?: boolean;
  sections: LearningArticleSection[];
  takeaways: string[];
};

export const learningDisclaimer =
  "Innehållet är endast avsett för utbildning och allmän information. Det utgör inte personlig finansiell rådgivning eller en rekommendation att köpa eller sälja ett visst värdepapper. Investeringar innebär risk och du kan förlora hela eller delar av ditt kapital.";
