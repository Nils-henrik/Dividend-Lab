import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — Veckan som kommer, 25 oktober 2026.
 * Editorial research cutoff: 2026-10-25T13:56:59+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
 * P0_SOURCE[primary]: https://www.bea.gov/news/schedule
 * P0_SOURCE[primary]: https://abc.xyz/investor/events/event-details/
 * P0_SOURCE[primary]: https://ir.aboutamazon.com/overview/default.aspx
 */
export const USA_I_FOKUS_25_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-25-oktober-2026-veckan-som-kommer-fed-bnp-alphabet-amazon",
  slug: "usa-i-fokus-25-oktober-2026-veckan-som-kommer-fed-bnp-alphabet-amazon",
  title: "USA i fokus – Veckan som kommer: Fed, BNP, Alphabet och Amazon",
  summary:
    "Federal Reserve lämnar besked på onsdag. Samma kväll rapporterar Alphabet, medan torsdagens första BNP-estimat, konsumtionsdata och Amazon gör veckan avgörande för både räntor och tekniksektorn.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-25T13:56:59+01:00",
  url: "/news/usa-i-fokus-25-oktober-2026-veckan-som-kommer-fed-bnp-alphabet-amazon",
  featured: true,
  readingMinutes: 5,
  seoTitle: "USA veckan som kommer: Fed, BNP, Alphabet och Amazon",
  seoDescription:
    "Wall Street nästa vecka: Fed lämnar besked 28 oktober. Alphabet rapporterar samma kväll och BNP, konsumtionsdata samt Amazon följer 29 oktober.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street veckan som kommer",
    "Federal Reserve möte",
    "USA BNP Q3 2026",
    "Alphabet rapport",
    "Amazon rapport",
    "USA konsumtion",
    "Nasdaq",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "Federal Reserve",
      "USA-räntor",
      "USA BNP",
      "konsumtion",
      "rapportperiod",
      "Nasdaq",
      "artificiell intelligens",
    ],
    companies: ["Alphabet", "Amazon"],
    tickers: ["GOOGL", "AMZN"],
    relatedNewsSlugs: [
      "usa-i-fokus-24-oktober-2026-veckan-som-gatt-teknik-olja",
      "usa-i-fokus-23-oktober-2026-american-express-slb-pmi",
      "usa-i-fokus-22-oktober-2026-nasdaq-tesla-ibm-olja",
      "borssverige-25-oktober-2026",
      "norden-i-centrum-25-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Den amerikanska kontantmarknaden är stängd på söndagen. Dagens artikel beskriver därför nästa veckas bekräftade kalender och kontrollpunkter, inte framtida indexrörelser, rapportutfall eller räntebesked.",
    "Veckans tyngsta verifierade hållpunkter samlas på onsdag och torsdag: Federal Reserve avslutar sitt möte, Alphabet och Amazon rapporterar och USA publicerar både ett första BNP-estimat för tredje kvartalet och septemberdata för inkomster och konsumtion.",
  ],
  sections: [
    {
      heading: "Onsdag: Federal Reserve lämnar räntebesked",
      paragraphs: [
        "Federal Reserves penningpolitiska kommitté möts den 27–28 oktober. Beskedet publiceras onsdag den 28 oktober klockan 14.00 amerikansk östkusttid, motsvarande klockan 19.00 svensk tid.",
        "Fed håller presskonferens klockan 14.30 amerikansk östkusttid, eller 19.30 svensk tid. Mötet är inte markerat som ett möte med nya ekonomiska prognoser, vilket gör formuleringarna i beskedet och presskonferensen till centrala kontrollpunkter.",
        "Inget räntebesked eller någon marknadsreaktion föregrips. Efter publiceringen blir den verifierbara frågan hur policyn och kommunikationen förhåller sig till tillväxt, inflation och arbetsmarknad.",
      ],
    },
    {
      heading: "Alphabet rapporterar efter Fed",
      paragraphs: [
        "Alphabet håller sin rapportkonferens för tredje kvartalet onsdag den 28 oktober klockan 13.30 amerikansk Stillahavstid, motsvarande 21.30 svensk tid.",
        "För marknaden blir rapporten en ny kontroll av intäkter från sökannonsering, utvecklingen i Google Cloud samt investeringarna i AI-infrastruktur. Utfallet kan inte beskrivas före konferensen och ingår därför inte i artikeln.",
        "Tidpunkten innebär att investerare först får Feds besked och därefter Alphabets rapport. De två händelserna testar därmed både ränteläget och värderingen av stora teknikbolag under samma kväll.",
      ],
    },
    {
      heading: "Torsdag: BNP och konsumtion klockan 13.30",
      paragraphs: [
        "USA:s Bureau of Economic Analysis publicerar sitt första estimat för BNP under tredje kvartalet torsdagen den 29 oktober klockan 08.30 amerikansk östkusttid, motsvarande 13.30 svensk tid.",
        "Samtidigt publiceras Personal Income and Outlays för september. Den statistiken innehåller uppgifter om inkomster och konsumtion och ger tillsammans med BNP en bred kontroll av den amerikanska ekonomins tempo.",
        "Båda publiceringarna ligger efter artikelns research-cutoff. Inga tillväxt-, inkomst-, konsumtions- eller inflationsutfall anges i förväg.",
      ],
    },
    {
      heading: "Amazon avslutar veckans huvudnummer",
      paragraphs: [
        "Amazon håller sin rapportkonferens för tredje kvartalet torsdag den 29 oktober klockan 14.00 amerikansk Stillahavstid, motsvarande 22.00 svensk tid.",
        "De viktigaste verifierbara kontrollpunkterna efter publiceringen blir omsättning, rörelseresultat, utvecklingen i AWS, kassaflöde och bolagets nya utsikter. Rapporten får också visa hur efterfrågan på molntjänster och investeringar i AI-infrastruktur utvecklas.",
        "Veckans ordning gör torsdagens handel särskilt informationsrik: BNP och konsumtionsdata kommer före USA-börsens öppning, medan Amazon rapporterar efter stängning. Det är en kalenderbeskrivning, inte en prognos för kursreaktionen.",
      ],
    },
  ],
  sources: [
    {
      text: "Federal Reserve: officiell FOMC-kalender med mötet den 27–28 oktober 2026",
      href: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    },
    {
      text: "Bureau of Economic Analysis: officiell publiceringskalender för BNP samt Personal Income and Outlays den 29 oktober 2026",
      href: "https://www.bea.gov/news/schedule",
    },
    {
      text: "Alphabet Investor Relations: officiell Q3-rapportkonferens den 28 oktober 2026 klockan 13.30 PT",
      href: "https://abc.xyz/investor/events/event-details/",
    },
    {
      text: "Amazon Investor Relations: officiell Q3-rapportkonferens den 29 oktober 2026 klockan 14.00 PT",
      href: "https://ir.aboutamazon.com/overview/default.aspx",
    },
  ],
};
