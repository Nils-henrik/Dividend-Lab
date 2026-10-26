import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 26 oktober 2026.
 * Editorial research cutoff: 2026-10-26T08:25:47+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.scb.se/hitta-statistik/statistik-efter-amne/priser-och-ekonomiska-tendenser/priser/prisindex-i-producent-och-importled-ppi/
 * P0_SOURCE[primary]: https://mfn.se/a/mycronic/mycronic-erhaller-order-pa-en-maskritare-och-ett-matsystem
 * P0_SOURCE[primary]: https://www.alleima.com/en/news-media/archive/2026/10/invitation-to-the-presentation-of-alleimas-q3-2026-interim-report/
 * P0_SOURCE[primary]: https://www.alleima.com/en/news-media/archive/2026/07/alleima-interim-report-q2-2026/
 */
export const BORSSVERIGE_26_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-26-oktober-2026",
  slug: "borssverige-26-oktober-2026",
  title: "Producentpriserna accelererar till 11,2 procent – Mycronic tar order på upp till 14 miljoner dollar",
  summary:
    "Svenska producentpriser steg 3,4 procent i september och 11,2 procent på årsbasis. Samtidigt har Mycronic fått en asiatisk order värd 12–14 miljoner dollar, medan Alleimas Q3 blir nästa industrikontroll klockan 11.30.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-26T08:26:00+01:00",
  url: "/news/borssverige-26-oktober-2026",
  featured: true,
  imageAlt: "BörsSverige 26 oktober 2026 – producentpriser, Mycronic och Alleima inför börsöppning.",
  readingMinutes: 4,
  seoTitle: "Producentpriserna stiger 11,2 procent – Mycronic får stororder",
  seoDescription:
    "SCB:s producentpriser steg 11,2 procent i september. Mycronic får en order värd 12–14 miljoner dollar och Alleima rapporterar klockan 11.30.",
  seoKeywords: [
    "producentpriser Sverige september 2026",
    "svenska producentprisindex",
    "importpriser Sverige",
    "Mycronic order",
    "Mycronic aktie",
    "Alleima Q3 2026",
    "Stockholmsbörsen idag",
    "BörsSverige"
  ],
  internalLinking: {
    topics: [
      "Sverige",
      "Stockholmsbörsen",
      "producentpriser",
      "importpriser",
      "industrikostnader",
      "orderingång",
      "kvartalsrapport"
    ],
    companies: ["Mycronic", "Alleima", "Alfa Laval", "Electrolux"],
    tickers: ["MYCR", "ALLEI", "ALFA", "ELUX B"],
    relatedNewsSlugs: [
      "borssverige-25-oktober-2026",
      "borssverige-24-oktober-2026",
      "norden-i-centrum-26-oktober-2026",
      "borssverige-23-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Måndagens första svenska makrobesked blev tydligt: producentprisindex steg 3,4 procent i september jämfört med augusti och 11,2 procent jämfört med samma månad 2025. Årstakten var 6,8 procent i augusti.",
    "Samtidigt meddelar Mycronic att bolaget fått en kombinationsorder på en maskritare och ett mätsystem värd 12–14 miljoner dollar från en befintlig kund i Asien.",
    "Dagens stora svenska rapportpunkt ligger fortfarande framför marknaden. Alleima publicerar Q3 omkring klockan 11.30. Stockholmsbörsen hade inte öppnat vid artikelns bryttid och därför anges ingen kursreaktion."
  ],
  sections: [
    {
      heading: "Producentpriserna ökar på samtliga marknader",
      paragraphs: [
        "SCB:s nya septemberutfall visar att priserna steg brett. Exportmarknadspriserna ökade 3,6 procent från augusti, importmarknadspriserna 4,5 procent och hemmamarknadspriserna 3,3 procent.",
        "På årsbasis steg producentprisindex 11,2 procent. Importprisindex ökade 15,5 procent, exportprisindex 12,4 procent och hemmamarknadsprisindex 10,2 procent.",
        "Utfallet besvarar den öppna fråga som söndagens BörsSverige och morgonens Norden-artikel pekade ut: kostnadstrycket lättade inte i september utan förstärktes tydligt i både månads- och årstakt."
      ]
    },
    {
      heading: "Varför kostnadssignalen spelar roll för börsbolagen",
      paragraphs: [
        "Producentpriser mäter prisutvecklingen tidigare i värdekedjan än konsumentprisindex. Den snabba uppgången blir därför relevant för industribolag, importörer och konsumentbolag när investerare bedömer inköpskostnader och marginaler.",
        "Det går inte att översätta indexet mekaniskt till ett enskilt bolags resultat. Företagens valutasäkring, avtal, produktmix och möjlighet att föra kostnader vidare skiljer sig åt.",
        "Men den breda prisuppgången höjer betydelsen av bolagens kommentarer om råvaror, valuta, prissättning och marginaler under resten av rapportperioden."
      ]
    },
    {
      heading: "Mycronic får order på 12–14 miljoner dollar",
      paragraphs: [
        "Mycronic har fått en order på maskritaren Prexision Lite 8 Evo och mätsystemet Prexision MMS från en befintlig kund i Asien. Ordervärdet ligger i intervallet 12–14 miljoner dollar.",
        "Maskritaren planeras att levereras under andra kvartalet 2027 och mätsystemet under tredje kvartalet 2027. Beställningen ger därmed framtida leveranser snarare än en omedelbar intäkt i dagens kvartal.",
        "Bolaget beskriver Prexision Lite 8 Evo som en lösning för kostnadseffektiv produktion av fotomasker för bildskärmar. Mätsystemet används för kvalitetssäkring genom att kontrollera mönstrets position på fotomasken."
      ]
    },
    {
      heading: "Alleima blir nästa svenska industrikontroll",
      paragraphs: [
        "Alleima publicerar sina finansiella resultat för tredje kvartalet omkring klockan 11.30 och håller webcast klockan 13.00. Rapportutfallet fanns därför inte tillgängligt vid bryttiden.",
        "I andra kvartalet ökade omsättningen 3 procent till 4 896 miljoner kronor och organiskt 2 procent. Justerat rörelseresultat blev 519 miljoner kronor, motsvarande en marginal på 10,6 procent, medan fritt operativt kassaflöde uppgick till 330 miljoner kronor.",
        "Dagens viktigaste kontrollpunkter blir om den organiska ordertillväxten håller i sig, hur kortcyklisk efterfrågan utvecklas och om marginal samt kassaflöde står emot ett fortsatt osäkert marknadsläge."
      ]
    },
    {
      heading: "Det här följer vi härnäst",
      paragraphs: [
        "Efter öppning kan marknaden väga den starkare kostnadssignalen mot bolagsspecifika besked. Den första verifierbara uppföljningen kommer med Alleimas rapport klockan 11.30.",
        "På tisdag följer Alfa Laval, där söndagens artikel pekade ut efterfrågan, orderingång och kassaflöde som centrala frågor. Senare i veckan kommer svensk konsumtion, BNP-indikator, detaljhandel och konjunkturbarometrar.",
        "Tillsammans avgör datapunkterna om stigande kostnadstryck möts av tillräckligt stark efterfrågan och prissättningskraft – eller om marginalrisken ökar."
      ]
    }
  ],
  sources: [
    {
      text: "SCB: officiell statistiknyhet och nyckeltal för producent-, import-, export- och hemmamarknadspriser i september 2026, publicerade 26 oktober 2026",
      href: "https://www.scb.se/hitta-statistik/statistik-efter-amne/priser-och-ekonomiska-tendenser/priser/prisindex-i-producent-och-importled-ppi/"
    },
    {
      text: "Mycronic: bolagets pressmeddelande via MFN om order på maskritare och mätsystem värd 12–14 miljoner dollar, publicerat 26 oktober 2026 klockan 08.00",
      href: "https://mfn.se/a/mycronic/mycronic-erhaller-order-pa-en-maskritare-och-ett-matsystem"
    },
    {
      text: "Alleima: officiell inbjudan med publiceringstid för Q3-resultatet och webcast den 26 oktober 2026",
      href: "https://www.alleima.com/en/news-media/archive/2026/10/invitation-to-the-presentation-of-alleimas-q3-2026-interim-report/"
    },
    {
      text: "Alleima: officiell Q2-rapport med omsättning, orderingång, justerad EBIT-marginal och fritt operativt kassaflöde, publicerad 17 juli 2026",
      href: "https://www.alleima.com/en/news-media/archive/2026/07/alleima-interim-report-q2-2026/"
    }
  ]
};
