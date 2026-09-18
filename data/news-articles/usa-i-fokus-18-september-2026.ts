import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 18 september 2026.
 * Editorial research cutoff: 2026-09-18T14:27:05+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm
 * P0_SOURCE[primary]: https://www.berkshirehathaway.com/news/sep1826.pdf
 * P0_SOURCE[primary]: https://investor.xenon-pharma.com/news-releases/news-release-details/xenon-announces-azetukalner-nda-submission-fda-focal-seizures
 * P0_SOURCE[secondary]: https://www.reuters.com/business/nasdaq-futures-lead-wall-st-gains-as-oil-retreat-eases-inflation-worries-2026-09-18/
 */
export const USA_I_FOKUS_18_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-18-september-2026-fed-buffett-xenon",
  slug: "usa-i-fokus-18-september-2026-fed-buffett-xenon",
  title: "USA i fokus 18 september: Nasdaq-terminer upp – Buffett blir Chairman Emeritus",
  summary: "Nasdaq 100-terminerna leder uppgången inför Wall Street när oljepriset faller. Berkshire Hathaway byter styrelseordförande och Xenon pressas efter en paus i nya psykiatristudier.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-18T14:27:18+02:00",
  url: "/news/usa-i-fokus-18-september-2026-fed-buffett-xenon",
  featured: true,
  imageAlt: "USA i fokus 18 september 2026 – DivLabs översikt inför Wall Street med terminer, Federal Reserve, Berkshire Hathaway och Xenon.",
  readingMinutes: 4,
  seoTitle: "USA i fokus: Nasdaq-terminer upp – Buffett lämnar ordföranderollen",
  seoDescription: "Nasdaq 100-terminerna stiger inför Wall Street den 18 september. Berkshire byter ordförande, Xenon pressas och Fed-höjningen ligger kvar i bakgrunden.",
  seoKeywords: ["USA i fokus","Wall Street idag","Nasdaq terminer","S&P 500 terminer","Federal Reserve","Warren Buffett","Berkshire Hathaway","Xenon Pharmaceuticals","Nvidia","Alphabet","18 september 2026"],
  internalLinking: {
    topics: ["Wall Street","Federal Reserve","amerikanska terminer","olja","bioteknik"],
    companies: ["Berkshire Hathaway","Xenon Pharmaceuticals","Nvidia","Alphabet"],
    tickers: ["BRK.A","BRK.B","XENE","NVDA","GOOG","GOOGL"],
    relatedNewsSlugs: ["usa-i-fokus-17-september-2026-wall-street-fed-olja","usa-i-fokus-16-september-2026-fed-besked-detaljhandel"],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street ser ut att öppna högre på fredagen. I Reuters verifierade förmarknadsbild klockan 06.43 lokal tid i New York var Dow-terminen upp 0,12 procent, S&P 500-terminen 0,23 procent och Nasdaq 100-terminen 0,50 procent.",
    "Samtidigt faller oljepriset för tredje dagen i rad, vilket dämpar en del av inflationsoron efter veckans räntehöjning från Federal Reserve. På bolagsnivå står Berkshire Hathaways ledarskifte och Xenon Pharmaceuticals kliniska besked ut.",
  ],
  sections: [
    {
      heading: "Nasdaq-terminerna leder uppgången",
      paragraphs: [
        "Tekniktunga Nasdaq 100 låg starkast inför öppning i Reuters senaste verifierade förmarknadsbild före DivLabs cutoff. Alphabet steg omkring 2,5 procent i förhandeln och Nvidia cirka 0,7 procent.",
        "Oljepriset gav samtidigt marknaden visst stöd genom att falla nära 2 procent. Lägre energi hjälper till att minska trycket på inflationsförväntningarna, även om prisnivåerna fortfarande är höga och marknaden fortsätter att väga energirisken mot centralbankernas stramare linje.",
      ],
    },
    {
      heading: "Fed-höjningen ligger kvar i bakgrunden",
      paragraphs: [
        "Federal Reserve höjde den 16 september målintervallet för federal funds-räntan med 0,25 procentenheter till 3,75–4,00 procent. FOMC-beslutet var enhälligt, 12–0.",
        "Fed konstaterade samtidigt att inflationen fortfarande är för hög och att ekonomin växer i solid takt. Fredagens handel blir därför ytterligare ett test på hur mycket börsen klarar av ett högre ränteläge samtidigt som oljepriset svänger kraftigt.",
      ],
    },
    {
      heading: "Warren Buffett blir Chairman Emeritus",
      paragraphs: [
        "Berkshire Hathaway meddelade på fredagen att Warren Buffett lämnar rollen som styrelseordförande och blir Chairman Emeritus med omedelbar verkan. Han stannar kvar i styrelsen och ska fortsatt kunna bidra med råd och perspektiv.",
        "Howard G. Buffett har valts till ny styrelseordförande. Greg Abel fortsätter som vd. Beskedet är därmed ett nytt steg i Berkshires sedan länge planerade generationsskifte.",
      ],
    },
    {
      heading: "Xenon pressas efter paus i psykiatristudier",
      paragraphs: [
        "Xenon Pharmaceuticals har frivilligt pausat rekryteringen av nya patienter till pågående studier inom egentlig depression och bipolär depression. Pausen infördes efter en analys av neuropsykiatriska biverkningar och sker i samråd med bolagets Data Safety Monitoring Board.",
        "Patienter som redan deltar fortsätter i studierna. Xenon beskriver pausen som en försiktighetsåtgärd och räknar med att den ska vara tillfällig. I Reuters förmarknadsbild föll aktien nära 27 procent.",
        "Samtidigt har bolaget lämnat in en amerikansk registreringsansökan för azetukalner vid fokala epileptiska anfall, medan de pågående fas 3-studierna inom epilepsi fortsätter att rekrytera.",
      ],
    },
    {
      heading: "DivLabs blick inför öppning",
      paragraphs: [
        "Fredagens marknadsbild är en kombination av lättnad från lägre oljepris och fortsatt osäkerhet kring räntor. Nasdaq-terminerna leder, men Fed-höjningen gör att varje ny inflations- eller räntesignal kan få stor betydelse för högt värderade teknikaktier.",
        "Bland enskilda bolag är Berkshires generationsskifte en stor företagshändelse, medan Xenon visar hur snabbt riskbilden kan förändras i bioteknik när ett kliniskt program pausas.",
        "Termins- och förmarknadsrörelserna ovan är ögonblicksbilder före ordinarie handel och kan förändras snabbt efter öppning.",
      ],
    },
  ],
  sources: [
    { text: "Federal Reserve: FOMC-besked 16 september 2026", href: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm" },
    { text: "Berkshire Hathaway: Warren Buffett blir Chairman Emeritus och Howard Buffett väljs till ordförande", href: "https://www.berkshirehathaway.com/news/sep1826.pdf" },
    { text: "Xenon Pharmaceuticals: azetukalner-ansökan och uppdatering om psykiatriprogrammet", href: "https://investor.xenon-pharma.com/news-releases/news-release-details/xenon-announces-azetukalner-nda-submission-fda-focal-seizures" },
    { text: "Reuters: Nasdaq-terminerna leder uppgången när oljepriset faller", href: "https://www.reuters.com/business/nasdaq-futures-lead-wall-st-gains-as-oil-retreat-eases-inflation-worries-2026-09-18/" },
  ],
};
