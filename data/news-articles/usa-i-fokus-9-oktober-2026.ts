import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus, 9 oktober 2026.
 * Editorial research cutoff: 2026-10-09T14:00:34+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/speech/waller20261008a.htm
 * P0_SOURCE[primary]: https://www.cms.gov/newsroom/fact-sheets/2027-medicare-advantage-part-d-star-ratings
 * P0_SOURCE[primary]: https://ir.delta.com/news/news-details/2026/Delta-Air-Lines-Announces-Webcast-of-September-Quarter-2026-Financial-Results/default.aspx
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-gain-oil-slips-telecoms-pressured-by-spacex-spectrum-deal-2026-10-09/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/energy/delta-air-lines-cuts-profit-outlook-fuel-costs-outpace-fare-gains-2026-10-09/
 */
export const USA_I_FOKUS_9_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-9-oktober-2026-delta-olja-rantor-humana",
  slug: "usa-i-fokus-9-oktober-2026-delta-olja-rantor-humana",
  title: "USA i fokus 9 oktober: Delta sänker prognosen när oljan lättar",
  summary:
    "USA-terminerna stiger när oljepriset backar, men långräntan är fortsatt hög. Delta sänker helårsprognosen efter kraftigt ökade bränslekostnader och Humana lyfter på Medicare-besked.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-09T14:00:40+02:00",
  url: "/news/usa-i-fokus-9-oktober-2026-delta-olja-rantor-humana",
  featured: true,
  imageAlt:
    "USA i fokus 9 oktober 2026 – Wall Street inför öppningen med Delta, olja, räntor och Humana i fokus.",
  readingMinutes: 5,
  seoTitle: "USA i fokus 9 oktober: Delta sänker prognosen",
  seoDescription:
    "Wall Street idag: terminerna stiger när oljan lättar. Delta sänker vinstprognosen, Humana rusar och Fed-ledamoten Waller ser fler höjningar.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "USA börsen 9 oktober 2026",
    "Delta Air Lines rapport",
    "oljepris idag",
    "amerikanska räntor",
    "Humana aktie",
    "Federal Reserve",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "rapportsäsong",
      "oljepris",
      "amerikanska räntor",
      "Federal Reserve",
      "flygbolag",
      "Medicare Advantage",
    ],
    companies: ["Delta Air Lines", "Humana"],
    tickers: ["DAL", "HUM"],
    relatedNewsSlugs: [
      "usa-i-fokus-4-oktober-2026-veckan-som-kommer-fed-protokoll-delta",
      "usa-i-fokus-3-oktober-2026-veckan-som-gatt-jobbrapport-nasdaq",
      "usa-i-fokus-30-september-2026-pce-boeing-micron",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en positiv öppning på fredagen när oljepriset backar efter torsdagens kraftiga uppgång. Vid DivLabs research-cutoff pekade S&P 500- och Nasdaq 100-terminerna upp, medan den amerikanska tioårsräntan låg kvar över 5 procent.",
    "Dagens tydligaste bolagsbesked kommer från Delta Air Lines. Flygbolaget sänker sin helårsprognos när bränslekostnaderna stiger snabbare än biljettintäkterna. Samtidigt lyfter Humana efter nya amerikanska kvalitetsbetyg för Medicare Advantage.",
  ],
  sections: [
    {
      heading: "Terminerna återhämtar sig när oljan faller",
      paragraphs: [
        "Klockan 07.05 amerikansk östkusttid var Dow-terminen upp 0,07 procent, S&P 500-terminen upp 0,35 procent och Nasdaq 100-terminen upp 0,72 procent, enligt Reuters. Det är en förhandsbild och inte ett färdigt börsutfall.",
        "Brentoljan föll mer än 1 procent men handlades fortfarande över 100 dollar per fat. Den amerikanska tioårsräntan låg samtidigt på 5,24 procent, nära onsdagens 24-årshögsta på 5,364 procent.",
        "Det ger ett delvis svar på gårdagens huvudfråga: energipressen har lättat, men ränteläget är fortsatt stramt. På torsdagen föll S&P 500 med 0,47 procent och Nasdaq med 1,25 procent, medan Dow steg 0,10 procent.",
      ],
    },
    {
      heading: "Delta sänker helårsprognosen",
      paragraphs: [
        "Delta redovisade en justerad vinst på 1,72 dollar per aktie för tredje kvartalet, jämfört med analytikernas genomsnittliga förväntan på 1,76 dollar enligt LSEG-data återgivna av Reuters. Den justerade rörelsemarginalen sjönk till 9,4 procent från 11,1 procent.",
        "Bolaget räknar nu med en justerad helårsvinst på 5,10–5,60 dollar per aktie. Den tidigare prognosen var 6,50–7,50 dollar. Bränslekostnaden i kvartalet ökade 62 procent till 4,1 miljarder dollar.",
        "Delta väntar sig en justerad vinst på 1,15–1,65 dollar per aktie i fjärde kvartalet. Aktien var ned 4,5 procent i förhandeln vid Reuters senaste marknadsuppdatering; rörelsen kan ändras efter börsöppningen.",
      ],
    },
    {
      heading: "Humana lyfter på Medicare-betyg",
      paragraphs: [
        "Humana steg 14,2 procent i förhandeln efter att amerikanska myndighetsdata visat att 95 procent av bolagets medlemmar finns i Medicare Advantage-planer med minst fyra stjärnor för 2027, enligt Reuters.",
        "CMS uppger att 188 Medicare Advantage-planer med läkemedelsskydd, motsvarande cirka 37 procent av kontrakten, fick minst fyra stjärnor för 2027. Viktat efter antal medlemmar omfattar sådana planer omkring 71 procent av de försäkrade.",
        "Betygen påverkar kvalitetsbonusar för 2028. Humanas förhandsrörelse visar hur materiella de kan vara för försäkringsbolagen, men den är inte en slutkurs.",
      ],
    },
    {
      heading: "Waller ser fler Fed-höjningar",
      paragraphs: [
        "Fed-guvernören Christopher Waller sade på torsdagen att ytterligare räntehöjningar kan behövas om ekonomin utvecklas som väntat. Han betonade samtidigt att höjningarna inte måste komma vid möten efter varandra.",
        "I Federal Reserves septemberprognoser räknade 16 av 18 deltagare med minst en ytterligare höjning under årets två återstående möten. Waller noterade att terminsmarknaden dagen före talet prissatte 85 procents sannolikhet för minst en höjning senast vid decembermötet.",
        "Uttalandet hjälper till att förklara varför tioårsräntan är fortsatt hög trots fredagens lättnad i oljepriset. För teknik- och andra högt värderade aktier förblir kapitalkostnaden en central motvikt inför rapportsäsongen.",
      ],
    },
    {
      heading: "Nästa vecka tar storbankerna över",
      paragraphs: [
        "Reuters uppger att den amerikanska rapportsäsongen växlar upp nästa vecka när de stora bankerna börjar rapportera. Fredagens Delta-besked ger redan en konkret påminnelse om hur högre insatskostnader kan slå mot prognoser trots stark efterfrågan.",
        "Före öppningen är marknadsläget därför tudelat: lägre olja och stigande terminer ger stöd, medan räntor över 5 procent och svagare bolagsutsikter håller riskbilden levande.",
        "Dagens kontanthandel på NYSE och Nasdaq öppnar efter artikelns cutoff. Inga rörelser efter öppningen eller slutkurser har därför föregripits.",
      ],
    },
  ],
  sources: [
    {
      text:
        "Federal Reserve: guvernör Christopher Wallers tal den 8 oktober 2026 om den ekonomiska utvecklingen, räntebanan och septemberprognoserna",
      href: "https://www.federalreserve.gov/newsevents/speech/waller20261008a.htm",
    },
    {
      text:
        "CMS: officiella kvalitetsbetyg för Medicare Advantage och Part D för 2027 samt kopplingen till kvalitetsbonusar 2028",
      href: "https://www.cms.gov/newsroom/fact-sheets/2027-medicare-advantage-part-d-star-ratings",
    },
    {
      text:
        "Delta Air Lines Investor Relations: officiellt schema för rapport och webcast för septemberkvartalet den 9 oktober 2026",
      href: "https://ir.delta.com/news/news-details/2026/Delta-Air-Lines-Announces-Webcast-of-September-Quarter-2026-Financial-Results/default.aspx",
    },
    {
      text:
        "Reuters: USA-terminer, oljepris, tioårsränta och förhandelsrörelser den 9 oktober 2026",
      href: "https://www.reuters.com/business/wall-st-futures-gain-oil-slips-telecoms-pressured-by-spacex-spectrum-deal-2026-10-09/",
    },
    {
      text:
        "Reuters: Delta Air Lines kvartalsresultat, bränslekostnader, helårsprognos och utsikter för fjärde kvartalet",
      href: "https://www.reuters.com/business/energy/delta-air-lines-cuts-profit-outlook-fuel-costs-outpace-fare-gains-2026-10-09/",
    },
  ],
};
