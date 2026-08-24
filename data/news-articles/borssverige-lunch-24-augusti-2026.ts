import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige Lunch — 24 August 2026.
 *
 * Editorial research window: up to approximately 13:20 CEST.
 * Primary/source anchors checked for this edition:
 * - Evolution AB, board statement on Candle Lake's mandatory cash offer (24 Aug 2026, 09:00 CEST).
 * - NIBE Industrier AB, Q2 2026 interim report and CEO comment (21 Aug 2026).
 * - SSAB, official US production-site information for Montpelier, Iowa and Mobile, Alabama.
 * - Reuters, failed US-Canada trade talks and 50% US tariffs on roughly USD 20bn of Canadian goods.
 * - Nyhetsbyrån Direkt / Finwire market snapshots for the Stockholm opening on 24 Aug 2026.
 * - Riksbank / Swedish market calendar for the 14:15 Aino Bunge panel appearance.
 *
 * Market percentages are tied to the stated morning snapshots and are not presented
 * as real-time lunch quotes. No raw source list is rendered in the public article.
 */
export const BORSSVERIGE_LUNCH_24_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "borssverige-lunch-24-augusti-2026",
  slug: "borssverige-lunch-24-augusti-2026",
  title:
    "BörsSverige Lunch – 24 augusti: SSAB lyfter på tullbråket – bankerna bromsar",
  summary:
    "SSAB hör till dagens tydligaste storbolagsvinnare efter att handelsförhandlingarna mellan USA och Kanada brutit samman. Samtidigt går storbankerna svagt, Evolution säger nej till budpliktsbudet på 695 kronor och Nibe står kvar i fokus efter fredagens Q2.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-24T13:24:00+02:00",
  url: "/news/borssverige-lunch-24-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_000000009cf48246883ae568fc196154.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige Lunch 24 augusti 2026 med Stockholm vid vattnet och DivLab-grafik.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle:
    "BörsSverige Lunch: SSAB lyfter på tullbråket – bankerna bromsar",
  seoDescription:
    "SSAB stiger när handelskonflikten mellan USA och Kanada hårdnar. Evolution säger nej till 695-kronorsbudet och Nibe är fortsatt i fokus efter Q2.",
  seoKeywords: [
    "BörsSverige Lunch",
    "Stockholmsbörsen",
    "börsen idag",
    "SSAB",
    "Evolution",
    "Nibe",
    "Handelsbanken",
    "Swedbank",
    "USA Kanada tullar",
    "svenska aktier",
    "börsnyheter",
    "börsen 24 augusti 2026",
  ],
  internalLinking: {
    topics: ["Stockholmsbörsen", "handelstullar", "budplikt", "Q2 2026"],
    companies: ["SSAB", "Evolution", "Nibe", "Handelsbanken", "Swedbank"],
    tickers: ["SSAB A", "EVO", "NIBE B", "SHB A", "SWED A"],
    relatedNewsSlugs: [
      "borssverige-24-augusti-2026",
      "borssverige-21-augusti-2026",
      "miljardbud-pa-evolution",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Stockholmsbörsen har fått en splittrad start på veckan. Storbolagsindexet rörde sig kring nollstrecket under morgonen, men under ytan var skillnaderna tydliga: SSAB steg kraftigt när handelskonflikten mellan USA och Kanada hårdnade, samtidigt som flera av de svenska storbankerna backade.",
    "Två andra bolag förtjänar mer än en kort kursnotis. Evolution har fått ett formellt nej från den egna styrelsen till Candle Lakes budpliktsbud på 695 kronor per aktie, medan Nibe fortsätter att värderas om efter fredagens rapport med högre försäljning, resultat och rörelsemarginal än ett år tidigare.",
    "BörsSverige Lunch fokuserar därför på de tre händelser som tydligast förändrar dagens svenska börsbild: SSAB:s tullkänslighet, Evolutions budfråga och Nibes förbättrade lönsamhet.",
  ],
  sections: [
    {
      heading: "SSAB lyfter när USA och Kanada trappar upp handelskonflikten",
      paragraphs: [
        "SSAB var en av morgonens tydligaste vinnare bland de större svenska aktierna. Vid 09.20-tiden var aktien upp omkring 4 procent, samtidigt som OMXS30 låg i princip oförändrat.",
        "Bakgrunden är att handelsförhandlingarna mellan USA och Kanada har brutit samman. USA har infört tullar på 50 procent på kanadensiska varor värda omkring 20 miljarder dollar, och Kanada har aviserat motåtgärder.",
        "För SSAB är kopplingen konkret. Bolaget producerar stål i USA vid anläggningar i Montpelier i Iowa och Mobile i Alabama. När importerade alternativ möter högre handelshinder kan den amerikanska produktionen få ett relativt bättre konkurrensläge.",
        "Det sista är däremot en marknadstolkning – inte en ny resultatprognos från SSAB. Hur stor den faktiska effekten blir beror bland annat på vilka produkter som omfattas, kundernas prissättning och hur länge tullarna ligger kvar.",
        "Rörelsen ska också ses mot slutet av förra veckan, då SSAB föll kraftigt när marknaden i stället började räkna med att USA och Kanada närmade sig en uppgörelse. Måndagens uppgång är därför delvis en omvärdering av samma handelsfråga åt motsatt håll.",
      ],
    },
    {
      heading: "Bankerna bromsar en annars starkare industribild",
      paragraphs: [
        "Samtidigt som SSAB och flera industribolag gick starkt var bankerna svaga. I morgonhandeln backade Handelsbanken omkring 1,4 procent och Swedbank omkring 1,3 procent.",
        "Det fanns ingen enskild verifierad bolagsnyhet som förklarade hela bankrörelsen. Därför är det mer korrekt att konstatera att bankerna höll tillbaka storbolagsindexet än att sätta en säker orsak på nedgången.",
        "Den splittrade utvecklingen är dagens viktigaste indexbild: råvaru- och industribolag får stöd av bolagsspecifika besked och handelspolitik, medan den tunga banksektorn går åt motsatt håll.",
      ],
    },
    {
      heading: "Evolution säger nej till budet på 695 kronor",
      paragraphs: [
        "Evolution meddelade klockan 09.00 att styrelsen rekommenderar aktieägarna att inte acceptera Candle Lakes kontanta budpliktsbud på 695 kronor per aktie.",
        "Budplikten uppstod efter att Candle Lake den 24 juli passerade 30-procentsgränsen och nådde ett direkt innehav på cirka 30,02 procent av aktierna och rösterna. Själva erbjudandet lämnades den 13 augusti.",
        "Styrelsen pekar bland annat på Evolutions aktuella börskurs, bolagets finansiella och strategiska ställning och den förväntade framtida utvecklingen. Budet motsvarade en rabatt på cirka 5,7 procent mot stängningskursen på 737,20 kronor dagen före erbjudandet offentliggjordes.",
        "Styrelsens slutsats är att 695 kronor inte speglar Evolutions verkliga marknadsvärde. Acceptperioden väntas löpa till omkring den 15 september.",
        "Det speciella i situationen är att Candle Lake själv har uppgett att budet inte lämnas för att köpa samtliga återstående aktier, utan därför att ägarandelen utlöste den lagstadgade budplikten. För aktieägarna blir därför skillnaden mellan budnivån och börsens egen värdering central att följa.",
      ],
    },
    {
      heading: "Nibe står kvar i fokus efter tydligt bättre lönsamhet",
      paragraphs: [
        "Nibe fortsätter att vara ett av de viktigare svenska rapportcasen efter fredagens Q2. Rapporten visade en omsättning på 10 849 miljoner kronor, jämfört med 10 082 miljoner ett år tidigare.",
        "Rörelseresultatet steg till 1 232 miljoner kronor från 944 miljoner och rörelsemarginalen förbättrades till 11,4 procent från 9,4 procent. Bolaget beskriver kvartalet som ännu ett med god underliggande tillväxt och förbättrad lönsamhet.",
        "Aktien steg omkring 9 procent på rapportdagen. På måndagsmorgonen höjde DNB Carnegie sin rekommendation till köp från behåll, och Nibe handlades då svagt på plus.",
        "Det viktiga är inte en enskild riktkurs utan att Nibe nu har visat förbättrat rörelseresultat och rörelsemarginal flera kvartal i rad. Nästa fråga blir om förbättringen kan hålla i sig när konsumenterna fortfarande är försiktiga och handelstullar påverkar delar av verksamheten.",
      ],
    },
    {
      heading: "Det här bevakar vi i eftermiddag",
      paragraphs: [
        "För SSAB är varje nytt besked om handelsrelationen mellan USA och Kanada direkt relevant. Om parterna åter närmar sig förhandlingar kan marknaden snabbt omvärdera dagens tullpremie i aktien.",
        "På den svenska marknaden blir det också värt att följa om bankerna återhämtar sig eller fortsätter att väga på OMXS30. Klockan 14.15 deltar vice riksbankschef Aino Bunge i ett panelsamtal om privata kapitalmarknader. Det är inte ett nytt räntebesked, men är den tydligaste svenska programpunkten under eftermiddagen.",
        "Evolution och Nibe är samtidigt två bolag där dagens besked handlar mer om värdering än om kortsiktigt indexbrus: i Evolution ska marknaden väga ett bud mot börskursen, och i Nibe ska fredagens tydliga lönsamhetsförbättring prissättas vidare efter rapportreaktionen.",
      ],
    },
  ],
};
