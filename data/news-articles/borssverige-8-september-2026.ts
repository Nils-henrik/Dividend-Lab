import type { NewsArticle } from "@/types/news";

/**
 * SAFE AUTOREDAKTION CI DRY RUN ONLY.
 * Editorial research cutoff: 21:00 CEST, 12 September 2026.
 * This branch is intentionally never merged to production.
 */
export const BORSSVERIGE_8_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-8-september-2026-skf-vertevo-bostadsmarknaden",
  slug: "borssverige-8-september-2026-skf-vertevo-bostadsmarknaden",
  title: "BörsSverige: säker CI-test av svensk publiceringskedja",
  summary:
    "Det här är en isolerad validering av BörsSveriges autonoma publiceringskedja med Sverige, Stockholmsbörsen och svensk marknadsdata i fokus. Testet ska aldrig mergeas till produktion.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-12T21:00:00+02:00",
  updatedAt: "2026-09-12T21:02:00+02:00",
  url: "/news/borssverige-8-september-2026-skf-vertevo-bostadsmarknaden",
  featured: false,
  imageUrl: null,
  readingMinutes: 2,
  seoTitle: "BörsSverige: säker test av autonom svensk publicering",
  seoDescription:
    "Isolerad CI-test av DivLabs autonoma BörsSverige-flöde med svensk börsfokus, SEO, registerkontroll och fail-closed-validering.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen",
    "svenska börsen",
    "Riksbanken",
    "SCB",
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "svensk marknad"],
    relatedNewsSlugs: ["norden-i-centrum-8-september-2026"],
  },
  showDisclaimer: true,
  intro: [
    "Den här texten finns bara på en separat valideringsbranch. Syftet är att låta samma tekniska gate som en riktig BörsSverige-artikel möter kontrollera en komplett svensk artikelmodul före autonom drift.",
    "Sverige, Stockholmsbörsen, Riksbanken och SCB används som tydliga svenska marknadssignaler. Texten gör inga påståenden om dagens kursrörelser eller obekräftade bolagshändelser.",
  ],
  sections: [
    {
      heading: "Svensk marknad i centrum",
      paragraphs: [
        "BörsSverige ska vara Sverige-fokuserad. Testet verifierar därför att svenska marknadsbegrepp som Stockholmsbörsen, Sverige och svenska bolag väger tyngre än utländska marknadsreferenser.",
        "Testet innehåller inga påhittade besked från svenska bolag, Riksbanken eller SCB. Det verifierar struktur och säkerhetsregler, inte en redaktionell nyhet för publicering.",
      ],
    },
    {
      heading: "Fail-closed före produktion",
      paragraphs: [
        "Artikelns id, slug, SEO-fält, URL, lästid, ansvarsfriskrivning och interna länksignaler måste passera validatorn. Bilden är avsiktligt satt till null för att verifiera den säkra bildlösa vägen.",
        "Om någon gate fallerar ska ändringen stanna på branchen. Den här teständringen ska aldrig mergeas till main och ska därför aldrig bli en riktig DivLab-nyhet.",
      ],
    },
  ],
};
