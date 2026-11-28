import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 28 november 2026.
 * Editorial research cutoff: 2026-11-28T13:57:19+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.census.gov/econ/indicators/current/index.html
 * P0_SOURCE[primary]: https://investor.salesforce.com/news/news-details/2026/Salesforce-Announces-Date-of-Third-Quarter-Fiscal-2027-Earnings-Release-and-Webcast/default.aspx
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/12_sched_list.htm
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/2026-december.htm
 * P0_SOURCE[secondary]: https://apnews.com/article/wall-street-stocks-dow-nasdaq-04dab6079cf7f3dfe7285a3cc1f240a2
 * P0_SOURCE[secondary]: https://www.marketscreener.com/news/wall-street-ends-higher-as-battered-ai-stocks-gain-in-volatile-week-ce7851d9d189f520
 */
export const USA_I_FOKUS_28_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-28-november-2026",
  slug: "usa-i-fokus-28-november-2026-veckan-nasdaq-ai-handelsunderskott",
  title: "USA i fokus: Veckan som gått – Nasdaq steg 6,7 procent när AI-aktier återhämtades",
  summary:
    "Nasdaq steg 6,7 procent och S&P 500 5,6 procent under en volatil Thanksgiving-vecka. Fredagens AI-ledda uppgång gav Wall Street den starkaste veckan på mer än ett år, samtidigt som USA:s varuhandelsunderskott växte till 149,5 miljarder dollar.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-28T13:57:20+01:00",
  url: "/news/usa-i-fokus-28-november-2026-veckan-nasdaq-ai-handelsunderskott",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-28.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-28.png",
  imageAlt: "USA i fokus 2026-11-28 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 6,
  seoTitle: "Wall Street veckan: Nasdaq upp 6,7 procent efter AI-rekyl",
  seoDescription:
    "USA i fokus 28 november: Nasdaq steg 6,7 procent, S&P 500 5,6 procent och varuhandelsunderskottet växte till 149,5 miljarder dollar.",
  seoKeywords: [
    "Wall Street veckan",
    "Nasdaq veckan",
    "S&P 500 veckan",
    "AI aktier USA",
    "Anthropic aktie",
    "Nvidia aktie",
    "USA handelsunderskott oktober 2026",
    "USA jobbrapport december 2026"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Veckan som gått",
      "Wall Street",
      "Nasdaq",
      "S&P 500",
      "AI-aktier",
      "varuhandel",
      "arbetsmarknad",
      "Federal Reserve"
    ],
    companies: ["Nvidia", "Anthropic", "Salesforce"],
    tickers: ["NVDA", "ANT", "CRM"],
    relatedNewsSlugs: [
      "usa-i-fokus-27-november-2026-nasdaq-olja-black-friday",
      "usa-i-fokus-26-november-2026-pce-bnp-thanksgiving",
      "usa-i-fokus-25-november-2026-ai-press-dell-pce"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Wall Street avslutade den korta Thanksgiving-veckan med en tydlig teknikledd uppgång. Nasdaq Composite steg 2,3 procent på fredagen och 6,7 procent under veckan, medan S&P 500 ökade 1,6 procent på fredagen och 5,6 procent för veckan.",
    "Därmed fick gårdagens viktigaste öppna fråga ett verifierat svar: teknikuppgången höll genom den förkortade sessionen. Anthropic steg omkring 11 procent och Nvidia 0,8 procent på fredagen, medan flera chip- och infrastrukturbolag återhämtade mark efter veckans kraftiga svängningar.",
    "USA:s kontantmarknad är stängd i dag, lördag. Artikeln sammanfattar därför den senaste avslutade sessionen och blickar fram mot nästa veckas jobbdata och bolagsrapporter utan att föregripa några utfall."
  ],
  sections: [
    {
      heading: "Nasdaq leder Wall Streets starkaste vecka på mer än ett år",
      paragraphs: [
        "S&P 500 stängde på 7 297,49 efter fredagens uppgång på 1,6 procent. Dow Jones steg 1,2 procent till 50 774,94 och Nasdaq Composite 2,3 procent till 24 129,50.",
        "För hela veckan ökade S&P 500 med 5,6 procent, Dow Jones med 5,5 procent, Nasdaq med 6,7 procent och Russell 2000 med 6,5 procent. Enligt AP var det S&P 500:s största veckouppgång sedan april 2025.",
        "Uppgången kom efter stora rörelser åt båda håll under måndag–onsdag och en stängd marknad på Thanksgiving. Veckosiffrorna visar en bred återhämtning, men den korta handelsveckan gör att nästa fulla vecka blir ett viktigare test av uthålligheten."
      ]
    },
    {
      heading: "AI-aktierna återhämtar sig – men skillnaderna är stora",
      paragraphs: [
        "Anthropic steg omkring 11 procent på fredagen och stängde nästan 9 dollar över introduktionskursen. Nvidia ökade mer försiktigt med 0,8 procent.",
        "Micron och Marvell steg båda mer än 7 procent, Sandisk nästan 16 procent och Tesla 5 procent enligt Reuters. Uppgången var alltså bred inom teknik, men de största rörelserna kom i bolag som pressats hårt tidigare under veckan.",
        "Det besvarar gårdagens fråga om den teknikledda terminsuppgången skulle hålla till stängning. Svaret är ja för fredagen, men veckans stora svängningar visar samtidigt att värdering, reglering och ränteläge fortfarande kan flytta AI-handeln snabbt."
      ]
    },
    {
      heading: "Handelsunderskottet växer till 149,5 miljarder dollar",
      paragraphs: [
        "USA:s preliminära underskott i varuhandeln ökade till 149,5 miljarder dollar i oktober från 135,1 miljarder i september. Försämringen var 14,4 miljarder dollar.",
        "Varuexporten ökade med 6,7 miljarder till 215,8 miljarder dollar, medan importen steg med 21,1 miljarder till 365,3 miljarder. Importökningen var därmed betydligt större än exportökningen.",
        "Grossistlagren uppskattades till 1 023,4 miljarder dollar, upp 0,9 procent från september, och detaljhandelslagren till 893,2 miljarder, upp 0,8 procent. Siffrorna ger ett verifierat svar på den statistikpunkt som ännu låg efter fredagens redaktionella cutoff."
      ]
    },
    {
      heading: "Stark tillväxt möter fortsatt högt pristryck",
      paragraphs: [
        "Veckans bredare makrobild var redan före fredagens statistik ovanligt tydlig: PCE-inflationen steg till 3,8 procent i oktober och kärn-PCE till 3,3 procent, samtidigt som tredje kvartalets BNP-tillväxt reviderades upp till 4,3 procent i årstakt.",
        "Fredagens marknadsuppgång visar att investerare för stunden prioriterade återhämtningen i nedpressade teknikaktier. Den ändrar däremot inte att kombinationen av stark aktivitet och hög inflation är central för Federal Reserves kommande beslut.",
        "Fed håller nästa penningpolitiska möte den 8–9 december och lämnar besked klockan 14.00 amerikansk östkusttid den 9 december. Något beslut eller någon räntereaktion föregrips inte."
      ]
    },
    {
      heading: "Nästa vecka: jobbdata och Salesforce",
      paragraphs: [
        "BLS publicerar JOLTS-statistik för oktober tisdagen den 1 december klockan 10.00 amerikansk östkusttid. Fredagen den 4 december klockan 08.30 kommer Employment Situation för november.",
        "Jobbrapporten blir nästa stora makrotest eftersom arbetsmarknadens styrka påverkar både tillväxtbilden och förväntningarna inför Fed-mötet veckan därpå.",
        "På rapportsidan publicerar Salesforce resultat för tredje kvartalet i räkenskapsåret 2027 efter stängning onsdagen den 2 december. Bolagets genomgång börjar klockan 17.00 ET. Omsättning, marginaler, kassaflöde och utsikter blir relevanta kontrollpunkter för den bredare AI- och mjukvaruhandeln; inget rapportutfall föregrips."
      ]
    }
  ],
  sources: [
    {
      text: "U.S. Census Bureau: officiell Advance Economic Indicators-rapport för oktober 2026 med varuhandel samt grossist- och detaljhandelslager",
      href: "https://www.census.gov/econ/indicators/current/index.html"
    },
    {
      text: "Salesforce Investor Relations: officiellt besked om Q3-resultat efter stängning den 2 december 2026 och genomgång klockan 17.00 ET",
      href: "https://investor.salesforce.com/news/news-details/2026/Salesforce-Announces-Date-of-Third-Quarter-Fiscal-2027-Earnings-Release-and-Webcast/default.aspx"
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiell decemberkalender med JOLTS den 1 december och Employment Situation den 4 december 2026",
      href: "https://www.bls.gov/schedule/2026/12_sched_list.htm"
    },
    {
      text: "Federal Reserve: officiell decemberkalender med FOMC-möte den 8–9 december och räntebesked den 9 december 2026",
      href: "https://www.federalreserve.gov/newsevents/2026-december.htm"
    },
    {
      text: "Associated Press: verifierade stängningsnivåer och veckoförändringar för S&P 500, Dow Jones, Nasdaq och Russell 2000 den 27 november 2026",
      href: "https://apnews.com/article/wall-street-stocks-dow-nasdaq-04dab6079cf7f3dfe7285a3cc1f240a2"
    },
    {
      text: "Reuters via MarketScreener: fredagens verifierade AI- och teknikreaktioner för Anthropic, Nvidia, Micron, Marvell, Sandisk och Tesla",
      href: "https://www.marketscreener.com/news/wall-street-ends-higher-as-battered-ai-stocks-gain-in-volatile-week-ce7851d9d189f520"
    }
  ]
};
