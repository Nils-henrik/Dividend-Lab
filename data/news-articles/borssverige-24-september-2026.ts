import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 24 september 2026.
 * Editorial research cutoff: 2026-09-24T09:50:15+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://hmgroup.com/news/h-m-hennes-mauritz-ab-nine-month-report-2026/
 * P0_SOURCE[secondary]: https://www.placera.se/nyheter/ovantat-hogt-vinstlyft-fran-hm-2026-09-24
 * P0_SOURCE[secondary]: https://www.di.se/live/riksbanken-lamnar-styrrantan-oforandrad-IJ82U/
 * P0_SOURCE[primary]: https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-09-242/
 * P0_SOURCE[primary]: https://www.arjo.com/sv-se/om-oss/investerare/pressmeddelanden/press-releases/2026/5417760-Inbjudan-till-Arjos-kapitalmarknadsdag-den-24-september-2026/
 */
export const BORSSVERIGE_24_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-24-september-2026",
  slug: "borssverige-24-september-2026",
  title: "BörsSverige 24 september: H&M slår vinstprognosen – Riksbanken håller 1,75 %",
  summary:
    "H&M:s rörelseresultat slog analytikernas förväntningar med bred marginal samtidigt som Riksbanken lämnade styrräntan oförändrad på 1,75 procent. Arjo håller dessutom kapitalmarknadsdag i Stockholm.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-24T09:50:20+02:00",
  url: "/news/borssverige-24-september-2026",
  featured: true,
  readingMinutes: 5,
  seoTitle: "BörsSverige 24 september: H&M rapport och Riksbankens räntebesked",
  seoDescription:
    "BörsSverige 24 september 2026: H&M slår vinstförväntningarna i Q3, Riksbanken håller styrräntan på 1,75 procent och Arjo håller kapitalmarknadsdag.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "H&M rapport Q3 2026",
    "H&M aktie",
    "Riksbanken ränta september 2026",
    "styrränta 1,75",
    "Arjo kapitalmarknadsdag 2026",
    "börsen idag 24 september 2026",
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "Riksbanken", "styrränta", "rapport", "kapitalmarknadsdag"],
    companies: ["H&M", "Arjo"],
    tickers: ["HM B", "ARJO B"],
    relatedNewsSlugs: ["norden-i-centrum-24-september-2026", "borssverige-23-september-2026"],
  },
  showDisclaimer: true,
  intro: [
    "Torsdagen har fått en tydlig svensk börsagenda redan under morgonen. H&M levererade ett rörelseresultat som låg 18,5 procent över analytikerkonsensus, samtidigt som Riksbanken lämnade styrräntan oförändrad på 1,75 procent.",
    "Handeln på Stockholmsbörsen är igång, men den här versionen använder inte någon exakt intradagsprocent för H&M eller OMXS30 eftersom sådan kursdata måste vara separat verifierad nära artikelns cutoff. Fokus ligger därför på de bekräftade rapport- och räntebeskeden.",
  ],
  sections: [
    {
      heading: "H&M slår vinstförväntningarna",
      paragraphs: [
        "H&M redovisade en nettoomsättning på 57 189 miljoner kronor i det tredje kvartalet, jämfört med 57 017 miljoner kronor ett år tidigare. Modular Finances analytikerkonsensus låg på 57 120 miljoner kronor.",
        "Rörelseresultatet steg till 6 037 miljoner kronor från 4 914 miljoner kronor. Konsensus låg på 5 095 miljoner kronor, vilket innebär att utfallet var 18,5 procent högre än väntat. Rörelsemarginalen blev 10,6 procent mot väntade 8,9 procent och 8,6 procent ett år tidigare.",
        "Bruttomarginalen förbättrades till 54,0 procent från 52,9 procent. H&M uppger samtidigt att kvartalets marginaler påverkades positivt av engångseffekter på omkring 1,6 procentenheter kopplade till tullar och varuimport.",
      ],
    },
    {
      heading: "Septemberförsäljningen väntas öka",
      paragraphs: [
        "H&M räknar med att försäljningen i september ökar med 1 procent i lokala valutor jämfört med samma månad förra året.",
        "Resultatet efter skatt steg till 4 098 miljoner kronor från 3 212 miljoner kronor och resultatet per aktie blev 2,58 kronor mot 2,01 kronor. Kassaflödet från den löpande verksamheten ökade till 11 908 miljoner kronor.",
      ],
    },
    {
      heading: "Riksbanken håller styrräntan på 1,75 procent",
      paragraphs: [
        "Riksbanken meddelade klockan 09.30 att styrräntan lämnas oförändrad på 1,75 procent. Enligt Riksbankens kalender ska dagens beslut om styrräntans nivå tillämpas från den 30 september.",
        "Räntebeskedet är centralt för svenska börsbolag eftersom finansieringskostnader, hushållens efterfrågan och avkastningskrav påverkas av ränteläget. DivLab tillskriver däremot inte enskilda kursrörelser beskedet utan en separat källa som uttryckligen stödjer ett sådant orsakssamband.",
      ],
    },
    {
      heading: "Arjo håller kapitalmarknadsdag",
      paragraphs: [
        "Medicinteknikbolaget Arjo håller kapitalmarknadsdag i Stockholm under torsdagen. Presentationerna startade klockan 09.00 och enligt bolagets inbjudan ska vd Andréas Elgaard ge en uppdatering om strategi och prioriteringar för att stärka lönsamheten och skapa långsiktigt värde.",
        "Kapitalmarknadsdagen pågår enligt den publicerade agendan till senast 11.30. Eventuella nya mål eller besked som presenteras efter artikelns cutoff behöver verifieras separat innan de läggs till som fakta.",
      ],
    },
    {
      heading: "DivLabs blick",
      paragraphs: [
        "H&M är morgonens tydligaste bolagsbesked eftersom vinsten kom in klart över marknadens förväntningar samtidigt som försäljningen låg nära konsensus. Riksbankens oförändrade ränta ger samtidigt investerare ett nytt penningpolitiskt ankare för svenska banker, fastigheter, konsumentbolag och andra räntekänsliga sektorer.",
        "Under resten av dagen ligger fokus på den faktiska marknadsreaktionen, Arjos kapitalmarknadsdag och senare svenska bolagshändelser. Kursrörelser läggs bara till när de kan verifieras mot färsk marknadsdata.",
      ],
    },
  ],
  sources: [
    {
      text: "H&M Group: Nine-month report 2026, 24 september 2026",
      href: "https://hmgroup.com/news/h-m-hennes-mauritz-ab-nine-month-report-2026/",
    },
    {
      text: "Placera: Oväntat högt vinstlyft från H&M, 24 september 2026",
      href: "https://www.placera.se/nyheter/ovantat-hogt-vinstlyft-fran-hm-2026-09-24",
    },
    {
      text: "Dagens industri: Riksbanken lämnar styrräntan oförändrad, 24 september 2026",
      href: "https://www.di.se/live/riksbanken-lamnar-styrrantan-oforandrad-IJ82U/",
    },
    {
      text: "Sveriges Riksbank: publicering och pressträff om penningpolitiskt beslut, 24 september 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-09-242/",
    },
    {
      text: "Arjo: Inbjudan till kapitalmarknadsdag den 24 september 2026",
      href: "https://www.arjo.com/sv-se/om-oss/investerare/pressmeddelanden/press-releases/2026/5417760-Inbjudan-till-Arjos-kapitalmarknadsdag-den-24-september-2026/",
    },
  ],
};
