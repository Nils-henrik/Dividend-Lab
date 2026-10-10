import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 10 oktober 2026.
 * Editorial research cutoff: 2026-10-10T08:22:47+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.scb.se/hitta-statistik/statistik-efter-amne/nationalrakenskaper/ovrigt/nationalrakenskaper-ovrigt/pong/statistiknyhet/nationalrakenskaper-ovrigt-bnp-indikator-manad-augusti-2026/
 * P0_SOURCE[primary]: https://www.scb.se/hitta-statistik/statistik-efter-amne/naringsverksamhet-och-utrikeshandel/foretagens-produktion-forsaljning-och-ekonomi--kortperiodisk-statistik/produktionsvardeindex/pong/statistiknyhet/produktionsvardeindex-pvi-augusti-2026/
 * P0_SOURCE[primary]: https://corporate.prisjakt.nu/prisjakt-har-stamt-google-pa-cirka-214-miljarder-kronor-vid-patent-och-marknadsdomstolen-i-stockholm/
 * P0_SOURCE[primary]: https://www.mfn.se/a/sleep-cycle/sleep-cycle-foreslar-forvarv-av-audiowell-genom-apportemission
 */
export const BORSSVERIGE_10_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-10-oktober-2026",
  slug: "borssverige-10-oktober-2026",
  title: "Veckan som gått: BNP ökade 1,1 procent – Prisjakt stämmer Google på 21,4 miljarder",
  summary:
    "SCB:s augustidata gav ett tydligt styrkebesked från svensk ekonomi. Samtidigt stämde Prisjakt Google på cirka 21,4 miljarder kronor och Sleep Cycle föreslog ett omvänt miljardförvärv.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-10T08:23:00+02:00",
  url: "/news/borssverige-10-oktober-2026",
  featured: true,
  imageUrl: "/news/generated/borssverige-2026-10-10.png",
  thumbnailImageUrl: "/news/generated/borssverige-2026-10-10.png",
  imageAlt: "BörsSverige 2026-10-10 – DivLabs morgonöversikt över svenska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Svensk BNP ökade 1,1 procent – veckans viktigaste besked",
  seoDescription:
    "Svensk BNP ökade 1,1 procent i augusti. Prisjakt stämmer Google på 21,4 miljarder och Sleep Cycle föreslår ett omvänt miljardförvärv.",
  seoKeywords: [
    "svensk BNP augusti 2026",
    "Prisjakt Google stämning",
    "Sleep Cycle Audiowell",
    "svensk industri augusti 2026",
    "Stockholmsbörsen veckan som gått",
    "BörsSverige",
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "BNP", "industriproduktion", "företagsförvärv"],
    companies: ["Prisjakt", "Google", "Sleep Cycle", "Audiowell"],
    tickers: ["SLEEP"],
    relatedNewsSlugs: [
      "borssverige-9-oktober-2026",
      "borssverige-8-oktober-2026",
      "norden-i-centrum-10-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Veckans sista svenska statistikbesked gav ett tydligare styrketecken än den preliminära inflationssiffran tidigare i veckan. SCB:s BNP-indikator ökade 1,1 procent i augusti jämfört med juli, säsongsrensat, och 3,5 procent jämfört med augusti 2025, kalenderkorrigerat.",
    "Samtidigt kom två ovanligt stora bolagsbesked. Prisjakt har väckt talan mot Google och kräver cirka 21,4 miljarder kronor i skadestånd, medan Sleep Cycle föreslår att köpa Audiowell för 2,255 miljarder kronor genom en apportemission som skulle förändra hela ägarbilden.",
  ],
  sections: [
    {
      heading: "SCB gav svar på veckans öppna aktivitetsfråga",
      paragraphs: [
        "Efter veckans preliminära inflationsutfall var fredagens aktivitetsdata nästa centrala kontrollpunkt. BNP-indikatorn ökade 1,1 procent från juli till augusti. Jämfört med samma månad föregående år var ökningen 3,5 procent. SCB beskriver uppgången som bred och pekar särskilt på hushållskonsumtion och varuproduktion.",
        "Produktionsvärdeindex förstärkte bilden, men visade också en tydlig skillnad mellan sektorer. Näringslivets totala produktion ökade 0,5 procent från juli och 3,8 procent från augusti 2025. Industrin steg 5,4 procent på månaden och 5,8 procent på året, medan tjänsteproduktionen minskade 0,8 procent från juli men låg 3,4 procent högre än ett år tidigare.",
        "Det är ett verifierat svar på frågan om den svenska aktiviteten hade fortsatt framåt: augustiutfallet var starkt. Men både BNP-indikatorn och produktionsvärdeindex är preliminära och kan revideras. En enskild månad räcker därför inte för att slå fast en varaktigt högre tillväxttakt.",
      ],
    },
    {
      heading: "Prisjakt kräver 21,4 miljarder kronor av Google",
      paragraphs: [
        "Efter börsens stängning på fredagen meddelade Prisjakt att bolaget lämnat in en stämningsansökan mot Google vid Patent- och marknadsdomstolen i Stockholm. Det begärda skadeståndet är cirka 21,4 miljarder kronor.",
        "Talan gäller påstått missbruk av dominerande ställning i anslutning till Google Shopping-ärendet och den efterföljande perioden. Beloppet är ett krav, inte ett tilldömt skadestånd eller en säker framtida betalning.",
        "Prisjakt anger också att det belopp som slutligen kan tillfalla bolaget beror på dom eller förlikning, fördelning till berörda parter samt kostnader för extern processfinansiering. Nästa avgörande kontrollpunkter blir domstolens handläggning och Googles svar på talan.",
      ],
    },
    {
      heading: "Sleep Cycles affär ritar om bolaget",
      paragraphs: [
        "Sleep Cycles styrelse föreslår ett omvänt förvärv av Audiowell för 2,255 miljarder kronor. Köpeskillingen ska betalas med 92 042 212 nya aktier till teckningskursen 24,50 kronor. För de befintliga ägarna motsvarar emissionen cirka 82 procents utspädning.",
        "Efter ett genomförande skulle Audiowell Group äga cirka 82 procent av Sleep Cycle och de nuvarande ägarna cirka 18 procent. Audiowell redovisade 378 miljoner kronor i omsättning och 216 miljoner kronor i rörelseresultat 2025, motsvarande en rörelsemarginal på 57 procent.",
        "Affären kräver bland annat godkännande på extra bolagsstämma den 11 november och myndighetsgodkännande för utländska direktinvesteringar. Slutförandet är planerat till fjärde kvartalet. Om affären genomförs har den nya kontrollägaren meddelat att ett budpliktsbud på resterande aktier ska lämnas till 24,50 kronor per aktie.",
      ],
    },
    {
      heading: "Det här följer vi nästa vecka",
      paragraphs: [
        "SCB publicerar nästa BNP-indikator, för september, den 29 oktober. Nästa produktionsvärdeindex kommer den 10 november. Fram till dess blir kommande bolagsrapporter viktiga för att pröva om den breda styrkan i augustidata syns i orderingång, volymer och marginaler.",
        "För Prisjakt saknar fredagens besked en fast tidplan för domstolsprocessen. För Sleep Cycle är extrastämman den 11 november den första fasta beslutspunkten, följd av myndighetsprövning och ett möjligt genomförande under fjärde kvartalet.",
        "Några kursrörelser för lördagen anges inte eftersom Stockholmsbörsen är stängd. De materiella beskeden bör bedömas utifrån verifierade villkor och kommande beslut, inte utifrån en antagen marknadsreaktion.",
      ],
    },
  ],
  sources: [
    {
      text: "SCB: BNP-indikatorn för augusti 2026 med månads- och årsförändring samt nästa publicering",
      href: "https://www.scb.se/hitta-statistik/statistik-efter-amne/nationalrakenskaper/ovrigt/nationalrakenskaper-ovrigt/pong/statistiknyhet/nationalrakenskaper-ovrigt-bnp-indikator-manad-augusti-2026/",
    },
    {
      text: "SCB: Produktionsvärdeindex för augusti 2026 med utfall för näringslivet, industrin och tjänstesektorn",
      href: "https://www.scb.se/hitta-statistik/statistik-efter-amne/naringsverksamhet-och-utrikeshandel/foretagens-produktion-forsaljning-och-ekonomi--kortperiodisk-statistik/produktionsvardeindex/pong/statistiknyhet/produktionsvardeindex-pvi-augusti-2026/",
    },
    {
      text: "Prisjakt: stämningsansökan mot Google vid Patent- och marknadsdomstolen och begärt skadestånd",
      href: "https://corporate.prisjakt.nu/prisjakt-har-stamt-google-pa-cirka-214-miljarder-kronor-vid-patent-och-marknadsdomstolen-i-stockholm/",
    },
    {
      text: "Sleep Cycle via MFN: villkoren för det föreslagna omvända förvärvet av Audiowell",
      href: "https://www.mfn.se/a/sleep-cycle/sleep-cycle-foreslar-forvarv-av-audiowell-genom-apportemission",
    },
  ],
};
