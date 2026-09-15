import type { NewsArticle } from "@/types/news";

/**
 * Bolaget i fokus — SBB, 15 september 2026.
 * Editorial research cutoff: approximately 11:30 CEST, 15 september 2026.
 * P0 Fact Gate: PASS before publication handoff.
 *
 * Primary source: SBB's regulatory announcement published 15 September 2026
 * at 07:30 CEST regarding the proposed buy-back and cancellation of all D shares.
 * Secondary cross-check: EFN / Nyhetsbyrån Direkt, 15 September 2026.
 *
 * Canonical series master image:
 * public/news-demo/bolaget-i-fokus-2026-09-15.png
 *
 * No intraday share-price reaction after the research cutoff is stated as fact.
 */
export const BOLAGET_I_FOKUS_SBB_15_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "bolaget-i-fokus-sbb-15-september-2026",
  slug: "bolaget-i-fokus-sbb-d-aktien-15-september-2026",
  title:
    "Bolaget i fokus: SBB vill skrota D-aktien – erbjuder 7,94 kronor eller 1,567 B-aktier",
  summary:
    "SBB:s styrelse vill fasa ut samtliga D-aktier. Ägarna föreslås få 7,94 kronor kontant eller 1,567 nya B-aktier per D-aktie, men upplägget kräver beslut på en extra bolagsstämma den 23 oktober.",
  category: "company",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-15T11:35:00+02:00",
  url: "/news/bolaget-i-fokus-sbb-d-aktien-15-september-2026",
  featured: true,
  imageUrl: "/news-demo/bolaget-i-fokus-2026-09-15.png",
  thumbnailImageUrl: "/news-demo/bolaget-i-fokus-2026-09-15.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "Bolaget i fokus – DivLabs omslagsbild för artikelserien om ett enskilt börsbolag.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 6,
  seoTitle: "SBB vill skrota D-aktien – 7,94 kr eller B-aktier",
  seoDescription:
    "SBB vill lösa in samtliga D-aktier. Förslaget ger 7,94 kronor kontant eller 1,567 B-aktier per D-aktie och ska avgöras på extra stämma.",
  seoKeywords: [
    "SBB",
    "SBB D",
    "SBB B",
    "SBB D-aktie",
    "SBB återköp",
    "SBB inlösen",
    "Samhällsbyggnadsbolaget",
    "D-aktier",
    "fastighetsaktier",
    "Bolaget i fokus",
    "15 september 2026",
  ],
  internalLinking: {
    topics: [
      "fastigheter",
      "kapitalstruktur",
      "återköp",
      "inlösen",
      "D-aktier",
      "bolagsstämma",
    ],
    companies: ["SBB", "Samhällsbyggnadsbolaget i Norden"],
    tickers: ["SBB B", "SBB D"],
  },
  showDisclaimer: true,
  intro: [
    "Samhällsbyggnadsbolaget i Norden, SBB, vill göra en stor förändring i sin kapitalstruktur. Styrelsen föreslår att samtliga D-aktier ska försvinna genom ett frivilligt återköp följt av en obligatorisk inlösen av de D-aktier som återstår.",
    "Förslaget är ännu inte beslutat. Det ska behandlas på en extra bolagsstämma som SBB avser att hålla den 23 oktober 2026. För D-aktieägarna är den centrala frågan vilket vederlag som erbjuds och hur processen är tänkt att gå till.",
  ],
  sections: [
    {
      heading: "SBB vill ta bort hela D-aktieslaget",
      paragraphs: [
        "Styrelsens förslag innebär att SBB först vill genomföra ett återköpserbjudande riktat till ägarna av D-aktier. Därefter ska de D-aktier som finns kvar lösas in obligatoriskt genom en minskning av aktiekapitalet.",
        "Målet är alltså inte ett mindre återköpsprogram där en del aktier försvinner. Om förslaget godkänns är avsikten att D-aktien ska fasas ut helt som aktieslag och därefter avnoteras.",
        "SBB uppger att det finns omkring 149 miljoner utestående D-aktier, exklusive de D-aktier som bolaget redan äger självt. Det motsvarar drygt 8 procent av bolagets totala aktiekapital enligt pressmeddelandet.",
      ],
    },
    {
      heading: "7,94 kronor kontant eller 1,567 nya B-aktier",
      paragraphs: [
        "I det frivilliga återköpserbjudandet föreslås varje D-aktie kunna bytas mot antingen 7,94 kronor kontant eller 1,567 nyemitterade B-aktier i SBB.",
        "De D-aktier som inte lämnas in i återköpserbjudandet ska enligt förslaget senare lösas in obligatoriskt för 7,94 kronor per aktie.",
        "SBB anger att kontantvederlaget på 7,94 kronor motsvarar bolagets långsiktiga substansvärde per stamaktie den 30 juni 2026. Bolaget räknar också med att nivån motsvarar en premie på 45,42 procent mot D-aktiens stängningskurs den 14 september och 33,47 procent mot den volymviktade genomsnittskursen under de föregående 20 handelsdagarna, som SBB anger till 5,95 kronor.",
        "KPMG har lämnat ett så kallat fairness opinion som enligt SBB stödjer att vederlaget är skäligt för bolagets aktieägare. Det är samtidigt viktigt att skilja det från en rekommendation till en enskild aktieägare om vilket alternativ som är bäst.",
      ],
    },
    {
      heading: "D-aktien har blivit ett problem för kapitalstrukturen",
      paragraphs: [
        "Bakgrunden är den särskilda utdelningsmekaniken i SBB:s D-aktie. D-aktien har rätt till fem gånger den totala utdelningen på A- och B-aktierna, men som mest 2 kronor per D-aktie och år. Om utdelningen blir lägre än taket höjs utdelningsgränsen framåt enligt villkoren.",
        "SBB har inte lämnat utdelning på sina stamaktier sedan 2024. Bolaget uppger därför att den ackumulerade höjningen av utdelningsgränsen för D-aktien når 5 kronor vid utgången av tredje kvartalet 2026 och fortsätter att öka med 0,50 kronor per kvartal så länge ingen utdelning beslutas.",
        "Styrelsens bedömning är att konstruktionen begränsar bolagets möjlighet att återuppta utdelningar, ta in nytt eget kapital och använda aktier som betalning i framtida affärer. Det är SBB:s egen motivering till varför D-aktien nu föreslås försvinna.",
      ],
    },
    {
      heading: "Extra stämma måste säga ja – och kraven är höga",
      paragraphs: [
        "Förslaget är villkorat av beslut på en extra bolagsstämma som är tänkt att hållas den 23 oktober 2026.",
        "För att paketet ska godkännas krävs enligt SBB både stöd från minst två tredjedelar av de röster och aktier som är representerade på stämman och stöd från minst två tredjedelar av de D-aktier som är representerade.",
        "SBB hänvisar också till ett uttalande från Aktiemarknadsnämnden, 2026:45, där nämnden enligt bolaget bedömer att transaktionsstrukturen och beslutsprocessen är förenliga med god sed på den svenska aktiemarknaden.",
      ],
    },
    {
      heading: "Så ser den preliminära tidsplanen ut",
      paragraphs: [
        "Om processen går vidare enligt SBB:s preliminära plan ska informationsdokumentet publiceras den 22 oktober och den extra bolagsstämman hållas dagen därpå, den 23 oktober.",
        "Acceptperioden för återköpserbjudandet är tänkt att löpa från den 27 oktober till den 10 november. Slutligt utfall är planerat till den 11 november och betalning i återköpserbjudandet till den 16 november.",
        "För den efterföljande inlösenprocessen anges den 23 november som preliminär avstämningsdag och den 26 november som dag för utbetalning och avregistrering av D-aktierna från Euroclear och Nasdaq Stockholm.",
        "Alla dessa datum är en del av en indikativ tidsplan och förutsätter att de nödvändiga besluten faktiskt fattas.",
      ],
    },
    {
      heading: "Det här blir viktigast att följa",
      paragraphs: [
        "Nästa avgörande steg är den formella kallelsen och beslutsunderlaget inför den extra bolagsstämman. Där framgår de slutliga villkoren som aktieägarna ska ta ställning till.",
        "Det blir också viktigt att följa hur D-aktieägarna ställer sig till förslaget, eftersom stödet inom just D-aktieslaget är en egen del av majoritetskravet.",
        "SBB uppger att återköpet, inlösen och den uppskjutna kupongräntan på hybridobligationerna ska finansieras med befintlig likviditet och tillgängliga kreditfaciliteter. Bolaget säger att transaktionen inte påverkar förmågan att möta övriga finansiella åtaganden. Det är ett bolagspåstående som blir relevant att följa mot kommande rapportering och genomförandet av transaktionen.",
        "Bolaget i fokus skiljer här på vad som är beslutat och vad som fortfarande är ett förslag. D-aktierna finns kvar tills stämman har godkänt upplägget och processen därefter har genomförts.",
      ],
    },
  ],
  sources: [
    {
      text: "SBB – styrelsens förslag om återköp och inlösen av D-aktier, 15 september 2026",
      href: "https://www.investegate.info/announcement/mfn/samhallsbyggnadsbolaget-i-norden-ab--0aas/the-board-of-directors-of-sbb-is-taking-the-n-/9771435",
    },
    {
      text: "EFN / Nyhetsbyrån Direkt – SBB föreslår återköp och inlösen av D-aktier",
      href: "https://efn.se/sbb-foreslar-aterkop-och-inlosen-av-d-aktier",
    },
  ],
};
