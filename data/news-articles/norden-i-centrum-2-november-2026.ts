import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 2 november 2026.
 * Editorial research cutoff: 2026-11-02T08:04:02+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://storage.mfn.se/c29b4f5a-93d7-4a6b-88a2-eae2ad6d1837/academedia-interim-report-2026-27-q1.pdf
 * P0_SOURCE[primary]: https://www.kesko.fi/en/media/news-and-releases/stock-exchange-releases/2026/estimated-completion-date-of-keskos-dahl-acquisition-specified-2-november-2026/
 * P0_SOURCE[primary]: https://www.aspo.com/press-releases/aspo-to-publish-interim-report-on-monday-november-2-2026-3389856
 */
export const NORDEN_I_CENTRUM_2_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-2-november-2026",
  slug: "norden-i-centrum-2-november-2026",
  title: "AcadeMedia växer 14 procent – Kesko väntas slutföra Dahl-köpet",
  summary:
    "AcadeMedia ökar omsättningen till 4,68 miljarder kronor och förbättrar resultat samt kassaflöde. I Finland väntas Kesko slutföra Dahl-förvärvet, medan Aspo har en Q3-rapport på dagens agenda.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-02T08:04:02+01:00",
  url: "/news/norden-i-centrum-2-november-2026",
  featured: true,
  imageAlt: "Norden i centrum 2026-11-02 – AcadeMedias rapport och finska bolagshändelser i fokus.",
  readingMinutes: 4,
  seoTitle: "Nordiska börsen idag: AcadeMedia, Kesko och Aspo i fokus",
  seoDescription:
    "AcadeMedia växer 14,1 procent och förbättrar resultat och kassaflöde. Kesko väntas slutföra Dahl-förvärvet och Aspo rapporterar.",
  seoKeywords: [
    "nordiska börsen idag",
    "AcadeMedia rapport 2026",
    "Kesko Dahl förvärv",
    "Aspo Q3 2026",
    "Nordiska aktier",
    "Norden i centrum"
  ],
  internalLinking: {
    topics: [
      "Norden",
      "rapportperiod",
      "utbildning",
      "förvärv",
      "teknisk handel",
      "kassaflöde",
      "Finland",
      "Sverige"
    ],
    companies: ["AcadeMedia", "Kesko", "Dahl", "Aspo"],
    tickers: ["ACAD", "KESKOB", "ASPO"],
    relatedNewsSlugs: [
      "norden-i-centrum-1-november-2026",
      "norden-i-centrum-31-oktober-2026",
      "norden-i-centrum-30-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Måndagens nordiska morgon får ett tydligt rapportbesked från AcadeMedia. Utbildningskoncernen ökar både omsättning och resultat under det första kvartalet i räkenskapsåret 2026/27, samtidigt som kassaflödet förbättras kraftigt från ett svagt jämförelsekvartal.",
    "I Finland ligger två andra kontrollpunkter nära. Kesko har angett den 2 november som beräknad dag för slutförandet av Dahl-förvärvet, och Aspo har planerat att publicera sin Q3-rapport omkring klockan 09.00 finsk tid.",
    "Det nya jämfört med gårdagens veckokalender är att AcadeMedias faktiska utfall nu finns. Riksbankens, Norges Banks, Novo Nordisks och Maersks besked ligger fortfarande senare i veckan och ska inte föregripas."
  ],
  sections: [
    {
      heading: "AcadeMedia kombinerar förvärv med organisk tillväxt",
      paragraphs: [
        "AcadeMedias nettoomsättning ökade med 14,1 procent till 4 679 miljoner kronor från 4 101 miljoner. Den organiska tillväxten, inklusive mindre tilläggsförvärv, var 4,8 procent jämfört med 6,4 procent ett år tidigare.",
        "Rörelseresultatet steg till 343 miljoner kronor från 292 miljoner. Justerat EBITA exklusive IFRS 16 ökade till 215 miljoner från 182 miljoner, medan den justerade marginalen förbättrades till 4,6 procent från 4,4 procent.",
        "Förvärv och fler elever bidrar tydligt till expansionen. Det genomsnittliga antalet barn och elever ökade med 7,4 procent till 121 436."
      ]
    },
    {
      heading: "Kassaflödet är rapportens tydligaste kvalitetsförbättring",
      paragraphs: [
        "Det fria kassaflödet före expansionsinvesteringar förbättrades till 195 miljoner kronor från minus 111 miljoner. Kassaflödet från den löpande verksamheten steg till 340 miljoner från minus 22 miljoner.",
        "Förändringen i rörelsekapital bidrog med 107 miljoner kronor, jämfört med ett utflöde på 258 miljoner ett år tidigare. Bolaget förklarar förbättringen främst med att en förvärvsrelaterad fordran i Nederländerna återfördes under kvartalet.",
        "Samtidigt ökade nettoskulden exklusive fastighetsrelaterade leasingskulder till 2 102 miljoner kronor från 1 244 miljoner. Skuldsättningen i relation till justerat EBITDA var 1,0 gånger mot 0,7 gånger."
      ]
    },
    {
      heading: "Kesko väntas slutföra sitt största förvärv",
      paragraphs: [
        "Kesko har angett den 2 november som beräknad dag för att slutföra köpet av Dahl i Sverige samt Brødrene Dahl i Norge och Danmark från Saint-Gobain. När transaktionen först offentliggjordes var beskedet att den skulle slutföras senast vid årets slut.",
        "Affären är materiell eftersom den breddar Keskos tekniska handel i tre nordiska länder. Ett faktiskt slutförande måste dock bekräftas i ett nytt bolagsmeddelande; vid artikelns bryttid var den officiella formuleringen fortfarande en uppskattad slutförandedag.",
        "Nästa kontrollpunkter blir köpeskillingens finansiering, integrationsplanen och hur den förvärvade verksamheten påverkar Keskos försäljning, lönsamhet och kapitalbindning."
      ]
    },
    {
      heading: "Aspo rapporterar i en pågående bolagsdelning",
      paragraphs: [
        "Aspo har meddelat att rapporten för juli–september ska publiceras den 2 november omkring klockan 09.00 finsk tid, motsvarande 08.00 i Stockholm. Presentationen är planerad till klockan 12.00 finsk tid.",
        "Rapporten blir särskilt viktig eftersom Aspo arbetar med en partiell delning där ESL Shipping ska separeras till ett självständigt noterat bolag. Inga Q3-siffror används här eftersom ett verifierat rapportutfall inte fanns i de öppnade primärkällorna vid bryttiden.",
        "När rapporten är tillgänglig blir utvecklingen i ESL Shipping och Telko samt bolagets kassaflöde, skuldsättning och vägledning de centrala kontrollpunkterna."
      ]
    },
    {
      heading: "Det följer vi härnäst",
      paragraphs: [
        "För AcadeMedia följer vi om den organiska tillväxten kan accelerera och om det starkare kassaflödet består utan samma stöd från rörelsekapitalet. Integrationen av förvärv i Nederländerna, Storbritannien och Polen blir också viktig.",
        "För Kesko krävs en separat bekräftelse innan Dahl-affären kan beskrivas som slutförd. För Aspo krävs samma disciplin: rapportens siffror ska verifieras mot den publicerade rapporten innan några slutsatser dras.",
        "Senare i veckan återkommer de redan utpekade makro- och rapportpunkterna: Riksbanken, Norges Bank, Novo Nordisk och Maersk."
      ]
    }
  ],
  sources: [
    {
      text: "AcadeMedia: officiell Q1-rapport 2026/27 med omsättning, organisk tillväxt, resultat, marginaler, elevtal, kassaflöde och nettoskuld",
      href: "https://storage.mfn.se/c29b4f5a-93d7-4a6b-88a2-eae2ad6d1837/academedia-interim-report-2026-27-q1.pdf"
    },
    {
      text: "Kesko: officiellt börsmeddelande om den 2 november 2026 som beräknad dag för slutförandet av Dahl-förvärvet i Sverige, Norge och Danmark",
      href: "https://www.kesko.fi/en/media/news-and-releases/stock-exchange-releases/2026/estimated-completion-date-of-keskos-dahl-acquisition-specified-2-november-2026/"
    },
    {
      text: "Aspo: officiellt investerarmeddelande med publiceringstid och presentationstid för Q3-rapporten den 2 november 2026",
      href: "https://www.aspo.com/press-releases/aspo-to-publish-interim-report-on-monday-november-2-2026-3389856"
    }
  ]
};
