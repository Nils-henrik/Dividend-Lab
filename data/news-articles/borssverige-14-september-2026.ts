import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 14 September 2026.
 *
 * Editorial research cutoff: 08:24 CEST, 14 September 2026.
 * Primary-source anchors:
 * - SCB Snabb-KPI for August, published 7 September: preliminary CPI 0.3%,
 *   CPIF 0.7%, CPIF-XE 0.5%; definitive August release scheduled for 08:00 today.
 *   The definitive release was not yet retrievable from the verified source set
 *   at cutoff, so this edition clearly labels the figures as preliminary.
 * - Hemnet financial calendar: preliminary August net sales/listing update is
 *   scheduled for 14 September. The fresh August release was not yet retrievable
 *   from the verified primary source at cutoff, so no August Hemnet figure is stated.
 * - Hemnet July update, published 21 August: net sales SEK 90.4m (-17.2% YoY),
 *   paid ARPL SEK 8,502 (+12.0%), published listings 8.1k (-9.5%).
 *
 * Market status at cutoff: Nasdaq Stockholm had not yet opened. No share-price
 * reaction for today's Swedish companies is stated as fact.
 *
 * Image generation fallback: the automation connector cannot safely commit the
 * generated binary PNG. Per AUTOREDATION_V1_1.md, imageUrl/thumbnailImageUrl are
 * therefore null rather than declaring a broken generated path.
 */
export const BORSSVERIGE_14_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-14-september-2026-inflation-hemnet",
  slug: "borssverige-14-september-2026-inflation-hemnet",
  title: "BörsSverige 14 september: Inflation och Hemnet i fokus inför öppning",
  summary:
    "Svensk inflation och Hemnets nya månadsdata står i centrum inför måndagens handel. SCB:s preliminära augustisiffror visade KPIF-inflation på 0,7 procent, medan Hemnets senaste verifierade månadsutfall visade fortsatt lägre omsättning men högre intäkt per betald annons.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-09-14T08:24:00+02:00",
  url: "/news/borssverige-14-september-2026-inflation-hemnet",
  featured: true,
  imageUrl: null,
  thumbnailImageUrl: null,
  imageAlt: null,
  imageCaption: null,
  readingMinutes: 4,
  seoTitle: "BörsSverige 14 september: Inflation och Hemnet i fokus",
  seoDescription:
    "Svensk inflation och Hemnet står i fokus inför Stockholmsbörsens öppning. Läs dagens BörsSverige med verifierade siffror och dagens hållpunkter.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsen idag",
    "svenska börsnyheter",
    "svenska aktier",
    "inflation Sverige",
    "KPIF augusti 2026",
    "SCB inflation",
    "Hemnet",
    "Hemnet aktie",
    "Hemnet omsättning",
    "14 september 2026",
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "inflation", "räntor", "bostadsmarknaden"],
    companies: ["Hemnet"],
    tickers: ["HEM"],
    relatedNewsSlugs: [
      "borssverige-8-september-2026",
      "borssverige-7-september-2026-rejlers-multiconsult",
      "borssverige-4-september-2026-sectra",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Inflationen och bostadsmarknaden ger två tydliga svenska hållpunkter inför måndagens handel på Stockholmsbörsen. SCB:s preliminära snabbestimat för augusti visade att KPIF-inflationen låg kvar på 0,7 procent, samtidigt som den vanliga KPI-inflationen steg marginellt till 0,3 procent.",
    "Den definitiva augustipubliceringen var planerad till klockan 08.00 i dag, men den färska primärkällan gick ännu inte att verifiera i researchflödet när den här upplagan stängdes klockan 08.24. Därför använder BörsSverige inte någon obekräftad definitiv siffra. Hemnet har samtidigt en planerad månadsuppdatering för augusti i dag; även där väntar vi med nya tal tills de finns verifierade hos bolaget.",
  ],
  sections: [
    {
      heading: "Preliminär KPIF-inflation kvar på 0,7 procent",
      paragraphs: [
        "SCB:s Snabb-KPI för augusti visade en preliminär inflationstakt enligt KPI på 0,3 procent, upp från 0,2 procent i juli. Från juli till augusti sjönk KPI med 0,3 procent.",
        "KPIF, som är Riksbankens målvariabel, låg enligt snabbestimatet kvar på 0,7 procent. KPIF exklusive energi sjönk samtidigt från 0,6 till 0,5 procent.",
        "Det placerar den preliminära KPIF-inflationen tydligt under Riksbankens mål på 2 procent. För börsen är inflationen viktig eftersom den påverkar förväntningarna på räntor, hushållens ekonomi och värderingen av räntekänsliga bolag.",
        "De här siffrorna är uttryckligen preliminära. BörsSverige uppdaterar inte dem till definitiva tal förrän den ordinarie SCB-publiceringen kan verifieras från primärkällan.",
      ],
    },
    {
      heading: "Hemnets augustisiffror är dagens bolagshållpunkt",
      paragraphs: [
        "Hemnet har i sin finansiella kalender lagt dagens datum för publicering av nettoomsättning och annonsvolymer för augusti. Uppdateringen är särskilt intressant efter att bolaget under året delvis gått över till modellen Sälj först, betala sen, som flyttar tidpunkten när vissa annonsintäkter redovisas.",
        "I den senast verifierade månadsuppdateringen, för juli, uppgick Hemnets nettoomsättning till 90,4 miljoner kronor jämfört med 109,2 miljoner ett år tidigare. Det motsvarade en minskning på 17,2 procent.",
        "Samtidigt steg den genomsnittliga intäkten per betald annons, ARPL, med 12 procent till 8 502 kronor. Antalet publicerade annonser var 8 100, cirka 10 procent färre än i juli 2025, medan antalet betalda annonser var 6 700.",
        "Hemnet betonade i juliuppdateringen att Sälj först, betala sen skapar en redovisningseffekt: intäkten för en sådan annons bokförs när bostaden säljs i stället för när annonsen publiceras. En del av nedgången i jämförelsetalen handlar därför om förskjutning mellan perioder och inte nödvändigtvis om att intäkten försvinner.",
      ],
    },
    {
      heading: "Vad marknaden behöver se från Hemnet",
      paragraphs: [
        "Augustiutfallet kan ge en ny datapunkt på tre frågor: om annonsvolymerna stabiliseras, om ARPL fortsätter växa och hur stor redovisningseffekten från den nya betalmodellen är när fler objekt hunnit säljas.",
        "För investerare är kombinationen viktigare än en enskild omsättningssiffra. Högre intäkt per annons är positivt för intäktskraften, men lägre volymer och en förändrad intäktsföring gör utvecklingen svårare att läsa månad för månad.",
        "BörsSverige anger inte någon augustisiffra innan den finns verifierad i Hemnets egen publicering. Det minskar risken att en sekundär uppgift eller förhandsnotering blandas ihop med bolagets regulatoriska data.",
      ],
    },
    {
      heading: "Det här följer vi när Stockholmsbörsen öppnar",
      paragraphs: [
        "Stockholmsbörsen öppnar klockan 09.00. Eftersom researchen stängdes före öppning beskriver den här morgonupplagan inga svenska aktier som stigande eller fallande i dagens handel.",
        "Först står den definitiva svenska inflationsbilden i fokus när den kan verifieras. Därefter blir Hemnets augustiuppdatering en tydlig bolagsspecifik datapunkt för bostadsplattformen och för synen på den svenska bostadsmarknaden.",
        "Dagens utgångsläge är därför ovanligt datadrivet: låg svensk inflation talar för fortsatt fokus på ränteläget, medan Hemnets siffror kan visa hur bostadsannonsmarknaden och bolagets nya betalmodell utvecklas efter sommaren.",
      ],
    },
  ],
};
