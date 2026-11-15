import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — Veckan som kommer, 15 november 2026.
 * Editorial research cutoff: 2026-11-15T08:02:52+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.inderes.se/en/markets/calendar
 * P0_SOURCE[primary]: https://ir.alk.net/news-releases/news-release-details/invitation-presentation-alks-first-nine-months-q3-2026-results
 * P0_SOURCE[secondary]: https://www.mfn.se/a/better-collective/invitation-to-better-collectives-q3-2026-financial-report-presentation
 * P0_SOURCE[primary]: https://www.scb.se/en/finding-statistics/publishing-calendar/
 * P0_SOURCE[primary]: https://www.dst.dk/en/Statistik/planlagte
 */
export const NORDEN_I_CENTRUM_15_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-15-november-2026",
  slug: "norden-i-centrum-15-november-2026",
  title: "Veckan som kommer: NIBE och ALK rapporterar – dansk BNP blir veckans makrotest",
  summary:
    "NIBE och ALK rapporterar på tisdag, Better Collective på onsdag efter börsstängning. På fredag publiceras svensk arbetsmarknadsstatistik samt dansk BNP och konsumentförtroende.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-15T08:02:57+01:00",
  url: "/news/norden-i-centrum-15-november-2026",
  featured: true,
  readingMinutes: 5,
  seoTitle: "Nordiska börsveckan: NIBE, ALK och dansk BNP i fokus",
  seoDescription:
    "Veckan som kommer i Norden: NIBE, ALK och Better Collective rapporterar medan svensk arbetsmarknadsdata och dansk BNP publiceras på fredag.",
  seoKeywords: [
    "nordiska börsen veckan",
    "veckan som kommer börsen",
    "NIBE Q3 2026",
    "ALK Q3 2026",
    "Better Collective Q3 2026",
    "Danmark BNP Q3 2026",
    "svensk arbetslöshet oktober 2026"
  ],
  internalLinking: {
    topics: [
      "Norden i centrum",
      "veckan som kommer",
      "rapportperiod",
      "värmepumpar",
      "läkemedel",
      "digital sportmedia",
      "arbetsmarknad",
      "BNP",
      "konsumentförtroende",
      "Sverige",
      "Danmark"
    ],
    companies: ["NIBE Industrier", "ALK-Abelló", "Better Collective"],
    tickers: ["NIBE B", "ALK B", "BETCO DKK"],
    relatedNewsSlugs: [
      "norden-i-centrum-14-november-2026",
      "norden-i-centrum-13-november-2026",
      "norden-i-centrum-12-november-2026",
      "borssverige-14-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Nästa nordiska börsvecka får en tydlig rapporttyngd på tisdag och onsdag. Svenska NIBE och danska ALK publicerar kvartalsbesked på tisdag, medan Better Collective följer efter börsstängning på onsdag.",
    "På makrosidan ligger veckans viktigaste verifierade kontrollpunkter på fredag. SCB publicerar svensk arbetskraftsundersökning för oktober, och Danmarks Statistik publicerar både nationalräkenskaper för tredje kvartalet och konsumentförväntningar för november.",
    "Det här är en framåtblickande veckoplan. Händelserna ligger efter artikelns redaktionella cutoff, så artikeln föregriper inga utfall, kursreaktioner eller orsaksförklaringar."
  ],
  sections: [
    {
      heading: "NIBE blir tisdagens svenska rapportpunkt",
      paragraphs: [
        "NIBE Industrier finns i den svenska rapportkalendern för tisdagen den 17 november med delårsrapport. För investerare blir omsättning, rörelseresultat, marginal och kassaflöde centrala kontrollpunkter.",
        "Bolaget verkar inom klimatlösningar och har stor exponering mot värmepumpar. Därför blir rapporten också en signal om efterfrågan på energieffektivisering och om återhämtningen i europeiska installationsmarknader.",
        "Några Q3-siffror eller kommentarer efter rapporten används inte här. Den relevanta frågan är vad tisdagens publicering faktiskt förändrar i bilden av efterfrågan, lager och lönsamhet."
      ]
    },
    {
      heading: "ALK rapporterar första nio månaderna på tisdag",
      paragraphs: [
        "Danska ALK-Abelló publicerar resultatet för årets första nio månader, inklusive tredje kvartalet, på eftermiddagen tisdagen den 17 november. Ledningen presenterar rapporten för investerare och analytiker klockan 15.30 CET.",
        "ALK är ett specialiserat läkemedelsbolag inom allergi och allergisk astma. I rapporten blir försäljningstillväxt, lönsamhet och helårsutsikter naturliga kontrollpunkter.",
        "Särskilt viktigt blir om ledningens kommentar om utsikterna förändrar den finansiella bilden. Någon sådan förändring kan bedömas först när rapport och presentation är publicerade."
      ]
    },
    {
      heading: "Better Collective avslutar onsdagens rapportdag",
      paragraphs: [
        "Better Collective publicerar sin Q3-rapport onsdagen den 18 november efter marknadens stängning. Bolaget håller telefonkonferens och webbsänd presentation torsdagen den 19 november klockan 10.00 CET.",
        "För den digitala sportmediekoncernen blir intäkter, lönsamhet, kassaflöde och eventuella utsiktskommentarer viktiga. Rapporten kommer efter börsstängning, vilket gör torsdagens presentation till den första utförliga kontrollpunkten för ledningens förklaring av kvartalet.",
        "Artikeln använder varken förväntningar eller framtida rapportutfall som fakta. Det som ska följas är den faktiska förändringen i verksamhetens tillväxt och kassagenerering."
      ]
    },
    {
      heading: "Fredagen samlar svensk arbetsmarknad och dansk BNP",
      paragraphs: [
        "SCB publicerar Arbetskraftsundersökningarna för oktober fredagen den 20 november. Statistiken ger nästa officiella avläsning av sysselsättning och arbetslöshet i Sverige.",
        "Samma morgon klockan 08.00 publicerar Danmarks Statistik nationalräkenskaper och BNP-nyckeltal för tredje kvartalet. Myndigheten publicerar också konsumentförväntningar för november.",
        "Kombinationen är användbar för nordiska investerare: svensk arbetsmarknad visar hushållens inkomst- och efterfrågegrund, medan dansk BNP och konsumentförtroende ger en bredare bild av aktivitet och framtidstro."
      ]
    },
    {
      heading: "Det följer vi – utan att upprepa förra veckan",
      paragraphs: [
        "Förra veckan gav tydliga rapportbesked från bland andra Vestas, AF Gruppen, Mandatum, Zealand Pharma och DOF. Nästa vecka flyttas fokus från deras historiska kvartal till nya rapporter och framåtblickande makrodata.",
        "Tisdagens NIBE- och ALK-rapporter blir veckans första stora kontrollpunkter. Better Collective förlänger rapportflödet in i torsdagens presentation, och fredagens statistik sätter bolagsbeskeden i en bredare konjunkturram.",
        "Nästa Norden-uppdatering bör fokusera på verifierade avvikelser, guidning och kassaflöde i rapporterna samt på vad arbetsmarknads- och BNP-statistiken faktiskt förändrar. Kalendern i sig är inte ett utfall."
      ]
    }
  ],
  sources: [
    {
      text: "Inderes: nordisk rapportkalender med NIBE Industriers delårsrapport den 17 november 2026",
      href: "https://www.inderes.se/en/markets/calendar"
    },
    {
      text: "ALK-Abelló: officiell inbjudan med publicering av niomånadersrapporten på eftermiddagen den 17 november 2026 och presentation klockan 15.30 CET",
      href: "https://ir.alk.net/news-releases/news-release-details/invitation-presentation-alks-first-nine-months-q3-2026-results"
    },
    {
      text: "MFN/Better Collective: bolagets distribuerade inbjudan med Q3-publicering efter börsstängning den 18 november och presentation den 19 november 2026 klockan 10.00 CET",
      href: "https://www.mfn.se/a/better-collective/invitation-to-better-collectives-q3-2026-financial-report-presentation"
    },
    {
      text: "Statistiska centralbyrån: officiell publiceringskalender med Arbetskraftsundersökningarna för oktober den 20 november 2026",
      href: "https://www.scb.se/en/finding-statistics/publishing-calendar/"
    },
    {
      text: "Danmarks Statistik: officiell kalender med nationalräkenskaper, BNP-nyckeltal och konsumentförväntningar den 20 november 2026 klockan 08.00",
      href: "https://www.dst.dk/en/Statistik/planlagte"
    }
  ]
};
