import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 17 september 2026.
 * Editorial research cutoff: 2026-09-17T18:26:44+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm
 * P0_SOURCE[primary]: https://www.sec.gov/newsroom/press-releases/2026-90-sec-issues-innovation-exemption-facilitate-trading-tokenized-nms-stock-request-comment
 * P0_SOURCE[primary]: https://ir.fluenceenergy.com/news-releases/news-release-details/fluence-energy-announces-revised-guidance-fiscal-year-2026
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-rise-fed-rate-hike-lifts-long-standing-overhang-2026-09-17/
 * P0_SOURCE[secondary]: https://www.reuters.com/legal/transactional/coreweave-launches-3-billion-convertible-debt-sale-2026-09-17/
 * P0_SOURCE[secondary]: https://www.reuters.com/technology/nebius-hikes-ai-cloud-prices-again-demand-computing-power-soars-2026-09-17/
 *
 * Material same-day editorial update after publication.
 * Editorial update verified at 2026-09-17T18:50:53+02:00 using sources published before the canonical cutoff.
 * The article now prioritizes current-session market moves and same-day company news.
 * The prior day's Fed decision remains only as market context.
 */
export const USA_I_FOKUS_17_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-17-september-2026-wall-street-fed-olja",
  slug: "usa-i-fokus-17-september-2026-wall-street-fed-olja",
  title: "USA i fokus 17 september: Nasdaq lyfter – Nvidia, Amazon och kryptobolag stiger",
  summary:
    "Nasdaq leder uppgången på Wall Street. Nvidia och Amazon stiger över 2 procent, kryptobolag lyfter efter ett nytt SEC-besked och AI-infrastrukturbolagen rör sig kraftigt åt olika håll.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-17T18:26:44+02:00",
  updatedAt: "2026-09-17T18:50:53+02:00",
  url: "/news/usa-i-fokus-17-september-2026-wall-street-fed-olja",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-09-17.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-09-17.png",
  imageAlt: "USA i fokus 2026-09-17 – DivLabs översikt över den amerikanska börsmarknaden under pågående handel på Wall Street.",
  readingMinutes: 5,
  seoTitle: "USA i fokus: Nasdaq lyfter – Nvidia, Amazon och kryptobolag stiger",
  seoDescription:
    "Nasdaq leder Wall Street uppåt den 17 september. Nvidia och Amazon stiger, kryptobolag lyfter efter SEC-besked och CoreWeave samt Fluence faller.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "USA börsen idag",
    "S&P 500",
    "Nasdaq",
    "Dow Jones",
    "Nvidia",
    "Amazon",
    "Robinhood",
    "Circle",
    "Coinbase",
    "Nebius",
    "IREN",
    "CoreWeave",
    "Fluence Energy",
    "Federal Reserve",
    "17 september 2026",
  ],
  internalLinking: {
    topics: ["Wall Street", "teknikaktier", "AI-infrastruktur", "tokeniserade aktier", "Federal Reserve"],
    companies: ["Nvidia", "Amazon", "Robinhood", "Circle", "Coinbase", "Nebius", "IREN", "CoreWeave", "Fluence Energy"],
    tickers: ["NVDA", "AMZN", "HOOD", "CRCL", "COIN", "NBIS", "IREN", "CRWV", "FLNC"],
    relatedNewsSlugs: [
      "usa-i-fokus-16-september-2026-fed-besked-detaljhandel",
      "usa-i-fokus-15-september-2026-fed-rantor-ai-olja",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street handlas tydligt högre under torsdagen och Nasdaq leder uppgången. I Reuters senaste verifierade marknadsbild före DivLabs uppdatering var Dow Jones upp 0,61 procent, S&P 500 1,06 procent och Nasdaq 1,59 procent.",
    "Dagens handel drivs framför allt av styrka i teknikaktier, fallande oljepris och något lägre amerikanska långräntor. Gårdagens Fed-besked finns kvar i bakgrunden, men dagens börsrörelser och bolagsnyheter står i centrum.",
  ],
  sections: [
    {
      heading: "Teknik leder uppgången – Nvidia och Amazon över 2 procent",
      paragraphs: [
        "Nvidia och Amazon steg båda mer än 2 procent i Reuters marknadsbild klockan 11.42 lokal tid i New York. Uppgången bidrog till att Nasdaq utvecklades starkare än både S&P 500 och Dow Jones.",
        "Även det mindre bolagsindexet Russell 2000 steg mer än 1 procent. Åtta av elva större sektorer i S&P 500 låg på plus, vilket visar att uppgången var bredare än enbart de största teknikbolagen.",
        "För tekniksektorn har nedgången i den amerikanska tioårsräntan varit viktig. Lägre marknadsräntor minskar trycket på högt värderade tillväxtbolag och har gett sektorn andrum efter den senaste tidens ränteuppgång.",
      ],
    },
    {
      heading: "Robinhood, Circle och Coinbase stiger efter nytt SEC-besked",
      paragraphs: [
        "Den amerikanska finansinspektionen SEC presenterade på torsdagen en tillfällig så kallad Innovation Exemption för handel med tokeniserade amerikanska aktier på särskilda handelsplattformar.",
        "I Reuters marknadsbild steg Robinhood omkring 3 procent, Circle omkring 4 procent och Coinbase cirka 3 procent efter beskedet.",
        "SEC:s undantag är tidsbegränsat och förenat med villkor. Bland annat ska tokeniserade aktier ge innehavarna samma rättigheter som motsvarande vanliga aktier, och emittenten ska kunna invända mot att en tredjepart tokeniserar bolagets aktie för handel på en sådan plattform.",
      ],
    },
    {
      heading: "Nebius och IREN upp – CoreWeave backar",
      paragraphs: [
        "AI-infrastruktur fortsätter att vara ett av dagens mest rörliga teman. Nebius och IREN steg omkring 2 procent vardera i Reuters senaste marknadsbild före uppdateringen.",
        "Nebius meddelade samtidigt att bolaget höjer pay-as-you-go-priserna för uthyrning av utvalda Nvidia-chip från den 1 oktober. Det är andra prisökningen på tre månader och speglar fortsatt stark efterfrågan på beräkningskapacitet för AI.",
        "CoreWeave gick åt motsatt håll och föll omkring 4 procent. Bolaget meddelade på torsdagen att det planerar att ta in 3 miljarder dollar genom konvertibla skuldebrev, samtidigt som Reuters rapporterade om ytterligare kapitalanskaffning via aktier.",
      ],
    },
    {
      heading: "Fluence faller över 14 procent efter sänkt prognos",
      paragraphs: [
        "Fluence Energy hör till dagens tydligaste förlorare och föll mer än 14 procent i Reuters marknadsbild.",
        "Bolaget har sänkt sin prognos för räkenskapsåret 2026 till en omsättning på omkring 2,4 miljarder dollar, jämfört med den tidigare prognosmittpunkten på cirka 3,0 miljarder.",
        "Den justerade EBITDA-förlusten väntas bli omkring 200 miljoner dollar, jämfört med den tidigare prognosmittpunkten på en förlust kring 10 miljoner. Fluence pekar främst på problem i leveranskedjan och förseningar i uppskalningen av produktionen i Houston.",
      ],
    },
    {
      heading: "Lägre olja ger börsen ytterligare stöd",
      paragraphs: [
        "Oljepriset föll för andra dagen i rad. Brent var ned mer än 2 procent till 103,43 dollar per fat och amerikansk WTI omkring 2 procent till 100,66 dollar i Reuters marknadsbild.",
        "Det är fortfarande höga nivåer, men nedgången minskar för stunden inflationsoron från energisidan. Kombinationen av lägre olja och lägre långräntor har därför varit en viktig del av dagens förbättrade riskklimat.",
      ],
    },
    {
      heading: "Gårdagens Fed-besked ligger i bakgrunden",
      paragraphs: [
        "Federal Reserve höjde på onsdagen målintervallet för federal funds-räntan med 0,25 procentenheter, från 3,50–3,75 procent till 3,75–4,00 procent.",
        "Det är alltså gårdagens besked, inte en ny torsdagshändelse. Det relevanta för dagens handel är hur marknaden reagerar: teknikaktier stiger, långräntan har lättat och investerarna väger risken för fler höjningar mot en ekonomi som fortfarande visar motståndskraft.",
      ],
    },
    {
      heading: "DivLabs blick",
      paragraphs: [
        "Torsdagens USA-handel är framför allt en bolags- och riskaptitsdriven börsdag. Nvidia och Amazon ger stöd åt Nasdaq, kryptorelaterade aktier reagerar på ett färskt SEC-besked och AI-infrastrukturbolagen visar stora skillnader mellan vinnare och förlorare.",
        "Resten av handelsdagen blir det främst tre saker att följa: om Nasdaq kan behålla sitt försprång, om oljepriset fortsätter ned och om den amerikanska tioårsräntan fortsätter ge tekniksektorn andrum.",
        "Indexnivåerna och procentförändringarna ovan är ögonblicksbilder från pågående handel och kan förändras innan Wall Street stänger.",
      ],
    },
  ],
  sources: [
    { text: "Federal Reserve: FOMC-besked 16 september 2026", href: "https://www.federalreserve.gov/newsevents/pressreleases/monetary20260916a.htm" },
    { text: "SEC: Innovation Exemption för handel med tokeniserade aktier", href: "https://www.sec.gov/newsroom/press-releases/2026-90-sec-issues-innovation-exemption-facilitate-trading-tokenized-nms-stock-request-comment" },
    { text: "Fluence Energy: reviderad guidning för räkenskapsåret 2026", href: "https://ir.fluenceenergy.com/news-releases/news-release-details/fluence-energy-announces-revised-guidance-fiscal-year-2026" },
    { text: "Reuters: Wall Street stiger när oljepriset faller", href: "https://www.reuters.com/business/wall-st-futures-rise-fed-rate-hike-lifts-long-standing-overhang-2026-09-17/" },
    { text: "Reuters: CoreWeave planerar konvertibelemission på 3 miljarder dollar", href: "https://www.reuters.com/legal/transactional/coreweave-launches-3-billion-convertible-debt-sale-2026-09-17/" },
    { text: "Reuters: Nebius höjer priserna för AI-kapacitet", href: "https://www.reuters.com/technology/nebius-hikes-ai-cloud-prices-again-demand-computing-power-soars-2026-09-17/" },
  ],
};
