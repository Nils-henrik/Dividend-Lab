import borjaInvestera from "./articles/borja-investera-pa-borsen";
import borsensOrdlista from "./articles/borsens-ordlista";
import direktavkastning from "./articles/direktavkastning-och-utdelningssakerhet";
import etf from "./articles/vad-ar-en-etf";
import fireEkonomiskFrihet from "./articles/fire-ekonomisk-frihet";
import hurMycketSparatEfterAlder from "./articles/hur-mycket-bor-man-ha-sparat-vid-25-35-45-65";
import iskEllerKapitalforsakring from "./articles/isk-eller-kapitalforsakring";
import levaPaUtdelningar from "./articles/leva-pa-utdelningar-kapital";
import peTal from "./articles/pe-tal-vad-betyder-det";
import premiepension from "./articles/ta-kontroll-over-premiepensionen";
import rantaPaRanta from "./articles/ranta-pa-ranta";
import sparande from "./articles/sparande-i-borjan";
import sparkvot from "./articles/sparkvot-budgetera-lonen-i-procent";
import tekniskAnalys from "./articles/teknisk-analys-for-nyborjare";
import tidTillFrihet from "./articles/tid-till-ekonomisk-frihet";
import vadArEnAktie from "./articles/vad-ar-en-aktie";
import vadArEnIndexfond from "./articles/vad-ar-en-indexfond";
import { withReadingTime, type LearningArticleWithReadingTime } from "./reading-time";
import type { LearningArticle } from "./types";
import { applyLearningSearchSeo } from "@/lib/seo/editorial-content";

export type {
  LearningArticle,
  LearningArticleSection,
  LearningArticleSubsection,
  LearningArticleTable,
} from "./types";
export { learningDisclaimer } from "./types";
export {
  getArticleReadingMinutes,
  withReadingTime,
  type LearningArticleWithReadingTime,
} from "./reading-time";

const rawArticles: LearningArticle[] = [
  borsensOrdlista,
  {
    ...tekniskAnalys,
    thumbnailObjectPosition: "left center",
  },
  levaPaUtdelningar,
  {
    ...hurMycketSparatEfterAlder,
    coverImage: "/learning/sparande_genom_livet_med_divlab.png",
    coverImageAlt:
      "Mörkt skrivbord med laptop, miniräknare och anteckningar om sparande vid 25, 35, 45 och 65 år.",
    thumbnailObjectPosition: "center",
  },
  {
    ...iskEllerKapitalforsakring,
    thumbnailObjectPosition: "left center",
  },
  rantaPaRanta,
  peTal,
  etf,
  premiepension,
  fireEkonomiskFrihet,
  sparkvot,
  vadArEnAktie,
  borjaInvestera,
  vadArEnIndexfond,
  tidTillFrihet,
  direktavkastning,
  sparande,
];

export const learningArticles: LearningArticleWithReadingTime[] =
  rawArticles.map(applyLearningSearchSeo).map(withReadingTime);

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
