import { stripLearningRichText } from "@/lib/learning/rich-text";
import type { LearningArticle } from "./types";

const WORDS_PER_MINUTE = 200;

function countWords(text: string) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function plainText(text: string) {
  return stripLearningRichText(text);
}

function collectArticleText(article: LearningArticle) {
  const introText = Array.isArray(article.intro)
    ? article.intro.map(plainText).join(" ")
    : plainText(article.intro);
  const chunks: string[] = [
    article.title,
    article.description,
    introText,
    ...article.takeaways.map(plainText),
  ];

  for (const section of article.sections) {
    if (section.heading) {
      chunks.push(section.heading);
    }

    if (section.intro) {
      chunks.push(...section.intro.map(plainText));
    }

    if (section.paragraphs) {
      chunks.push(...section.paragraphs.map(plainText));
    }

    if (section.bullets) {
      chunks.push(...section.bullets.map(plainText));
    }

    if (section.numberedItems) {
      chunks.push(...section.numberedItems.map(plainText));
    }

    if (section.callout) {
      chunks.push(plainText(section.callout));
    }

    if (section.calculation) {
      chunks.push(section.calculation.title, ...section.calculation.lines);
    }

    if (section.table) {
      chunks.push(...section.table.headers, ...section.table.rows.flat());
    }

    if (section.relatedLinks) {
      chunks.push(...section.relatedLinks.map((link) => link.text));
    }

    if (section.externalLinks) {
      chunks.push(...section.externalLinks.map((link) => link.text));
    }

    if (section.paragraphsAfterLists) {
      chunks.push(...section.paragraphsAfterLists.map(plainText));
    }

    if (section.subsections) {
      for (const subsection of section.subsections) {
        chunks.push(subsection.subheading);
        if (subsection.paragraphs) {
          chunks.push(...subsection.paragraphs.map(plainText));
        }
        if (subsection.bullets) {
          chunks.push(...subsection.bullets.map(plainText));
        }
        if (subsection.numberedItems) {
          chunks.push(...subsection.numberedItems.map(plainText));
        }
        if (subsection.paragraphsAfterLists) {
          chunks.push(...subsection.paragraphsAfterLists.map(plainText));
        }
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
