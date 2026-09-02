import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 2 September 2026.
 *
 * Editorial research cutoff: 09:33 CEST, 2 September 2026.
 * Verified editorial anchors:
 * - Skanska: USD 57m / about SEK 530m US order in Del Mar, booked in Q3 2026.
 * - Swedbank/Silf manufacturing PMI: 56.1 in August vs revised 55.7 in July;
 *   input-price index 75.4 vs 67.2.
 * - OMXS30: 3,266.43 at the 1 September close, down 1.29% for the day.
 * - SEB Sparbarometer: household net wealth SEK 27,089bn; equity assets SEK
 *   13,170bn vs property assets SEK 13,128bn, the first crossover in the series.
 * - Volvo Cars: market calendar for 2 September lists rolling June-August sales;
 *   no new sales figure had been published at the research cutoff.
 *
 * Cover uploaded by editor:
 * public/news-demo/file_00000000f26481f496aadc0686b5460c.png
 */
export const BORSSVERIGE_2_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-2-september-2026",
  slug: "borssverige-2-september-2026",
  title:
    "BörsSverige 2 september: Skanska tar USA-order – högre kostnadstryck utmanar svensk industri",
  summary:
    "Skanska har fått en amerikansk order värd cirka 530 miljoner kronor. Samtidigt fortsätter svensk industri att växa, men kostnadstrycket har stigit tydligt och Volvo Cars väntas lämna nya försäljningssiffror under dagen.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-09-02T09:33:00+02:00",
  url: "/news/borssverige-2-september-2026",
  featured: true,
  imageUrl: "/news-demo/file_00000000f26481f496aadc0686b5460c.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 2 september 2026 med Stockholm i morgonljus inför onsdagens handel på Stockholmsbörsen.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle: "BörsSverige 2 september: Skanska får order på 530 miljoner",
  seoDescription:
    "Skanska får en USA-order på cirka 530 miljoner kronor. Samtidigt visar svensk industri fortsatt tillväxt, men också ett snabbt stigande kostnadstryck.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsnyheter idag",
    "svenska aktier",
    "Skanska",
    "Skanska USA order",
    "Volvo Cars",
    "Volvo Cars försäljning",
    "svensk PMI",
    "svensk industri",
    "kostnadstryck",
    "OMXS30",
    "2 september 2026",
  ],
  internalLinking: {
    topics: [
      "Stockholmsbörsen",
      "svensk industri",
      "inköpschefsindex",
      "svenskt sparande",
      "bilförsäljning",
    ],
    companies: ["Skanska", "Volvo Cars", "SEB", "Swedbank"],
    tickers: ["SKA B", "VOLCAR B"],
    relatedNewsSlugs: [
      "norden-i-centrum-2-september-2026",
      "borssverige-1-september-2026",
      "borsvecka-36-2026-jobbrapport-broadcom-euroinflation",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Stockholmsbörsen går in i onsdagen efter två raka nedgångsdagar. Skanska har på morgonen fått en amerikansk order värd cirka 530 miljoner kronor, samtidigt som svensk industri fortsätter att växa – men med ett tydligt högre kostnadstryck.",
    "Researchen för dagens BörsSverige stängdes klockan 09.33 den 2 september. Stockholmsbörsen hade då nyligen öppnat och de första minuternas kursrörelser används därför inte som ett fast facit. Fokus ligger i stället på verifierade svenska besked och de frågor som är relevanta för resten av handelsdagen.",
  ],
  sections: [
    {
      heading: "Skanska får USA-order på cirka 530 miljoner kronor",
      paragraphs: [
        "Skanska inleder onsdagen med en ny order i USA. Byggkoncernen har tecknat avtal med staden San Diego om projektet El Camino Real Half Mile to Via De La Valle i Del Mar i Kalifornien.",
        "Kontraktet är värt 57 miljoner dollar, motsvarande cirka 530 miljoner kronor, och ska räknas in i Skanskas amerikanska orderingång under Q3 2026.",
        "Projektet omfattar bland annat en breddning av El Camino Real till fyra körfält och ett byte av den 84 år gamla bron över San Dieguito River. Även dränering, åtgärder mot översvämning och erosion, separerade cykelbanor och nya trottoarer ingår.",
        "Byggstart är planerad till december 2026 och projektet väntas vara färdigt i augusti 2030.",
        "För Skanska är beskedet framför allt ytterligare ett tillskott till den amerikanska orderboken. En enskild order på 530 miljoner kronor förändrar inte bilden av hela koncernen, men den visar att bolaget fortsätter att fylla på med fleråriga infrastrukturprojekt på en viktig marknad.",
      ],
    },
    {
      heading: "Svensk industri växer – men kostnaderna stiger snabbt",
      paragraphs: [
        "Den kanske viktigaste svenska konjunktursignalen inför onsdagens handel kom på tisdagsmorgonen. Swedbank och Silfs inköpschefsindex, PMI, för svensk tillverkningsindustri steg till 56,1 i augusti från reviderade 55,7 i juli.",
        "Ett värde över 50 betyder att aktiviteten i industrin ökar. Indexet har dessutom legat över sitt historiska genomsnitt på 54,3 under 14 månader i följd.",
        "Produktionen gav det största positiva bidraget i augusti och även sysselsättningen bidrog uppåt. Orderingången drog däremot åt andra hållet.",
        "Den tydligaste varningssignalen finns i företagens kostnader. Indexet för rå- och insatsvarupriser steg från 67,2 i juli till 75,4 i augusti. Det är en tydlig förändring på en månad och visar att industriföretagen åter möter ett högre tryck från inköpskostnader.",
      ],
    },
    {
      heading: "Varför kostnadstrycket spelar roll för börsen",
      paragraphs: [
        "För svenska industribolag är kombinationen viktig. Stark produktion och fortsatt tillväxt är positivt för aktiviteten, men om kostnaderna samtidigt stiger snabbt måste företagen antingen kunna ta ut högre priser, effektivisera verksamheten eller acceptera press på marginalerna.",
        "Ett högre kostnadstryck betyder inte automatiskt att svensk inflation kommer att stiga eller att Riksbanken behöver ändra räntan. Om utvecklingen fortsätter och företagen för över en större del av kostnadsökningarna till kunderna kan det däremot bli en viktig pusselbit i inflationsbilden.",
        "Det gör marginaler och prissättning till frågor att följa när svenska industribolag senare under hösten beskriver efterfrågan och kostnadsläget.",
      ],
    },
    {
      heading: "OMXS30 kommer från två raka nedgångsdagar",
      paragraphs: [
        "Stockholmsbörsen föll på tisdagen för andra handelsdagen i rad. OMXS30 stängde ned 1,29 procent på 3 266,43 punkter.",
        "Teknik var den svagaste större sektorn och föll 2,3 procent, medan fastighetssektorn gick mot strömmen och steg 0,7 procent. Bland OMXS30-bolagen föll Saab 3,3 procent och EQT 3,2 procent. SCA och Swedbank steg samtidigt 0,6 procent vardera.",
        "Stigande marknadsräntor och ett högre oljepris fanns i bakgrunden till den mer försiktiga marknaden. För onsdagen blir frågan om svenska bolagsbesked kan ge stöd efter två svagare börsdagar, samtidigt som kostnads- och ränteläget fortsätter att bevakas.",
      ],
    },
    {
      heading: "Aktietillgångar större än fastigheter för första gången",
      paragraphs: [
        "Ett annat svenskt besked på onsdagsmorgonen säger något om hur viktig börsutvecklingen har blivit för hushållens ekonomi. Enligt SEB:s Sparbarometer ökade de svenska hushållens nettoförmögenhet med 1 733 miljarder kronor under Q2, till totalt 27 089 miljarder kronor.",
        "För första gången i Sparbarometerns historia är hushållens aktietillgångar större än deras fastighetstillgångar. Aktietillgångarna värderades till 13 170 miljarder kronor medan fastighetstillgångarna uppgick till 13 128 miljarder.",
        "Skillnaden är liten, men skiftet är historiskt i SEB:s mätserie. Det är inte en uppgift som i sig behöver flytta Stockholmsbörsen i dag, men den visar hur stor del av hushållens förmögenhet som numera är kopplad till utvecklingen på aktiemarknaden.",
      ],
    },
    {
      heading: "Volvo Cars lämnar nya försäljningssiffror under dagen",
      paragraphs: [
        "Volvo Cars är en annan tydlig svensk hållpunkt på onsdagens kalender. Enligt Nyhetsbyrån Direkts dagskalender väntas bolaget under dagen rapportera försäljningen för tremånadersperioden juni–augusti.",
        "När den här artikelns research stängdes hade Volvo Cars ännu inte publicerat något nytt försäljningsutfall. DivLab sätter därför varken en siffra eller en kursreaktion på beskedet i förväg.",
        "I den föregående tremånadersuppdateringen, som avsåg maj–juli, sålde Volvo Cars 164 663 bilar globalt. Det var 4 procent färre än under motsvarande period året före. Försäljningen av elektrifierade modeller ökade samtidigt med 15 procent och stod för 53 procent av totalen.",
        "Bolaget beskrev då en återhämtning i USA och en stabilare utveckling i Europa, medan Kina fortsatte att tynga totalen. När juni–augusti-siffrorna kommer blir det därför särskilt relevant att se om den globala nedgången minskar och hur stor andel av försäljningen som fortsatt kommer från elbilar och laddhybrider.",
      ],
    },
    {
      heading: "Tre svenska frågor sätter tonen för BörsSverige",
      paragraphs: [
        "Onsdagens svenska börsbild har tre tydliga hållpunkter. Skanska fortsätter att fylla på den amerikanska orderboken med ett nytt projekt på cirka 530 miljoner kronor.",
        "Svensk industri fortsätter samtidigt att växa, men den snabba uppgången i företagens inköpskostnader gör lönsamhet och prissättning till viktigare frågor inför hösten.",
        "Och under dagen väntas Volvo Cars ge en ny temperaturmätare på den globala bilförsäljningen. Efter två raka nedgångsdagar på Stockholmsbörsen är det en kombination av konkreta bolagsbesked och ett mer utmanande kostnadsläge som sätter tonen för BörsSverige den 2 september.",
      ],
    },
  ],
  sources: [
    {
      text: "Skanska – USA-order i Del Mar, 2 september 2026",
      href: "https://news.cision.com/skanska/r/skanska-to-expand-traffic-corridor-in-del-mar--california--usa--for-usd-57m--about-sek-530m%2Cc4390853",
    },
    {
      text: "Swedbank/Silf – PMI steg till 56,1 i augusti, 1 september 2026",
      href: "https://www.swedbank.com/sv/newsroom/press-releases.details.pmi-steg-till-56%2C1-i-augusti-%E2%80%93-tillv%C3%A4xt-och-h%C3%B6gre-kostnadstryck.AB32D7E8729AF1B0.html",
    },
    {
      text: "SEB – Sparbarometern Q2 2026, 2 september 2026",
      href: "https://sebgroup.com/sv/press/pressmeddelanden/2026/historisk-milstolpe-i-hushallens-sparande--storre-sparande-i-aktier-an-i-fastigheter",
    },
    {
      text: "Volvo Cars – Försäljning maj–juli 2026, 4 augusti 2026",
      href: "https://www.volvocars.com/se/media/press-releases/ADE5AF14E199FBD8/",
    },
    {
      text: "Nyhetsbyrån Direkt/Placera – PM i fokus onsdag 2 september 2026",
      href: "https://www.placera.se/telegram/pm-i-fokus-onsdag-2-september-20260902",
    },
    {
      text: "Finwire/MarketScreener – Stockholmsbörsens stängning 1 september 2026",
      href: "https://se.marketscreener.com/nyheter/ned-t-p-stockholmsborsen-for-andra-dagen-i-rad-omxs30-index-backade-1-3-procent-ce7858d2d98dff22",
    },
  ],
};
