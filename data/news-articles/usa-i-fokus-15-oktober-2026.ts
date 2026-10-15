import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus, 15 oktober 2026.
 * Editorial research cutoff: 2026-10-15T14:03:14+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.bls.gov/news.release/archives/cpi_10142026.htm
 * P0_SOURCE[primary]: https://investor.tsmc.com/japanese/encrypt/files/encrypt_file/reports/2026-10/526b65af7305df2dde6b9ece6812b1fdf1e49f9b/3Q26%20EarningsRelease.pdf
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/home.htm
 * P0_SOURCE[primary]: https://www.census.gov/retail/release_schedule.html
 * P0_SOURCE[secondary]: https://www.reuters.com/business/nasdaq-futures-dive-1-ai-rout-deepens-debt-concerns-2026-10-15/
 * P0_SOURCE[secondary]: https://www.reuters.com/world/asia-pacific/tsmc-expected-report-sixth-straight-quarter-record-profit-thanks-ai-boom-2026-10-14/
 */
export const USA_I_FOKUS_15_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-15-oktober-2026-nasdaq-tsmc-inflation",
  slug: "usa-i-fokus-15-oktober-2026-nasdaq-tsmc-inflation",
  title: "USA i fokus 15 oktober: Nasdaq-terminen faller när AI-oron fördjupas",
  summary:
    "Nasdaq 100-terminen faller 1,1 procent efter högre amerikansk inflation och fortsatt oro för AI-finansiering. TSMC redovisar rekordvinst men går försiktigt in i 2027.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-15T14:03:30+02:00",
  url: "/news/usa-i-fokus-15-oktober-2026-nasdaq-tsmc-inflation",
  featured: true,
  imageAlt:
    "USA i fokus 15 oktober 2026 med Nasdaq, TSMC, AI-aktier och amerikansk inflation inför Wall Street.",
  readingMinutes: 5,
  seoTitle: "USA i fokus 15 oktober: Nasdaq pressas av AI-oro",
  seoDescription:
    "Wall Street idag: Nasdaq-terminen faller 1,1 procent när högre inflation och AI-finansiering pressar teknikaktier. TSMC redovisar rekordvinst.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "Nasdaq terminer",
    "USA börsen 15 oktober 2026",
    "TSMC rapport Q3 2026",
    "AI aktier",
    "USA inflation",
    "PPI USA",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "Nasdaq",
      "USA-terminer",
      "AI",
      "halvledare",
      "USA-inflation",
      "PPI",
      "detaljhandel",
      "Federal Reserve",
    ],
    companies: ["TSMC", "CoreWeave", "Oracle", "Nvidia"],
    tickers: ["TSM", "CRWV", "ORCL", "NVDA"],
    relatedNewsSlugs: [
      "usa-i-fokus-14-oktober-2026-bankrapporter-kpi",
      "usa-i-fokus-13-oktober-2026-goldman-jpmorgan-chipaktier",
      "usa-i-fokus-12-oktober-2026-olja-storbanker-terminer",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Torsdagens terminsbild visar att gårdagens inflationsoro har flyttat fokus tillbaka till tekniksektorns finansiering och värderingar. Vid Reuters senaste verifierade uppdatering föll Nasdaq 100-terminen 1,1 procent och S&P 500-terminen 0,27 procent, medan Dow-terminen steg 0,32 procent.",
    "TSMC redovisar samtidigt sitt sjätte raka kvartal med rekordvinst och fortsatt stark efterfrågan på avancerade chip. Den starka rapporten räcker ändå inte för att lugna AI-handeln när högre räntor och finansieringskostnader väger tyngre inför Wall Streets öppning.",
  ],
  sections: [
    {
      heading: "Gårdagens KPI satte ny press på teknikaktierna",
      paragraphs: [
        "USA:s konsumentprisindex steg 0,6 procent i september jämfört med augusti och 3,7 procent jämfört med ett år tidigare. Kärninflationen, där mat och energi räknas bort, var 2,6 procent på årsbasis.",
        "Bensinpriserna steg 9,1 procent under månaden och stod för mer än hälften av den totala månadsuppgången. Energiindex ökade 5,2 procent och boendekostnaderna 0,4 procent.",
        "Efter statistiken föll Nasdaq Composite 1,9 procent och S&P 500 1,1 procent på onsdagen, enligt Reuters. Därmed fick gårdagens öppna KPI-fråga ett tydligt svar: inflationen accelererade och teknikaktierna reagerade negativt under den avslutade sessionen.",
      ],
    },
    {
      heading: "Nasdaq-terminen faller 1,1 procent",
      paragraphs: [
        "Vid klockan 05.50 östkusttid var Dow-terminen upp 0,32 procent, medan S&P 500-terminen föll 0,27 procent och Nasdaq 100-terminen 1,1 procent.",
        "CoreWeave föll 6,3 procent i förhandeln efter en nedgång på 15 procent under onsdagen. Oracle backade 2,1 procent efter att ha tappat nästan 9 procent föregående session. Nvidia föll 1,8 procent.",
        "Rörelserna är verifierade förhandsnoteringar och kan förändras när kontanthandeln öppnar klockan 15.30 svensk tid. Artikeln beskriver dem därför inte som slutliga dagsrörelser.",
      ],
    },
    {
      heading: "TSMC levererar rekordvinst och höjer intäktsnivån",
      paragraphs: [
        "TSMC:s intäkter steg 50,9 procent i lokal valuta till 1 494,24 miljarder taiwanesiska dollar i Q3. Nettovinsten ökade 68,7 procent till 763,06 miljarder taiwanesiska dollar och resultatet per ADR-enhet var 4,60 dollar.",
        "I amerikanska dollar steg omsättningen 41,2 procent till 46,72 miljarder dollar. Bruttomarginalen var 66,4 procent, rörelsemarginalen 58,7 procent och nettomarginalen 51,1 procent.",
        "Avancerade processtekniker på sju nanometer och mindre stod för 79 procent av waferintäkterna. Tvånanometer stod för 8 procent, tre nanometer för 33 procent och fem nanometer för 28 procent.",
      ],
    },
    {
      heading: "Stark Q4-prognos möter försiktighet inför 2027",
      paragraphs: [
        "TSMC räknar med intäkter på 52,3–54,3 miljarder dollar i fjärde kvartalet. Bolaget guidar samtidigt för en bruttomarginal på 65–67 procent och en rörelsemarginal på 56,5–58,5 procent.",
        "Reuters uppger att bolaget höjde sin prognos för helårets intäktstillväxt till omkring 44 procent och behöll investeringsbudgeten på 60–64 miljarder dollar.",
        "Samtidigt beskrev ledningen planeringen inför 2027 som försiktig på grund av makroekonomisk osäkerhet och press på priskänsliga konsumentmarknader. TSMC är inte amerikanskt, men beskedet har en direkt koppling till USA genom stora kunder som Nvidia och Apple samt bolagets omfattande investeringar i Arizona.",
      ],
    },
    {
      heading: "PPI och detaljhandel kommer efter cutoff",
      paragraphs: [
        "Bureau of Labor Statistics publicerar producentprisindex för september klockan 08.30 östkusttid, motsvarande 14.30 svensk tid. Census Bureau publicerar samtidigt den preliminära detaljhandeln för september.",
        "Båda utfallen ligger efter artikelns research-cutoff. Artikeln innehåller därför inga PPI- eller detaljhandelssiffror och ingen marknadsreaktion på dem.",
        "Producentpriserna blir nästa kontroll av inflationstrycket tidigare i produktionskedjan, medan detaljhandeln ger en färsk bild av hushållens efterfrågan. De faktiska utfallen måste verifieras separat efter publiceringen.",
      ],
    },
    {
      heading: "Det här bevakar Wall Street vid öppningen",
      paragraphs: [
        "Den första kontrollpunkten är om pressen på CoreWeave, Oracle och Nvidia står sig efter öppningen. Den andra är om PPI och detaljhandel förstärker eller mildrar gårdagens inflationssignal.",
        "TSMC:s rapport ger samtidigt marknaden två budskap att väga: mycket stark efterfrågan och rekordresultat i dag, men större försiktighet inför 2027.",
        "DivLabs redaktionella bedömning är att dagens huvudfråga är om starka AI-resultat kan väga upp den högre finansieringskostnaden. Det är en prioritering av verifierade fakta och katalysatorer, inte en prognos om dagens slutkurser.",
      ],
    },
  ],
  sources: [
    {
      text:
        "Bureau of Labor Statistics: officiell KPI-rapport för september 2026 med månads- och årsförändringar samt delindex",
      href: "https://www.bls.gov/news.release/archives/cpi_10142026.htm",
    },
    {
      text:
        "TSMC Investor Relations: officiell Q3-rapport 2026 med intäkter, vinst, marginaler, processtekniker och Q4-prognos",
      href: "https://investor.tsmc.com/japanese/encrypt/files/encrypt_file/reports/2026-10/526b65af7305df2dde6b9ece6812b1fdf1e49f9b/3Q26%20EarningsRelease.pdf",
    },
    {
      text:
        "Bureau of Labor Statistics: officiellt publiceringsschema för producentpriser den 15 oktober 2026",
      href: "https://www.bls.gov/schedule/2026/home.htm",
    },
    {
      text:
        "U.S. Census Bureau: officiellt publiceringsschema för preliminär detaljhandel avseende september 2026",
      href: "https://www.census.gov/retail/release_schedule.html",
    },
    {
      text:
        "Reuters: tidsstämplad terminsbild, AI-aktier och marknadsläge inför Wall Streets öppning den 15 oktober 2026",
      href: "https://www.reuters.com/business/nasdaq-futures-dive-1-ai-rout-deepens-debt-concerns-2026-10-15/",
    },
    {
      text:
        "Reuters: TSMC:s Q3-resultat, helårsutsikt, investeringsplan och försiktighet inför 2027",
      href: "https://www.reuters.com/world/asia-pacific/tsmc-expected-report-sixth-straight-quarter-record-profit-thanks-ai-boom-2026-10-14/",
    },
  ],
};
