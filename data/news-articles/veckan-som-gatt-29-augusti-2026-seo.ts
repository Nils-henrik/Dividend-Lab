import type { NewsArticle } from "@/types/news";
import { VECKAN_SOM_GATT_29_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/veckan-som-gatt-29-augusti-2026";

/**
 * Search-intent layer for the week 35 recap.
 * Keeps the verified editorial body intact while improving H1, ingress and
 * metadata for searches around börsveckan vecka 35, Nvidia, OMXS30 and USA-inflation.
 */
export const VECKAN_SOM_GATT_29_AUGUSTI_2026_SEO_ARTICLE: NewsArticle = {
  ...VECKAN_SOM_GATT_29_AUGUSTI_2026_ARTICLE,
  title: "Veckan som gått: Nvidia lyfte AI-handeln – OMXS30 över 3 300",
  summary:
    "Börsveckan vecka 35 gav en stark Nvidia-rapport, OMXS30 över 3 300 och bättre nordiska tillväxtdata. Samtidigt höll USA:s inflation ränteoron vid liv.",
  imageAlt:
    "Börsveckan vecka 35 2026 med Nvidia, OMXS30, Norden, Europa och Wall Street i fokus.",
  seoTitle: "Börsveckan vecka 35: Nvidia, OMXS30 och USA-inflation",
  seoDescription:
    "Börsveckan vecka 35 summerad: Nvidia lyfte AI-handeln, OMXS30 stängde över 3 300 och USA:s inflation höll ränteoron vid liv.",
  seoKeywords: [
    "börsveckan vecka 35",
    "börsen vecka 35 2026",
    "veckan som gått börsen",
    "Nvidia rapport",
    "OMXS30 vecka 35",
    "USA inflation",
    "PCE inflation",
    "nordiska börsen",
    "Wall Street",
    "Nasdaq",
    "Federal Reserve",
    "svensk BNP",
    "Finland BNP",
    "börsnyheter",
  ],
  internalLinking: {
    ...VECKAN_SOM_GATT_29_AUGUSTI_2026_ARTICLE.internalLinking,
    relatedNewsSlugs: [
      "borsveckan-24-28-augusti-2026-nvidia-jackson-hole",
      "nvidia-infor-odesrapporten-ai-rally-25-augusti-2026",
      "borssverige-28-augusti-2026",
      "norden-i-centrum-28-augusti-2026",
      "usa-borsen-nvidia-nasdaq-ai-rally-27-augusti-2026",
    ],
  },
  intro: [
    "Börsveckan vecka 35 blev ett tydligt styrketest för marknaden. Nvidia bekräftade att AI-investeringarna fortfarande växer snabbt, OMXS30 tog sig över 3 300 och svensk och finsk ekonomi visade tydligare livstecken. Samtidigt låg den amerikanska inflationen kvar på en nivå som gör att räntan inte kan räknas bort ur marknadens ekvation.",
    ...(VECKAN_SOM_GATT_29_AUGUSTI_2026_ARTICLE.intro?.slice(1) ?? []),
  ],
};
