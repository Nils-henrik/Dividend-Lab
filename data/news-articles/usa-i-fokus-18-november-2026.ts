import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 18 november 2026.
 * Editorial research cutoff: 2026-11-18T14:01:55+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/business/nasdaq-futures-jump-nvidia-forecast-lifts-ai-trade-ahead-anthropic-pricing-2026-11-18/
 * P0_SOURCE[secondary]: https://www.reuters.com/commentary/reuters-open-interest/global-markets-view-usa-2026-11-18/
 * P0_SOURCE[primary]: https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Third-Quarter-Fiscal-2027/
 * P0_SOURCE[primary]: https://www.census.gov/retail/marts/www/marts_current.pdf?release=20261117
 * P0_SOURCE[primary]: https://corporate.target.com/press/release/2026/11/target-corporation-reports-third-quarter-earnings
 * P0_SOURCE[primary]: https://corporate.lowes.com/newsroom/press-releases/lowes-reports-third-quarter-2026-sales-and-earnings-results
 */
export const USA_I_FOKUS_18_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-18-november-2026",
  slug: "usa-i-fokus-18-november-2026-nvidia-target-lowes",
  title: "USA i fokus 18 november: Nvidia guidar över förväntan – Nasdaq-terminen stiger",
  summary:
    "Nvidia fördubblade omsättningen och guidar för 130 miljarder dollar i nästa kvartal. Target växer snabbare medan Lowe’s höjer försäljningsmålet men sänker marginalutsikterna inför kvällens Fed-protokoll.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-18T14:02:00+01:00",
  url: "/news/usa-i-fokus-18-november-2026-nvidia-target-lowes",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-18.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-18.png",
  imageAlt: "USA i fokus 2026-11-18 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 6,
  seoTitle: "USA-börsen idag: Nvidia lyfter Nasdaq inför Fed-protokoll",
  seoDescription:
    "USA-börsen 18 november: Nvidia guidar över förväntan och stiger i förhandeln. Target och Lowe’s rapporterar medan Fed-protokollet väntas i kväll.",
  seoKeywords: [
    "USA-börsen idag",
    "Wall Street idag",
    "Nvidia Q3 2027",
    "Nvidia rapport",
    "Target Q3 2026",
    "Lowes Q3 2026",
    "Nasdaq terminer",
    "Fed protokoll"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Wall Street",
      "Nasdaq",
      "artificiell intelligens",
      "halvledare",
      "bolagsrapporter",
      "detaljhandel",
      "konsumtion",
      "Federal Reserve"
    ],
    companies: ["Nvidia", "Target", "Lowe's", "Advanced Micro Devices", "Broadcom", "Micron"],
    tickers: ["NVDA", "TGT", "LOW", "AMD", "AVGO", "MU"],
    relatedNewsSlugs: [
      "usa-i-fokus-17-november-2026-disney-home-depot-nvidia",
      "usa-i-fokus-16-november-2026-teknikpress-nvidia-fed",
      "usa-i-fokus-15-november-2026-veckan-nvidia-detaljhandel-fed",
      "usa-i-fokus-14-november-2026-veckan-wall-street-nvidia-inflation"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Gårdagens största öppna fråga har fått ett verifierat svar. Nvidia redovisade 115,8 miljarder dollar i kvartalsomsättning och guidar för 130 miljarder dollar, plus eller minus 3 procent, i nästa kvartal.",
    "Rapporten gav stöd åt AI-sektorn före onsdagens öppning. Vid Reuters senaste uppdatering var Nasdaq 100-terminen upp 0,9 procent och Nvidia 2,7 procent i förhandeln, samtidigt som flera andra chip- och datacenteraktier steg.",
    "Target och Lowe’s har också rapporterat. Target visar bredare försäljningsstyrka, medan Lowe’s höjer helårets försäljningsmål men sänker marginalprognosen. Senare i dag publiceras protokollet från Federal Reserves oktobermöte."
  ],
  sections: [
    {
      heading: "Nvidia fördubblar omsättningen",
      paragraphs: [
        "Nvidias omsättning steg 103 procent från året före till 115,8 miljarder dollar i det tredje kvartalet av räkenskapsåret 2027. Jämfört med föregående kvartal var ökningen 20 procent.",
        "Datacenterintäkterna ökade 110 procent på årsbasis till 107,6 miljarder dollar. Den justerade bruttomarginalen var 74,9 procent och den justerade vinsten per aktie blev 2,68 dollar.",
        "För fjärde kvartalet räknar Nvidia med intäkter på 130 miljarder dollar, plus eller minus 3 procent. Reuters jämför med analytikernas snittprognos på 125,25 miljarder dollar. Bolagets prognos förutsätter ingen försäljning av datacenterberäkning till Kina."
      ]
    },
    {
      heading: "Rapporten ger lättnad åt AI-sektorn",
      paragraphs: [
        "Nvidia steg 2,7 procent i förhandeln vid Reuters senaste uppdatering. AMD, Broadcom och Micron steg samtidigt 1,9, 2,2 respektive 2,7 procent, medan flera datacenterrelaterade aktier också handlades högre.",
        "Dow-terminen var upp 0,11 procent, S&P 500-terminen 0,41 procent och Nasdaq 100-terminen 0,9 procent. Förhandeln visar en tydlig riktning, men nivåerna kan ändras före och efter börsöppningen.",
        "Rapporten svarar på den operativa delen av Nvidias test: efterfrågan och guidningen är fortsatt starka. Ledarskapsfrågan är däremot inte löst, och marknaden behöver fortfarande bedöma hur vd-sökningen påverkar styrning och förtroende."
      ]
    },
    {
      heading: "Target växer – men tullåterbetalningar lyfter resultatet",
      paragraphs: [
        "Targets nettoomsättning ökade 7,1 procent till 27,1 miljarder dollar i tredje kvartalet. Den jämförbara försäljningen steg 5,6 procent, driven av 5,0 procent fler jämförbara kundbesök, medan den digitala jämförbara försäljningen ökade 9,8 procent.",
        "GAAP- och justerad vinst per aktie blev 2,65 dollar. Resultatet inkluderade en positiv effekt på 0,50 dollar per aktie från tullåterbetalningar, totalt 301 miljoner dollar före skatt.",
        "Target räknar nu med helårstillväxt i försäljningen kring 6 procent, en rörelsemarginal omkring 6,2 procent och vinst per aktie på 10,65–11,40 dollar. Prognosen inkluderar tidigare erhållna tullåterbetalningar men inga möjliga framtida återbetalningar."
      ]
    },
    {
      heading: "Lowe’s höjer försäljningen men sänker marginalmålet",
      paragraphs: [
        "Lowe’s ökade kvartalsförsäljningen 9,3 procent till 22,8 miljarder dollar. Den jämförbara försäljningen steg 1,8 procent och den justerade vinsten per aktie blev 3,10 dollar.",
        "Bolaget höjer helårets försäljningsprognos till cirka 92,5 miljarder dollar från 92,0 miljarder och räknar nu med omkring 0,5 procents jämförbar tillväxt i stället för oförändrad försäljning.",
        "Samtidigt sänks prognosen för redovisad rörelsemarginal till cirka 11,1 procent från 11,2 och den justerade marginalen till 11,5 från 11,6 procent. Reuters uppgav att aktien föll omkring 3 procent i förhandeln efter prognosen."
      ]
    },
    {
      heading: "Detaljhandeln ökade 0,2 procent i oktober",
      paragraphs: [
        "USA:s detalj- och restaurangförsäljning uppgick till 748,2 miljarder dollar i oktober, 0,2 procent mer än i september och 6,8 procent mer än ett år tidigare.",
        "Exklusive bilhandeln steg försäljningen 0,6 procent under månaden och exklusive både bilar och bensin 0,5 procent. Census Bureau påpekar att osäkerhetsintervallet för totalens månadsförändring inkluderar noll.",
        "Utfallet ger ett mer nyanserat svar än rubriksiffran ensam: totalen bromsade från september, men underliggande mått utan bilhandeln var starkare. Target och Lowe’s visar samtidigt att utvecklingen skiljer sig tydligt mellan detaljhandelssegment."
      ]
    },
    {
      heading: "Fed-protokollet väntar efter cutoff",
      paragraphs: [
        "Federal Reserve publicerar protokollet från mötet den 27–28 oktober klockan 14.00 amerikansk östkusttid, motsvarande 20.00 i Stockholm.",
        "Protokollet ligger efter artikelns cutoff och beskrivs därför endast framåtblickande. Marknaden söker mer information om hur ledamöterna väger fortsatt högt pristryck mot riskerna för tillväxt och arbetsmarknad.",
        "Efter öppningen följer DivLab om Nvidias förhandelsuppgång består, hur Target och Lowe’s reagerar i ordinarie handel och om protokollet förändrar räntemarknadens bild. Inga utfall efter cutoff föregrips."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters: färsk amerikansk förhandelsbild den 18 november 2026 med indexterminer, Nvidias kursreaktion, AI-relaterade aktier och väntan på Fed-protokollet",
      href: "https://www.reuters.com/business/nasdaq-futures-jump-nvidia-forecast-lifts-ai-trade-ahead-anthropic-pricing-2026-11-18/"
    },
    {
      text: "Reuters Morning Bid: marknadskontext den 18 november 2026 med Nvidias efterhandel, dagens rapportkalender och kommande FOMC-protokoll",
      href: "https://www.reuters.com/commentary/reuters-open-interest/global-markets-view-usa-2026-11-18/"
    },
    {
      text: "Nvidia Investor Relations: officiell Q3-rapport för räkenskapsåret 2027 med omsättning, datacenterintäkter, marginaler, resultat och Q4-prognos",
      href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Third-Quarter-Fiscal-2027/"
    },
    {
      text: "U.S. Census Bureau: officiell preliminär detaljhandelsrapport för oktober 2026 med total försäljning, månads- och årsförändring samt mått exklusive bilar och bensin",
      href: "https://www.census.gov/retail/marts/www/marts_current.pdf?release=20261117"
    },
    {
      text: "Target Corporation: officiell Q3-rapport 2026 med försäljning, jämförbar tillväxt, resultat, tullåterbetalningar och uppdaterad helårsprognos",
      href: "https://corporate.target.com/press/release/2026/11/target-corporation-reports-third-quarter-earnings"
    },
    {
      text: "Lowe’s: officiell Q3-rapport 2026 med försäljning, jämförbar tillväxt, justerad vinst och uppdaterad helårsprognos",
      href: "https://corporate.lowes.com/newsroom/press-releases/lowes-reports-third-quarter-2026-sales-and-earnings-results"
    }
  ]
};
