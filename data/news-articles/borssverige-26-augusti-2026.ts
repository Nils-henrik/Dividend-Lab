import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 26 August 2026.
 *
 * Publication cutoff: 08:20 CEST, before the Stockholm market open.
 * Primary sources checked:
 * - BioArctic, Interim report April–June 2026, published 26 Aug 2026.
 * - Modular Finance Estimates, BioArctic Q2 2026 consensus, published 21 Aug 2026.
 * - Sveriges Riksbank, August monetary-policy decision and calendar, 20–26 Aug 2026.
 *
 * Market reaction is intentionally not included before trading starts.
 */
export const BORSSVERIGE_26_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "borssverige-26-augusti-2026",
  slug: "borssverige-26-augusti-2026",
  title:
    "BörsSverige – 26 augusti: BioArctic slår förväntningarna inför öppningen",
  summary:
    "BioArctic redovisar 247,5 miljoner kronor i Q2-omsättning och ett rörelseresultat på −6,5 miljoner, tydligt bättre än konsensus. Samtidigt ligger det svenska ränteläget fortsatt i fokus efter Riksbankens augustibesked.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-26T08:20:00+02:00",
  url: "/news/borssverige-26-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/borssverige-2026-08-26.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 26 augusti 2026 med BioArctic och svensk ränta i fokus inför Stockholmsbörsens öppning.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle: "BörsSverige 26 augusti: BioArctic slår förväntningarna",
  seoDescription:
    "BioArctic slår konsensus i Q2 med högre omsättning och mindre rörelseförlust än väntat. Här är onsdagens viktigaste svenska börsnyheter inför öppningen.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen",
    "BioArctic",
    "BIOA B",
    "BioArctic Q2 2026",
    "Leqembi",
    "BrainTransporter",
    "Riksbanken",
    "styrränta",
    "svenska aktier",
    "börsnyheter",
    "26 augusti 2026",
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "Q2 2026", "Riksbanken", "Alzheimer", "bioteknik"],
    companies: ["BioArctic"],
    tickers: ["BIOA B"],
    relatedNewsSlugs: ["borssverige-25-augusti-2026"],
  },
  showDisclaimer: true,
  intro: [
    "BioArctic står i centrum inför onsdagens öppning på Stockholmsbörsen. Forskningsbolagets Q2-rapport kommer in tydligt bättre än analytikernas förväntningar både på försäljning och rörelseresultat.",
    "Samtidigt är det svenska ränteläget fortsatt en viktig bakgrund för börsen. Riksbanken lämnade förra veckan styrräntan oförändrad på 1,75 procent och bedömer fortfarande att en höjning senare i år är möjlig.",
  ],
  sections: [
    {
      heading: "BioArctic slår konsensus på två viktiga punkter",
      paragraphs: [
        "BioArctic redovisar en nettoomsättning på 247,5 miljoner kronor för Q2 2026. Inför rapporten låg konsensus från Modular Finance, baserat på tre analytikerestimat, på 224 miljoner kronor. Utfallet är därmed cirka 10,5 procent högre än väntat.",
        "Även rörelseresultatet är starkare än marknaden räknat med. Det blev −6,5 miljoner kronor, jämfört med ett väntat resultat på −32,9 miljoner kronor. Förlusten blev alltså drygt 26 miljoner kronor mindre än konsensus.",
        "Jämfört med samma kvartal förra året är siffrorna lägre. Då uppgick omsättningen till 392,1 miljoner kronor och rörelseresultatet till 179,1 miljoner. För BioArctic kan intäkterna dock variera kraftigt mellan kvartalen eftersom milstolps- och engångsbetalningar från samarbeten kan få stor effekt på enskilda perioder.",
      ],
    },
    {
      heading: "Leqembi fortsätter bygga återkommande royaltyintäkter",
      paragraphs: [
        "En av de viktigaste delarna i rapporten är royaltyintäkterna från Alzheimerläkemedlet Leqembi. De uppgick till 179,4 miljoner kronor under kvartalet, jämfört med 162,5 miljoner kronor under motsvarande period förra året.",
        "Bakom royaltyn ligger en global Leqembi-försäljning på 29,3 miljarder yen under kvartalet. BioArctics partner Eisai räknar med en försäljning på 143,5 miljarder yen under sitt räkenskapsår april 2026 till mars 2027, vilket skulle motsvara en tillväxt på 63 procent.",
        "Efter kvartalets slut har Leqembi dessutom fått stöd av FDA-godkännandet för Leqembi Iqlik som autoinjektor för behandling från start. Produkten har lanserats i USA och är utformad för att förenkla behandlingen genom administration i hemmet.",
      ],
    },
    {
      heading: "Lilly-avtalet ger BrainTransporter ytterligare tyngd",
      paragraphs: [
        "Under kvartalet ingick BioArctic ett forsknings- och samarbetsavtal med Eli Lilly där BioArctics BrainTransporter-teknik kombineras med en ännu inte offentliggjord läkemedelskandidat från Lilly.",
        "BioArctic får 30 miljoner dollar i en initial betalning. Därutöver kan avtalet ge upp till 770 miljoner dollar i framtida milstolpsbetalningar samt royalty om projektet når marknaden. Det möjliga avtalsvärdet är därmed upp till 800 miljoner dollar före royalty.",
        "Det är viktigt att skilja möjligheten från ett säkert framtida inflöde: huvuddelen av beloppet är beroende av att projektet når olika utvecklingsmässiga och kommersiella mål. Men avtalet är samtidigt ännu ett exempel på att ett stort globalt läkemedelsbolag väljer BioArctics teknikplattform.",
      ],
    },
    {
      heading: "DivLabs tolkning: starkare rapport än fjolårsjämförelsen antyder",
      paragraphs: [
        "En snabb blick på jämförelsen med Q2 2025 kan få rapporten att se svag ut eftersom både omsättning och resultat är lägre än för ett år sedan. Den viktigaste informationen inför dagens handel är däremot att utfallet slår marknadens förväntningar tydligt.",
        "Samtidigt växer royaltyintäkterna från Leqembi och BrainTransporter får ytterligare extern validering genom Lilly-samarbetet. DivLabs bedömning är därför att rapporten ger marknaden fler positiva än negativa datapunkter att värdera vid öppningen.",
        "Någon kursreaktion går ännu inte att slå fast eftersom Stockholmsbörsen inte har öppnat när den här artikeln publiceras. BioArctic blir därför en av de tydligaste aktierna att följa från klockan 09.00.",
      ],
    },
    {
      heading: "Riksbanken håller räntan still – men höjningsrisken finns kvar",
      paragraphs: [
        "Riksbanken lämnade den 20 augusti styrräntan oförändrad på 1,75 procent. Direktionen konstaterade samtidigt att både tillväxten och inflationen under sommaren varit högre än prognosen från juni och att risken för för hög underliggande inflation kvarstår.",
        "Riksbankens bedömning är fortfarande att det finns en sannolikhet för en räntehöjning senare i år. Det gör ränteläget relevant för bland annat fastighetsbolag, konsumentbolag och andra räntekänsliga delar av Stockholmsbörsen.",
        "Vice riksbankschef Göran Hjelm talar på onsdagsmorgonen mellan klockan 08.00 och 09.00 om det ekonomiska läget och det senaste räntebeskedet. Eventuella nya besked från talet behöver vägas in separat när de är publicerade och verifierade.",
      ],
    },
    {
      heading: "Det här följer vi vid börsöppningen",
      paragraphs: [
        "BioArctic är den tydligaste enskilda svenska aktien att följa när handeln öppnar. Rapporten är bättre än väntat på både omsättning och rörelseresultat, men marknadens faktiska omdöme kommer först när aktien börjar handlas.",
        "Klockan 09.30 håller BioArctic dessutom sin rapportpresentation. Där blir kommentarer om Leqembis utveckling, kostnadsnivån, BrainTransporter och den fortsatta forskningsportföljen särskilt intressanta.",
        "För den bredare Stockholmsbörsen ligger samtidigt räntan kvar som en viktig svensk faktor. Onsdagens morgon har därför en tydlig inhemsk kärna: BioArctics rapport först, Riksbankens signaler i bakgrunden och marknadens reaktion efter klockan 09.00.",
      ],
    },
  ],
  sources: [
    {
      text: "BioArctic – Delårsrapport april–juni 2026, 26 augusti 2026",
      href: "https://www.bioarctic.com/sv/delarsrapport-april-juni-2026/",
    },
    {
      text: "Modular Finance Estimates – BioArctic consensus estimates Q2 2026, 21 augusti 2026",
      href: "https://www.mfn.se/a/modularfinance-estimates/estimates-compiled-by-modular-finance-on-behalf-of-bioarctic",
    },
    {
      text: "Sveriges Riksbank – Styrräntan oförändrad på 1,75 procent, 20 augusti 2026",
      href: "https://ebs.publicnow.com/view/E016FB97145EAD3704F26F2016AFFFC528053153",
    },
    {
      text: "Sveriges Riksbank – Kalender: Hjelm om ekonomiska läget och det senaste räntebeskedet, 26 augusti 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/",
    },
  ],
};
