import type { NewsArticle } from "@/types/news";

/**
 * Bolaget i fokus — 11 november 2026.
 * Editorial research cutoff: 2026-11-11T11:03:41+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.hansabiopharma.com/media/press-releases/2026/hansa-biopharma-reports-third-quarter-and-interim-year-to-date-2026-financial-results/
 * P0_SOURCE[primary]: https://www.hansabiopharma.com/media/press-releases/2026/hansa-biopharma-announces-closing-of-115-million-licensing-transaction-with-serb-pharmaceuticals-for-idefirix-in-europe-and-mena/
 * P0_SOURCE[primary]: https://www.hansabiopharma.com/media/press-releases/2026/hansa-biopharma-enters-into-115-million-licensing-agreement-with-serb-pharmaceuticals-for-idefirix-in-europe-and-mena/
 */
export const BOLAGET_I_FOKUS_HANSA_BIOPHARMA_11_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "bolaget-i-fokus-hansa-biopharma-11-november-2026",
  slug: "bolaget-i-fokus-hansa-biopharma-11-november-2026",
  title: "Bolaget i fokus: Hansa fyller USA-kassan – FDA-datumet blir nästa test",
  summary:
    "Hansa Biopharmas kassa stiger till 1,34 miljarder kronor efter SERB-affären. Q3-intäkterna domineras av licensposter, medan FDA:s beslut om imlifidase den 19 december blir nästa avgörande kontrollpunkt.",
  category: "company",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-11T11:03:46+01:00",
  url: "/news/bolaget-i-fokus-hansa-biopharma-11-november-2026",
  featured: true,
  readingMinutes: 4,
  seoTitle: "Hansa Biopharma Q3 2026: kassan stärks inför FDA-besked",
  seoDescription:
    "Hansa Biopharma har 1,34 miljarder kronor i kassan efter SERB-affären. Läs om Q3-resultatet, USA-satsningen och FDA-datumet 19 december.",
  seoKeywords: [
    "Hansa Biopharma Q3 2026",
    "Hansa Biopharma rapport",
    "Hansa Biopharma aktie",
    "imlifidase FDA",
    "Idefirix SERB",
    "PDUFA 19 december 2026",
    "HNSA",
    "Bolaget i fokus"
  ],
  internalLinking: {
    topics: [
      "bioteknik",
      "läkemedel",
      "njurtransplantation",
      "licensaffär",
      "FDA",
      "USA-lansering",
      "kassaflöde",
      "forskningspipeline",
      "sällsynta sjukdomar"
    ],
    companies: ["Hansa Biopharma", "SERB Pharmaceuticals"],
    tickers: ["HNSA"],
    relatedNewsSlugs: [
      "borssverige-11-november-2026",
      "norden-i-centrum-11-november-2026",
      "bolaget-i-fokus-bahnhof-9-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Hansa Biopharma är dagens Bolaget i fokus efter en rapport som framför allt förändrar finansieringsbilden. Likvida medel uppgick till 1 337,2 miljoner kronor vid utgången av september, jämfört med 252,1 miljoner ett år tidigare.",
    "Kassalyftet kommer från licensaffären med SERB, inte från en plötslig försäljningsökning i den löpande produktverksamheten. Av kvartalets intäkter på 143,0 miljoner kronor var 121,6 miljoner licensintäkt och 20,8 miljoner leverans- och serviceintäkt kopplad till SERB.",
    "Det nya handlingsutrymmet ska användas inför en möjlig USA-lansering av imlifidase. FDA har satt den 19 december 2026 som beslutsdatum, vilket gör nästa dryga månad viktigare än själva kvartalsjämförelsen."
  ],
  sections: [
    {
      heading: "SERB-affären förklarar nästan hela intäktslyftet",
      paragraphs: [
        "Hansas intäkter steg till 143,0 miljoner kronor i tredje kvartalet från 30,8 miljoner ett år tidigare. Jämförelsen ser stark ut, men intäktsmixen har förändrats helt.",
        "Produktförsäljningen var noll kronor, jämfört med 30,1 miljoner i Q3 2025. I stället redovisade Hansa 121,6 miljoner kronor i licensintäkt och 20,8 miljoner i leverans- och serviceintäkt från SERB.",
        "Bolaget betonar därför att perioderna inte är direkt jämförbara. SERB har tagit över den exklusiva kommersialiseringen av Idefirix inom transplantation i Europa och MENA, medan Hansa koncentrerar mer av sin kommersiella organisation på USA."
      ]
    },
    {
      heading: "115 miljoner euro ger Hansa ett nytt finansiellt läge",
      paragraphs: [
        "Licensaffären värderas till totalt 115 miljoner euro. Hansa fick 110 miljoner euro i förskottsbetalning efter att affären stängde den 1 juli. Ytterligare 5 miljoner euro ska betalas när EMA accepterar ansökan om fullständigt godkännande av Idefirix.",
        "Kassaflödet från den löpande verksamheten blev 964,4 miljoner kronor i kvartalet, jämfört med minus 106,9 miljoner ett år tidigare. Även detta domineras av engångsbetalningen och ska inte läsas som normal kvartalsvis kassagenerering.",
        "Affären flyttar samtidigt kommersiellt ansvar och långsiktiga uppföljningsåtaganden till SERB i Europa och MENA. För Hansa frigörs kapital och ledningsfokus inför USA, men bolaget blir också mer beroende av att den amerikanska lanseringsplanen lyckas."
      ]
    },
    {
      heading: "Förlusten består trots den starkare kassan",
      paragraphs: [
        "Rörelseförlusten minskade till 138,6 miljoner kronor från 147,6 miljoner. Nettoförlusten ökade däremot till 178,5 miljoner kronor från 148,3 miljoner.",
        "Försäljnings- och administrationskostnaderna steg till 147,6 miljoner kronor från 88,4 miljoner. Forsknings- och utvecklingskostnaderna minskade till 65,4 miljoner från 70,2 miljoner.",
        "Det är den centrala skillnaden mellan likviditet och lönsamhet. Hansa har fått betydligt mer tid och finansiell styrka, men verksamheten måste fortfarande bära en kommersiell organisation, kliniska program och förberedelser för en eventuell USA-lansering."
      ]
    },
    {
      heading: "FDA-datumet den 19 december är den stora katalysatorn",
      paragraphs: [
        "FDA accepterade Hansas ansökan om biologiskt läkemedelsgodkännande för imlifidase i februari 2026 och satte den 19 december som PDUFA-datum. Då väntas myndigheten fatta beslut om ansökan enligt den nuvarande tidsplanen.",
        "Imlifidase är utvecklat för att klyva IgG-antikroppar snabbt. I njurtransplantation är målet att möjliggöra transplantation för högsensitiserade patienter som annars riskerar att avvisas mot en tillgänglig donator.",
        "Ett godkännande skulle öppna vägen för den USA-lansering som SERB-affärens kapital ska stödja. Ett försenat eller negativt besked skulle i stället skjuta fram den viktigaste kommersiella värdedrivaren och förlänga perioden med höga förberedelsekostnader."
      ]
    },
    {
      heading: "Australien och nästa enzym breddar berättelsen",
      paragraphs: [
        "Under kvartalet behandlades den första kommersiella patienten i Australien med Idefirix inför en njurtransplantation från levande donator. Det markerar starten för kommersiell användning på den australiska marknaden.",
        "Efter kvartalet lämnade Hansa också in en IND-ansökan till FDA för HNSA-5487 inom Guillain-Barrés syndrom. Programmet bygger vidare på bolagets teknik för att klyva IgG-antikroppar, men befinner sig tidigare i utvecklingen än imlifidase.",
        "För investerare är imlifidase i USA fortfarande huvudfrågan. Australien och HNSA-5487 ger fler möjliga värdedrivare, men de ersätter inte behovet av regulatorisk och kommersiell leverans i den amerikanska transplantationsmarknaden."
      ]
    },
    {
      heading: "Vad händer härnäst?",
      paragraphs: [
        "Hansa håller sin rapportpresentation klockan 14.00 CET i dag. Eventuella nya kommentarer efter artikelns cutoff ingår inte i denna publicering.",
        "Den första kontrollpunkten är hur bolaget beskriver lanseringsberedskap, kostnadsnivå och kommersiell kapacitet i USA. Därefter följer FDA:s beslutsdatum den 19 december.",
        "Någon kursreaktion anges inte. Artikeln använder inte en fördröjd eller odaterad marknadsnotering som om den vore verifierad handel nära cutoff."
      ]
    }
  ],
  sources: [
    {
      text: "Hansa Biopharma: regulatorisk Q3-rapport publicerad den 11 november 2026 klockan 07.00 CET med intäkter, kostnader, resultat, kassaflöde, likvida medel, SERB-intäkter, Australien och HNSA-5487",
      href: "https://www.hansabiopharma.com/media/press-releases/2026/hansa-biopharma-reports-third-quarter-and-interim-year-to-date-2026-financial-results/"
    },
    {
      text: "Hansa Biopharma: regulatoriskt besked den 1 juli 2026 om slutförd licensaffär med SERB, geografisk omfattning, totalvärde 115 miljoner euro och betalningsstruktur",
      href: "https://www.hansabiopharma.com/media/press-releases/2026/hansa-biopharma-announces-closing-of-115-million-licensing-transaction-with-serb-pharmaceuticals-for-idefirix-in-europe-and-mena/"
    },
    {
      text: "Hansa Biopharma: regulatoriskt avtal den 19 maj 2026 med USA-strategi, väg mot lönsamhet samt FDA:s PDUFA-datum den 19 december 2026 för imlifidase",
      href: "https://www.hansabiopharma.com/media/press-releases/2026/hansa-biopharma-enters-into-115-million-licensing-agreement-with-serb-pharmaceuticals-for-idefirix-in-europe-and-mena/"
    }
  ]
};
