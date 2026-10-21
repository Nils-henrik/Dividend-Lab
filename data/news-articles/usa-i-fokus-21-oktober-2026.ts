import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 21 oktober 2026.
 * Editorial research cutoff: 2026-10-21T13:57:30+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://ir.netflix.net/files/doc_financials/2026/q3/FINAL-Q3-26-Shareholder-Letter.pdf
 * P0_SOURCE[primary]: https://investors.att.com/
 * P0_SOURCE[primary]: https://ir.tesla.com/press-release/tesla-third-quarter-2026-production-deliveries-and-deployments
 * P0_SOURCE[primary]: https://newsroom.ibm.com/2026-10-07-ibm-to-announce-third-quarter-2026-financial-results
 * P0_SOURCE[secondary]: https://www.reuters.com/world/china/global-markets-global-markets-2026-10-21/
 * P0_SOURCE[secondary]: https://apnews.com/article/stocks-markets-rates-oil-earnings-ai-4fa93685cd49e51e7ff0d840fdd38b0d
 */
export const USA_I_FOKUS_21_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-21-oktober-2026-netflix-att-tesla-ibm",
  slug: "usa-i-fokus-21-oktober-2026-netflix-att-tesla-ibm",
  title: "USA i fokus 21 oktober: S&P 500-terminen stiger inför Tesla och IBM",
  summary:
    "S&P 500-terminen stiger svagt inför Wall Streets öppning. Netflix redovisar högre marginal men sänker sin prognos för årets annonsintäkter, AT&T visar starkt kassaflöde och efter stängning väntar Tesla och IBM.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-21T13:57:30+02:00",
  url: "/news/usa-i-fokus-21-oktober-2026-netflix-att-tesla-ibm",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-10-21.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-10-21.png",
  imageAlt: "USA i fokus 2026-10-21 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 5,
  seoTitle: "USA i fokus: Netflix och AT&T rapporterar – Tesla väntar",
  seoDescription:
    "Wall Street idag: S&P 500-terminen stiger svagt. Netflix och AT&T har rapporterat, medan Tesla och IBM publicerar Q3 efter stängning.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "S&P 500 terminer",
    "USA börsen 21 oktober 2026",
    "Netflix rapport",
    "AT&T rapport",
    "Tesla rapport",
    "IBM rapport",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "S&P 500",
      "rapportperiod",
      "streaming",
      "telekom",
      "artificiell intelligens",
    ],
    companies: ["Netflix", "AT&T", "Tesla", "IBM"],
    tickers: ["NFLX", "T", "TSLA", "IBM"],
    relatedNewsSlugs: [
      "usa-i-fokus-20-oktober-2026-gm-halliburton-3m-netflix",
      "usa-i-fokus-19-oktober-2026-nasdaq-ai-olja-rapporter",
      "usa-i-fokus-18-oktober-2026-veckan-som-kommer-netflix-tesla-ibm",
      "borssverige-21-oktober-2026",
      "norden-i-centrum-21-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en försiktigt positiv öppning efter tisdagens blandade handel. I AP:s senaste verifierade terminsbild steg S&P 500-terminen 0,1 procent, medan Dow-terminen var ned 0,1 procent. Reuters beskrev samtidigt USA-terminerna som positiva inför kvällens stora teknikrapporter.",
    "Gårdagens huvudfråga har nu fått ett delvis svar: Netflix levererade ett starkare rörelseresultat och högre marginal, men sänkte sin prognos för årets annonsintäkter. Före öppningen har även AT&T rapporterat, medan Tesla och IBM publicerar sina Q3-resultat efter stängning.",
  ],
  sections: [
    {
      heading: "Netflix höjer marginalen men sänker annonsprognosen",
      paragraphs: [
        "Netflix omsättning ökade 11,8 procent till 12,874 miljarder dollar i tredje kvartalet. Rörelseresultatet steg till 4,459 miljarder dollar och rörelsemarginalen förbättrades till 34,6 procent från 28,2 procent ett år tidigare.",
        "Den utspädda vinsten per aktie blev 0,87 dollar, jämfört med 0,59 dollar. Det fria kassaflödet uppgick till 2,884 miljarder dollar.",
        "För helåret räknar Netflix med 51,1 miljarder dollar i omsättning och en rörelsemarginal på 31,5 procent. Samtidigt sänkte bolaget prognosen för annonsintäkterna 2026 till omkring 2,7 miljarder dollar från tidigare cirka 3 miljarder, eftersom utrullningen av vissa annonsprodukter gått något långsammare än väntat.",
      ],
    },
    {
      heading: "AT&T visar 5 miljarder dollar i fritt kassaflöde",
      paragraphs: [
        "AT&T redovisade intäkter på 32,3 miljarder dollar och justerad EBITDA på 12,5 miljarder dollar för tredje kvartalet. Det fria kassaflödet uppgick till 5,0 miljarder dollar.",
        "Bolaget fick 379 000 nya efterbetalda mobilabonnemang och 769 000 nya internetanslutningar inom kategorin avancerad uppkoppling. Fibernätet når enligt bolaget 39,7 miljoner konsument- och företagsadresser.",
        "Rapportkonferensen börjar klockan 08.30 östkusttid, motsvarande 14.30 svensk tid. Den ligger efter artikelns research-cutoff, så eventuella nya besked från samtalet ingår inte.",
      ],
    },
    {
      heading: "Tisdagens börs gav ett splittrat startläge",
      paragraphs: [
        "S&P 500 steg 0,3 procent på tisdagen och Dow Jones ökade 1,0 procent. Nasdaq slutade samtidigt knappt 0,1 procent lägre, enligt AP:s verifierade slutdata.",
        "Det innebär att gårdagens svagare Nasdaq-termin följdes av fortsatt relativ svaghet i teknikindexet, samtidigt som den bredare marknaden steg. Rörelsen ger ingen säker prognos för onsdagen.",
        "Brentoljan steg 1,1 procent till 109,95 dollar per fat i AP:s senaste morgonbild. Reuters noterade senare att Brent åter passerade 110 dollar. Det höga oljepriset är fortsatt relevant för inflation och räntor, men artikeln tillskriver inte dagens terminsrörelse en enskild faktor.",
      ],
    },
    {
      heading: "Tesla rapporterar efter stängning",
      paragraphs: [
        "Tesla publicerar sitt finansiella Q3-resultat efter börsstängning. Ledningens frågestund börjar klockan 17.30 östkusttid, motsvarande 23.30 svensk tid.",
        "Bolaget har redan redovisat 486 532 levererade och 464 391 producerade fordon under kvartalet. Energilagringsprodukterna nådde 13,7 GWh.",
        "Tesla betonar att leveranser och energilagring inte ensamma visar det finansiella resultatet. Därför blir intäkter, marginaler, kassaflöde och utsikter kvällens centrala kontrollpunkter, utan att något utfall eller någon kursreaktion föregrips.",
      ],
    },
    {
      heading: "IBM följer strax före Tesla",
      paragraphs: [
        "IBM håller sin rapportkonferens klockan 17.00 östkusttid, motsvarande 23.00 svensk tid. Bolaget uppger att resultatpressmeddelandet publiceras före webbsändningen.",
        "Rapporten blir ytterligare en viktig datapunkt för företagens efterfrågan på mjukvara, hybridmoln och AI-relaterade tjänster. Det är DivLabs redaktionella prioritering, inte ett påstående om det kommande utfallet.",
        "Efter cutoff bevakar marknaden först öppningen klockan 15.30 svensk tid och därefter rapporterna från IBM och Tesla. Inga siffror eller reaktioner från dessa kommande händelser ingår i artikeln.",
      ],
    },
  ],
  sources: [
    {
      text: "Netflix Investor Relations: officiellt Q3-utfall, Q4-prognos och uppdaterad helårsprognos, publicerat 20 oktober 2026",
      href: "https://ir.netflix.net/files/doc_financials/2026/q3/FINAL-Q3-26-Shareholder-Letter.pdf",
    },
    {
      text: "AT&T Investor Relations: officiella nyckeltal för Q3 2026 och tid för rapportkonferensen den 21 oktober",
      href: "https://investors.att.com/",
    },
    {
      text: "Tesla Investor Relations: officiella leverans-, produktions- och energilagringssiffror samt Q3-schema den 21 oktober 2026",
      href: "https://ir.tesla.com/press-release/tesla-third-quarter-2026-production-deliveries-and-deployments",
    },
    {
      text: "IBM Newsroom: officiellt schema för Q3-resultat och rapportkonferens den 21 oktober 2026",
      href: "https://newsroom.ibm.com/2026-10-07-ibm-to-announce-third-quarter-2026-financial-results",
    },
    {
      text: "Reuters: aktuell global marknadsbild, positiva USA-terminer, oljepris och kvällens rapportfokus den 21 oktober 2026",
      href: "https://www.reuters.com/world/china/global-markets-global-markets-2026-10-21/",
    },
    {
      text: "Associated Press: verifierad amerikansk terminsbild, tisdagens indexutfall och oljepris den 21 oktober 2026",
      href: "https://apnews.com/article/stocks-markets-rates-oil-earnings-ai-4fa93685cd49e51e7ff0d840fdd38b0d",
    },
  ],
};
