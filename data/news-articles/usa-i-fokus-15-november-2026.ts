import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 15 november 2026.
 * Editorial research cutoff: 2026-11-15T13:59:09+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-week-ahead-nvidia-results-anthropic-ipo-pose-tests-tumultuous-ai-trade-2026-11-13/
 * P0_SOURCE[primary]: https://nvidianews.nvidia.com/news/nvidia-sets-conference-call-for-third-quarter-financial-results-6928873
 * P0_SOURCE[primary]: https://www.census.gov/retail/release_schedule.html
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/2026-November.htm
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/news_release/ximpim.htm
 */
export const USA_I_FOKUS_15_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-15-november-2026",
  slug: "usa-i-fokus-15-november-2026-veckan-nvidia-detaljhandel-fed",
  title: "Veckan som kommer: Nvidia rapporterar – detaljhandel och Fed-protokoll i fokus",
  summary:
    "Nvidia rapporterar på tisdag efter vd-skiftet. Samma dag publiceras amerikansk detaljhandelsförsäljning och importpriser, medan Fed-protokollet följer på onsdag.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-15T13:59:14+01:00",
  url: "/news/usa-i-fokus-15-november-2026-veckan-nvidia-detaljhandel-fed",
  featured: true,
  readingMinutes: 6,
  seoTitle: "Wall Street veckan: Nvidia, detaljhandel och Fed-protokoll",
  seoDescription:
    "Veckan som kommer på Wall Street: Nvidia rapporterar på tisdag, USA släpper detaljhandelsdata och importpriser och Fed publicerar protokoll på onsdag.",
  seoKeywords: [
    "Wall Street veckan",
    "USA-börsen veckan",
    "Nvidia rapport november 2026",
    "USA detaljhandel oktober 2026",
    "Fed protokoll november 2026",
    "importpriser USA",
    "Walmart rapport",
    "Target rapport"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Veckan som kommer",
      "Wall Street",
      "Nasdaq",
      "artificiell intelligens",
      "detaljhandel",
      "konsumtion",
      "inflation",
      "Federal Reserve",
      "räntor"
    ],
    companies: ["Nvidia", "Walmart", "Target", "Home Depot", "Lowe's"],
    tickers: ["NVDA", "WMT", "TGT", "HD", "LOW"],
    relatedNewsSlugs: [
      "usa-i-fokus-14-november-2026-veckan-wall-street-nvidia-inflation",
      "usa-i-fokus-13-november-2026-nvidia-cisco-applied-materials",
      "usa-i-fokus-12-november-2026-nasdaq-brookfield-nvidia",
      "usa-i-fokus-11-november-2026-coreweave-inflation-nasdaq"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Den amerikanska kontantmarknaden är stängd på söndagen. Nästa vecka öppnar med ett ovanligt koncentrerat test av AI-sektorn, hushållens efterfrågan och ränteläget.",
    "Nvidia publicerar sitt tredje kvartal på tisdag efter vd-skiftet från Jensen Huang till tillförordnade vd:n Colette Kress. Tidigare samma dag kommer amerikansk detaljhandelsförsäljning och import- och exportpriser för oktober.",
    "På onsdag publicerar Federal Reserve protokollet från mötet den 27–28 oktober. Tillsammans med rapporter från Walmart, Target, Home Depot och Lowe's ger veckan nya datapunkter för både teknikvärderingar och konsumentstyrka."
  ],
  sections: [
    {
      heading: "Nvidia blir veckans största enskilda test",
      paragraphs: [
        "Nvidia offentliggör resultatet för tredje kvartalet i räkenskapsåret 2027 tisdagen den 17 november omkring klockan 13.20 Stillahavstid, motsvarande 22.20 i Stockholm. Konferenssamtalet börjar klockan 14.00 Stillahavstid, motsvarande 23.00 i Stockholm.",
        "Kvartalet avslutades den 25 oktober. Bolaget uppger att skriftliga kommentarer från Colette Kress publiceras direkt efter resultatet och före konferenssamtalet.",
        "Efter förra veckans vd-skifte blir rapporten både ett finansiellt och ett operativt test. Omsättning, resultat, datacenterutveckling och framtidsutsikter blir centrala, men inga rapportutfall eller kursreaktioner föregrips."
      ]
    },
    {
      heading: "Detaljhandelsförsäljningen mäter konsumentens styrka",
      paragraphs: [
        "U.S. Census Bureau publicerar den preliminära detaljhandelsförsäljningen för oktober tisdagen den 17 november klockan 08.30 amerikansk östkusttid, motsvarande 14.30 i Stockholm.",
        "Statistiken kommer efter en vecka där producentpriserna steg 6,5 procent i årstakt. Det gör fördelningen mellan nominell försäljning, prisökningar och faktisk efterfrågan viktigare än en enda totalsiffra.",
        "Reuters pekar samtidigt ut Walmart, Target, Home Depot och Lowe's som större rapportbolag under veckan. Deras försäljning, marginaler, lager och prognoser kan ge bolagsspecifik information om hushållens köpvilja inför helghandeln."
      ]
    },
    {
      heading: "Importpriserna kompletterar inflationsbilden",
      paragraphs: [
        "Bureau of Labor Statistics publicerar import- och exportprisindex för oktober på tisdag klockan 08.30 amerikansk östkusttid, samma tid som detaljhandelsförsäljningen.",
        "Importpriserna steg 1,1 procent i september och 8,1 procent jämfört med ett år tidigare. Exportpriserna steg 2,2 procent under månaden och 11,6 procent på ett år.",
        "Oktoberutfallet får visa om trycket från varor som förs in i USA fortsatte. Resultatet ligger efter artikelns cutoff och beskrivs därför endast som en kommande, verifierad datapunkt."
      ]
    },
    {
      heading: "Fed-protokollet kommer på onsdag",
      paragraphs: [
        "Federal Reserve publicerar protokollet från mötet den 27–28 oktober onsdagen den 18 november klockan 14.00 amerikansk östkusttid, motsvarande 20.00 i Stockholm.",
        "Protokollet är inte ett nytt räntebesked. Det ger däremot mer information om diskussionen bakom mötet och vilka risker ledamöterna vägde mot varandra.",
        "Efter oktoberutfallen för konsument- och producentpriser blir formuleringar om inflation, arbetsmarknad och fortsatt åtstramning särskilt relevanta. Slutsatser ska dras först när protokollet är publicerat."
      ]
    },
    {
      heading: "Så läser vi veckan",
      paragraphs: [
        "Tisdagen ger veckans tätaste informationspaket: detaljhandelsförsäljning och importpriser före öppning, följt av Nvidias rapport efter stängning. Därmed möts makrofrågan om köpkraft och inflationspress med bolagsfrågan om AI-investeringarnas styrka.",
        "Onsdagens Fed-protokoll kan därefter förändra marknadens tolkning av ränteläget. Detaljhandelsbolagens rapporter visar samtidigt om högre priser och finansieringskostnader påverkar försäljning, lager och marginaler.",
        "Den viktiga redaktionella ordningen blir att först verifiera varje utfall mot primärkällan och därefter beskriva marknadsreaktionen med färsk data. Söndagens plan föregriper varken siffror, guidning eller kursrörelser."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters: veckans amerikanska marknadskatalysatorer med Nvidia-rapport, detaljhandelsförsäljning, Fed-protokoll och rapporter från Walmart, Target, Home Depot och Lowe's",
      href: "https://www.reuters.com/business/wall-st-week-ahead-nvidia-results-anthropic-ipo-pose-tests-tumultuous-ai-trade-2026-11-13/"
    },
    {
      text: "Nvidia Newsroom: officiell tidplan för Q3-resultatet i räkenskapsåret 2027 den 17 november 2026 och efterföljande konferenssamtal",
      href: "https://nvidianews.nvidia.com/news/nvidia-sets-conference-call-for-third-quarter-financial-results-6928873"
    },
    {
      text: "U.S. Census Bureau: officiell publiceringskalender för preliminär detaljhandelsförsäljning avseende oktober 2026 den 17 november klockan 08.30 ET",
      href: "https://www.census.gov/retail/release_schedule.html"
    },
    {
      text: "Federal Reserve: officiell novemberkalender med FOMC-protokoll från mötet den 27–28 oktober, publicering den 18 november 2026 klockan 14.00 ET",
      href: "https://www.federalreserve.gov/newsevents/2026-November.htm"
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiell publiceringskalender för import- och exportprisindex avseende oktober 2026 den 17 november klockan 08.30 ET",
      href: "https://www.bls.gov/schedule/news_release/ximpim.htm"
    }
  ]
};
