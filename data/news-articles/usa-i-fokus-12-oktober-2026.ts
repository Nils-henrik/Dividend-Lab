import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus, 12 oktober 2026.
 * Editorial research cutoff: 2026-10-12T14:06:51+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/2026-october.htm
 * P0_SOURCE[primary]: https://www.nyse.com/trade/hours-calendars
 * P0_SOURCE[primary]: https://www.jpmorganchase.com/ir/news/2026/jpmc-to-host-third-quarter-2026-earnings-call
 * P0_SOURCE[primary]: https://www.citigroup.com/global/news/press-release/2026/citi-third-quarter-2026-earnings-call
 * P0_SOURCE[secondary]: https://www.reuters.com/business/us-stock-futures-muted-oil-stays-above-100-ahead-earnings-2026-10-12/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/energy/oil-climbs-mideast-conflict-tanker-attacks-persist-2026-10-11/
 */
export const USA_I_FOKUS_12_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-12-oktober-2026-olja-storbanker-terminer",
  slug: "usa-i-fokus-12-oktober-2026-olja-storbanker-terminer",
  title: "USA i fokus 12 oktober: Oljan över 106 dollar inför storbanksrapporter",
  summary:
    "Wall Street går mot en avvaktande öppning när Brentoljan stiger över 106 dollar. Räntemarknaden är stängd, medan JPMorgan, Goldman Sachs, Citi och Wells Fargo rapporterar på tisdagen.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-12T14:07:00+02:00",
  url: "/news/usa-i-fokus-12-oktober-2026-olja-storbanker-terminer",
  featured: true,
  imageAlt:
    "USA i fokus 12 oktober 2026 med Wall Street, oljepris och amerikanska storbanker inför rapportstarten.",
  readingMinutes: 5,
  seoTitle: "USA i fokus 12 oktober: Olja och storbanker",
  seoDescription:
    "Wall Street idag: USA-terminerna är blandade när Brent passerar 106 dollar. Storbankerna öppnar rapportsäsongen på tisdag.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "USA börsen 12 oktober 2026",
    "oljepris idag",
    "Brentolja",
    "JPMorgan rapport",
    "amerikanska storbanker",
    "USA terminer",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "oljepris",
      "rapportsäsong",
      "amerikanska banker",
      "inflation",
      "Federal Reserve",
      "amerikanska räntor",
    ],
    companies: ["JPMorgan Chase", "Goldman Sachs", "Citigroup", "Wells Fargo"],
    tickers: ["JPM", "GS", "C", "WFC"],
    relatedNewsSlugs: [
      "usa-i-fokus-11-oktober-2026-veckan-som-kommer-storbanker-kpi",
      "usa-i-fokus-10-oktober-2026-veckan-som-gatt-rekord-rantor-humana",
      "usa-i-fokus-9-oktober-2026-delta-olja-rantor-humana",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en avvaktande start på veckan. Vid Reuters senaste verifierade förhandsbild steg Dow-terminen 0,06 procent och S&P 500-terminen 0,03 procent, medan Nasdaq 100-terminen föll 0,23 procent.",
    "Oljepriset är dagens tydligaste makrosignal. Brent handlades på 106,19 dollar per fat och WTI på 92,96 dollar efter uppgångar på 1,2 procent. Samtidigt är den amerikanska statsobligationsmarknaden stängd för Columbus Day, medan aktiehandeln på NYSE går enligt ordinarie schema.",
  ],
  sections: [
    {
      heading: "Oljan återtar huvudrollen inför börsöppningen",
      paragraphs: [
        "Reuters uppger att Brentoljan nådde sin högsta nivå på omkring två veckor. Uppgången följde nya attacker i och kring Saudiarabien samt rapporterade angrepp mot tankfartyg nära Hormuzsundet.",
        "Den högre energinivån är relevant för Wall Street eftersom den kan påverka företagens kostnader och den kommande inflationsbilden. Det är däremot för tidigt att slå fast hur dagens aktiehandel reagerar; den amerikanska kontantmarknaden öppnar först klockan 15.30 svensk tid.",
        "Förra veckan avslutades de tre stora USA-indexen högre enligt Reuters, men måndagens blandade terminer visar att rekordoptimismen nu möter både dyrare energi och en tung rapportvecka.",
      ],
    },
    {
      heading: "Aktiebörsen är öppen men räntesignalen saknas",
      paragraphs: [
        "Columbus Day delar de amerikanska marknaderna. Federal Reserves kalender anger att dagens ordinarie statistikpubliceringar flyttas till tisdagen, och Reuters uppger att statsobligationsmarknaden är stängd.",
        "NYSE listar inte Columbus Day bland börsens stängningsdagar 2026. Den ordinarie aktiehandeln pågår därför mellan klockan 09.30 och 16.00 östkusttid, motsvarande 15.30–22.00 svensk tid.",
        "Det betyder att investerare får en aktiedag utan en färsk kontantnotering i amerikanska statsobligationer. Ränteläget kan fortfarande påverka börsen, men dagens signal från obligationsmarknaden blir mindre komplett än normalt.",
      ],
    },
    {
      heading: "Fyra storbanker tar över på tisdagen",
      paragraphs: [
        "På tisdagen skiftar fokus till JPMorgan Chase, Goldman Sachs, Citigroup och Wells Fargo. Reuters anger att de fyra bankerna hör till de första stora amerikanska bolagen som rapporterar Q3.",
        "JPMorgan planerar att publicera resultatet omkring klockan 07.00 östkusttid, motsvarande 13.00 svensk tid, och håller rapportkonferens klockan 14.30 svensk tid. Citi uppger att dess resultat kommer omkring klockan 14.00 svensk tid och att rapportkonferensen börjar klockan 17.00.",
        "Dagens artikel föregriper inga utfall. För bankerna blir räntenetto, kreditkvalitet, inlåningskostnader och kapitalmarknadsintäkter centrala kontrollpunkter först när de faktiska rapporterna finns.",
      ],
    },
    {
      heading: "Inflation och detaljhandel väntar senare i veckan",
      paragraphs: [
        "Efter bankstarten riktas marknadens blick mot amerikansk konsumentinflation, producentpriser och detaljhandel senare i veckan. Reuters enkät pekar inför KPI-publiceringen på en väntad årstakt på 3,7 procent för huvudmåttet och 2,5 procent för kärninflationen.",
        "Detta är förväntningar, inte rapporterade utfall. De faktiska siffrorna publiceras efter artikelns research-cutoff och måste verifieras separat innan de kan kopplas till en marknadsreaktion.",
        "Federal Reserve publicerar dessutom Beige Book på onsdagen. Dokumentet blir en regional temperaturmätare på aktivitet, arbetsmarknad och priser inför FOMC-mötet den 27–28 oktober.",
      ],
    },
    {
      heading: "Det här bevakar Wall Street i dag",
      paragraphs: [
        "Dagens första kontrollpunkt är om Brentoljan håller sig över 106 dollar när USA-handeln öppnar. Den andra är om teknikaktiernas svagare terminsbild består eller förändras efter klockan 15.30.",
        "Den tredje är positioneringen inför tisdagens bankrapporter. Enskilda förhandsrörelser kan ändras snabbt, så artikeln använder endast Reuters tidsstämplade terminsdata och beskriver inga slutliga kursreaktioner.",
        "DivLabs redaktionella bedömning är att oljan sätter tonen i dag, medan bankernas faktiska Q3-siffror blir veckans första stora resultatprov. Det är en prioritering av verifierade katalysatorer, inte en prognos om indexens slutnivåer.",
      ],
    },
  ],
  sources: [
    {
      text:
        "Federal Reserve: officiell oktoberkalender med Columbus Day, flyttade statistikpubliceringar, Beige Book och FOMC-mötet",
      href: "https://www.federalreserve.gov/newsevents/2026-october.htm",
    },
    {
      text:
        "NYSE: officiella handelsdagar och ordinarie öppettider för amerikansk aktiehandel 2026",
      href: "https://www.nyse.com/trade/hours-calendars",
    },
    {
      text:
        "JPMorgan Chase Investor Relations: officiellt datum och klockslag för Q3-resultat och rapportkonferens 2026",
      href: "https://www.jpmorganchase.com/ir/news/2026/jpmc-to-host-third-quarter-2026-earnings-call",
    },
    {
      text:
        "Citigroup Investor Relations: officiellt datum och klockslag för Q3-resultat och rapportkonferens 2026",
      href: "https://www.citigroup.com/global/news/press-release/2026/citi-third-quarter-2026-earnings-call",
    },
    {
      text:
        "Reuters: tidsstämplad USA-terminsbild, oljepris, bankkalender och veckans inflationsförväntningar den 12 oktober 2026",
      href: "https://www.reuters.com/business/us-stock-futures-muted-oil-stays-above-100-ahead-earnings-2026-10-12/",
    },
    {
      text:
        "Reuters: Brent- och WTI-priser samt verifierad energimarknadskontext inför USA-handeln den 12 oktober 2026",
      href: "https://www.reuters.com/business/energy/oil-climbs-mideast-conflict-tanker-attacks-persist-2026-10-11/",
    },
  ],
};
