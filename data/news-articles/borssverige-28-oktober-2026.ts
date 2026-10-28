import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 28 oktober 2026.
 * Editorial research cutoff: 2026-10-28T08:28:00+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.ssab.com/sv-se/nyhetsrum/nyheter/2026/10/rapport-for-tredje-kvartalet-2026
 * P0_SOURCE[primary]: https://www.ssab.com/sv-se/nyhetsrum/nyheter/2026/07/rapport-for-andra-kvartalet-2026
 * P0_SOURCE[primary]: https://www.scb.se/hitta-statistik/statistik-efter-amne/hushallens-ekonomi/hushallens-utgifter/hushallens-konsumtion/pong/statistiknyhet/hushallens-konsumtionsindikator-september-2026-veckoindikator-till-och-med-vecka-40-2026/
 * P0_SOURCE[primary]: https://www.peab.com/financial-info/
 */
export const BORSSVERIGE_28_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-28-oktober-2026",
  slug: "borssverige-28-oktober-2026",
  title: "SSAB lyfter mot fjolåret – men Q3-resultatet bromsar 20 procent från Q2",
  summary:
    "SSAB höjer rörelseresultatet till 2,16 miljarder kronor mot fjolåret, men resultatet faller cirka 20 procent från Q2. Samtidigt visar SCB starkare hushållskonsumtion och rapportdagen fortsätter med Peab före öppning.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-28T08:28:30+01:00",
  url: "/news/borssverige-28-oktober-2026",
  featured: true,
  imageAlt: "BörsSverige 28 oktober 2026 – SSAB:s kvartalsrapport och svenska marknadssignaler.",
  readingMinutes: 5,
  seoTitle: "SSAB Q3 2026: resultatet stiger men bromsar från Q2",
  seoDescription:
    "SSAB:s rörelseresultat steg till 2,16 miljarder kronor mot fjolåret men föll 20 procent från Q2. SCB:s konsumtionsdata och Peab står också i fokus.",
  seoKeywords: [
    "SSAB Q3 2026",
    "SSAB rapport",
    "SSAB aktie",
    "hushållens konsumtion",
    "Peab rapport",
    "Stockholmsbörsen idag",
    "BörsSverige"
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "rapportperiod", "stål", "industrikonjunktur", "hushållskonsumtion"],
    companies: ["SSAB", "Peab"],
    tickers: ["SSAB A", "PEAB B"],
    relatedNewsSlugs: [
      "norden-i-centrum-28-oktober-2026",
      "borssverige-27-oktober-2026",
      "borssverige-26-oktober-2026",
      "borssverige-25-oktober-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "SSAB sätter den svenska tonen inför onsdagens börsöppning. Rörelseresultatet steg jämfört med fjolåret, hjälpt av högre priser och leveranser, men den sekventiella bilden är svalare: resultatet föll med cirka 20 procent från andra kvartalet.",
    "Det är den fördjupning som skiljer dagens BörsSverige från morgonens nordiska översikt. För svenska investerare är frågan inte bara om Q3 blev bättre än i fjol, utan om nedväxlingen från Q2 och de högre underhållskostnaderna förändrar vinsttakten inför årets slut.",
    "Stockholmsbörsen hade ännu inte öppnat vid artikelns bryttid. Därför beskrivs ingen kursreaktion och inget orsakssamband mellan rapporterna och dagens handel."
  ],
  sections: [
    {
      heading: "SSAB förbättras mot fjolåret",
      paragraphs: [
        "SSAB:s intäkter uppgick till 25 632 miljoner kronor i tredje kvartalet, jämfört med 22 960 miljoner ett år tidigare. Rörelseresultatet steg till 2 157 miljoner kronor från 1 869 miljoner.",
        "Resultatet per aktie ökade till 1,56 kronor från 1,49 kronor. Nettokassan var 8,4 miljarder kronor, jämfört med 10,8 miljarder ett år tidigare.",
        "Bolaget förklarar resultatförbättringen med högre stålpriser och högre leveranser. SSAB Europe ökade leveranserna inom flera premiumsegment, däribland avancerade stål till fordonsindustrin."
      ]
    },
    {
      heading: "Men kvartalstakten bromsar tydligt",
      paragraphs: [
        "Jämförelsen med andra kvartalet ger en mer försiktig bild. Då var intäkterna 27 489 miljoner kronor och rörelseresultatet 2 695 miljoner. Q3-intäkterna blev därmed cirka 6,8 procent lägre och rörelseresultatet cirka 20 procent lägre sekventiellt.",
        "Skillnaden är relevant eftersom tredje kvartalet innehöll planerat underhåll. Underhållskostnaden uppgick till 810 miljoner kronor, jämfört med 390 miljoner ett år tidigare. Bolaget ska slutföra årets planerade underhåll under fjärde kvartalet.",
        "Nettokassan var samtidigt nära Q2-nivån på 8,6 miljarder kronor. Balansräkningen är alltså fortsatt nettokassapositiv, men vinsttakten gick ned mellan kvartalen trots den bättre jämförelsen mot 2025."
      ]
    },
    {
      heading: "Omställningsprojekten håller tidsplanen",
      paragraphs: [
        "SSAB uppger att konverteringen av Oxelösund fortskrider enligt plan, med produktionsstart planerad till andra kvartalet 2027.",
        "Markarbetena för det nya stålverket i Luleå fortsätter och projektet ligger enligt bolaget kvar på plan för produktionsstart sent 2029.",
        "För investerare blir nästa kontrollpunkt därför dubbel: dels hur priser, leveranser och återstående underhåll påverkar Q4, dels om de stora omställningsprojekten fortsätter utan nya tids- eller kostnadsavvikelser."
      ]
    },
    {
      heading: "Konsumtionen ger stöd åt hemmamarknaden",
      paragraphs: [
        "SCB:s konsumtionsindikator visar att hushållens konsumtion ökade 1,1 procent i september jämfört med augusti och 3,5 procent jämfört med september 2025. Talen är fastprisberäknade, kalenderkorrigerade och säsongrensade.",
        "Nio av elva skattade konsumtionsändamål utvecklades positivt på månadsbasis. Möbler, hushållsutrustning och rutinunderhåll av bostaden ökade 7,1 procent på årsbasis, medan transport ökade 6,9 procent.",
        "Samtidigt reviderades augusti ned till minus 0,4 procent mot juli. Septemberutfallet ger därmed en tydlig förbättring, men det följer på en svagare föregående månad än vad den första publiceringen visade."
      ]
    },
    {
      heading: "Peab och resten av rapportdagen",
      paragraphs: [
        "Peab har lagt sin Q3-publicering till klockan 08.00 och presentationen till klockan 09.00. Vid bryttiden var bolagets fullständiga rapportdata ännu inte tillräckligt stabilt tillgängliga i de verifierade primärkällorna för att tas in i P0-granskningen.",
        "Det innebär att SSAB förblir den verifierade huvudrapporten i morgonbilden. Peabs orderläge, marginal och kassaflöde blir nästa svenska kontrollpunkt när den fullständiga rapporten kan läsas mot bolagets egna uppgifter.",
        "Senare under dagen väntas även rapporter från LKAB och Epiroc. De låg efter artikelns bryttid och har därför inte behandlats som inträffade händelser."
      ]
    },
    {
      heading: "Vad marknaden behöver väga efter öppningen",
      paragraphs: [
        "SSAB:s rapport innehåller två sanna men olika berättelser: en förbättring mot fjolåret och en tydlig inbromsning mot Q2. Den första visar att pris och leveransläge är bättre än för ett år sedan; den andra visar att underhåll och kvartalsmix fortfarande kan ge stora resultatsvängningar.",
        "SCB:s konsumtionsdata ger samtidigt ett starkare svenskt efterfrågetecken, men nedrevideringen av augusti påminner om att en enskild månad inte räcker för att fastställa en stabil trend.",
        "Efter börsöppningen blir den relevanta kontrollen hur SSAB och Peab handlas mot verifierade rapportdetaljer. Den bedömningen görs först med färsk marknadsdata efter klockan 09.00."
      ]
    }
  ],
  sources: [
    {
      text: "SSAB: officiell Q3-rapport med intäkter, rörelseresultat, resultat per aktie, nettokassa, underhåll och projekttidsplaner, publicerad 28 oktober 2026 klockan 07.30 CET",
      href: "https://www.ssab.com/sv-se/nyhetsrum/nyheter/2026/10/rapport-for-tredje-kvartalet-2026"
    },
    {
      text: "SSAB: officiell Q2-rapport med jämförelsetal för intäkter, rörelseresultat och nettokassa, publicerad 22 juli 2026",
      href: "https://www.ssab.com/sv-se/nyhetsrum/nyheter/2026/07/rapport-for-andra-kvartalet-2026"
    },
    {
      text: "SCB: hushållens konsumtionsindikator för september 2026 med månads-, års- och revisionsdata, publicerad 14 oktober 2026 klockan 08.00",
      href: "https://www.scb.se/hitta-statistik/statistik-efter-amne/hushallens-ekonomi/hushallens-utgifter/hushallens-konsumtion/pong/statistiknyhet/hushallens-konsumtionsindikator-september-2026-veckoindikator-till-och-med-vecka-40-2026/"
    },
    {
      text: "Peab: officiell finansiell information om Q3-publicering klockan 08.00 och presentation klockan 09.00 den 28 oktober 2026",
      href: "https://www.peab.com/financial-info/"
    }
  ]
};
