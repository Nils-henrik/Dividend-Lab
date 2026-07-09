import type { LearningArticle } from "./types";

const WORDS_PER_MINUTE = 200;

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function collectArticleText(article: LearningArticle) {
  const chunks: string[] = [
    article.title,
    article.description,
    article.intro,
    ...article.takeaways,
  ];

  for (const section of article.sections) {
    if (section.heading) {
      chunks.push(section.heading);
    }

    if (section.intro) {
      chunks.push(...section.intro);
    }

    if (section.paragraphs) {
      chunks.push(...section.paragraphs);
    }

    if (section.callout) {
      chunks.push(section.callout);
    }

    if (section.calculation) {
      chunks.push(section.calculation.title, ...section.calculation.lines);
    }

    if (section.relatedLinks) {
      chunks.push(...section.relatedLinks.map((link) => link.text));
    }

    if (section.subsections) {
      for (const subsection of section.subsections) {
        chunks.push(subsection.subheading, ...subsection.paragraphs);
      }
    }
  }

  return chunks.join(" ");
}

export function getArticleReadingMinutes(article: LearningArticle) {
  const words = countWords(collectArticleText(article));
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export type LearningArticleWithReadingTime = LearningArticle & {
  readingMinutes: number;
};

export function withReadingTime(article: LearningArticle): LearningArticleWithReadingTime {
  return {
    ...article,
    readingMinutes: getArticleReadingMinutes(article),
  };
}
