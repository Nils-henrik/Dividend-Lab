import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 26 september 2026.
 * Editorial research cutoff: 2026-09-26T13:24:00+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://hmgroup.com/news/h-m-hennes-mauritz-ab-nine-month-report-2026/
 * P0_SOURCE[primary]: https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/pressmeddelanden/2026/styrrantan-oforandrad-pa-175-procent6/
 * P0_SOURCE[primary]: https://www.arjo.com/en-us/about-us/investors/newsroom/press-releases/2026/5430967-Unlocking-the-potential-of-Arjo/
 * P0_SOURCE[primary]: https://www.saab.com/newsroom/press-releases/2026/canada-takes-next-step-towards-future-globaleye-capability
 */
export const BORSSVERIGE_26_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-26-september-2026",
  slug: "borssverige-26-september-2026",
  title: "BörsSverige – veckan som gått: H&M:s vinstlyft, Riksbanken och Saab",
  summary:
    "Vecka 39 gav flera tunga svenska besked. H&M lyfte rörelseresultatet kraftigt, Riksbanken öppnade för fler räntehöjningar, Arjo presenterade ett nytt lönsamhetsprogram och Saab tog nästa steg med GlobalEye i Kanada.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-09-26T13:25:00+02:00",
  url: "/news/borssverige-26-september-2026",
  featured: true,
  imageAlt: "BörsSverige – veckan som gått den 26 september 2026 med H&M, Riksbanken, Arjo och Saab.",
  readingMinutes: 7,
  seoTitle: "BörsSverige veckan som gått: H&M, Riksbanken och Saab",
  seoDescription:
    "Veckan som gått på svenska börsen: H&M:s Q3, Riksbankens räntebesked, Arjos nya lönsamhetsmål och Saabs GlobalEye-dialog med Kanada.",
  seoKeywords: [
    "BörsSverige veckan som gått",
    "Stockholmsbörsen vecka 39",
    "H&M rapport Q3 2026",
    "Riksbanken ränta september 2026",
    "Arjo kapitalmarknadsdag 2026",
    "Saab GlobalEye Kanada",
    "svenska börsen veckan som gått",
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "Sverige", "Riksbanken", "styrränta", "detaljhandel", "medicinteknik", "försvar"],
    companies: ["H&M", "Arjo", "Saab"],
    tickers: ["HM B", "ARJO B", "SAAB B"],
    relatedNewsSlugs: ["norden-i-centrum-26-september-2026", "borssverige-24-september-2026", "borssverige-23-september-2026"],
  },
  showDisclaimer: true,
  intro: [
    "Vecka 39 gav den svenska marknaden fyra tydliga besked att ta med sig in i nästa vecka. H&M förbättrade lönsamheten kraftigt, Riksbanken höll styrräntan still men signalerade en stramare bana, Arjo satte siffror på sitt nya effektiviseringsarbete och Saab tog ytterligare ett steg i den kanadensiska GlobalEye-processen.",
    "Det gemensamma temat var att marknaden fick mer information om framtiden. H&M visade vad kostnadskontroll kan göra för marginalerna, Riksbanken flyttade förväntningarna på räntan, Arjo presenterade en konkret resultatambition och Saab kom närmare formella förhandlingar om ett möjligt större försvarssystem.",
  ],
  sections: [
    {
      heading: "H&M: rörelseresultatet steg till 6,0 miljarder kronor",
      paragraphs: [
        "H&M redovisade 57 189 miljoner kronor i nettoomsättning i Q3, jämfört med 57 017 miljoner kronor ett år tidigare. I lokala valutor ökade försäljningen med 1 procent.",
        "Rörelseresultatet steg till 6 037 miljoner kronor från 4 914 miljoner kronor och rörelsemarginalen förbättrades till 10,6 procent från 8,6 procent. Bruttomarginalen steg samtidigt till 54,0 procent från 52,9 procent.",
        "Bolaget uppger att marginalen fick stöd av engångseffekter på cirka 1,6 procentenheter kopplade till tullar och varuimport. Det betyder att nästa steg blir att se hur mycket av förbättringen som kan bestå när de effekterna inte längre hjälper jämförelsen.",
      ],
    },
    {
      heading: "Riksbanken: 1,75 procent ligger kvar – men höjningar väntas",
      paragraphs: [
        "Riksbanken lämnade styrräntan oförändrad på 1,75 procent. Samtidigt bedömer direktionen att räntan behöver höjas mer framöver än i juniprognosen för att inflationen ska stabiliseras kring 2 procent.",
        "Om inflations- och konjunkturutsikterna står sig väntas höjningarna inledas redan i år. Riksbankens prognos visar ett kvartalsgenomsnitt på 1,85 procent under Q4 2026 och 2,07 procent under Q1 2027.",
        "För svenska investerare innebär det att räntefrågan inte försvann med ett oförändrat septemberbesked. Banker, fastigheter, konsumentbolag och andra räntekänsliga sektorer går in i hösten med en tydligare risk för högre finansieringskostnader.",
      ],
    },
    {
      heading: "Arjo: siktar på cirka 350 miljoner i EBIT-förbättring",
      paragraphs: [
        "Arjo presenterade en ny strategi på sin kapitalmarknadsdag. Bolaget vill skapa en mer kundnära organisation och har satt en tydlig ambition om att förbättra EBIT med cirka 350 miljoner kronor, plus eller minus 25 miljoner, jämfört med 2025 till mitten av 2029.",
        "För att nå dit räknar Arjo med en engångsinvestering på cirka 370 miljoner kronor, till stor del fram till och med 2027. Åtgärderna ska bland annat komma från en effektivare organisation, lägre inköpskostnader och förbättrat kommersiellt arbete.",
        "Nya finansiella mål ska presenteras under Q1 2027. Veckans besked gav därför marknaden en tydligare resultatriktning, men den fulla målbilden kommer först nästa år.",
      ],
    },
    {
      heading: "Saab: Kanada tar nästa steg kring GlobalEye",
      paragraphs: [
        "Saab meddelade på fredagen att bolaget har tecknat ett icke-bindande term-sheet-avtal med Canadian Defence Investment Agency. Avtalet sätter ramarna för fortsatta och mer detaljerade förhandlingar om GlobalEye till det kanadensiska flygvapnet.",
        "Kanada pekade i maj ut Saab som föredragen leverantör för landets framtida AEW&C-förmåga. Veckans besked är ett steg vidare i processen, men Saab är tydligt med att det ännu inte är ett kontrakt och inte innebär något bindande åtagande att köpa flygplan.",
        "Det gör GlobalEye-processen fortsatt viktig att följa, men det vore för tidigt att behandla den som en bokad order. Nästa värdeskapande steg är att förhandlingarna faktiskt leder fram till ett bindande avtal.",
      ],
    },
    {
      heading: "DivLabs blick: lönsamhet, ränta och orderpotential",
      paragraphs: [
        "Vecka 39 gav tre olika typer av svenska börssignaler. H&M levererade ett faktiskt resultatlyft här och nu. Arjo satte en tydlig ambition för hur lönsamheten ska förbättras under de kommande åren. Saab visade samtidigt att en potentiellt stor affär rör sig framåt, utan att ännu vara i mål.",
        "Ovanpå bolagsbeskeden ligger Riksbankens stramare signal. Därför går svenska investerare in i nästa vecka med både förbättrade bolagsutsikter på vissa håll och en högre räntenivå längre fram som motvikt.",
      ],
    },
  ],
  sources: [
    {
      text: "H&M Group: Nine-month report 2026, 24 september 2026",
      href: "https://hmgroup.com/news/h-m-hennes-mauritz-ab-nine-month-report-2026/",
    },
    {
      text: "Sveriges Riksbank: Styrräntan oförändrad på 1,75 procent, 24 september 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/pressmeddelanden/2026/styrrantan-oforandrad-pa-175-procent6/",
    },
    {
      text: "Arjo: Unlocking the potential of Arjo, 24 september 2026",
      href: "https://www.arjo.com/en-us/about-us/investors/newsroom/press-releases/2026/5430967-Unlocking-the-potential-of-Arjo/",
    },
    {
      text: "Saab: Canada takes next step towards future GlobalEye capability, 25 september 2026",
      href: "https://www.saab.com/newsroom/press-releases/2026/canada-takes-next-step-towards-future-globaleye-capability",
    },
  ],
};
