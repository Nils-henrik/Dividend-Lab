import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 27 August 2026.
 *
 * Publication cutoff: before the Stockholm market open.
 * Primary sources checked immediately before publication:
 * - Boliden, acquisition of controlling stake in Nexa Resources, 27 Aug 2026.
 * - Elekta IR calendar and reporting cycle.
 * - Finwire/Placera with FactSet consensus for Elekta Q1 2026/27.
 *
 * Market reaction is intentionally not included before trading starts.
 */
export const BORSSVERIGE_27_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "borssverige-27-augusti-2026",
  slug: "borssverige-27-augusti-2026",
  title:
    "BörsSverige 27 augusti: Boliden köper Nexa-kontrollpost – Elekta slår förväntningarna",
  summary:
    "Boliden köper en kontrollpost på 64,68 procent i Nexa Resources i en aktieaffär värd cirka 1,31 miljarder dollar. Samtidigt slår Elekta vinstförväntningarna i Q1 2026/27 trots lägre försäljning än väntat.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-27T08:15:00+02:00",
  url: "/news/borssverige-27-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/borssverige-2026-08-27.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 27 augusti 2026 inför Stockholmsbörsens öppning, med Boliden och Elekta i fokus.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle:
    "Boliden köper Nexa-kontrollpost – Elekta slår förväntningarna",
  seoDescription:
    "Boliden köper 64,68 procent av Nexa Resources och Elekta slår vinstförväntningarna i Q1 2026/27. BörsSverige inför Stockholmsbörsen 27 augusti.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen",
    "Stockholmsbörsen idag",
    "börsnyheter idag",
    "svenska aktier",
    "Boliden",
    "Boliden aktie",
    "Boliden Nexa",
    "Boliden förvärv",
    "Nexa Resources",
    "Elekta",
    "Elekta aktie",
    "Elekta rapport",
    "Elekta Q1 2026/27",
    "27 augusti 2026",
  ],
  internalLinking: {
    topics: [
      "Stockholmsbörsen",
      "svenska aktier",
      "gruvbolag",
      "medicinteknik",
      "rapportperioden",
    ],
    companies: ["Boliden", "Elekta"],
    tickers: ["BOL", "EKTA B"],
    relatedNewsSlugs: ["borssverige-26-augusti-2026"],
  },
  showDisclaimer: true,
  intro: [
    "Boliden står för torsdagens största svenska bolagsnyhet inför öppningen på Stockholmsbörsen. Gruv- och smältverksbolaget har avtalat om att köpa Votorantims kontrollpost på 64,68 procent i Nexa Resources, en affär som värderar posten till cirka 1,31 miljarder dollar.",
    "Samtidigt kommer Elekta med ett klart starkare resultat än väntat i sitt Q1 2026/27. Försäljningen var svagare än analytikernas prognoser, men lönsamheten förbättrades tydligt. Här är det viktigaste i BörsSverige den 27 augusti före börsöppningen.",
  ],
  sections: [
    {
      heading: "Boliden köper 64,68 procent av Nexa Resources",
      paragraphs: [
        "Boliden och Votorantim har tecknat ett slutgiltigt avtal där Boliden förvärvar samtliga Nexa-aktier som Votorantim äger. Posten motsvarar 64,68 procent av aktierna och rösterna i Nexa Resources och ger därmed Boliden kontroll över bolaget när transaktionen har slutförts.",
        "Den implicita köpeskillingen för kontrollposten är 1,31 miljarder dollar, motsvarande cirka 12,5 miljarder kronor med den växelkurs som Boliden använder i affärsunderlaget. På 100-procentig basis värderas Nexas eget kapital till cirka 2,03 miljarder dollar och företagsvärdet till cirka 3,67 miljarder dollar.",
        "Nexa har gruv- och smältverksverksamhet i Latinamerika och är framför allt exponerat mot zink, koppar, bly och silver. För Boliden innebär affären en betydligt större geografisk spridning och en tydlig förstärkning inom zink och silver. Efter ett slutförande skulle den kombinerade verksamheten omfatta 12 gruvenheter och åtta smältverksenheter i Europa och Latinamerika.",
      ],
    },
    {
      heading: "Nya Boliden-aktier betalar affären – utspädningen blir cirka 7 procent",
      paragraphs: [
        "Votorantim får inte kontant betalning för kontrollposten. I stället ska Boliden emittera 21,4 miljoner nya aktier till Votorantim, som efter affären väntas äga cirka 7 procent av Boliden. För dagens Boliden-ägare innebär nyemissionen en utspädning på ungefär 7 procent.",
        "Det är en central del när marknaden ska värdera Boliden-aktien. Utspädningen är negativ för den befintliga ägarandelen, men Boliden räknar samtidigt med att Nexa ska bidra positivt till vinsten per aktie direkt efter genomförandet. Bolagets bedömning är att bidraget till vinst per aktie överstiger 8 procent.",
        "Boliden har dessutom kommit överens med Nexa om att efter slutförandet lämna ett frivilligt kontanterbjudande till de aktieägare som då fortfarande äger Nexa-aktier. För att skapa finansiell flexibilitet har Boliden säkrat en bryggfinansiering på 2 miljarder dollar. Om transaktionen hade varit genomförd den 30 juni skulle den kombinerade nettoskuldsättningsgraden enligt Boliden ha varit omkring 33 procent, jämfört med Bolidens rapporterade 24 procent.",
        "Affären är ännu inte genomförd. Den kräver bland annat godkännande från Bolidens aktieägare vid en extra bolagsstämma och regulatoriska godkännanden. Boliden räknar med att kontrollposten kan tillträdas under första kvartalet 2027.",
      ],
    },
    {
      heading: "Elekta slår vinstförväntningarna i Q1 2026/27",
      paragraphs: [
        "Elekta står för morgonens andra tydliga svenska börsbesked. Medicinteknikbolagets nettoomsättning blev 3 536 miljoner kronor i Q1 2026/27, jämfört med 3 646 miljoner ett år tidigare. FactSets analytikerkonsensus låg på 3 635 miljoner kronor, vilket innebär att försäljningen kom in cirka 2,7 procent under förväntan.",
        "På resultatsidan var bilden betydligt starkare. Justerat rörelseresultat blev 395 miljoner kronor, mot väntade 318 miljoner. Det är drygt 24 procent över konsensus. Den justerade rörelsemarginalen steg samtidigt till 11,2 procent från 6,4 procent ett år tidigare och var högre än konsensus på 8,7 procent.",
        "Orderingången uppgick till 3 910 miljoner kronor, nästan exakt i linje med analytikernas prognos på 3 915 miljoner. I konstanta valutakurser ökade orderingången med 3 procent och det var tredje kvartalet i rad med ökad orderingång.",
        "Elekta upprepar också sin prognos för hela räkenskapsåret 2026/27: en nettoomsättningstillväxt på 2–4 procent i konstanta valutakurser och en justerad EBIT-marginal på 12,5–13,5 procent. För Elekta-aktien blir därför frågan vid öppningen om marknaden lägger störst vikt vid den tydligt förbättrade lönsamheten eller den svagare försäljningen.",
      ],
    },
    {
      heading: "Därför rapporterar Elekta Q1 när många andra bolag är i Q2",
      paragraphs: [
        "Att Elekta rapporterar Q1 i slutet av augusti kan se märkligt ut när många svenska börsbolag just nu redovisar Q2. Förklaringen är att Elekta har brutet räkenskapsår och inte följer kalenderåret januari–december.",
        "Elektas räkenskapsår löper från maj till april. Därför omfattar bolagets Q1 perioden maj–juli, Q2 maj–oktober ackumulerat och helåret avslutas i april. Rapporten den 27 augusti är alltså Elektas aktuella första kvartal för räkenskapsåret 2026/27 – inte en gammal Q1-rapport.",
        "Det är också därför Elektas nästa kvartalsrapport, Q2 2026/27, ligger i slutet av november medan flera andra bolag då redan har kommit längre i sina kalenderårsbaserade rapportperioder.",
      ],
    },
    {
      heading: "Det här följer vi när Stockholmsbörsen öppnar",
      paragraphs: [
        "Stockholmsbörsen har ännu inte öppnat när den här artikeln publiceras, så någon faktisk kursreaktion ska inte slås fast i förväg. Boliden och Elekta är däremot två av de tydligaste svenska aktierna att följa från klockan 09.00.",
        "För Boliden blir marknadens första bedömning av Nexa-affären central: hur investerarna väger den större zink- och silverexponeringen och den förväntade vinstökningen mot utspädningen och den högre skuldsättningen. Boliden håller dessutom en press- och analytikerkonferens om transaktionen klockan 09.30.",
        "Elekta presenterar sin Q1-rapport klockan 10.00. Där blir kommentarer om försäljningstillväxt, kostnadsnivå, orderingång och vägen mot helårsmarginalen särskilt viktiga. Inför öppningen är torsdagens svenska huvudbild därför tydlig: en stor strukturell affär i Boliden och en resultatmässig överraskning från Elekta.",
      ],
    },
  ],
  sources: [
    {
      text: "Boliden – Boliden förvärvar kontrollpost i Nexa Resources, 27 augusti 2026",
      href: "https://investors.boliden.com/sv/press/boliden-forvarvar-kontrollpost-i-nexa-resources",
    },
    {
      text: "Placera/Finwire – Elektas justerade resultat klart högre än väntat, 27 augusti 2026",
      href: "https://www.placera.se/nyheter/elektas-justerade-resultat-klart-hogre-an-vantat-2026-08-27",
    },
    {
      text: "Elekta – Invitation to the presentation of Elekta’s first quarter 2026/27, 13 augusti 2026",
      href: "https://ir.elekta.com/investors/press-releases/2026/invitation-to-the-presentation-of-elektas-first-quarter-202627/",
    },
    {
      text: "Elekta – Reports & presentations, rapportcykel maj–april",
      href: "https://ir.elekta.com/investors/reports-presentations/",
    },
  ],
};
