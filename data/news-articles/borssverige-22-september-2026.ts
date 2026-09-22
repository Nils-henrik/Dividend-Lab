import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 22 september 2026.
 * Editorial research cutoff: 2026-09-22T09:40:28+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://attachment.news.eu.nasdaq.com/a0c86f26b696293f1dcdc6c3661af8fe8
 * P0_SOURCE[primary]: https://www.vivagroup.se/sista-dag-for-handel-i-aktierna-i-viva-wine-group-pa-nasdaq-stockholm/
 * P0_SOURCE[primary]: https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-09-24/
 * P0_SOURCE[primary]: https://hmgroup.com/investors/financial-calendar/
 * P0_SOURCE[primary]: https://indexes.nasdaqomx.com/index/Overview/OMXS30
 */
export const BORSSVERIGE_22_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-22-september-2026",
  slug: "borssverige-22-september-2026",
  title: "BörsSverige 22 september: Evolution håller extrastämma – Viva Wine lämnar börsen",
  summary:
    "Evolution håller extrastämma om indragning av återköpta aktier, medan Viva Wine Group gör sin sista handelsdag på Nasdaq Stockholm. Senare i veckan väntar H&M:s niomånadersrapport och Riksbankens nya räntebesked.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-22T09:42:00+02:00",
  url: "/news/borssverige-22-september-2026",
  featured: true,
  imageAlt: "BörsSverige 2026-09-22 – DivLabs översikt över svenska börsnyheter med Evolution, Viva Wine, H&M och Riksbanken.",
  readingMinutes: 5,
  seoTitle: "BörsSverige 22 september: Evolution, Viva Wine och Riksbanken",
  seoDescription:
    "Stockholmsbörsen i dag: Evolution håller extrastämma om återköpta aktier, Viva Wine gör sista handelsdagen och H&M samt Riksbanken står på veckans agenda.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsen idag Sverige",
    "Evolution aktie",
    "Evolution extrastämma",
    "Viva Wine avnotering",
    "H&M rapport september 2026",
    "Riksbanken ränta september 2026",
    "OMXS30",
    "22 september 2026",
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "aktieåterköp", "avnotering", "detaljhandel", "Riksbanken", "penningpolitik"],
    companies: ["Evolution", "Viva Wine Group", "H&M"],
    tickers: ["EVO", "VIVA", "HM B"],
    relatedNewsSlugs: ["borssverige-21-september-2026", "borssverige-19-september-2026"],
  },
  showDisclaimer: true,
  intro: [
    "Tisdagens svenska börsdag innehåller två tydliga bolagshändelser. Evolution håller extra bolagsstämma klockan 15.00 om bland annat indragning av återköpta aktier, samtidigt som Viva Wine Group gör sin sista handelsdag på Nasdaq Stockholm.",
    "I bakgrunden kommer Stockholmsbörsen från en stark måndag: OMXS30 stängde den 21 september på 3 307,02 punkter, upp 1,31 procent enligt Nasdaq. Senare i veckan riktas fokus mot H&M:s niomånadersrapport och Riksbankens penningpolitiska besked.",
  ],
  sections: [
    {
      heading: "Evolution vill dra in återköpta aktier",
      paragraphs: [
        "Evolution håller extra bolagsstämma i Stockholm den 22 september klockan 15.00. På dagordningen finns ett förslag om att minska aktiekapitalet genom indragning av återköpta egna aktier, kombinerat med en fondemission och en teknisk kapitalminskning för att återställa aktiekapitalet.",
        "I kallelsen uppgav Evolution att bolaget per den 27 augusti hade köpt tillbaka och innehade 13 373 756 egna aktier. Styrelsens förslag medger indragning av upp till 19 922 661 egna aktier, eftersom bolaget planerade att fortsätta återköpen fram till stämman.",
        "Det exakta antalet aktier som eventuellt dras in avgörs därför av hur många egna aktier bolaget faktiskt innehar vid stämman. Förslaget kräver minst två tredjedelar av både avgivna röster och de aktier som är representerade på stämman.",
      ],
    },
    {
      heading: "Viva Wine gör sista handelsdagen",
      paragraphs: [
        "Viva Wine Group har den 22 september som sista handelsdag på Nasdaq Stockholm. Bakgrunden är att Riesling Ventures efter sitt offentliga uppköpserbjudande blivit ägare till mer än 90 procent av aktierna och begärt att bolaget ska avnoteras.",
        "Nasdaq Stockholm har godkänt avnoteringen. Händelsen innebär att tisdagens handel blir den sista ordinarie börshandeln i VIVA-aktien på Nasdaq Stockholm.",
      ],
    },
    {
      heading: "OMXS30 steg 1,31 procent på måndagen",
      paragraphs: [
        "OMXS30 stängde måndagen den 21 september på 3 307,02 punkter. Det var en uppgång med 42,69 punkter, motsvarande 1,31 procent, enligt Nasdaqs officiella indexdata.",
        "Den siffran är gårdagens stängning och ska inte läsas som en aktuell kurs för tisdagen. BörsSverige låser inte in intradagsrörelser i artikeln utan separat verifiering nära publiceringstidpunkten.",
      ],
    },
    {
      heading: "H&M och Riksbanken gör torsdagen tung",
      paragraphs: [
        "H&M publicerar sin niomånadersrapport för perioden 1 december 2025 till 31 augusti 2026 torsdagen den 24 september. Rapporten är en av veckans största svenska bolagshändelser.",
        "Samma dag klockan 09.30 publicerar Riksbanken sitt nya penningpolitiska beslut, inklusive styrräntan, tillsammans med den penningpolitiska rapporten. Direktionen fattar själva beslutet vid det penningpolitiska mötet den 23 september.",
        "Varken H&M:s nya rapportsiffror eller Riksbankens nya räntebeslut var publicerade vid artikelns cutoff och föregrips därför inte.",
      ],
    },
    {
      heading: "DivLabs blick",
      paragraphs: [
        "Evolution och Viva Wine ger två helt olika bolagsteman för tisdagen: kapitalstruktur i ett av Stockholmsbörsens mest omsatta tillväxtbolag och slutpunkten för en börsnotering efter ett uppköp.",
        "Mot slutet av veckan flyttas tyngdpunkten mot H&M och Riksbanken. För svenska sparare blir torsdagen därmed en betydligt mer koncentrerad dag för både bolags- och makronyheter.",
      ],
    },
  ],
  sources: [
    {
      text: "Nasdaq Stockholm/Evolution: kallelse till extra bolagsstämma 22 september 2026",
      href: "https://attachment.news.eu.nasdaq.com/a0c86f26b696293f1dcdc6c3661af8fe8",
    },
    {
      text: "Viva Wine Group: sista dag för handel på Nasdaq Stockholm 22 september 2026",
      href: "https://www.vivagroup.se/sista-dag-for-handel-i-aktierna-i-viva-wine-group-pa-nasdaq-stockholm/",
    },
    {
      text: "Riksbanken: penningpolitiskt beslut och rapport 24 september 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-09-24/",
    },
    {
      text: "H&M Group: finansiell kalender – niomånadersrapport 24 september 2026",
      href: "https://hmgroup.com/investors/financial-calendar/",
    },
    {
      text: "Nasdaq: OMXS30 – stängning 21 september 2026",
      href: "https://indexes.nasdaqomx.com/index/Overview/OMXS30",
    },
  ],
};
