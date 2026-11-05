import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 5 november 2026.
 * Editorial research cutoff: 2026-11-05T07:56:48+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://mowi.com/investors/
 * P0_SOURCE[primary]: https://mowi.com/wp-content/uploads/2026/05/Mowi_Q3_2026_Report.pdf
 * P0_SOURCE[primary]: https://investor.maersk.com/events/event-details/interim-report-3rd-quarter-2026
 * P0_SOURCE[primary]: https://orsted.com/en/media/news/2026/10/orsted-to-present-q3-2026-results-on-5-november-1525534411
 * P0_SOURCE[primary]: https://www.norges-bank.no/en/news-events/calendar/policy-rate-decisions/26-11-05/
 */
export const NORDEN_I_CENTRUM_5_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-5-november-2026",
  slug: "norden-i-centrum-5-november-2026",
  title: "Mowi höjer volymprognosen efter rekordkvartal – Maersk och Ørsted väntar",
  summary:
    "Mowi redovisar rekordintäkter och mer än fördubblad operativ EBIT i Q3 samt höjer årets volymprognos. Senare i dag väntar rapporter från Maersk och Ørsted samt Norges Banks räntebesked.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-05T07:56:53+01:00",
  url: "/news/norden-i-centrum-5-november-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-11-05.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-11-05.png",
  imageAlt: "Norden i centrum 2026-11-05 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Nordiska börsen idag: Mowi höjer volymprognosen efter rekordkvartal",
  seoDescription:
    "Mowi når rekordintäkter, lyfter operativ EBIT och höjer volymprognosen. Maersk, Ørsted och Norges Bank följer senare den 5 november.",
  seoKeywords: [
    "nordiska börsen idag",
    "Mowi Q3 2026",
    "Mowi volymprognos",
    "Mowi aktie",
    "Maersk Q3 2026",
    "Ørsted Q3 2026",
    "Norges Bank ränta",
    "Norden i centrum"
  ],
  internalLinking: {
    topics: [
      "Norden",
      "rapportperiod",
      "lax",
      "sjömat",
      "frakt",
      "vindkraft",
      "ränta",
      "Norge",
      "Danmark"
    ],
    companies: ["Mowi", "A.P. Møller - Mærsk", "Ørsted"],
    tickers: ["MOWI", "MAERSK B", "ORSTED"],
    relatedNewsSlugs: [
      "norden-i-centrum-4-november-2026",
      "norden-i-centrum-3-november-2026",
      "norden-i-centrum-2-november-2026",
      "borssverige-4-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Torsdagens nordiska morgon ger ett nytt svar på rapportveckans öppna frågor. Mowi redovisar rekordhög omsättning och skördevolym, samtidigt som den operativa rörelsevinsten mer än fördubblades jämfört med tredje kvartalet i fjol.",
    "Den norska laxproducenten höjer också prognosen för årets skördevolym till 620 000 ton från 600 000 ton. Högre priser, större volymer och lägre odlingskostnad stärkte resultatet.",
    "Senare i dag publicerar Maersk och Ørsted sina Q3-resultat, medan Norges Bank lämnar räntebesked klockan 10.00. Dessa utfall låg efter artikelns cutoff och föregrips därför inte."
  ],
  sections: [
    {
      heading: "Mowi når 1,73 miljarder euro i intäkter",
      paragraphs: [
        "Mowis operativa intäkter steg till 1 731,7 miljoner euro från 1 393,1 miljoner ett år tidigare. Bolaget beskriver nivån som rekordhög.",
        "Skördevolymen ökade till rekordnivån 185 641 ton från 165 640 ton. Kombinationen av större volym och högre priser gav ett tydligt genomslag i resultatet.",
        "Operativ EBIT steg till 274,5 miljoner euro från 111,7 miljoner. Den operativa EBIT-marginalen förbättrades till 15,9 procent från 8,0 procent."
      ]
    },
    {
      heading: "Högre laxpris och lägre kostnad lyfter lönsamheten",
      paragraphs: [
        "Mowi uppger att spotpriserna under tredje kvartalet var 18 procent högre än ett år tidigare. Samtidigt sjönk den realiserade odlingskostnaden till 5,11 euro per kilo från 5,42 euro.",
        "Kostnadsminskningen motsvarade enligt bolaget 51 miljoner euro. Mowi hänför den starkare operativa vinsten till förbättrade priser, volymer och kostnader.",
        "Bolaget höjer prognosen för skördevolymen 2026 till 620 000 ton från 600 000 ton efter stark biologisk produktion. För 2027 är prognosen 630 000 ton, under antagande om normala tillväxtförhållanden i havet."
      ]
    },
    {
      heading: "Kassaflöde och nettoskuld ger en motvikt",
      paragraphs: [
        "Kassaflödet från den löpande verksamheten minskade till 193,0 miljoner euro från 255,2 miljoner. Rörelsekapital band 67,8 miljoner euro under kvartalet, främst inom Sales & Marketing.",
        "Räntebärande nettoskuld exklusive IFRS 16 uppgick till 2 886,5 miljoner euro, jämfört med 1 759,8 miljoner ett år tidigare. Nivån låg också över Mowis långsiktiga skuldmål på 2 700 miljoner euro.",
        "Den avtalade försäljningen av verksamheten i östra Kanada väntas tillföra omkring 140 miljoner euro när affären slutförs, förutsatt sedvanliga villkor och konkurrensgodkännande."
      ]
    },
    {
      heading: "Konsumentprodukter växer men tjänar mindre",
      paragraphs: [
        "Consumer Products nådde rekordhöga intäkter och volymer. Försäljningsvolymen steg 17,8 procent till 84 300 ton.",
        "Affärsområdets operativa EBIT minskade samtidigt till 45,3 miljoner euro från 65,7 miljoner. Lägre kontraktspriser belastade resultatet, delvis motverkat av bättre drift och lägre råvarukostnader.",
        "Foderverksamheten utvecklades starkare. Operativ EBITDA ökade till 33,7 miljoner euro från 25,7 miljoner och volymerna steg 19,3 procent till 211 200 ton."
      ]
    },
    {
      heading: "Utdelningen höjs – men nästa test är uthålligheten",
      paragraphs: [
        "Styrelsen har beslutat om en kvartalsutdelning på 2,30 norska kronor per aktie. Under jämförelsekvartalet var den deklarerade och utbetalda utdelningen 1,45 kronor per aktie.",
        "Rapporten visar ett kraftigt vinstlyft och bättre kostnadsläge, men också lägre operativt kassaflöde och högre skuld. Nästa kontrollpunkt blir om pris- och kostnadsförbättringen håller när skördevolymen väntas minska säsongsmässigt i fjärde kvartalet.",
        "Mowi räknar med att den realiserade kostnaden i Q4 ligger i nivå med samma kvartal 2025 och något över Q3-nivån, bland annat på grund av lägre volymer och tillfälligt högre kostnader för foderråvaror."
      ]
    },
    {
      heading: "Tre nordiska besked följer efter cutoff",
      paragraphs: [
        "Maersk planerar att publicera sin Q3-rapport omkring klockan 08.00. Ørsted anger också att bolagets Q3-resultat publiceras omkring klockan 08.00.",
        "Norges Bank lämnar sitt räntebesked klockan 10.00 och håller presskonferens klockan 10.30. Samtliga tre utfall måste verifieras mot respektive primärkälla innan de kan beskrivas som fakta.",
        "För nordiska investerare blir dagens följdfrågor därför hur fraktmarknaden påverkar Maersk, hur projekt och finansiering utvecklas hos Ørsted samt om Norges Bank ändrar räntan eller sin signal om vägen framåt."
      ]
    }
  ],
  sources: [
    {
      text: "Mowi: officiell investerarsida som visar Q3 2026-materialet och rapportdatumet den 4 november 2026",
      href: "https://mowi.com/investors/"
    },
    {
      text: "Mowi: fullständig officiell Q3-rapport med intäkter, skördevolym, operativ EBIT, marginal, pris- och kostnadsutveckling, prognoser, kassaflöde, nettoskuld och utdelning",
      href: "https://mowi.com/wp-content/uploads/2026/05/Mowi_Q3_2026_Report.pdf"
    },
    {
      text: "A.P. Møller - Mærsk: officiell kalender som anger publicering av Q3-rapporten omkring klockan 08.00 den 5 november 2026",
      href: "https://investor.maersk.com/events/event-details/interim-report-3rd-quarter-2026"
    },
    {
      text: "Ørsted: officiellt besked att Q3-resultatet publiceras omkring klockan 08.00 den 5 november 2026",
      href: "https://orsted.com/en/media/news/2026/10/orsted-to-present-q3-2026-results-on-5-november-1525534411"
    },
    {
      text: "Norges Bank: officiell kalender som anger räntebesked klockan 10.00 och presskonferens klockan 10.30 den 5 november 2026",
      href: "https://www.norges-bank.no/en/news-events/calendar/policy-rate-decisions/26-11-05/"
    }
  ]
};
