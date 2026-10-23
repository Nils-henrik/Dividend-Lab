import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 23 oktober 2026.
 * Editorial research cutoff: 2026-10-23T13:57:23+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://ir.americanexpress.com/events/event-details/2026/Q3-2026-American-Express-Earnings-Conference-Call/default.aspx
 * P0_SOURCE[primary]: https://investorcenter.slb.com/
 * P0_SOURCE[primary]: https://www.pmi.spglobal.com/Public/Release/ReleaseDates
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-street-futures-dip-after-ai-rout-telecoms-slide-2026-10-23/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/american-express-raises-2026-profit-forecast-affluent-customers-keep-spending-2026-10-23/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/energy/top-oilfield-services-firm-slb-beats-quarterly-profit-estimates-2026-10-23/
 */
export const USA_I_FOKUS_23_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-23-oktober-2026-american-express-slb-pmi",
  slug: "usa-i-fokus-23-oktober-2026-american-express-slb-pmi",
  title: "USA i fokus 23 oktober: Wall Street backar – Amex höjer prognosen",
  summary:
    "USA-terminerna pekar svagt ned efter torsdagens teknikfall. American Express höjer vinstprognosen, SLB slår vinstförväntningarna och oljepriset ligger nära femmånadershögsta.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-23T13:57:23+02:00",
  url: "/news/usa-i-fokus-23-oktober-2026-american-express-slb-pmi",
  featured: true,
  readingMinutes: 4,
  seoTitle: "USA i fokus: Amex höjer prognosen – Wall Street backar",
  seoDescription:
    "Wall Street idag: USA-terminerna sjunker svagt. American Express höjer prognosen, SLB slår förväntningarna och USA:s PMI väntar.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "S&P 500 terminer",
    "Nasdaq terminer",
    "USA börsen 23 oktober 2026",
    "American Express rapport",
    "SLB rapport",
    "USA PMI",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "S&P 500",
      "Nasdaq",
      "rapportperiod",
      "konsument",
      "energi",
      "USA PMI",
    ],
    companies: ["American Express", "SLB", "Meta Platforms"],
    tickers: ["AXP", "SLB", "META"],
    relatedNewsSlugs: [
      "usa-i-fokus-22-oktober-2026-nasdaq-tesla-ibm-olja",
      "usa-i-fokus-21-oktober-2026-netflix-att-tesla-ibm",
      "usa-i-fokus-20-oktober-2026-gm-halliburton-3m-netflix",
      "bolaget-i-fokus-intrum-23-oktober-2026",
      "borssverige-23-oktober-2026",
      "norden-i-centrum-23-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en försiktigt svagare öppning efter torsdagens tydliga teknikfall. Vid Reuters senaste verifierade mätpunkt var Dow-terminen ned 0,59 procent, S&P 500-terminen ned 0,25 procent och Nasdaq 100-terminen ned 0,12 procent.",
    "Gårdagens fråga om teknikpressen har fått ett tydligt men inte slutgiltigt svar: Nasdaq föll nära 3 procent och Meta backade nära 8 procent. På fredagen breddas fokus till American Express, SLB och eftermiddagens preliminära USA-PMI.",
  ],
  sections: [
    {
      heading: "American Express höjer årets vinstprognos",
      paragraphs: [
        "American Express ökade intäkterna med 9 procent till 20,1 miljarder dollar i tredje kvartalet. Kortmedlemmarnas fakturerade köp, billed business, steg 8 procent till 454 miljarder dollar.",
        "Den justerade vinsten per aktie ökade till 4,68 dollar från 4,14 dollar ett år tidigare. Kreditförlustreserveringarna minskade samtidigt till 1,0 miljard dollar från 1,3 miljarder.",
        "Bolaget höjde prognosen för helårsvinsten till 18,30–18,60 dollar per aktie från tidigare 17,30–17,90 dollar. Aktien steg 0,8 procent i Reuters senaste premarketbild.",
      ],
    },
    {
      heading: "SLB slår förväntningarna när Nordamerika växer",
      paragraphs: [
        "SLB redovisade en omsättning på 9,45 miljarder dollar. Den justerade vinsten per aktie blev 0,64 dollar, jämfört med marknadens sammanvägda förväntan på 0,62 dollar enligt LSEG-data som Reuters återger.",
        "Bolagets officiella rapportöversikt visar en GAAP-vinst per aktie på 0,49 dollar, justerad EBITDA på 2,07 miljarder dollar och ett fritt kassaflöde på 828 miljoner dollar.",
        "Nordamerikanska intäkter ökade 24 procent till 2,40 miljarder dollar. Intäkterna i Mellanöstern och Asien minskade däremot till 2,81 miljarder dollar från 3,0 miljarder ett år tidigare.",
      ],
    },
    {
      heading: "Teknikfallet lämnar en försiktig fredagsbörs",
      paragraphs: [
        "Nasdaq föll nära 3 procent på torsdagen när investerare fortsatte att väga kostnader och finansieringsbehov för AI-satsningar mot framtida avkastning. Meta föll nära 8 procent efter rapporten.",
        "Fredagens terminsnedgång är betydligt mindre än torsdagens kontantmarknadsrörelse. Det visar ett lugnare utgångsläge, men är ingen garanti för hur den ordinarie handeln slutar.",
        "Brentoljan handlas samtidigt nära den högsta nivån på mer än fem månader. Det håller energipriser och inflationsrisk i fokus inför Federal Reserves penningpolitiska möte nästa vecka.",
      ],
    },
    {
      heading: "PMI blir eftermiddagens nästa kontrollpunkt",
      paragraphs: [
        "S&P Global publicerar preliminära amerikanska inköpschefsindex för oktober klockan 13.45 UTC, motsvarande 15.45 svensk tid. Publiceringen sker efter artikelns research-cutoff.",
        "PMI ger en färsk bild av aktivitet inom tillverkningsindustrin och tjänstesektorn. DivLabs redaktionella bedömning är att kombinationen av tillväxtsignal och prispress blir viktigare än en enskild rubriksiffra.",
        "Inget PMI-utfall eller någon efterföljande marknadsreaktion ingår i artikeln. Efter cutoff bevakas även om American Express och SLB behåller sina premarketreaktioner när kontanthandeln öppnar.",
      ],
    },
  ],
  sources: [
    {
      text: "American Express Investor Relations: officiellt Q3-material och rapportkonferens den 23 oktober 2026",
      href: "https://ir.americanexpress.com/events/event-details/2026/Q3-2026-American-Express-Earnings-Conference-Call/default.aspx",
    },
    {
      text: "SLB Investor Relations: officiella Q3-nyckeltal, kassaflöde och rapportmaterial den 23 oktober 2026",
      href: "https://investorcenter.slb.com/",
    },
    {
      text: "S&P Global: officiell publiceringskalender för preliminärt amerikanskt PMI den 23 oktober 2026",
      href: "https://www.pmi.spglobal.com/Public/Release/ReleaseDates",
    },
    {
      text: "Reuters: aktuell USA-terminsbild, torsdagens teknikfall och oljepris inför Wall Street den 23 oktober 2026",
      href: "https://www.reuters.com/business/wall-street-futures-dip-after-ai-rout-telecoms-slide-2026-10-23/",
    },
    {
      text: "Reuters: American Express Q3-resultat, höjd vinstprognos och premarketreaktion den 23 oktober 2026",
      href: "https://www.reuters.com/business/american-express-raises-2026-profit-forecast-affluent-customers-keep-spending-2026-10-23/",
    },
    {
      text: "Reuters: SLB:s Q3-resultat, regionala intäkter och jämförelse med LSEG-förväntningar den 23 oktober 2026",
      href: "https://www.reuters.com/business/energy/top-oilfield-services-firm-slb-beats-quarterly-profit-estimates-2026-10-23/",
    },
  ],
};
