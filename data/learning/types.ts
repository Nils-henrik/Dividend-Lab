export type LearningArticleSubsection = {
  subheading: string;
  paragraphs: string[];
};

export type LearningArticleSection = {
  heading?: string;
  intro?: string[];
  paragraphs?: string[];
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
};

export type LearningArticle = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  intro: string;
  sections: LearningArticleSection[];
  takeaways: string[];
};

export const learningDisclaimer =
  "Endast utbildande innehåll. Inte finansiell rådgivning.";
