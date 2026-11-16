import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 16 november 2026.
 * Editorial research cutoff: 2026-11-16T14:13:02+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/commentary/reuters-open-interest/global-markets-view-usa-2026-11-16/
 * P0_SOURCE[primary]: https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-CEO-Transition/default.aspx
 * P0_SOURCE[primary]: https://www.newyorkfed.org/research/calendars/i-nov26.html
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents.htm
 */
export const USA_I_FOKUS_16_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-16-november-2026",
  slug: "usa-i-fokus-16-november-2026-teknikpress-nvidia-fed",
  title: "USA i fokus 16 november: Teknikpress inför Nvidia – Fed och New York-data väntar",
  summary:
    "Tekniksektorn går in i veckan under press inför Nvidias rapport efter det oväntade vd-skiftet. Före Wall Streets öppning väntar Empire State-index, medan Fed-chefen Kevin Warsh talar senare i dag.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-16T14:13:07+01:00",
  url: "/news/usa-i-fokus-16-november-2026-teknikpress-nvidia-fed",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-16.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-16.png",
  imageAlt: "USA i fokus 2026-11-16 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 5,
  seoTitle: "USA-börsen idag: Teknikpress inför Nvidia och Fed-tal",
  seoDescription:
    "USA-börsen inför öppning 16 november: tekniksektorn pressas inför Nvidias rapport. Empire State-index och Fed-chefen Kevin Warsh står på dagens agenda.",
  seoKeywords: [
    "USA-börsen idag",
    "Wall Street idag",
    "Nasdaq terminer",
    "Nvidia rapport 2026",
    "Nvidia vd",
    "Empire State index",
    "Kevin Warsh tal",
    "Federal Reserve"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Wall Street",
      "Nasdaq",
      "artificiell intelligens",
      "halvledare",
      "Federal Reserve",
      "amerikansk industri",
      "räntor"
    ],
    companies: ["Nvidia", "Dell", "HP", "Super Micro Computer"],
    tickers: ["NVDA", "DELL", "HPE", "SMCI"],
    relatedNewsSlugs: [
      "usa-i-fokus-15-november-2026-veckan-nvidia-detaljhandel-fed",
      "usa-i-fokus-14-november-2026-veckan-wall-street-nvidia-inflation",
      "usa-i-fokus-13-november-2026-nvidia-cisco-applied-materials",
      "usa-i-fokus-12-november-2026-nasdaq-brookfield-nvidia"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går in i måndagen med tydlig press på teknik och AI-relaterade aktier. Reuters beskriver fallande terminer för S&P 500 och Nasdaq 100 inför öppningen, medan Nvidias aktie handlades lägre i förhandeln.",
    "Det som förändrats sedan fredagens stängning är framför allt att marknaden nu prissätter en ny handelsvecka där Nvidias rapport kommer samtidigt som bolaget söker en permanent efterträdare till Jensen Huang. Teknikfrågan handlar därför både om efterfrågan och om ledarskap.",
    "Före öppningen väntar New York Feds Empire State Manufacturing Survey. Senare under dagen talar Fed-chefen Kevin Warsh, men båda händelserna ligger efter artikelns cutoff och några utfall föregrips inte."
  ],
  sections: [
    {
      heading: "Teknikaktier sätter tonen före öppningen",
      paragraphs: [
        "Reuters marknadsöversikt visar att trycket är koncentrerat till tekniksektorn inför måndagens handel. S&P 500- och Nasdaq 100-terminerna pekade nedåt, medan Dow-terminen låg svagt högre i den senaste uppdateringen.",
        "Nvidia, Dell, HP och Super Micro Computer hörde till de teknikaktier som handlades lägre före öppningen. Rörelserna ger en aktuell temperaturmätare, men förhandelskurser kan ändras snabbt och ska inte läsas som ett slutligt dagsutfall.",
        "Fredagens breda indexbild var mer motståndskraftig än tekniksegmentet. Måndagens uppställning testar därför om pressen förblir koncentrerad eller sprids när kontantmarknaden öppnar."
      ]
    },
    {
      heading: "Nvidias rapport blir nästa stora svar",
      paragraphs: [
        "Nvidia publicerar resultatet för tredje kvartalet i räkenskapsåret 2027 tisdagen den 17 november omkring klockan 13.20 Stillahavstid, motsvarande 22.20 i Stockholm. Konferenssamtalet börjar klockan 14.00 Stillahavstid.",
        "Rapporten kommer fem dagar efter bolagets besked att Jensen Huang lämnat posten som vd, koncernchef och styrelseledamot med omedelbar verkan. Finanschefen Colette Kress är tillförordnad vd medan styrelsen söker en permanent efterträdare.",
        "Det gör rapporten till ett dubbelt test. Marknaden får nya siffror om verksamheten och en första formell möjlighet att bedöma hur ledningen kommunicerar om kontinuitet, kundåtaganden och framtida prioriteringar. Resultat och kursreaktion ligger efter cutoff och föregrips inte."
      ]
    },
    {
      heading: "Empire State-index kommer före börsöppningen",
      paragraphs: [
        "New York Feds kalender visar att Empire State Manufacturing Survey för november publiceras klockan 08.30 amerikansk östkusttid, motsvarande 14.30 i Stockholm.",
        "Indexet är en regional temperaturmätare för tillverkningsindustrin. Det kan ge en tidig signal om orderingång, produktion och sysselsättning, men bör inte ensamt tolkas som ett fullständigt mått på hela USA:s industrisektor.",
        "Publiceringen sker efter artikelns research-cutoff. Därför innehåller artikeln varken ett indexutfall eller någon påstådd marknadsreaktion."
      ]
    },
    {
      heading: "Fed-tal senare i dag – protokoll på onsdag",
      paragraphs: [
        "Federal Reserves kalender visar att ordförande Kevin Warsh talar klockan 12.00 amerikansk östkusttid, motsvarande 18.00 i Stockholm. Talet ligger senare under dagen och behandlas här enbart som en verifierad kommande händelse.",
        "Ränteläget har blivit mer känsligt efter förra veckans inflationsdata. Marknaden kommer därför att väga eventuella kommentarer om inflation, produktivitet och penningpolitik mot onsdagens protokoll från FOMC-mötet den 27–28 oktober.",
        "Dagens ordning är tydlig: först Empire State-index före öppning, därefter den faktiska handeln och senare Warshs tal. Nvidias rapport följer efter tisdagens stängning. Varje utfall behöver verifieras separat innan slutsatser dras."
      ]
    },
    {
      heading: "Vad följer vi efter cutoff?",
      paragraphs: [
        "Den första kontrollpunkten är om teknikpressen i förhandeln består när Wall Street öppnar. Den andra är novemberutfallet i Empire State-index och hur räntemarknaden reagerar på ny information.",
        "Därefter flyttas fokus till Warshs tal och tisdagens tätare paket med detaljhandelsförsäljning, importpriser och Nvidias rapport. Söndagens öppna fråga om AI-efterfrågan har ännu inte fått ett rapporterat svar.",
        "Måndagens artikel uppdaterar därför marknadsläget utan att återupprepa hela veckokalendern: den nya nyheten är den konkreta teknikpressen inför öppningen och att Nvidias ledarskapsfråga nu möter ett nära förestående resultatprov."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters: marknadsöversikt den 16 november 2026 om teknikpressen inför Wall Streets öppning, Nvidias rapport och veckans centrala USA-katalysatorer",
      href: "https://www.reuters.com/commentary/reuters-open-interest/global-markets-view-usa-2026-11-16/"
    },
    {
      text: "Nvidia Investor Relations: officiellt besked den 12 november 2026 om Jensen Huangs avgång, Colette Kress som tillförordnad vd och rapporttid den 17 november",
      href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-CEO-Transition/default.aspx"
    },
    {
      text: "Federal Reserve Bank of New York: officiell novemberkalender med Empire State Manufacturing Survey den 16 november 2026 klockan 08.30 ET",
      href: "https://www.newyorkfed.org/research/calendars/i-nov26.html"
    },
    {
      text: "Federal Reserve Board: officiell dagskalender den 16 november 2026 med ordförande Kevin Warshs tal klockan 12.00 ET",
      href: "https://www.federalreserve.gov/newsevents.htm"
    }
  ]
};
