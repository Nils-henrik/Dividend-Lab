import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 25 november 2026.
 * Editorial research cutoff: 2026-11-25T14:02:58+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/business/nasdaq-futures-slide-over-2-fresh-us-tariff-concerns-inflation-data-focus-2026-11-25/
 * P0_SOURCE[primary]: https://investors.delltechnologies.com/sec-filings/all-sec-filings/content/0001571996-26-000050/exhibit991earnings8kq3fy27.htm
 * P0_SOURCE[primary]: https://www.sec.gov/Archives/edgar/data/315189/000110465926131741/de-ex99d1.htm
 * P0_SOURCE[primary]: https://www.bea.gov/news/schedule?output=1
 * P0_SOURCE[primary]: https://newsroom.workday.com/2026-11-24-Workday-Announces-Fiscal-2027-Third-Quarter-Financial-Results?asPDF=1
 */
export const USA_I_FOKUS_25_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-25-november-2026",
  slug: "usa-i-fokus-25-november-2026-ai-press-dell-pce",
  title: "USA i fokus 25 november: AI-press trots Dellrekord – PCE väntar",
  summary:
    "Nasdaq 100-terminen faller 2,38 procent när AI-aktier åter pressas. Dell redovisar rekordintäkter men backar i förhandeln, Deere guidar för lägre helårsvinst och PCE samt BNP väntar efter cutoff.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-25T14:03:03+01:00",
  url: "/news/usa-i-fokus-25-november-2026-ai-press-dell-pce",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-25.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-25.png",
  imageAlt: "USA i fokus 2026-11-25 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 6,
  seoTitle: "Wall Street idag: AI-press, Dellrekord och PCE i fokus",
  seoDescription:
    "USA-börsen 25 november: Nasdaq-terminen faller, Dell slår rekord, Deere guidar för 2027 och PCE samt BNP publiceras klockan 14.30.",
  seoKeywords: [
    "USA-börsen idag",
    "Wall Street idag",
    "Nasdaq terminer",
    "Dell rapport Q3 2027",
    "Deere rapport 2026",
    "PCE inflation november 2026",
    "USA BNP tredje kvartalet",
    "Workday rapport"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Wall Street",
      "Nasdaq",
      "AI-aktier",
      "bolagsrapporter",
      "PCE-inflation",
      "USA BNP",
      "Federal Reserve"
    ],
    companies: ["Dell Technologies", "Deere & Company", "Workday", "Nvidia", "Anthropic"],
    tickers: ["DELL", "DE", "WDAY", "NVDA", "ANT"],
    relatedNewsSlugs: [
      "usa-i-fokus-22-november-2026-veckan-pce-bnp-dell-deere",
      "usa-i-fokus-21-november-2026-veckan-ai-ras-nvidia-anthropic",
      "usa-i-fokus-20-november-2026-anthropic-intuit-ross-keysight"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Wall Streets korta handelsvecka går in i sin mest beskedstäta dag med förnyad press på tekniksektorn. Klockan 06.01 amerikansk östkusttid var Dow-terminen ned 0,76 procent, S&P 500-terminen 1,44 procent och Nasdaq 100-terminen 2,38 procent.",
    "Nedgången kommer trots att Dell Technologies redovisat rekordintäkter och höjt helårsprognosen. Aktien föll ändå 6 procent i förhandeln, vilket gör rapporten till ett konkret test av om mycket stark AI-efterfrågan räcker för att stabilisera sektorns värderingar.",
    "Deere har samtidigt lämnat ett verifierat bokslut och en ny prognos. PCE-inflation och en uppdaterad BNP-siffra publiceras först klockan 14.30 svensk tid, efter artikelns cutoff, och beskrivs därför enbart framåtblickande."
  ],
  sections: [
    {
      heading: "AI-aktier leder nedgången i förhandeln",
      paragraphs: [
        "Nvidia föll 5,1 procent i förhandeln, Micron 6 procent, AMD 6,5 procent och Marvell 5,7 procent enligt Reuters. Även Alphabet, Amazon, Microsoft och Meta handlades lägre.",
        "Anthropic tappade 5,7 procent efter att aktien på tisdagen stängt på 81,90 dollar, under introduktionskursen 83 dollar. Därmed har den tidigare öppna frågan fått ytterligare ett svar: måndagens kraftiga återhämtning har inte brutit den bredare osäkerheten kring AI-handeln.",
        "Förhandelskurser är ögonblicksbilder och kan ändras före öppningen. Det verifierade läget vid cutoff är därför fortsatt teknikpress, inte ett färdigt utfall för onsdagens ordinarie handel."
      ]
    },
    {
      heading: "Dell fördubblar intäkterna – men aktien faller",
      paragraphs: [
        "Dell redovisade rekordintäkter på 54,9 miljarder dollar i tredje kvartalet av räkenskapsåret 2027, en ökning med 103 procent från året före. Justerad vinst per aktie steg 265 procent till 9,45 dollar och kassaflödet från den löpande verksamheten blev 4,5 miljarder dollar.",
        "Infrastructure Solutions Group ökade intäkterna 198 procent till 42,0 miljarder dollar. Försäljningen av AI-optimerade servrar steg 291 procent till 22,0 miljarder dollar, medan bolagets AI-orderbok uppgick till 132,3 miljarder dollar.",
        "Dell höjde helårsprognosen för intäkter från 192 till 202 miljarder dollar och prognosen för justerad vinst per aktie från 25,50 till 29,68 dollar. Trots det föll aktien 6 procent i förhandeln, ett tecken på att marknaden ställer mycket höga krav på AI-relaterade bolag."
      ]
    },
    {
      heading: "Deere ser tidiga tecken på förbättring i jordbruket",
      paragraphs: [
        "Deere redovisade intäkter på 12,115 miljarder dollar för det fjärde kvartalet, 2 procent lägre än året före. Nettovinsten minskade 1 procent till 1,051 miljarder dollar och vinsten per aktie blev 3,89 dollar.",
        "För helåret ökade intäkterna 4 procent till 47,704 miljarder dollar, medan nettovinsten sjönk 3 procent till 4,860 miljarder. Bolaget räknar med en nettovinst på 4,50–5,25 miljarder dollar under 2027, jämfört med 4,86 miljarder under 2026.",
        "Segmentbilden var blandad. Production & Precision Agriculture minskade försäljningen 15 procent och rörelseresultatet 33 procent, medan Small Agriculture & Turf ökade försäljningen 10 procent. Bolaget uppger att stora jordbruksmaskiner visar tidiga förbättringstecken i Nordamerika, men prognosen innehåller ett brett utfallsintervall."
      ]
    },
    {
      heading: "Workday växer men guidningen prövas av marknaden",
      paragraphs: [
        "Workdays omsättning ökade 11,2 procent till 2,705 miljarder dollar och abonnemangsintäkterna 12,8 procent till 2,532 miljarder under tredje kvartalet.",
        "Rörelseresultatet blev 329 miljoner dollar och påverkades av omstruktureringskostnader på 51 miljoner. Bolaget höjde helårsprognosen för abonnemangsintäkter till 9,958 miljarder dollar och guidar för 2,600 miljarder i fjärde kvartalet.",
        "Aktien föll 9,3 procent i förhandeln enligt Reuters. Kombinationen av högre intäkter, omstruktureringskostnader och en svag kursreaktion visar att rapportsvepet inte enbart bedöms efter tillväxttakten."
      ]
    },
    {
      heading: "PCE och BNP kommer efter artikelns cutoff",
      paragraphs: [
        "Bureau of Economic Analysis publicerar Personal Income and Outlays för oktober samt den andra BNP-uppskattningen för tredje kvartalet klockan 08.30 amerikansk östkusttid, motsvarande 14.30 i Stockholm.",
        "PCE-rapporten innehåller Federal Reserves centrala inflationsmått. BNP-uppdateringen kompletteras med företagsvinster och ger samtidigt en ny lägesbild för tillväxten.",
        "Båda publiceringarna ligger efter artikelns cutoff. Inget utfall, ingen ränterörelse och ingen marknadsreaktion föregrips. USA-börserna håller därefter stängt på torsdag för Thanksgiving och har förkortad handel på fredag."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters: färsk förhandelsbild den 25 november 2026 med USA-terminer, AI-aktier, Dell, Workday och tider för PCE och BNP",
      href: "https://www.reuters.com/business/nasdaq-futures-slide-over-2-fresh-us-tariff-concerns-inflation-data-focus-2026-11-25/"
    },
    {
      text: "Dell Technologies Investor Relations och SEC: officiell Q3-rapport för räkenskapsåret 2027 med intäkter, resultat, kassaflöde, AI-servrar, orderbok och höjd helårsprognos",
      href: "https://investors.delltechnologies.com/sec-filings/all-sec-filings/content/0001571996-26-000050/exhibit991earnings8kq3fy27.htm"
    },
    {
      text: "Deere & Company via SEC: officiell Q4- och helårsrapport 2026 med segmentutfall och prognos för nettovinst 2027",
      href: "https://www.sec.gov/Archives/edgar/data/315189/000110465926131741/de-ex99d1.htm"
    },
    {
      text: "U.S. Bureau of Economic Analysis: officiell publiceringskalender för PCE, personliga inkomster och utgifter samt BNP den 25 november 2026 klockan 08.30 ET",
      href: "https://www.bea.gov/news/schedule?output=1"
    },
    {
      text: "Workday: officiell Q3-rapport för räkenskapsåret 2027 med intäkter, marginaler, kassaflöde och uppdaterad prognos",
      href: "https://newsroom.workday.com/2026-11-24-Workday-Announces-Fiscal-2027-Third-Quarter-Financial-Results?asPDF=1"
    }
  ]
};
