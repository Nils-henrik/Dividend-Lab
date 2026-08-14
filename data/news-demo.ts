import type { NewsArticle } from "@/types/news";
import { AKTIEREKAR_INFOR_NASTA_VECKA_MICROSOFT_META_AMAZON_SINCH_ARTICLE } from "@/data/news-articles/aktierekar-infor-nasta-vecka-microsoft-meta-amazon-sinch";
import { AMAZON_RUSAR_MICRON_TVAVANDER_AI_BOOMEN_WALL_STREET_ARTICLE } from "@/data/news-articles/amazon-rusar-micron-tvavander-ai-boomen-wall-street";
import { BORSSVERIGE_14_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/borssverige-14-augusti-2026";
import { NORDEN_I_CENTRUM_14_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-14-augusti-2026";
import { BORSSVERIGE_LUNCH_13_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/borssverige-lunch-13-augusti-2026";
import { MILJARDBUD_PA_EVOLUTION_ARTICLE } from "@/data/news-articles/miljardbud-pa-evolution";
import { BORSSVERIGE_13_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/borssverige-13-augusti-2026";
import { BORSSVERIGE_12_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/borssverige-12-augusti-2026";
import { BORSVECKA_32_INVESTOR_INFLATION_USA_JOBB_ARTICLE } from "@/data/news-articles/borsvecka-32-investor-inflation-usa-jobb";
import { BORSVECKA_33_ARTICLE } from "@/data/news-articles/borsvecka-33";
import { BORSVECKAN_I_KORTHET_AI_FROSSA_OLJERUSNING_RANTEHOT_ARTICLE } from "@/data/news-articles/borsveckan-i-korthet-ai-frossa-oljerusning-rantehot";
import { BORSVECKAN_SOM_GICK_VECKA_32_2026_ARTICLE } from "@/data/news-articles/borsveckan-som-gick-vecka-32-2026";
import { IRAN_OLJEPRIS_HORMUZ_BORSEN_ARTICLE } from "@/data/news-articles/iran-oljepris-hormuz-borsen";
import { NOKIA_OVERRASKAR_AI_FORSALJNINGEN_FORDUBBLADES_ARTICLE } from "@/data/news-articles/nokia-overraskar-ai-forsaljningen-fordubblades";
import { NORDEN_I_CENTRUM_4_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-4-augusti-2026";
import { NORDEN_I_CENTRUM_5_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-5-augusti-2026";
import { NORDEN_I_CENTRUM_6_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-6-augusti-2026";
import { NORDEN_I_CENTRUM_7_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-7-augusti-2026";
import { NORDEN_I_CENTRUM_10_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-10-augusti-2026";
import { NORDEN_I_CENTRUM_11_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-11-augusti-2026";
import { NORDEN_I_CENTRUM_12_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-12-augusti-2026";
import { NORDEN_I_CENTRUM_13_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-13-augusti-2026";
import { ONSDAGENS_RAPPORTER_TESLA_IBM_ARTICLE } from "@/data/news-articles/onsdagens-rapporter-tesla-ibm";
import { SINCH_RASAR_EFTER_Q2_RAPPORTEN_2026_ARTICLE } from "@/data/news-articles/sinch-rasar-efter-q2-rapporten-2026";
import { SIVERS_RUSAR_AI_FOTONIK_USA_IMPORTREGLER_ARTICLE } from "@/data/news-articles/sivers-rusar-ai-fotonik-usa-importregler";
import { UKRAINA_WILDBERRIES_RYSSLAND_BENSIN_INFLATION_ARTICLE } from "@/data/news-articles/ukraina-wildberries-ryssland-bensin-inflation";
import { USA_BORSEN_FALLER_ALPHABET_TESLA_OLJA_ARTICLE } from "@/data/news-articles/usa-borsen-faller-alphabet-tesla-olja";
import { WALL_STREET_REKORDNIVA_SVALARE_INFLATION_TECHAKTIERNA_ARTICLE } from "@/data/news-articles/wall-street-rekordniva-svalare-inflation-techaktierna";
import { applyNewsSearchSeo } from "@/lib/seo/editorial-content";

/**
 * Published Börsnyheter articles.
 * Image assets currently live under /public/news-demo/ for historical path stability.
 */
const PUBLISHED_NEWS_ARTICLES: NewsArticle[] = [
  BORSSVERIGE_14_AUGUSTI_2026_ARTICLE,
  NORDEN_I_CENTRUM_14_AUGUSTI_2026_ARTICLE,
  WALL_STREET_REKORDNIVA_SVALARE_INFLATION_TECHAKTIERNA_ARTICLE,
  BORSSVERIGE_LUNCH_13_AUGUSTI_2026_ARTICLE,
  MILJARDBUD_PA_EVOLUTION_ARTICLE,
  BORSSVERIGE_13_AUGUSTI_2026_ARTICLE,
  NORDEN_I_CENTRUM_13_AUGUSTI_2026_ARTICLE,
  BORSSVERIGE_12_AUGUSTI_2026_ARTICLE,
  NORDEN_I_CENTRUM_12_AUGUSTI_2026_ARTICLE,
  NORDEN_I_CENTRUM_11_AUGUSTI_2026_ARTICLE,
  NORDEN_I_CENTRUM_10_AUGUSTI_2026_ARTICLE,
  BORSVECKA_33_ARTICLE,
  BORSVECKAN_SOM_GICK_VECKA_32_2026_ARTICLE,
  NORDEN_I_CENTRUM_7_AUGUSTI_2026_ARTICLE,
  NORDEN_I_CENTRUM_6_AUGUSTI_2026_ARTICLE,
  NORDEN_I_CENTRUM_5_AUGUSTI_2026_ARTICLE,
  SIVERS_RUSAR_AI_FOTONIK_USA_IMPORTREGLER_ARTICLE,
  NORDEN_I_CENTRUM_4_AUGUSTI_2026_ARTICLE,
  BORSVECKA_32_INVESTOR_INFLATION_USA_JOBB_ARTICLE,
  AMAZON_RUSAR_MICRON_TVAVANDER_AI_BOOMEN_WALL_STREET_ARTICLE,
  BORSVECKAN_I_KORTHET_AI_FROSSA_OLJERUSNING_RANTEHOT_ARTICLE,
  UKRAINA_WILDBERRIES_RYSSLAND_BENSIN_INFLATION_ARTICLE,
  AKTIEREKAR_INFOR_NASTA_VECKA_MICROSOFT_META_AMAZON_SINCH_ARTICLE,
  USA_BORSEN_FALLER_ALPHABET_TESLA_OLJA_ARTICLE,
  NOKIA_OVERRASKAR_AI_FORSALJNINGEN_FORDUBBLADES_ARTICLE,
  SINCH_RASAR_EFTER_Q2_RAPPORTEN_2026_ARTICLE,
  ONSDAGENS_RAPPORTER_TESLA_IBM_ARTICLE,
  IRAN_OLJEPRIS_HORMUZ_BORSEN_ARTICLE,
];

export const DEMO_NEWS_ARTICLES: NewsArticle[] =
  PUBLISHED_NEWS_ARTICLES.map(applyNewsSearchSeo);
