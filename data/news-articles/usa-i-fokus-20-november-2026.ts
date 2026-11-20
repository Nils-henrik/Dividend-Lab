import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 20 november 2026.
 * Editorial research cutoff: 2026-11-20T14:06:53+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/legal/transactional/wall-st-futures-slip-anthropic-debut-fails-reassure-ai-investors-2026-11-20/
 * P0_SOURCE[primary]: https://investors.intuit.com/sec-filings/all-sec-filings/content/0000896878-26-000043/fy27q1earningspressrelease.htm
 * P0_SOURCE[primary]: https://investors.rossstores.com/news-releases/news-release-details/ross-stores-reports-strong-third-quarter-sales-and-earnings
 * P0_SOURCE[primary]: https://investor.keysight.com/investor-news-and-events/financial-press-releases/press-release-details/2026/Keysight-Technologies-Reports-Fourth-Quarter-and-Fiscal-Year-2026-Results/default.aspx
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/11_sched_list.htm
 */
export const USA_I_FOKUS_20_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-20-november-2026",
  slug: "usa-i-fokus-20-november-2026-anthropic-intuit-ross-keysight",
  title: "USA i fokus 20 november: Anthropic vänder ned – AI-oron pressar Nasdaq",
  summary:
    "Nasdaq-terminen faller 1,6 procent när Anthropic tappar efter sin starka debut. Intuit säljer Mailchimp, medan Ross Stores och Keysight visar tydlig tillväxt i sina rapporter.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-20T14:06:58+01:00",
  url: "/news/usa-i-fokus-20-november-2026-anthropic-intuit-ross-keysight",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-20.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-20.png",
  imageAlt: "USA i fokus 2026-11-20 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 6,
  seoTitle: "USA-börsen idag: Anthropic faller och AI-oron pressar Nasdaq",
  seoDescription:
    "USA-börsen 20 november: Anthropic vänder ned efter debuten och Nasdaq-terminen faller. Intuit säljer Mailchimp, Ross och Keysight rapporterar.",
  seoKeywords: [
    "USA-börsen idag",
    "Wall Street idag",
    "Anthropic aktie",
    "Anthropic IPO",
    "Intuit rapport",
    "Mailchimp försäljning",
    "Ross Stores rapport",
    "Keysight rapport",
    "Nasdaq terminer"
  ],
  internalLinking: {
    topics: ["USA i fokus", "Wall Street", "Nasdaq", "artificiell intelligens", "börsnotering", "bolagsrapporter", "detaljhandel", "cybersäkerhet", "Federal Reserve"],
    companies: ["Anthropic", "Intuit", "Bending Spoons", "Ross Stores", "Keysight Technologies", "Nvidia", "Amazon", "Microsoft", "Meta"],
    tickers: ["ANT", "INTU", "ROST", "KEYS", "NVDA", "AMZN", "MSFT", "META"],
    relatedNewsSlugs: [
      "usa-i-fokus-19-november-2026-anthropic-walmart-fed",
      "usa-i-fokus-18-november-2026-nvidia-target-lowes",
      "usa-i-fokus-17-november-2026-disney-home-depot-nvidia"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Gårdagens stora kontrollpunkt har fått ett verifierat utfall. Anthropic steg mer än 17 procent under sin första handelsdag men föll 7,4 procent i fredagens förhandel, samtidigt som Nasdaq 100-terminen backade 1,64 procent.",
    "Omsvängningen visar att en stark börsdebut inte räckte för att återställa förtroendet för AI-handeln. Nvidia, AMD, Broadcom, Marvell och Micron föll också i förhandeln när marknaden fortsatte att väga stark efterfrågan mot höga värderingar och dyrare finansiering.",
    "Rapportsvepet ger en mer blandad bild. Intuit växer men säljer Mailchimp och sänker sin intäktsprognos, medan Ross Stores och Keysight redovisar tydlig försäljnings- och vinsttillväxt."
  ],
  sections: [
    {
      heading: "Anthropics debutlyft försvinner snabbt",
      paragraphs: [
        "Anthropic började på torsdagen handlas mer än 34 procent över erbjudandepriset på 83 dollar och avslutade debutdagen med en uppgång på mer än 17 procent. I fredagens förhandel föll aktien 7,4 procent.",
        "Nasdaq 100-terminen var samtidigt ned 1,64 procent, S&P 500-terminen 0,74 procent och Dow-terminen 0,1 procent vid Reuters uppdatering klockan 07.03 amerikansk östkusttid.",
        "S&P 500 hade då fallit sex handelsdagar i följd, den längsta nedgångsserien sedan april 2024. Nasdaq låg 13,6 procent under rekordstängningen den 6 oktober och VIX-indexet nådde 30 för första gången sedan den 30 mars."
      ]
    },
    {
      heading: "AI-pressen breddas före öppningen",
      paragraphs: [
        "Nvidia föll 2,2 procent i förhandeln. AMD, Broadcom, Marvell och Micron tappade mellan 2,2 och 6,6 procent, medan Amazon och Microsoft backade mer än 1,5 procent och Meta cirka 2 procent.",
        "Det innebär att gårdagens fråga nu har fått ett tydligare svar: Anthropics notering gav ett starkt enskilt debututfall men stabiliserade inte den bredare AI-handeln.",
        "Ränterisken ligger kvar efter veckans hökaktiga Fed-signaler. Enligt Reuters prissatte marknaden en sannolikhet på 98,4 procent för en räntehöjning vid centralbankens decembermöte."
      ]
    },
    {
      heading: "Intuit säljer Mailchimp för 3,68 miljarder dollar",
      paragraphs: [
        "Intuits omsättning steg 12 procent till 4,4 miljarder dollar i det första kvartalet av räkenskapsåret 2027. Den justerade vinsten per aktie ökade 56 procent till 2,91 dollar.",
        "Bolaget har ingått ett avtal om att sälja Mailchimp till Bending Spoons för cirka 3,68 miljarder dollar, varav 3,31 miljarder i kontanter och 368 miljoner i aktier i Bending Spoons. Mailchimps kvartalsomsättning minskade 1 procent till 313 miljoner dollar.",
        "Intuit uppdaterade samtidigt helårsprognosen och räknar nu med intäkter på 23,08–23,37 miljarder dollar, motsvarande 8–9 procents tillväxt. Aktien föll i förhandeln efter den sänkta intäktsutsikten och försäljningen av Mailchimp."
      ]
    },
    {
      heading: "Ross Stores höjer helårets vinstprognos",
      paragraphs: [
        "Ross Stores ökade kvartalsförsäljningen 12 procent till 6,3 miljarder dollar. Den jämförbara försäljningen steg 8 procent och rörelsemarginalen förbättrades 0,7 procentenheter till 12,3 procent.",
        "Vinsten per aktie steg till 1,91 dollar från 1,58 dollar året före och översteg bolagets egen prognos på 1,75–1,83 dollar.",
        "För helåret höjer Ross Stores prognosen för vinst per aktie till 8,75–8,84 dollar. Prognosen inkluderar en positiv effekt på cirka 0,60 dollar per aktie från tullåterbetalningar som bokfördes under andra kvartalet."
      ]
    },
    {
      heading: "Keysight avslutar året med rekordkvartal",
      paragraphs: [
        "Keysights intäkter ökade till 1,99 miljarder dollar i det fjärde kvartalet från 1,42 miljarder året före. Den justerade vinsten per aktie steg till 3,61 dollar från 1,91 dollar.",
        "Kassaflödet från verksamheten uppgick till 507 miljoner dollar och det fria kassaflödet till 465 miljoner dollar. För helåret ökade intäkterna till 7,16 miljarder dollar från 5,37 miljarder.",
        "För det första kvartalet av räkenskapsåret 2027 guidar Keysight för intäkter på 2,04–2,06 miljarder dollar och en justerad vinst per aktie på 3,63–3,69 dollar."
      ]
    },
    {
      heading: "Vad väntar efter cutoff?",
      paragraphs: [
        "Bureau of Labor Statistics publicerar delstatlig sysselsättning och arbetslöshet för oktober klockan 10.00 amerikansk östkusttid, motsvarande 16.00 i Stockholm. Samtidigt publiceras årlig totalfaktorproduktivitet för större branscher.",
        "Statistiken ligger efter artikelns cutoff och beskrivs därför endast framåtblickande. Inget utfall eller någon marknadsreaktion föregrips.",
        "Efter öppningen följer DivLab om Anthropics nedgång fördjupas, om teknikpressen breddas ytterligare och hur Intuit, Ross Stores och Keysight reagerar i ordinarie handel."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters: färsk förhandelsbild den 20 november 2026 med USA-terminer, Anthropics omsvängning, AI-relaterade aktier och ränteförväntningar",
      href: "https://www.reuters.com/legal/transactional/wall-st-futures-slip-anthropic-debut-fails-reassure-ai-investors-2026-11-20/"
    },
    {
      text: "Intuit Investor Relations och SEC: officiell Q1-rapport 2027 med resultat, Mailchimp-försäljning och uppdaterad helårsprognos",
      href: "https://investors.intuit.com/sec-filings/all-sec-filings/content/0000896878-26-000043/fy27q1earningspressrelease.htm"
    },
    {
      text: "Ross Stores Investor Relations: officiell Q3-rapport 2026 med försäljning, marginal, resultat och höjd helårsprognos",
      href: "https://investors.rossstores.com/news-releases/news-release-details/ross-stores-reports-strong-third-quarter-sales-and-earnings"
    },
    {
      text: "Keysight Investor Relations: officiell Q4- och helårsrapport 2026 med intäkter, resultat, kassaflöde och Q1-prognos",
      href: "https://investor.keysight.com/investor-news-and-events/financial-press-releases/press-release-details/2026/Keysight-Technologies-Reports-Fourth-Quarter-and-Fiscal-Year-2026-Results/default.aspx"
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiell publiceringskalender för november 2026 med dagens statistik klockan 10.00 ET",
      href: "https://www.bls.gov/schedule/2026/11_sched_list.htm"
    }
  ]
};
