import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 4 oktober 2026.
 * Editorial research cutoff: 2026-10-04T08:03:51+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.ssb.no/en/priser-og-prisindekser/konsumpriser/statistikk/konsumprisindeksen
 * P0_SOURCE[primary]: https://www.ssb.no/en/priser-og-prisindekser/produsent-og-engrosprisindekser/statistikk/produsentprisindeksen/
 * P0_SOURCE[primary]: https://www.scb.se/en/finding-statistics/publishing-calendar/?period=Forward1Year&prodKod=NR9999
 * P0_SOURCE[primary]: https://www.scb.se/en/finding-statistics/publishing-calendar/?period=Forward1Year&prodKod=NV0402
 */
export const NORDEN_I_CENTRUM_4_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-4-oktober-2026",
  slug: "norden-i-centrum-4-oktober-2026",
  title: "Norden i centrum: veckan som kommer – fredagens inflations- och tillväxttest",
  summary: "Norsk inflation och producentpriser möter svensk BNP-indikator och industriproduktion den 9 oktober. Fyra officiella datapunkter blir veckans viktigaste nordiska test.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-04T08:04:10+02:00",
  url: "/news/norden-i-centrum-4-oktober-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-10-04.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-10-04.png",
  imageAlt: "Norden i centrum 2026-10-04 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Nordiska veckan: inflation, BNP och industri den 9 oktober",
  seoDescription: "Veckan som kommer i Norden: norsk KPI och PPI samt svensk BNP-indikator och industriproduktion publiceras fredagen den 9 oktober.",
  seoKeywords: [
    "Norden veckan som kommer",
    "Norge KPI september 2026",
    "Norge producentprisindex",
    "Sverige BNP-indikator augusti 2026",
    "svensk industriproduktion",
    "nordiska marknader"
  ],
  internalLinking: {
    topics: ["Norden", "Norge", "Sverige", "inflation", "BNP", "industriproduktion"],
    companies: [],
    tickers: [],
    relatedNewsSlugs: [
      "norden-i-centrum-3-oktober-2026",
      "norden-i-centrum-1-oktober-2026",
      "borssverige-3-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Veckan som kommer har sin tydligaste nordiska tyngdpunkt på fredagen den 9 oktober. Då publicerar Norge ny konsumentprisstatistik och producentprisindex för september, samtidigt som Sverige redovisar BNP-indikatorn och industriproduktionen för augusti.",
    "Fyra officiella datapunkter samma morgon ger en ovanligt samlad kontroll av pris- och aktivitetsbilden. De blir också nästa steg efter veckan som gick, då uppdaterad dansk BNP och högre nominell norsk handelsomsättning gav en försiktigt konstruktiv men ännu ofullständig konjunkturbild."
  ],
  sections: [
    {
      heading: "Norsk inflation får ett nytt septemberutfall",
      paragraphs: [
        "Statistisk sentralbyrå publicerar nästa uppdatering av konsumentprisindex den 9 oktober. Det senaste tillgängliga utfallet avser augusti: KPI steg då 3,3 procent från ett år tidigare och föll 0,3 procent från juli. KPI justerat för skatteförändringar och utan energivaror, KPI-ATE, ökade 3,0 procent i årstakt.",
        "Septemberutfallet blir viktigt eftersom det visar om pristrycket breddas, dämpas eller ligger kvar nära augustinivån. DivLab föregriper inte riktningen. Det verifierbara inför veckan är publiceringsdatumet och jämförelsenivåerna, inte ett prognostiserat utfall.",
        "För nordiska investerare är skillnaden mellan total KPI och KPI-ATE central. Energi kan flytta totalinflationen snabbt, medan måttet utan energivaror ger en annan bild av det underliggande pristrycket."
      ]
    },
    {
      heading: "Producentpriserna visar trycket tidigare i kedjan",
      paragraphs: [
        "Samma dag uppdaterar SSB producentprisindex för september. Indexet mäter prisutvecklingen för varor som produceras i Norge och säljs på den norska och utländska marknaden.",
        "Statistiken omfattar bland annat olje- och gasutvinning, tillverkningsindustri, gruvor och el. Den ger därför en bredare bild av prisrörelser i producentledet än konsumentprisindex, men förändringar behöver inte slå igenom direkt eller fullt ut i konsumentpriserna.",
        "Kombinationen av KPI och producentprisindex gör fredagens norska datapaket särskilt användbart: konsumentledet och producentledet kan bedömas sida vid sida utan att ett enskilt index behöver bära hela tolkningen."
      ]
    },
    {
      heading: "Svensk BNP-indikator och industri publiceras samtidigt",
      paragraphs: [
        "Statistiska centralbyråns publiceringskalender anger den 9 oktober för både BNP-indikatorn och industriproduktionsindex, i båda fallen med augusti 2026 som referensmånad. SCB uppger att ny vardagsstatistik normalt publiceras klockan 08.00.",
        "BNP-indikatorn ger en tidig månadsbild av aktiviteten i svensk ekonomi. Industriproduktionsindex gör det möjligt att samtidigt kontrollera om industrin bekräftar eller avviker från den bredare signalen.",
        "Utfallet blir särskilt relevant efter förra veckans nordiska signaler. Starkare dansk kvartalstillväxt och högre norsk nominell handelsomsättning är inte automatiskt bevis för en gemensam nordisk trend. Den svenska augustistatistiken blir en ny, separat kontrollpunkt."
      ]
    },
    {
      heading: "Det här följer vi under veckan",
      paragraphs: [
        "Veckans huvudfråga är om fredagens statistik ger en sammanhängande bild eller drar åt olika håll. Ett inflationsutfall och en aktivitetsindikator mäter olika delar av ekonomin och ska inte pressas in i samma slutsats om siffrorna divergerar.",
        "DivLab följer därför tre saker: avståndet mellan norsk KPI och KPI-ATE, riktningen i norska producentpriser samt om svensk BNP-indikator och industriproduktion pekar åt samma håll. Först när utfallen är publicerade går det att bedöma vad som faktiskt har förändrats.",
        "Rapport- och bolagsbesked kan tillkomma under veckan och värderas då mot primärkällor. Den verifierade kalendern inför måndagen gör ändå den 9 oktober till veckans tydligaste nordiska makrotest."
      ]
    }
  ],
  sources: [
    {
      text: "Statistisk sentralbyrå: Konsumentprisindex, nästa uppdatering den 9 oktober 2026 och senaste utfall för augusti",
      href: "https://www.ssb.no/en/priser-og-prisindekser/konsumpriser/statistikk/konsumprisindeksen"
    },
    {
      text: "Statistisk sentralbyrå: Producentprisindex, nästa uppdatering den 9 oktober 2026 och indexets omfattning",
      href: "https://www.ssb.no/en/priser-og-prisindekser/produsent-og-engrosprisindekser/statistikk/produsentprisindeksen/"
    },
    {
      text: "Statistiska centralbyrån: Publiceringskalender för BNP-indikatorn, augusti 2026, den 9 oktober",
      href: "https://www.scb.se/en/finding-statistics/publishing-calendar/?period=Forward1Year&prodKod=NR9999"
    },
    {
      text: "Statistiska centralbyrån: Publiceringskalender för industriproduktionsindex, augusti 2026, den 9 oktober",
      href: "https://www.scb.se/en/finding-statistics/publishing-calendar/?period=Forward1Year&prodKod=NV0402"
    }
  ]
};
