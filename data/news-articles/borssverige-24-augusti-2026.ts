import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 24 August 2026.
 *
 * Publication cutoff: 08:18 CEST, before the Stockholm market open.
 * Primary sources checked:
 * - SCB, Bygglov, nybyggnad och ombyggnad, preliminary Q2/H1 2026 release (24 Aug 2026).
 * - Lyko Group AB / Wolt, partnership announcement (24 Aug 2026, 07:00 CEST).
 * - Episurf Medical AB, strategic review / pure-play property company announcement (22 Aug 2026, 20:00 CEST).
 *
 * Market reaction is intentionally not included before trading starts.
 * No visible raw source list in the article according to DivLab's editorial standard.
 */
export const BORSSVERIGE_24_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "borssverige-24-augusti-2026",
  slug: "borssverige-24-augusti-2026",
  title:
    "BörsSverige – 24 augusti: Bostadsbyggandet ökar – Lyko tar Wolt-vägen och Episurf lämnar medtech",
  summary:
    "Bostadsbyggandet ökade under första halvåret, men småhusen går mot strömmen. Samtidigt öppnar Lyko en ny distributionskanal via Wolt och Episurf tar nästa steg i omvandlingen till fastighetsbolag.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-24T08:18:00+02:00",
  url: "/news/borssverige-24-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_00000000c794820a8db16763aebb3bf0.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 24 augusti 2026 med Stockholm vid vattnet i varmt morgonljus.",
  imageCaption: "Bild: DivLab.",
  readingMinutes: 6,
  seoTitle:
    "BörsSverige 24 augusti: Lyko, Episurf och bostadsbyggandet",
  seoDescription:
    "Bostadsbyggandet ökar, Lyko samarbetar med Wolt och Episurf lämnar den operativa medtech-verksamheten. BörsSverige inför öppningen.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen",
    "börsen idag",
    "bostadsbyggande",
    "SCB bostäder",
    "Lyko",
    "Wolt",
    "Episurf",
    "svenska aktier",
    "börsnyheter",
    "börsen 24 augusti 2026",
  ],
  showDisclaimer: true,
  intro: [
    "Stockholmsbörsen går in i en ny vecka med ett ovanligt tunt rapportprogram på måndagen. I stället är det färsk svensk bostadsstatistik och ett par tydliga bolagsbesked som sätter tonen inför öppningen.",
    "SCB:s preliminära siffror visar att bostadsbyggandet ökade under första halvåret jämfört med samma period i fjol, samtidigt som småhusbyggandet fortsatte ned. På bolagsfronten inleder Lyko ett nordiskt samarbete med Wolt, medan Episurf påskyndar sin omvandling från medicinteknik till fastigheter.",
  ],
  sections: [
    {
      heading: "Bostadsbyggandet ökar – men småhusen fortsätter ned",
      paragraphs: [
        "Preliminärt påbörjades omkring 15 350 nya bostadslägenheter i Sverige under första halvåret 2026. Det är 8 procent fler än under motsvarande period 2025.",
        "Bakom totalsiffran finns däremot en tydlig skillnad mellan olika delar av marknaden. Omkring 12 700 bostäder påbörjades i flerbostadshus inklusive specialbostäder, en ökning med 16 procent. Samtidigt påbörjades omkring 2 650 bostäder i småhus, vilket är 18 procent färre än ett år tidigare.",
        "Statistiken pekar alltså mot en försiktig återhämtning i delar av bostadsbyggandet, men inte en bred vändning. Att flerbostadshusen ökar samtidigt som småhusen minskar visar att hushållens och byggaktörernas förutsättningar fortfarande skiljer sig kraftigt mellan segmenten.",
        "För börsen är utvecklingen framför allt relevant för svenska bygg-, bostadsutvecklings- och fastighetsbolag. En uthållig uppgång i nyproduktionen skulle på sikt kunna förbättra efterfrågan i flera led av byggkedjan, men dagens siffror är preliminära och räcker inte ensamma för att slå fast att den svenska byggsvackan är över.",
        "SCB räknar dessutom upp den senaste periodens preliminära uppgifter för att kompensera för eftersläpande kommunrapportering. Det är därför viktigare att följa riktningen över flera publiceringar än att läsa in för mycket i en enskild totalsiffra.",
      ],
    },
    {
      heading: "Lyko öppnar ny distributionskanal via Wolt",
      paragraphs: [
        "Lyko meddelade klockan 07.00 att bolaget inleder ett partnerskap med Wolt. Kunder ska kunna beställa tusentals produkter inom beauty, hårvård, hudvård och hygien genom Wolt-appen med lokala leveranser.",
        "Leveranserna blir tillgängliga från 34 Lyko-butiker i Sverige, Finland och Norge, däribland flaggskeppsbutikerna i Stockholm, Helsingfors och Oslo.",
        "För Lyko är det framför allt en ny distributionskanal. Bolaget har redan byggt sin position kring e-handel, app och fysiska butiker, och Wolt-samarbetet lägger till ett snabbare lokalt leveransalternativ för kunder som prioriterar tillgänglighet och kort leveranstid.",
        "Det är däremot för tidigt att dra slutsatser om vilken ekonomisk effekt samarbetet får. Nyheten säger inget om volymer, marginaler eller hur stor del av Lykos försäljning som på sikt kan komma via Wolt. Det viktigaste inför börsöppningen är därför den strategiska signalen: Lyko testar ännu ett sätt att flytta sortimentet närmare kunden.",
      ],
    },
    {
      heading: "Episurf lämnar den operativa medtech-verksamheten",
      paragraphs: [
        "Episurf Medical går samtidigt vidare med en betydligt större förändring. Under helgen meddelade bolaget att omvandlingen till ett renodlat nordiskt fastighetsbolag ska påskyndas och att resurser och kapital framöver ska koncentreras till fastighetsverksamheten.",
        "Styrelsen har beslutat att inleda en ordnad avveckling av den operativa medicintekniska verksamheten. Episurf bedömer att en försäljning eller avknoppning i nuvarande form skulle kräva en lång process och betydande resurser. I stället ska bolaget försöka realisera värdet i patentportföljen och andra immateriella tillgångar.",
        "Det förändrar också hur aktien behöver förstås. Episurf har historiskt förknippats med det individanpassade implantatet Episealer, men när fastigheter blir kärnverksamheten flyttas fokus mot sådant som fastighetsvärden, hyresintäkter, finansiering, belåning och kassaflöden.",
        "Omställningen sker dessutom snabbt. Bara den 20 augusti meddelade Episurf en avsiktsförklaring om att förvärva en fastighetsportfölj med ett överenskommet fastighetsvärde på omkring 505 miljoner kronor. Bolaget har även meddelat att finansiering för Lilium- och Setune-förvärven är på plats och att tillträde planeras till den 31 augusti.",
        "För dagens handel är Episurf därför ett av de tydligaste svenska bevakningscasen. Det är inte en vanlig kvartalsuppdatering utan en förändring av vad bolaget i praktiken ska vara framöver.",
      ],
    },
    {
      heading: "Det här är viktigast inför öppningen",
      paragraphs: [
        "Måndagens svenska nyhetsbild är inte fylld av tunga storbolagsrapporter. Det gör att de enskilda beskeden kan få större uppmärksamhet än under en normal rapportmorgon.",
        "Bostadsstatistiken är dagens bredaste svenska datapunkt och ger en försiktigt bättre bild av byggandet, men småhusnedgången visar att återhämtningen är ojämn. Lyko presenterar en konkret ny distributionskanal, medan Episurf genomför en betydligt mer genomgripande förändring av hela bolagets inriktning.",
        "Stockholmsbörsen öppnar klockan 09.00. Fram till dess går det inte att slå fast hur marknaden värderar morgonens besked, och BörsSverige skiljer därför på verifierade nyheter före öppningen och den faktiska kursreaktionen när handeln väl är igång.",
      ],
    },
  ],
};
