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
  publishedAt?: string;
  updatedAt?: string;
  coverImage?: string;
  coverImageAlt?: string;
  showDefaultDisclaimer?: boolean;
  sections: LearningArticleSection[];
  takeaways: string[];
};

export const learningDisclaimer =
  "Endast utbildande innehåll. Inte finansiell rådgivning.";
