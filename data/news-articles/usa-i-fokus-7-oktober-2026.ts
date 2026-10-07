import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus, 7 oktober 2026.
 * Editorial research cutoff: 2026-10-07T14:00:26+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.federalreserve.gov/monetarypolicy.htm
 * P0_SOURCE[primary]: https://ir.cbrands.com/sec-filings/all-sec-filings/content/0000016918-26-000039/stzex991_83120268kearnings.htm
 * P0_SOURCE[primary]: https://investors.levistrauss.com/news/financial-news/news-details/2026/Levi-Strauss--Co--to-Webcast-Third-Quarter-2026-Earnings-Conference-Call/default.aspx
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-slip-yields-oil-rebound-fed-minutes-focus-2026-10-07/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/fed-minutes-could-detail-rate-hike-decision-policy-path-2026-10-07/
 */
export const USA_I_FOKUS_7_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-7-oktober-2026-fed-protokoll-olja-constellation-brands",
  slug: "usa-i-fokus-7-oktober-2026-fed-protokoll-olja-constellation-brands",
  title: "USA i fokus 7 oktober: Fed-protokoll och olja pressar Wall Street",
  summary:
    "USA-terminerna backar när långräntor och oljepris stiger inför kvällens Fed-protokoll. Constellation Brands faller efter rapporten, medan Levi Strauss rapporterar efter stängning.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-07T14:00:35+02:00",
  url: "/news/usa-i-fokus-7-oktober-2026-fed-protokoll-olja-constellation-brands",
  featured: true,
  imageAlt:
    "USA i fokus 7 oktober 2026 – Wall Street inför Fed-protokoll med stigande räntor och oljepris.",
  readingMinutes: 5,
  seoTitle: "USA i fokus 7 oktober: Fed-protokoll pressar Wall Street",
  seoDescription:
    "Wall Street idag: USA-terminerna backar när räntor och olja stiger. Fed-protokoll, Constellation Brands och Levi Strauss står i fokus.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "USA börsen 7 oktober 2026",
    "Fed protokoll oktober 2026",
    "amerikanska räntor",
    "oljepris idag",
    "Constellation Brands rapport",
    "Levi Strauss rapport",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "Federal Reserve",
      "FOMC-protokoll",
      "amerikanska räntor",
      "olja",
      "rapportsäsong",
      "konsumentbolag",
    ],
    companies: ["Constellation Brands", "Micron Technology", "Levi Strauss"],
    tickers: ["STZ", "MU", "LEVI"],
    relatedNewsSlugs: [
      "usa-i-fokus-4-oktober-2026-veckan-som-kommer-fed-protokoll-delta",
      "usa-i-fokus-3-oktober-2026-veckan-som-gatt-jobbrapport-nasdaq",
      "usa-i-fokus-30-september-2026-pce-boeing-micron",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en försiktig öppning efter tisdagens rekordstängningar för S&P 500 och Nasdaq. Vid DivLabs research-cutoff var terminerna ned samtidigt som både amerikanska långräntor och Brentoljan hade vänt upp igen.",
    "Dagens huvudnummer kommer först klockan 20.00 svensk tid, när Federal Reserve publicerar protokollet från septembermötet. Före öppningen står Constellation Brands rapport och svagare chipaktier för de tydligaste bolagssignalerna.",
  ],
  sections: [
    {
      heading: "Gårdagens lättnad har vänt",
      paragraphs: [
        "Klockan 06.02 amerikansk östkusttid var Dow-terminen ned 0,34 procent, S&P 500-terminen ned 0,14 procent och Nasdaq 100-terminen ned 0,41 procent, enligt Reuters. Det är en förhandsbild och inte ett färdigt börsutfall.",
        "Den amerikanska 30-årsräntan steg till 5,70 procent, den högsta nivån sedan 2002. Brentoljan handlades samtidigt åter över 100 dollar per fat när marknaden vägde fortsatta risker för utbudet i Mellanöstern.",
        "Det ger ett tydligt svar på gårdagens öppna fråga: nedgången i räntor och olja höll inte i sig. Trots det nådde både S&P 500 och Nasdaq nya rekordstängningar på tisdagen, vilket visar att AI- och vinstoptimismen fortfarande ger stöd.",
      ],
    },
    {
      heading: "Fed-protokollet kan visa hur enigt beslutet var",
      paragraphs: [
        "Federal Reserve publicerar protokollet från mötet den 15–16 september klockan 14.00 östkusttid, motsvarande 20.00 svensk tid. Något innehåll eller någon marknadsreaktion finns inte i artikeln eftersom publiceringen sker efter cutoff.",
        "Vid septembermötet höjde Fed styrräntan med 0,25 procentenheter till intervallet 3,75–4,00 procent. Reuters beskriver beslutet som enhälligt, men protokollet väntas ge mer information om hur ledamöterna såg på fortsatta höjningar.",
        "Sedan mötet har både inflation och jobbtillväxt kommit in svagare än väntat. Marknaden prissatte före cutoff en sannolikhet på 78 procent för oförändrad ränta vid oktobermötet, enligt CME-data återgiven av Reuters.",
      ],
    },
    {
      heading: "Constellation Brands växer men aktien faller",
      paragraphs: [
        "Constellation Brands redovisade en nettoomsättning på 2,633 miljarder dollar för sitt andra räkenskapskvartal 2027, en ökning med 6 procent. Justerad vinst per aktie var 3,74 dollar, upp 3 procent.",
        "Ölförsäljningen ökade 5 procent och rörelseresultatet i ölverksamheten steg 1 procent. Vin- och spritverksamhetens försäljning ökade 17 procent. Bolaget uppdaterade sin prognos för redovisad vinst per aktie till 11,85–12,55 dollar och upprepade intervallet 11,20–11,90 dollar för justerad vinst per aktie.",
        "Aktien var ned 4,5 procent i förhandeln enligt Reuters. Rörelsen kan förändras efter öppningen och ska inte behandlas som dagens slutkurs.",
      ],
    },
    {
      heading: "Chipaktier tappar inför öppningen",
      paragraphs: [
        "Micron Technology föll 2,2 procent i förhandeln. Rörelsen kom i ett läge där stigande långräntor åter pressade tekniksektorns värderingar efter tisdagens AI-drivna rekordstängning.",
        "Den bredare rapportsäsongen startar nästa vecka. Reuters sammanställning av LSEG-prognoser pekar på en väntad vinstökning på 30,6 procent för S&P 500-bolagen under tredje kvartalet, men detta är en prognos och inget rapporterat utfall.",
        "För tekniksektorn blir det avgörande om faktiska vinster och investeringsplaner kan motivera de höga värderingarna när ränteläget samtidigt har stramats åt.",
      ],
    },
    {
      heading: "Levi Strauss rapporterar efter stängning",
      paragraphs: [
        "Levi Strauss håller sin rapportkonferens för tredje kvartalet klockan 17.00 östkusttid, motsvarande 23.00 svensk tid. Kvartalet avslutades den 30 augusti.",
        "Rapportutfall, guidning och kursreaktion ligger efter artikelns cutoff och får därför inte föregripas. För investerare blir försäljning, marginal och efterfrågan i Nordamerika naturliga kontrollpunkter när siffrorna väl har publicerats.",
        "Dagens ordning är därmed tydlig: först Wall Streets öppning, därefter Fed-protokollet klockan 20.00 och sist Levi Strauss efter stängning.",
      ],
    },
  ],
  sources: [
    {
      text:
        "Federal Reserve: officiell penningpolitisk kalender med FOMC-protokollet den 7 oktober 2026",
      href: "https://www.federalreserve.gov/monetarypolicy.htm",
    },
    {
      text:
        "Constellation Brands: officiell Q2-rapport för räkenskapsåret 2027 med omsättning, resultat, segment och prognoser",
      href: "https://ir.cbrands.com/sec-filings/all-sec-filings/content/0000016918-26-000039/stzex991_83120268kearnings.htm",
    },
    {
      text:
        "Levi Strauss Investor Relations: rapportkonferens för tredje kvartalet 2026 den 7 oktober klockan 17.00 ET",
      href: "https://investors.levistrauss.com/news/financial-news/news-details/2026/Levi-Strauss--Co--to-Webcast-Third-Quarter-2026-Earnings-Conference-Call/default.aspx",
    },
    {
      text:
        "Reuters: USA-terminer, rekordstängningar, obligationsränta, oljepris och bolagsrörelser före öppningen den 7 oktober",
      href: "https://www.reuters.com/business/wall-st-futures-slip-yields-oil-rebound-fed-minutes-focus-2026-10-07/",
    },
    {
      text:
        "Reuters: bakgrund inför FOMC-protokollet, septemberbeslutet och marknadens ränteförväntningar",
      href: "https://www.reuters.com/business/fed-minutes-could-detail-rate-hike-decision-policy-path-2026-10-07/",
    },
  ],
};
