import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus – Veckan som kommer, 11 oktober 2026.
 * Editorial research cutoff: 2026-10-11T13:57:10+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/home.htm
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/2026-october.htm
 * P0_SOURCE[primary]: https://www.jpmorganchase.com/ir/news/2026/jpmc-to-host-third-quarter-2026-earnings-call
 * P0_SOURCE[primary]: https://www.census.gov/retail/release_schedule.html
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-week-ahead-bank-earnings-cpi-headline-busy-markets-week-sp-500-hovers-2026-10-09/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/finance/us-bank-investors-focus-impact-higher-rates-deals-outlook-q3-earnings-2026-10-08/
 */
export const USA_I_FOKUS_11_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-11-oktober-2026-veckan-som-kommer-storbanker-kpi",
  slug: "usa-i-fokus-11-oktober-2026-veckan-som-kommer-storbanker-kpi",
  title: "USA i fokus – Veckan som kommer: Storbanker och KPI testar rekordbörsen",
  summary:
    "Wall Street är stängt på söndagen. Nästa vecka öppnar de amerikanska storbankerna rapportsäsongen samtidigt som KPI, PPI, detaljhandel och Fed Beige Book testar ränteläget.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-11T13:57:20+02:00",
  url: "/news/usa-i-fokus-11-oktober-2026-veckan-som-kommer-storbanker-kpi",
  featured: true,
  imageAlt:
    "USA i fokus – Veckan som kommer 11 oktober 2026 med amerikanska storbanker, KPI och Federal Reserve i fokus.",
  readingMinutes: 6,
  seoTitle: "USA i fokus veckan som kommer: Storbanker och KPI",
  seoDescription:
    "Wall Street nästa vecka: JPMorgan och övriga storbanker rapporterar när KPI, PPI, detaljhandel och Fed Beige Book sätter ränteläget i fokus.",
  seoKeywords: [
    "USA i fokus veckan som kommer",
    "Wall Street nästa vecka",
    "USA KPI oktober 2026",
    "JPMorgan rapport",
    "amerikanska storbanker",
    "Federal Reserve Beige Book",
    "USA detaljhandel",
    "amerikanska räntor",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "rapportsäsong",
      "amerikanska banker",
      "USA-inflation",
      "KPI",
      "PPI",
      "detaljhandel",
      "Federal Reserve",
      "amerikanska räntor",
    ],
    companies: ["JPMorgan Chase", "Goldman Sachs", "Bank of America", "Morgan Stanley"],
    tickers: ["JPM", "GS", "BAC", "MS"],
    relatedNewsSlugs: [
      "usa-i-fokus-4-oktober-2026-veckan-som-kommer-fed-protokoll-delta",
      "usa-i-fokus-3-oktober-2026-veckan-som-gatt-jobbrapport-nasdaq",
      "usa-i-fokus-30-september-2026-pce-boeing-micron",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Den amerikanska kontantmarknaden är stängd på söndagen. Efter en vecka där S&P 500 nådde nytt rekord och den tioåriga statsräntan avslutade fredagen kring 5,24 procent flyttas fokus nu från förväntningar till faktiska bankvinster och inflationsdata.",
    "Veckans tyngsta verifierade hållpunkter är storbanksrapporter på tisdag och onsdag, september-KPI och Federal Reserves Beige Book på onsdag samt PPI och detaljhandel på torsdag. Alla utfall ligger efter artikelns cutoff och beskrivs därför endast framåtblickande.",
  ],
  sections: [
    {
      heading: "Tisdag: fyra storbanker öppnar rapportveckan",
      paragraphs: [
        "JPMorgan Chase, Goldman Sachs, Citigroup och Wells Fargo är enligt Reuters schemalagda att rapportera tredje kvartalet på tisdag den 13 oktober. JPMorgan uppger att resultatet publiceras omkring klockan 07.00 östkusttid, motsvarande 13.00 svensk tid, och att rapportkonferensen börjar klockan 14.30 svensk tid.",
        "För bankerna blir räntenetto, inlåningskostnader, kreditkvalitet, lånetillväxt och kapitalmarknadsintäkter centrala kontrollpunkter. Reuters uppger att bankindexet S&P 500 Banks hade fallit 7,5 procent den senaste månaden inför rapporterna.",
        "Reuters sammanställning pekar på att de största bankernas vinster väntas öka jämfört med förra året, men detta är prognoser och inte rapporterade utfall. Artikeln föregriper därför varken resultat, guidning eller kursreaktioner.",
      ],
    },
    {
      heading: "Onsdag: Bank of America, Morgan Stanley och KPI",
      paragraphs: [
        "Bank of America och Morgan Stanley är schemalagda att rapportera på onsdag den 14 oktober. Samma dag klockan 08.30 östkusttid, motsvarande 14.30 svensk tid, publicerar Bureau of Labor Statistics konsumentprisindex för september.",
        "Reuters enkät inför publiceringen pekar på en väntad årstakt på 3,7 procent för KPI och 2,5 procent för kärn-KPI. Dessa siffror är marknadsförväntningar, inte verifierade utfall.",
        "KPI blir en av de sista stora datapunkterna före Federal Reserves möte den 27–28 oktober. Ett faktiskt utfall kan påverka räntemarknadens prissättning, men riktning och marknadsreaktion kan inte fastställas före publiceringen.",
      ],
    },
    {
      heading: "Fed Beige Book kommer på onsdagskvällen",
      paragraphs: [
        "Federal Reserve publicerar Beige Book onsdagen den 14 oktober klockan 14.00 östkusttid, motsvarande 20.00 svensk tid.",
        "Rapporten samlar regionala observationer om bland annat aktivitet, arbetsmarknad, priser och efterfrågan. Den blir särskilt relevant efter att Fed höjde styrräntan i september och flera ledamöter signalerat att ytterligare höjningar kan behövas.",
        "Beige Book publiceras efter onsdagens KPI. Marknaden får därmed först en nationell inflationssiffra och senare samma dag en bredare regional bild av ekonomin.",
      ],
    },
    {
      heading: "Torsdag: PPI och detaljhandel mäter två olika risker",
      paragraphs: [
        "BLS publicerar producentprisindex för september torsdagen den 15 oktober klockan 08.30 östkusttid, motsvarande 14.30 svensk tid.",
        "Vid samma tid publicerar Census Bureau den preliminära detaljhandelsrapporten för september. Kombinationen ger en samtidig kontroll av pristryck tidigare i produktionskedjan och hushållens efterfrågan.",
        "För investerare blir samspelet viktigare än en enskild rubriksiffra. Stark efterfrågan tillsammans med högt producentpristryck kan hålla räntefrågan levande, medan svagare data kan ge en annan signal. Det är scenarier, inte prognoser om utfallet.",
      ],
    },
    {
      heading: "Fredag: industriproduktion och importpriser avslutar veckan",
      paragraphs: [
        "BLS publicerar import- och exportprisindex för september på fredagen den 16 oktober klockan 08.30 östkusttid, motsvarande 14.30 svensk tid.",
        "Federal Reserve följer klockan 09.15 östkusttid, motsvarande 15.15 svensk tid, med industriproduktion och kapacitetsutnyttjande för september.",
        "De två rapporterna ger veckan ett avslutande test av både externt pristryck och aktiviteten i amerikansk industri. Några utfall eller marknadsreaktioner finns inte vid söndagens cutoff.",
      ],
    },
    {
      heading: "Vad har förändrats sedan veckan som gick?",
      paragraphs: [
        "Förra veckan bar stora teknikbolag och vinstoptimism indexen till nya rekord trots långräntor över 5 procent. Nästa vecka ska den optimismen börja möta faktiska kvartalsrapporter.",
        "Bankerna ger tidiga besked om konsumenter, kreditförluster, finansieringskostnader och kapitalmarknader. KPI, PPI och detaljhandel avgör samtidigt om makrobilden stöder eller utmanar Feds stramare linje.",
        "DivLabs redaktionella bedömning är därför att veckan får två parallella huvudspår: kvaliteten i bolagsvinsterna och uthålligheten i inflationen. Det är en prioritering av bekräftade katalysatorer, inte ett påstående om kommande indexrörelser.",
      ],
    },
    {
      heading: "Veckans bevakningslista",
      paragraphs: [
        "Tisdag står JPMorgan, Goldman Sachs, Citigroup och Wells Fargo i centrum. Onsdag följer Bank of America, Morgan Stanley, KPI och Beige Book.",
        "Torsdag riktas blicken mot PPI och detaljhandel. Fredag avslutas kalendern med importpriser och industriproduktion.",
        "Inga rapportresultat, makroutfall eller marknadsreaktioner efter söndagens research-cutoff är kända i förväg. De måste verifieras separat när respektive källa publicerar dem.",
      ],
    },
  ],
  sources: [
    {
      text:
        "Bureau of Labor Statistics: officiellt publiceringsschema för KPI, PPI samt import- och exportpriser i oktober 2026",
      href: "https://www.bls.gov/schedule/2026/home.htm",
    },
    {
      text:
        "Federal Reserve: officiell oktoberkalender för Beige Book och industriproduktion",
      href: "https://www.federalreserve.gov/newsevents/2026-october.htm",
    },
    {
      text:
        "JPMorgan Chase Investor Relations: tid och datum för resultat och rapportkonferens för tredje kvartalet 2026",
      href: "https://www.jpmorganchase.com/ir/news/2026/jpmc-to-host-third-quarter-2026-earnings-call",
    },
    {
      text:
        "U.S. Census Bureau: officiellt publiceringsschema för preliminär detaljhandel avseende september 2026",
      href: "https://www.census.gov/retail/release_schedule.html",
    },
    {
      text:
        "Reuters: veckokalender med storbanksrapporter, KPI, PPI och detaljhandel samt marknadens förväntningar",
      href: "https://www.reuters.com/business/wall-st-week-ahead-bank-earnings-cpi-headline-busy-markets-week-sp-500-hovers-2026-10-09/",
    },
    {
      text:
        "Reuters: rapportschema och centrala bevakningspunkter för USA:s sex största banker",
      href: "https://www.reuters.com/business/finance/us-bank-investors-focus-impact-higher-rates-deals-outlook-q3-earnings-2026-10-08/",
    },
  ],
};
