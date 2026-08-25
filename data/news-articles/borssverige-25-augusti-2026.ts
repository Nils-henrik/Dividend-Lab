import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 25 August 2026.
 *
 * Publication cutoff: 08:28 CEST, before the Stockholm market open.
 * Primary sources checked:
 * - Ellos Holding AB (publ), Half-year report January–June 2026, published 25 Aug 2026 via Cision.
 * - SCB, Ekonomisk statistik på kvartal, Q2 2026, published 25 Aug 2026.
 *
 * Market reaction is intentionally not included before trading starts.
 */
export const BORSSVERIGE_25_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "borssverige-25-augusti-2026",
  slug: "borssverige-25-augusti-2026",
  title:
    "BörsSverige – 25 augusti: Ellos växer men resultatet pressas inför öppningen",
  summary:
    "Ellos ökar försäljningen med nära 6 procent i Q2, men det redovisade resultatet försvagas tydligt. Samtidigt ger SCB ny kvartalsstatistik över det svenska näringslivet inför börsöppningen.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-25T08:28:00+02:00",
  url: "/news/borssverige-25-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_000000002824824686410de9781cb587.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 25 augusti 2026 med Stockholm vid vattnet i varmt morgonljus.",
  imageCaption: "Bild: DivLab.",
  readingMinutes: 5,
  seoTitle:
    "BörsSverige 25 augusti: Ellos Q2 och ny statistik från SCB",
  seoDescription:
    "Ellos ökar försäljningen i Q2 men resultatet pressas. Samtidigt publicerar SCB ny statistik över svenska näringslivet. BörsSverige inför öppningen.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen",
    "börsen idag",
    "Ellos",
    "Ellos Group",
    "Ellos Q2 2026",
    "SCB",
    "svenska näringslivet",
    "svenska aktier",
    "börsnyheter",
    "börsen 25 augusti 2026",
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "Q2 2026", "svensk konjunktur"],
    companies: ["Ellos Group"],
    tickers: ["ELLOS"],
  },
  showDisclaimer: true,
  intro: [
    "Ellos Group ökar försäljningen i årets andra kvartal, men den redovisade lönsamheten försvagas tydligt. Samtidigt har SCB på tisdagsmorgonen publicerat ny kvartalsstatistik över utvecklingen i det svenska näringslivet.",
    "Det ger två tydliga svenska hållpunkter inför Stockholmsbörsens öppning: en färsk rapport från ett nyintroducerat börsbolag och en bredare temperaturmätning på företagssektorn.",
  ],
  sections: [
    {
      heading: "Ellos försäljning ökar med nära 6 procent",
      paragraphs: [
        "Ellos Group redovisar en nettoomsättning på 848,3 miljoner kronor för Q2 2026, jämfört med 800,9 miljoner kronor under motsvarande kvartal förra året. Det innebär en försäljningsökning på 5,9 procent. Den underliggande försäljningstillväxten uppgick till 5,0 procent.",
        "Vd Hans Ohlsson uppger att tillväxten drevs av bolagets egna varumärken inom mode och heminredning. Enligt bolaget utvecklades samtliga e-handelsplatser positivt, både i Norden och på de nyare europeiska marknaderna.",
        "Det justerade EBITA-resultatet blev 41,8 miljoner kronor, i stort sett oförändrat från 41,7 miljoner kronor ett år tidigare. Den justerade EBITA-marginalen sjönk samtidigt till 4,9 procent, från 5,2 procent.",
      ],
    },
    {
      heading: "Svagare resultat längre ned i resultaträkningen",
      paragraphs: [
        "Trots den högre försäljningen försvagades det redovisade resultatet tydligt. Rörelseresultatet uppgick till −0,1 miljoner kronor, jämfört med 24,1 miljoner kronor under Q2 2025.",
        "Resultatet efter skatt blev −37,9 miljoner kronor, mot −1,0 miljoner kronor ett år tidigare.",
        "Ellos uppger samtidigt att bolaget fortsatt investera i strategiskt prioriterade produktkategorier och i att rekrytera nya kunder. Det bidrog till högre marknadsföringskostnader under kvartalet.",
        "Kassaflödet från den löpande verksamheten utvecklades däremot positivt och steg till 90,7 miljoner kronor, från 62,1 miljoner kronor.",
        "Rapporten ger därmed en tudelad bild. Försäljningen växer och den justerade EBITA-nivån är i princip oförändrad, men marginalen backar och det redovisade resultatet är betydligt svagare än under motsvarande period förra året.",
      ],
    },
    {
      heading: "Extra intressant efter sommarens börsnotering",
      paragraphs: [
        "Rapporten får ytterligare betydelse eftersom Ellos Group är ett nytt bolag på Stockholmsbörsen. Aktien började handlas på Nasdaq Stockholm den 8 juli 2026 under kortnamnet ELLOS. Dagens rapport är därmed den första Q2-rapporten sedan börsnoteringen.",
        "Någon marknadsreaktion går ännu inte att slå fast eftersom Stockholmsbörsen inte har öppnat när denna artikel skrivs. Hur aktien tar emot rapporten blir därför en av morgonens saker att följa efter klockan 09.00.",
      ],
    },
    {
      heading: "Ny temperaturmätning på det svenska näringslivet",
      paragraphs: [
        "SCB publicerade klockan 08.00 på tisdagen Ekonomisk statistik på kvartal för Q2 2026.",
        "Statistiken ger en bred bild av utvecklingen inom det svenska näringslivet och omfattar bland annat företagens lönsamhet, förädlingsvärde, fasta bruttoinvesteringar och lagerinvesteringar.",
        "Uppgifterna används även som underlag i SCB:s kvartalsvisa BNP-beräkningar och fungerar som indikatorer på konjunkturläget.",
        "För börsen är statistiken därför relevant som bakgrund till hur svenska företag går in i andra halvåret. Den kan ge ytterligare information om hur produktion, kostnader, vinster och investeringar utvecklas i näringslivet inför den ordinarie BNP-publiceringen för Q2 senare i veckan.",
      ],
    },
    {
      heading: "BörsSverige inför öppningen",
      paragraphs: [
        "Tisdagens svenska morgon handlar därmed mindre om breda internationella börsrörelser och mer om färska svenska företagsdata.",
        "Ellos visar att försäljningen går åt rätt håll, men också att högre omsättning ännu inte har översatts till starkare redovisad lönsamhet. Samtidigt ger SCB:s nya Q2-statistik en bredare bild av förutsättningarna för svenska företag.",
        "För Ellos blir nästa besked marknadens eget. När handeln öppnar klockan 09.00 får vi den första riktiga värdemätaren på hur investerarna bedömer bolagets första Q2-rapport som börsnoterat företag.",
      ],
    },
  ],
  sources: [
    {
      text: "Ellos Holding AB (publ) – Halvårsrapport januari–juni 2026, Cision, 25 augusti 2026",
      href: "https://news.cision.com/se/ellos-group/r/ellos-holding-ab--publ--halvarsrapport-januari---juni-2026,c4387124",
    },
    {
      text: "SCB – Ekonomisk statistik på kvartal, 2:a kvartalet 2026, 25 augusti 2026",
      href: "https://www.scb.se/hitta-statistik/statistik-efter-amne/naringsverksamhet-och-utrikeshandel/foretagens-produktion-forsaljning-och-ekonomi--kortperiodisk-statistik/ekonomisk-statistik-pa-kvartal/pong/statistiknyhet/ekonomisk-statistik-pa-kvartal-2a-kvartalet-2026/",
    },
  ],
};
