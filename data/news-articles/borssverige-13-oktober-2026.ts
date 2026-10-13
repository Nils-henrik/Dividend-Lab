import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 13 oktober 2026.
 * Editorial research cutoff: 2026-10-13T08:20:28+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://karnell.se/pressmeddelanden/karnell-offentliggor-preliminara-siffror-for-tredje-kvartalet-2026-stark-organisk-ebita-tillvaxt/
 * P0_SOURCE[primary]: https://www.mfn.se/a/avtech-sweden/avtech-offentliggor-nyckeltal-for-det-tredje-kvartalet-2026
 */
export const BORSSVERIGE_13_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-13-oktober-2026",
  slug: "borssverige-13-oktober-2026",
  title: "Karnell lyfter marginalen – AVTECHs återkommande intäkter minskar",
  summary:
    "Karnells preliminära Q3-siffror visar 33 procents omsättningstillväxt och en EBITA-marginal över 20 procent. AVTECH går åt motsatt håll med lägre försäljning, ARR och resultat.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-13T08:20:28+02:00",
  url: "/news/borssverige-13-oktober-2026",
  featured: true,
  imageUrl: "/news/generated/borssverige-2026-10-13.png",
  thumbnailImageUrl: "/news/generated/borssverige-2026-10-13.png",
  imageAlt: "BörsSverige 2026-10-13 – DivLabs morgonöversikt över svenska börsnyheter.",
  readingMinutes: 4,
  seoTitle: "Karnell lyfter marginalen – AVTECH tappar ARR i Q3",
  seoDescription:
    "Karnells preliminära Q3 visar stark organisk tillväxt och högre marginal. AVTECH redovisar lägre försäljning, ARR och resultat.",
  seoKeywords: [
    "Karnell Q3 2026",
    "Karnell aktie",
    "AVTECH Q3 2026",
    "AVTECH ARR",
    "svenska börsen idag",
    "Stockholmsbörsen 13 oktober 2026",
    "BörsSverige",
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "Q3", "industriteknik", "flygteknik", "organisk tillväxt", "återkommande intäkter"],
    companies: ["Karnell Group", "AVTECH Sweden"],
    tickers: ["KARNEL B", "AVT B"],
    relatedNewsSlugs: [
      "borssverige-11-oktober-2026",
      "borssverige-10-oktober-2026",
      "norden-i-centrum-13-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Två svenska förhandsbesked inför Q3-rapporterna visar tydligt olika utveckling. Karnell uppger att omsättningen ökade omkring 33 procent och att EBITA steg omkring 73 procent, medan AVTECH redovisar lägre försäljning, återkommande intäkter och resultat än ett år tidigare.",
    "Karnells marginalförbättring bygger både på organisk utveckling och förvärv. För AVTECH är den viktigaste förändringen att en större kund använt tjänsterna mindre, vilket har dragit ned bolagets ARR.",
    "Stockholmsbörsen hade inte öppnat vid artikelns verifierade bryttid. Därför anges inga kursrörelser, och inga analytikerförväntningar används eftersom sådana inte har verifierats i källunderlaget.",
  ],
  sections: [
    {
      heading: "Karnell växer snabbt och lyfter EBITA-marginalen",
      paragraphs: [
        "Karnells preliminära nettoomsättning för Q3 var omkring 580 miljoner kronor, jämfört med 436 miljoner ett år tidigare. Det motsvarar en ökning på cirka 33 procent. Den organiska tillväxten var omkring 19 procent, medan förvärv bidrog med cirka 15 procent och valutaeffekten var försumbar.",
        "EBITA ökade till omkring 120 miljoner kronor från 69 miljoner, en uppgång på cirka 73 procent. Den organiska EBITA-tillväxten var omkring 43 procent och förvärv bidrog med cirka 31 procent. EBITA-marginalen steg till drygt 20 procent från 15,9 procent.",
        "Det är marginalförflyttningen som gör beskedet mer än en ren förvärvsdriven tillväxtnyhet. Resultatet växte snabbare än omsättningen, samtidigt som den organiska delen stod för en stor del av ökningen.",
      ],
    },
    {
      heading: "Tillfällig efterfrågan kräver försiktig tolkning",
      paragraphs: [
        "Karnell beskriver utvecklingen som bred i båda affärsområdena och hänvisar den organiska tillväxten till god efterfrågan och hög leveranstakt i flera koncernbolag.",
        "Samtidigt upprepar bolaget att den höga efterfrågan i ett av nischbolagen bedöms vara tillfällig. Det gör uthålligheten i den organiska tillväxten till en central fråga när den fullständiga rapporten kommer.",
        "Siffrorna är preliminära och inte granskade av bolagets revisor. Karnell publicerar delårsrapporten för januari–september den 23 oktober klockan 07.00 och har meddelat att bolaget inte kommenterar uppgifterna ytterligare före dess.",
      ],
    },
    {
      heading: "AVTECH tappar försäljning och återkommande intäkter",
      paragraphs: [
        "AVTECHs preliminära nettoomsättning blev 10,3 miljoner kronor i Q3, jämfört med 12,3 miljoner ett år tidigare. Minskningen var 15,9 procent. EBITDA sjönk till 4,3 miljoner från 6,7 miljoner och nettoresultatet till 3,1 miljoner från 5,2 miljoner.",
        "ARR, bolagets annualiserade återkommande intäkter beräknade utifrån kvartalets sista månad, minskade till 43,2 miljoner kronor från 48,9 miljoner. Det var en nedgång på 11,7 procent. Bolaget förklarar huvuddelen av tappet med lägre användning av tjänsterna hos en större kund.",
        "Nettoresultatet minskade med 39,8 procent. Utöver de lägre intäkterna pekar AVTECH på planerade resursförstärkningar inom försäljning, kunddriftsättning och produktutveckling.",
      ],
    },
    {
      heading: "Starkt kassaflöde mildrar inte intäktstappet",
      paragraphs: [
        "AVTECHs kassaflöde under kvartalet var 8,6 miljoner kronor, upp från 5,9 miljoner ett år tidigare. Av beloppet kom 3,2 miljoner från bidrag i EU-projekt, och bolaget uppger att merparten av tidigare förfallna kundfordringar betalades under perioden.",
        "Likvida medel steg till 42,8 miljoner kronor från 33,2 miljoner och soliditeten var 86,7 procent. Balansräkningen ger därmed finansiell handlingsfrihet, men den operativa huvudfrågan är fortfarande om kunddialoger och produktinvesteringar kan vända utvecklingen i försäljning och ARR.",
        "AVTECH publicerar den fullständiga Q3-rapporten den 23 oktober. Då blir intäktsutvecklingen hos den större kunden, kostnadsnivån efter resursförstärkningarna och konverteringen av den kommersiella pipelinen de viktigaste kontrollpunkterna.",
      ],
    },
    {
      heading: "Det här följer vi härnäst",
      paragraphs: [
        "Karnell och AVTECH lämnar sina fullständiga Q3-rapporter samma dag, den 23 oktober. För Karnell behöver investerare skilja uthållig organisk förbättring från den efterfrågan som bolaget självt beskriver som tillfällig. För AVTECH blir frågan om lägre kundanvändning är övergående eller början på en svagare intäktstrend.",
        "Redan onsdagen den 14 oktober kommer de kontrollpunkter som helgens BörsSverige pekade ut: SCB publicerar svensk KPI och hushållens konsumtion för september, samtidigt som Dustin lämnar bokslut. Dagens bolagsbesked ersätter inte de bredare signalerna, men ger två konkreta exempel på hur efterfrågan och investeringar slår olika mellan svenska småbolag.",
        "Rapportutfall som låg efter dagens redaktionella bryttid föregrips inte. Nästa uppdatering ska bygga på respektive bolags publicerade rapport eller annan primärkälla.",
      ],
    },
  ],
  sources: [
    {
      text: "Karnell Group: preliminära Q3-siffror för omsättning, organisk tillväxt, EBITA, marginal och rapportdatum, publicerade 12 oktober 2026",
      href: "https://karnell.se/pressmeddelanden/karnell-offentliggor-preliminara-siffror-for-tredje-kvartalet-2026-stark-organisk-ebita-tillvaxt/",
    },
    {
      text: "AVTECH Sweden via MFN: preliminära Q3-nyckeltal för försäljning, ARR, resultat, kassaflöde, balansräkning och rapportdatum, publicerade 13 oktober 2026",
      href: "https://www.mfn.se/a/avtech-sweden/avtech-offentliggor-nyckeltal-for-det-tredje-kvartalet-2026",
    },
  ],
};
