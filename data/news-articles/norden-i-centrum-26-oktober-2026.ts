import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 26 oktober 2026.
 * Editorial research cutoff: 2026-10-26T08:05:07+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.nitrogames.com/press-release/webcast-q3-2026/
 * P0_SOURCE[primary]: https://www.scb.se/en/finding-statistics/publishing-calendar/
 * P0_SOURCE[primary]: https://www.scb.se/PR0301-en
 */
export const NORDEN_I_CENTRUM_26_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-26-oktober-2026",
  slug: "norden-i-centrum-26-oktober-2026",
  title: "Nitro Games öppnar rapportmåndagen – svenska producentpriser nästa signal",
  summary:
    "Finska Nitro Games publicerar Q3 för januari–september och håller webcast klockan 09.30 svensk tid. Samtidigt väntas svensk producent- och importprisstatistik för september ge nästa signal om industrins kostnadstryck.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-26T08:06:00+01:00",
  url: "/news/norden-i-centrum-26-oktober-2026",
  featured: true,
  readingMinutes: 4,
  seoTitle: "Nordiska börsen idag: Nitro Games Q3 och svenska producentpriser",
  seoDescription:
    "Nordisk börsmorgon 26 oktober: Nitro Games publicerar Q3 och svensk producent- och importprisstatistik ger nästa signal om kostnadstrycket.",
  seoKeywords: [
    "nordiska börsen idag",
    "Nitro Games Q3 2026",
    "Nitro Games rapport",
    "NITRO aktie",
    "svenska producentpriser september 2026",
    "importpriser Sverige",
    "Norden i centrum"
  ],
  internalLinking: {
    topics: [
      "Norden",
      "Finland",
      "Sverige",
      "kvartalsrapport",
      "spelutveckling",
      "producentpriser",
      "importpriser",
      "industrikostnader"
    ],
    companies: ["Nitro Games", "Equinor", "Aker BP", "Danske Bank"],
    tickers: ["NITRO", "EQNR", "AKRBP", "DANSKE"],
    relatedNewsSlugs: [
      "norden-i-centrum-25-oktober-2026",
      "norden-i-centrum-24-oktober-2026",
      "norden-i-centrum-23-oktober-2026",
      "borssverige-25-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Måndagens nordiska rapportmorgon öppnar i mindre skala än den tunga rapportvecka som väntar längre fram. Den tydligaste verifierade bolagshändelsen före börsöppning är finska Nitro Games rapport för januari–september.",
    "På makrosidan publicerar SCB producent- och importprisindex för september. Statistiken blir en tidig signal om kostnadstrycket för svenska industribolag och importörer.",
    "Varken Nitro Games rapportutfall eller septemberutfallet för producentpriser fanns verifierat vid artikelns bryttid. Därför anges inga framtida siffror, slutsatser eller kursreaktioner."
  ],
  sections: [
    {
      heading: "Nitro Games rapporterar före webcasten",
      paragraphs: [
        "Nitro Games har bekräftat att delårsrapporten för januari–september 2026 publiceras måndag den 26 oktober. Bolaget håller därefter en webcast klockan 09.30 svensk tid.",
        "Nitro Games är ett finländskt spelutvecklings- och förlagsbolag vars aktie handlas på Nasdaq First North Growth Market under kortnamnet NITRO.",
        "Rapportens viktigaste nya information blir utvecklingen i intäkter, resultat, kassaflöde och projektportfölj under tredje kvartalet. Före publiceringen går det inte att slå fast hur dessa poster har förändrats."
      ]
    },
    {
      heading: "Vad investerare behöver lyssna efter",
      paragraphs: [
        "För ett projektorienterat spelbolag är fördelningen mellan egna spel, samarbetsprojekt och utvecklingsavtal central. Det påverkar både intäkternas timing och hur kapitalbehovet ska bedömas.",
        "Webcasten blir därför relevant för att förstå hur ledningen beskriver leveranser, kommande milstolpar och finansiering efter periodens slut.",
        "Dagens artikel föregriper inte presentationen. Nästa kontrollpunkt är den publicerade rapporten och därefter ledningens kommentarer klockan 09.30."
      ]
    },
    {
      heading: "Svenska producentpriser mäter kostnadstrycket",
      paragraphs: [
        "SCB:s kalender anger att producent- och importprisindex för september publiceras den 26 oktober. Statistiken mäter prisutvecklingen när varor lämnar svenska producenter och när varor förs in i Sverige.",
        "I augusti steg producentprisindex 0,9 procent från juli och 6,8 procent jämfört med ett år tidigare. Importprisindex låg samtidigt 9,5 procent över nivån i augusti 2025.",
        "Septemberutfallet var ännu inte synligt i den officiella statistiksidan vid bryttiden. Det går därför inte att säga om kostnadstrycket har tilltagit eller lättat."
      ]
    },
    {
      heading: "Varför måndagens två signaler spelar roll",
      paragraphs: [
        "Nitro Games ger en av dagens få verifierade nordiska rapportpunkter, medan producentpriserna kan påverka synen på marginaler i en betydligt bredare del av den svenska marknaden.",
        "En hög importpristakt kan pressa bolag som köper insatsvaror i utländsk valuta. Producentpriserna visar samtidigt hur mycket pristryck som finns tidigare i värdekedjan innan det eventuellt når konsumenterna.",
        "Senare i veckan följer de större kontrollpunkter som söndagens Norden-artikel pekade ut: Equinor den 28 oktober samt Aker BP och Danske Bank den 29 oktober. Dagens besked ska därför läsas som veckans första datapunkter, inte som hela marknadsbilden."
      ]
    }
  ],
  sources: [
    {
      text: "Nitro Games: officiell information om Q3-rapporten för januari–september 2026 och webcast den 26 oktober klockan 09.30 svensk tid",
      href: "https://www.nitrogames.com/press-release/webcast-q3-2026/"
    },
    {
      text: "SCB: officiell publiceringskalender som anger producent- och importprisindex för september med publiceringsdatum 26 oktober 2026",
      href: "https://www.scb.se/en/finding-statistics/publishing-calendar/"
    },
    {
      text: "SCB: officiell statistiksida för producent- och importprisindex med senast verifierade augustivärden och beskrivning av serien",
      href: "https://www.scb.se/PR0301-en"
    }
  ]
};
