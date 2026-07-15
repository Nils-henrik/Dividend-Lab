import borjaInvestera from "./articles/borja-investera-pa-borsen";
import vadArEnAktie from "./articles/vad-ar-en-aktie";
import vadArEnIndexfond from "./articles/vad-ar-en-indexfond";
import direktavkastning from "./articles/direktavkastning-och-utdelningssakerhet";
import sparande from "./articles/sparande-i-borjan";
import tidTillFrihet from "./articles/tid-till-ekonomisk-frihet";
import { withReadingTime, type LearningArticleWithReadingTime } from "./reading-time";
import type { LearningArticle } from "./types";

export type {
  LearningArticle,
  LearningArticleSection,
  LearningArticleSubsection,
} from "./types";
export { learningDisclaimer } from "./types";
export {
  getArticleReadingMinutes,
  withReadingTime,
  type LearningArticleWithReadingTime,
} from "./reading-time";

const rawArticles: LearningArticle[] = [
  vadArEnAktie,
  borjaInvestera,
  vadArEnIndexfond,
  tidTillFrihet,
  direktavkastning,
  sparande,
];

export const learningArticles: LearningArticleWithReadingTime[] =
  rawArticles.map(withReadingTime);

export function getLearningArticle(slug: string) {
  return learningArticles.find((article) => article.slug === slug) ?? null;
}

export function getRelatedLearningArticles(
  currentSlug: string,
  relatedSlugs?: string[],
) {
  if (!relatedSlugs?.length) {
    return [];
  }

  const seen = new Set<string>();

  return relatedSlugs
    .map((slug) => getLearningArticle(slug))
    .filter((article): article is LearningArticleWithReadingTime => {
      if (!article || article.slug === currentSlug || seen.has(article.slug)) {
        return false;
      }

      seen.add(article.slug);
      return true;
    });
}

export function getDashboardLearningInsights() {
  return learningArticles.map((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
  }));
}
