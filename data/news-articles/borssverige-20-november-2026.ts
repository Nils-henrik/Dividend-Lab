import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 20 november 2026.
 * Editorial research cutoff: 2026-11-20T08:21:34+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://mfn.se/a/powercell-sweden/powercell-far-order-vard-440-msek-pa-storskalig-anlaggning-for-elproduktion-med-gron-vatgas-i-usa
 */
export const BORSSVERIGE_20_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-20-november-2026",
  slug: "borssverige-20-november-2026",
  title: "PowerCell tar order på 440 MSEK – vätgaskraft blir nytt tillväxtben",
  summary:
    "PowerCell har fått en order på 440 MSEK för en 20 MW-anläggning i södra USA. Projektet ska levereras över 18–24 månader och gör stationär kraftproduktion till ett tydligare andra affärsområde vid sidan av Marine.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-20T08:21:35+01:00",
  url: "/news/borssverige-20-november-2026",
  featured: true,
  readingMinutes: 4,
  seoTitle: "PowerCell får USA-order på 440 MSEK för vätgaskraft",
  seoDescription:
    "PowerCell får en order på 440 MSEK för en 20 MW-anläggning i USA. Här är kapaciteten, leveranstiden och vad beskedet betyder för bolaget.",
  seoKeywords: [
    "PowerCell order",
    "PowerCell USA",
    "PowerCell 440 MSEK",
    "PowerPod 3000",
    "vätgas elproduktion",
    "PCELL",
    "Stockholmsbörsen idag",
    "BörsSverige"
  ],
  internalLinking: {
    topics: [
      "BörsSverige",
      "vätgas",
      "bränsleceller",
      "stationär kraftproduktion",
      "energilagring",
      "order",
      "USA"
    ],
    companies: ["PowerCell"],
    tickers: ["PCELL"],
    relatedNewsSlugs: [
      "borssverige-19-november-2026",
      "norden-i-centrum-20-november-2026",
      "borssverige-18-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "PowerCell har tecknat ett avtal värt 440 MSEK med ett etablerat amerikanskt elkooperativ. Ordern gäller en storskalig bränslecellsanläggning i södra USA och är morgonens tydligaste nya svenska börsbesked.",
    "Anläggningen får 27 MW installerad bränslecellseffekt och 20 MW nominell uteffekt. Leveransen ska ske under 18–24 månader, vilket gör både projektets genomförande och intäkternas fördelning över tid till centrala kontrollpunkter.",
    "Beskedet breddar samtidigt PowerCells kommersiella tyngdpunkt. Bolaget beskriver Power Generation som ett betydande tillväxtområde vid sidan av Marine. Det är den strategiska förändringen som gör ordern viktigare än en enskild leverans."
  ],
  sections: [
    {
      heading: "Ordern i siffror",
      paragraphs: [
        "Avtalsvärdet är 440 MSEK. Kunden är ett etablerat elkooperativ i USA, men namnet anges inte i bolagets pressmeddelande. PowerCell ska leverera och systemintegrera anläggningen genom sitt amerikanska dotterbolag PowerCell Inc.",
        "Systemet byggs på PowerPod 3000, bolagets containerbaserade plattform för elproduktion. Den omfattar 27 MW installerad bränslecellseffekt och 20 MW nominell uteffekt. Skillnaden speglar att installerad systemkapacitet inte är samma sak som anläggningens nominella levererade effekt.",
        "Leveransen väntas löpa över 18–24 månader. Parterna avser dessutom att teckna ett separat serviceavtal före driftsättning, men något värde för ett sådant avtal är inte offentliggjort."
      ]
    },
    {
      heading: "Solenergi lagras som grön vätgas",
      paragraphs: [
        "Anläggningen ska ingå i kundens förnybara energisystem. Överskottsel från solkraft används för att producera grön vätgas, som lagras och senare omvandlas tillbaka till elektricitet i PowerCells PEM-bränsleceller.",
        "Tanken är att elen ska kunna levereras när solproduktionen är låg, under natten eller när extra effekt behövs. Därmed fungerar vätgasen som långvarig energilagring och bränslecellsanläggningen som reglerbar produktion.",
        "Processen producerar också vatten. PowerCell framhåller möjligheten att återvinna vattnet i det övergripande energisystemet, men mängd och användning beror på den slutliga utformningen, driften och kraven på vattenbehandling."
      ]
    },
    {
      heading: "Varför beskedet spelar roll",
      paragraphs: [
        "Orderns storlek och kapacitet visar att PowerCells teknik nu används i ett fullskaligt energisystem, inte bara i mindre demonstrationer. Det ger bolaget en konkret referens inom stationär elproduktion i USA.",
        "PowerCell har länge haft Marine som ett centralt affärsområde. Med dagens avtal beskriver bolaget Power Generation som sitt andra stora affärsområde. Det minskar inte genomföranderisken, men det breddar den kommersiella bas som framtida tillväxt kan byggas på.",
        "Ett eventuellt serviceavtal kan också skapa en längre kundrelation efter leveransen. Eftersom villkoren ännu inte är klara ska det dock ses som en möjlig fortsättning, inte som en del av de verifierade 440 MSEK."
      ]
    },
    {
      heading: "Det här följer vi härnäst",
      paragraphs: [
        "Den första kontrollpunkten är leveransplanen under de kommande 18–24 månaderna. För investerare blir det viktigt att se när ordern börjar synas i intäkter, kassaflöde och projektkostnader.",
        "Nästa punkt är systemintegrationen. Ett projekt på 20 MW nominell uteffekt kräver att PowerCell samordnar bränsleceller, kraftomvandling, kylning och styrning i en fungerande helhet.",
        "Slutligen följer vi om det separata serviceavtalet blir verklighet och om den amerikanska referensen leder till fler beställningar inom Power Generation. Någon kursreaktion före Stockholmsbörsens öppning beskrivs inte."
      ]
    }
  ],
  sources: [
    {
      text: "PowerCells officiella marknadsmeddelande om USA-order på 440 MSEK, systemkapacitet, leveranstid och planerat serviceavtal",
      href: "https://mfn.se/a/powercell-sweden/powercell-far-order-vard-440-msek-pa-storskalig-anlaggning-for-elproduktion-med-gron-vatgas-i-usa"
    }
  ]
};
