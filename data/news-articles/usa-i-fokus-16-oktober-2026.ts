import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus, 16 oktober 2026.
 * Editorial research cutoff: 2026-10-16T13:59:40+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.bls.gov/news.release/archives/ppi_10152026.htm
 * P0_SOURCE[primary]: https://www.census.gov/retail/sales.html
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/home.htm
 * P0_SOURCE[primary]: https://www.federalreserve.gov/data/releaseschedule.htm
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-mixed-tech-wobbles-again-tesla-gains-2026-10-16/
 */
export const USA_I_FOKUS_16_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-16-oktober-2026-ppi-detaljhandel-tech",
  slug: "usa-i-fokus-16-oktober-2026-ppi-detaljhandel-tech",
  title: "USA i fokus 16 oktober: PPI stiger 1,3 procent – Nasdaq släpar efter",
  summary:
    "USA:s producentpriser steg 1,3 procent i september och detaljhandeln ökade 0,8 procent. Inför Wall Streets öppning är terminerna blandade, med Nasdaq efter Dow och S&P 500 när AI-relaterade aktier pressas igen.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-16T13:59:40+02:00",
  url: "/news/usa-i-fokus-16-oktober-2026-ppi-detaljhandel-tech",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-10-16.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-10-16.png",
  imageAlt: "USA i fokus 2026-10-16 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 5,
  seoTitle: "USA i fokus 16 oktober: PPI, detaljhandel och tech",
  seoDescription:
    "Wall Street idag: USA:s PPI steg 1,3 procent, detaljhandeln 0,8 procent och Nasdaq-terminen släpar efter inför nya pris- och industridata.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "USA börsen 16 oktober 2026",
    "USA PPI september 2026",
    "USA detaljhandel september 2026",
    "Nasdaq terminer",
    "USA importpriser",
    "Federal Reserve industriproduktion",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "producentpriser",
      "detaljhandel",
      "inflation",
      "Nasdaq",
      "artificiell intelligens",
      "Federal Reserve",
    ],
    companies: ["CoreWeave", "Varonis Systems"],
    tickers: ["CRWV", "VRNS"],
    relatedNewsSlugs: [
      "usa-i-fokus-14-oktober-2026-bankrapporter-kpi",
      "borssverige-16-oktober-2026",
      "norden-i-centrum-16-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Fredagens amerikanska förhandel präglas av två motkrafter. Gårdagens statistik visade både en stark konsumtion och betydligt högre producentpriser, medan dagens terminer är blandade och teknikledet fortsätter att släpa efter.",
    "Vid Reuters senaste verifierade uppdatering steg Dow-terminen 0,39 procent och S&P 500-terminen 0,16 procent. Nasdaq 100-terminen var samtidigt ned 0,08 procent. Det är en ögonblicksbild före kontanthandelns öppning klockan 15.30 svensk tid, inte ett slutresultat.",
  ],
  sections: [
    {
      heading: "Producentpriserna steg mest sedan mars 2022",
      paragraphs: [
        "USA:s producentprisindex för slutlig efterfrågan steg 1,3 procent i september, säsongsrensat. Jämfört med september 2025 var uppgången 6,3 procent.",
        "Månadsökningen var den största sedan mars 2022. Varupriserna steg 2,6 procent och tjänstepriserna 0,8 procent. Mer än 80 procent av varuprisernas uppgång kom från energi, där indexet steg 10,8 procent.",
        "Måttet som exkluderar livsmedel, energi och handel steg 0,5 procent under månaden och 5,0 procent i årstakt. Det visar att prispressen inte enbart låg i den mest volatila energidelen, även om energin var den klart största drivkraften för varor.",
      ],
    },
    {
      heading: "Detaljhandeln ökade 0,8 procent",
      paragraphs: [
        "Den amerikanska detaljhandeln och försäljningen hos matserveringar uppgick till 745,0 miljarder dollar i september. Det var 0,8 procent mer än i augusti och 6,3 procent mer än ett år tidigare.",
        "Försäljningen under juli–september låg 5,5 procent över motsvarande period 2025. Augustiökningen reviderades samtidigt upp till 1,3 procent från tidigare 1,1 procent.",
        "Tillsammans ger statistiken en ovanligt tydlig kombination: efterfrågan fortsatte växa samtidigt som producenternas prisnivå steg snabbt. För Wall Street betyder det att bolagens försäljning får stöd, men också att kostnads- och ränteläget kan förbli besvärligt.",
      ],
    },
    {
      heading: "Gårdagens inflationsfråga har fått ett skarpare svar",
      paragraphs: [
        "Den senaste publicerade USA i fokus-artikeln lyfte KPI och bankrapporter som dagens huvudfrågor. Sedan dess har producentpriserna gett ytterligare belägg för att inflationstrycket inte är avklarat.",
        "Det är samtidigt viktigt att skilja mellan konsument- och producentpriser. PPI mäter priser som inhemska producenter får för sina varor och tjänster och säger inte ensamt hur konsumentpriserna kommer att utvecklas.",
        "Marknaden behöver därför väga den starka detaljhandeln mot den högre kostnadsbilden, utan att anta att en enskild datapunkt automatiskt avgör Federal Reserves nästa beslut.",
      ],
    },
    {
      heading: "Tech släpar efter – Varonis går mot strömmen",
      paragraphs: [
        "Reuters rapporterade fortsatt press i AI-relaterade aktier före öppningen. CoreWeave föll 4,1 procent i förhandeln, medan flera bolag inom molninfrastruktur och halvledare också handlades lägre. Rörelserna är tidsstämplade förhandsnoteringar och kan förändras snabbt.",
        "Samtidigt steg Varonis Systems 2,3 procent efter att Proofpoint avtalat om att köpa datasäkerhetsbolaget i en kontantaffär värd cirka 6,3 miljarder dollar. Affären ger ett bolagsspecifikt stöd i ett annars svagare tekniksegment.",
        "Den blandade terminsbilden visar därför mer rotation än ett brett riskavslag: Dow och S&P 500 pekade svagt uppåt, medan Nasdaq låg efter.",
      ],
    },
    {
      heading: "Två datapunkter kommer efter bryttiden",
      paragraphs: [
        "Bureau of Labor Statistics publicerar september månads import- och exportprisindex klockan 08.30 östkusttid, motsvarande 14.30 svensk tid. Federal Reserves industriproduktion och kapacitetsutnyttjande följer klockan 09.15 östkusttid, 15.15 svensk tid.",
        "Båda publiceringarna ligger efter artikelns redaktionella bryttid. Artikeln innehåller därför inga påstådda utfall eller marknadsreaktioner på dem.",
        "Det viktigaste att bevaka efter cutoff är om nya prisdata förstärker eller mildrar gårdagens PPI-signal, hur industriproduktionen utvecklas och om Nasdaq fortsätter att halka efter när kontanthandeln börjar.",
      ],
    },
  ],
  sources: [
    {
      text: "Bureau of Labor Statistics: officiellt PPI-utfall för september 2026 med månads- och årsförändring samt komponenter, publicerat 15 oktober 2026",
      href: "https://www.bls.gov/news.release/archives/ppi_10152026.htm",
    },
    {
      text: "U.S. Census Bureau: officiell förhandsrapport för detaljhandel och matserveringar i september 2026, publicerad 15 oktober 2026",
      href: "https://www.census.gov/retail/sales.html",
    },
    {
      text: "Bureau of Labor Statistics: officiellt publiceringsschema för import- och exportprisindex den 16 oktober 2026 klockan 08.30 ET",
      href: "https://www.bls.gov/schedule/2026/home.htm",
    },
    {
      text: "Federal Reserve: officiellt schema för industriproduktion och kapacitetsutnyttjande den 16 oktober 2026 klockan 09.15 ET",
      href: "https://www.federalreserve.gov/data/releaseschedule.htm",
    },
    {
      text: "Reuters: tidsstämplad USA-terminsbild, förhandelsrörelser i teknikaktier och Varonis-affären den 16 oktober 2026",
      href: "https://www.reuters.com/business/wall-st-futures-mixed-tech-wobbles-again-tesla-gains-2026-10-16/",
    },
  ],
};
