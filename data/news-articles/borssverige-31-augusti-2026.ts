import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 31 August 2026.
 *
 * Editorial research cutoff: 08:42 CEST, 31 August 2026.
 * Primary/authoritative sources checked immediately before publication:
 * - AcadeMedia, Q4/year-end communication for July 2025-June 2026 and the
 *   preliminary Q4 release from 16 July 2026.
 * - Nanologica, interim report Q2 2026, published 08:10 CEST today.
 * - Mycronic, Q2 2026 report, Capital Markets Day invitation and order update.
 * - Sveriges Riksbank, calendar for Per Jansson's speech today.
 *
 * Stockholm market had not opened at the research cutoff, so no market
 * reaction is stated as fact before trading starts.
 *
 * Cover:
 * public/news-demo/file_0000000024c481f48471140aa5b85782.png
 */
export const BORSSVERIGE_31_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "borssverige-31-augusti-2026",
  slug: "borssverige-31-augusti-2026",
  title:
    "BörsSverige 31 augusti: AcadeMedia bekräftar starkt Q4 – Nanologica lyfter omsättningen",
  summary:
    "AcadeMedia bekräftar de starka Q4-siffror som förhandskommunicerades i juli, men något utdelningsförslag lämnas ännu inte. Nanologica ökar omsättningen kraftigt efter Syntagon-förvärvet och senare i dag håller Mycronic kapitalmarknadsdag i Täby.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-31T08:42:00+02:00",
  url: "/news/borssverige-31-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_0000000024c481f48471140aa5b85782.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 31 augusti 2026 med Stockholm i morgonljus inför måndagens handel på Stockholmsbörsen.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle:
    "BörsSverige 31 augusti 2026: AcadeMedia, Nanologica och Mycronic",
  seoDescription:
    "AcadeMedia bekräftar starkt Q4 men väntar med utdelningsförslag. Nanologica lyfter omsättningen efter Syntagon och Mycronic håller kapitalmarknadsdag.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsnyheter idag",
    "svenska aktier",
    "AcadeMedia",
    "AcadeMedia Q4 2026",
    "Nanologica",
    "Nanologica Q2 2026",
    "Mycronic",
    "Mycronic kapitalmarknadsdag",
    "Riksbanken",
    "31 augusti 2026",
  ],
  internalLinking: {
    topics: [
      "Stockholmsbörsen",
      "Q4 2025/26",
      "Q2 2026",
      "kapitalmarknadsdag",
      "Riksbanken",
    ],
    companies: ["AcadeMedia", "Nanologica", "Mycronic"],
    tickers: ["ACAD", "NICA", "MYCR"],
    relatedNewsSlugs: [
      "norden-i-centrum-31-augusti-2026",
      "borsvecka-36-2026-jobbrapport-broadcom-euroinflation",
      "borssverige-28-augusti-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Måndagens BörsSverige öppnar med två färska svenska rapportbesked. AcadeMedia bekräftar ett starkt avslut på räkenskapsåret, men de viktigaste Q4-siffrorna var redan kända sedan juli. Det nya fokuset hamnar därför bland annat på den fortsatta internationella expansionen och att styrelsen ännu inte lämnar något utdelningsförslag.",
    "Klockan 08.10 publicerade Nanologica sin Q2-rapport. Omsättningen stiger kraftigt efter förvärvet av Syntagon, samtidigt som förlusten i själva kvartalet ökar. Senare under dagen riktas dessutom blickarna mot Mycronic, som håller kapitalmarknadsdag efter ett mycket starkt första halvår och hög efterfrågan kopplad till avancerad elektronik och AI-infrastruktur.",
  ],
  sections: [
    {
      heading: "AcadeMedia bekräftar starkt Q4 – utdelningsbeskedet dröjer",
      paragraphs: [
        "AcadeMedia redovisar en omsättning på 5 658 miljoner kronor i Q4, en ökning med 10,6 procent från 5 118 miljoner ett år tidigare. Det justerade EBITA-resultatet steg med 16,2 procent till 552 miljoner kronor från 475 miljoner, medan rörelseresultatet, EBIT, ökade till 666 miljoner kronor från 578 miljoner.",
        "Även elevutvecklingen var positiv. Det genomsnittliga antalet barn och elever inom förskola, grundskola och gymnasium ökade med 5,2 procent till 119 430 under kvartalet. För helåret nådde omsättningen 20 360 miljoner kronor och justerat EBITA 1 516 miljoner kronor.",
        "Det är samtidigt viktigt att inte behandla rubriksiffrorna som en ny överraskning. AcadeMedia offentliggjorde redan den 16 juli preliminära uppgifter om Q4-omsättningen, tillväxten och det justerade EBITA-resultatet. Dagens bokslut bekräftar därmed i stora drag den bild som marknaden redan fått.",
        "En ny fråga gäller utdelningen. Något förslag finns inte med i bokslutet. Styrelsen uppger att den ska fatta beslut om ett utdelningsförslag och offentliggöra det i samband med kallelsen till årsstämman. Förra räkenskapsåret beslutade årsstämman om 2,25 kronor per aktie i ordinarie utdelning.",
        "AcadeMedia presenterar rapporten klockan 09.30. Eftersom de största Q4-siffrorna redan var kända blir kommentarer om expansionen, kapitalanvändningen och den fortsatta utvecklingen viktigare än normalt för att ge ny information till marknaden.",
      ],
    },
    {
      heading: "Nanologica lyfter omsättningen – Syntagon står för nästan hela Q2",
      paragraphs: [
        "Nanologica rapporterar en nettoomsättning på 24,3 miljoner kronor för Q2, jämfört med 2,3 miljoner samma period förra året. Av kvartalets omsättning kom 22,8 miljoner kronor från Syntagon och 2,5 miljoner från Nanologicas tidigare verksamhet. Förvärvet har alltså förändrat koncernens storlek tydligt på kort tid.",
        "Samtidigt är resultatbilden mer försiktig. Rörelseresultatet i Q2 blev minus 18,1 miljoner kronor, jämfört med minus 11,3 miljoner ett år tidigare. Resultatet före skatt var minus 18,7 miljoner kronor och likvida medel uppgick till 19,1 miljoner kronor vid halvårsskiftet.",
        "Halvårets rörelseresultat på plus 49,0 miljoner kronor ska inte läsas som att den löpande verksamheten redan har blivit lönsam. Resultatet har påverkats positivt med 75,7 miljoner kronor genom redovisningen av Syntagon-förvärvet. Det är därför Q2-förlusten och den fortsatta försäljningsutvecklingen som ger en tydligare bild av den underliggande verksamheten.",
        "Inför andra halvåret säger bolaget att prioriteringen är att öka Syntagons försäljning, kapacitetsutnyttjande och lönsamhet. För Nanologicas kromatografiverksamhet är målet att få fler kunder från utvärdering till kommersiella order och ta steg mot nollresultat. Det gör orderflödet och kassautvecklingen till centrala punkter att följa framåt.",
      ],
    },
    {
      heading: "Mycronic samlar marknaden i Täby efter ett starkt första halvår",
      paragraphs: [
        "Mycronic håller kapitalmarknadsdag i Täby mellan klockan 13.00 och 16.30. Bolaget kommer in i dagen med ett starkt Q2 bakom sig: orderingången ökade med 119 procent till 2 917 miljoner kronor, omsättningen steg med 17 procent till 2 416 miljoner och rörelseresultatet ökade till 698 miljoner kronor. Rörelsemarginalen var 29 procent.",
        "I samband med Q2 höjde Mycronic också sin bedömning för helårets omsättning från cirka 8,75 miljarder till 9,25 miljarder kronor. Bolaget beskrev då en fortsatt stark efterfrågan på utrustning för avancerade serverkort och andra lösningar som används i datacenter och AI-infrastruktur.",
        "Inför kapitalmarknadsdagen fick orderboken ytterligare ett tillskott. I fredags meddelade Mycronic en inbytesorder på en Prexision 80 Evo till en kund i Asien värd 21–24 miljoner dollar, med planerad leverans under Q2 2027.",
        "Det gör eftermiddagens huvudfråga tydlig: hur uthållig är den starka efterfrågan och hur tänker Mycronic omsätta den i fortsatt tillväxt? Strategi, kapacitet och utvecklingen inom de verksamheter som gynnas av investeringarna i avancerad elektronik blir därför särskilt viktiga delar av presentationen.",
      ],
    },
    {
      heading: "Det här följer vi på Stockholmsbörsen i dag",
      paragraphs: [
        "Stockholmsbörsen har ännu inte öppnat när den här artikeln publiceras. Det finns därför ingen faktisk kursreaktion på AcadeMedias eller Nanologicas rapporter att slå fast i förväg. Om någon av aktierna får en större och tydligt nyhetsdriven rörelse efter öppningen bör den bedömas utifrån den information marknaden faktiskt reagerar på.",
        "Dagens svenska hållpunkter är AcadeMedias rapportpresentation klockan 09.30, en sammanfattning från Riksbanken inför vice riksbankschef Per Janssons framträdande klockan 10.20 och själva talet klockan 10.30. Därefter tar Mycronics kapitalmarknadsdag över bolagsfokuset från klockan 13.00.",
        "Jansson ska tala om det ekonomiska läget och det senaste räntebeslutet. För Stockholmsbörsen blir hans kommentarer relevanta eftersom de kan ge mer färg på hur Riksbanken ser på konjunkturen och inflationen efter augustibeslutet.",
      ],
    },
  ],
  sources: [
    {
      text: "AcadeMedia – Interim report July 2025-June 2026, 31 augusti 2026",
      href: "https://www.tradingview.com/news/modular_finance%3A3c596749df490%3A0-academedia-s-interim-report-july-2025-june-2026/",
    },
    {
      text: "AcadeMedia – Preliminary financial results for Q4 2025/2026, 16 juli 2026",
      href: "https://mfn.se/a/academedia/academedia-announces-preliminary-financial-results-for-the-fourth-quarter-2025-2026",
    },
    {
      text: "Nanologica – Delårsrapport Q2 2026, 31 augusti 2026",
      href: "https://nanologica.com/mfn_news/delarsrapport-q2-2026-nanologica-ab-publ/",
    },
    {
      text: "Mycronic – Delårsrapport januari-juni 2026, 14 juli 2026",
      href: "https://www.mycronic.com/sv/nyheter-event/pressmeddelanden/delarsrapport-januari-juni-2026/",
    },
    {
      text: "Mycronic – Inbjudan till kapitalmarknadsdag, 3 juli 2026",
      href: "https://www.mycronic.com/sv/nyheter-event/pressmeddelanden/inbjudan-till-kapitalmarknadsdag/",
    },
    {
      text: "Mycronic – Order på Prexision 80 Evo, 28 augusti 2026",
      href: "https://www.mycronic.com/sv/produktomraden/photomask-equipment/press-releases/mycronic-erhaller-order-pa-en-prexision-80-evo/",
    },
    {
      text: "Sveriges Riksbank – Per Jansson om ekonomiska läget och senaste räntebeskedet, 31 augusti 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-08-31/",
    },
  ],
};
