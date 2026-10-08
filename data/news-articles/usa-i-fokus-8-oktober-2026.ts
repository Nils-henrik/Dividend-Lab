import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus, 8 oktober 2026.
 * Editorial research cutoff: 2026-10-08T14:01:46+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.federalreserve.gov/monetarypolicy/fomcminutes20260916.htm
 * P0_SOURCE[primary]: https://investors.levistrauss.com/news/financial-news/news-details/2026/Levi-Strauss--Co--Reports-Third-Quarter-Results/default.aspx
 * P0_SOURCE[primary]: https://investor.wolfspeed.com/news/news-details/2026/Wolfspeed-Announces-Conditional-30-Year-1-5-Billion-Loan-Commitment-from-U-S--Department-of-War-to-Advance-Domestic-Wide-Bandgap-Supply-Chain/default.aspx
 * P0_SOURCE[primary]: https://ir.delta.com/news/news-details/2026/Delta-Air-Lines-Announces-Webcast-of-September-Quarter-2026-Financial-Results/default.aspx
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-slide-rising-oil-yields-dampen-mood-2026-10-08/
 */
export const USA_I_FOKUS_8_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-8-oktober-2026-olja-rantor-levi-wolfspeed",
  slug: "usa-i-fokus-8-oktober-2026-olja-rantor-levi-wolfspeed",
  title: "USA i fokus 8 oktober: Oljan över 105 dollar pressar Wall Street",
  summary:
    "USA-terminerna faller när Brentoljan stiger över 105 dollar och tioårsräntan ligger nära den högsta nivån sedan 2002. Levi Strauss höjer vinstutsikterna och Wolfspeed rusar i förhandeln.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-08T14:01:55+02:00",
  url: "/news/usa-i-fokus-8-oktober-2026-olja-rantor-levi-wolfspeed",
  featured: true,
  imageAlt:
    "USA i fokus 8 oktober 2026 – Wall Street pressas av stigande oljepris och amerikanska långräntor.",
  readingMinutes: 5,
  seoTitle: "USA i fokus 8 oktober: Olja och räntor pressar börsen",
  seoDescription:
    "Wall Street idag: terminerna faller när oljan passerar 105 dollar och räntorna stiger. Levi Strauss, Wolfspeed och Fed-protokollet i fokus.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "USA börsen 8 oktober 2026",
    "oljepris idag",
    "amerikanska räntor",
    "Fed protokoll",
    "Levi Strauss rapport",
    "Wolfspeed aktie",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "Federal Reserve",
      "amerikanska räntor",
      "oljepris",
      "AI-finansiering",
      "halvledare",
      "rapportsäsong",
    ],
    companies: ["Levi Strauss", "Wolfspeed", "Delta Air Lines"],
    tickers: ["LEVI", "WOLF", "DAL"],
    relatedNewsSlugs: [
      "usa-i-fokus-4-oktober-2026-veckan-som-kommer-fed-protokoll-delta",
      "usa-i-fokus-3-oktober-2026-veckan-som-gatt-jobbrapport-nasdaq",
      "usa-i-fokus-30-september-2026-pce-boeing-micron",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en tydligt svagare öppning på torsdagen. Brentoljan har stigit över 105 dollar per fat och den amerikanska tioårsräntan ligger omkring 5,34 procent, nära den högsta nivån sedan 2002.",
    "Gårdagens Fed-protokoll visar varför kombinationen är känslig: centralbanken såg ihållande inflation, högre energipriser och konkurrens om kapital från stora AI-investeringar. På bolagssidan ger Levi Strauss ett starkare vinstbesked, medan Wolfspeed lyfter på ett stort villkorat finansieringsåtagande.",
  ],
  sections: [
    {
      heading: "Terminerna faller när oljan rusar",
      paragraphs: [
        "Klockan 07.24 amerikansk östkusttid var Dow-terminen ned 0,9 procent, S&P 500-terminen ned 0,5 procent och Nasdaq 100-terminen ned 0,73 procent, enligt Reuters. Det är en förhandsbild före öppningen och inte ett färdigt börsutfall.",
        "Brentoljan steg 4,8 procent till över 105 dollar per fat efter nya störningar för sjöfarten i Persiska viken och Hormuzsundet. Den amerikanska tioårsräntan låg samtidigt på 5,34 procent.",
        "S&P 500 och Nasdaq hade redan lämnat sina rekordnivåer under onsdagen när räntorna steg. Torsdagens kombination av dyrare energi och högre finansieringskostnad ökar pressen på både konsumtion och högt värderade tillväxtbolag.",
      ],
    },
    {
      heading: "Fed-protokollet lyfte samma risker",
      paragraphs: [
        "Protokollet från mötet den 15–16 september visar att Fed såg en motståndskraftig ekonomi men fortsatt för hög inflation. Kommittén röstade enhälligt för att höja styrräntan med 0,25 procentenheter till intervallet 3,75–4,00 procent.",
        "Fed noterade att högre oljepriser hade lyft den kortsiktiga inflationskompensationen. Protokollet pekade också på omfattande privat skuldfinansiering av AI-infrastruktur som en faktor bakom högre löptidspremier och statsräntor.",
        "Det gör dagens marknadsbild till en direkt uppföljning av protokollet: energi och dyrare kapital rör sig åter i den riktning som kan hålla inflationstrycket uppe. Fed-guvernören Christopher Waller signalerade samtidigt enligt Reuters att det finns flexibilitet att pausa höjningarna vid oktobermötet.",
      ],
    },
    {
      heading: "Levi Strauss höjer vinstutsikterna",
      paragraphs: [
        "Levi Strauss redovisade en nettoomsättning på 1,6 miljarder dollar för tredje kvartalet, en ökning med 4 procent. Rörelsemarginalen steg till 13,8 procent från 10,8 procent och justerad vinst per aktie ökade till 0,48 dollar från 0,34 dollar.",
        "Försäljningen i USA minskade 1 procent, medan e-handeln växte 10 procent. Direktförsäljningen till konsument ökade 2 procent och grossistförsäljningen steg 6 procent.",
        "Bolaget höjde prognosen för justerad vinst per aktie för helåret till 1,54–1,56 dollar, från tidigare 1,46–1,52 dollar. Samtidigt planerar Levi Strauss ett accelererat återköpsprogram på 100 miljoner dollar.",
      ],
    },
    {
      heading: "Wolfspeed rusar på villkorat miljardlån",
      paragraphs: [
        "Wolfspeed steg 14,5 procent i förhandeln efter att bolaget fått ett villkorat låneåtagande på upp till 1,5 miljarder dollar från USA:s försvarsdepartement, enligt Reuters.",
        "Bolagets primärkälla beskriver ett säkerställt lån med 30 års löptid. Kapitalet ska stödja amerikansk utveckling och produktion av kiselkarbidmaterial och effekthalvledare, inklusive teknik för kommunikation och elektronisk krigföring.",
        "Åtagandet är villkorat av fortsatt granskning, slutliga avtal samt finansiella och juridiska krav. Det är därför inte samma sak som att hela beloppet redan har betalats ut.",
      ],
    },
    {
      heading: "Delta rapporterar på fredag",
      paragraphs: [
        "Delta Air Lines håller sin rapportkonferens för septemberkvartalet på fredag den 9 oktober klockan 10.00 östkusttid, motsvarande 16.00 svensk tid.",
        "Rapporten ligger efter artikelns cutoff. Några utfall, prognosändringar eller kursreaktioner från Delta finns därför inte i texten.",
        "Efter veckans kraftiga oljeuppgång blir bränslekostnader, biljettintäkter och bolagets utsikter särskilt viktiga kontrollpunkter när rapporten väl publiceras.",
      ],
    },
  ],
  sources: [
    {
      text:
        "Federal Reserve: protokollet från FOMC-mötet den 15–16 september 2026 med beslut, inflationsbild och finansieringsförhållanden",
      href: "https://www.federalreserve.gov/monetarypolicy/fomcminutes20260916.htm",
    },
    {
      text:
        "Levi Strauss Investor Relations: Q3 2026 med omsättning, marginaler, EPS, försäljningsutveckling och höjd helårsprognos",
      href: "https://investors.levistrauss.com/news/financial-news/news-details/2026/Levi-Strauss--Co--Reports-Third-Quarter-Results/default.aspx",
    },
    {
      text:
        "Wolfspeed Investor Relations: villkorat 30-årigt låneåtagande på upp till 1,5 miljarder dollar",
      href: "https://investor.wolfspeed.com/news/news-details/2026/Wolfspeed-Announces-Conditional-30-Year-1-5-Billion-Loan-Commitment-from-U-S--Department-of-War-to-Advance-Domestic-Wide-Bandgap-Supply-Chain/default.aspx",
    },
    {
      text:
        "Delta Air Lines Investor Relations: rapportwebcast för septemberkvartalet den 9 oktober 2026 klockan 10.00 ET",
      href: "https://ir.delta.com/news/news-details/2026/Delta-Air-Lines-Announces-Webcast-of-September-Quarter-2026-Financial-Results/default.aspx",
    },
    {
      text:
        "Reuters: USA-terminer, Brentolja, tioårsränta och förhandelsrörelser den 8 oktober 2026",
      href: "https://www.reuters.com/business/wall-st-futures-slide-rising-oil-yields-dampen-mood-2026-10-08/",
    },
  ],
};
