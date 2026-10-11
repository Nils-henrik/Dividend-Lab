import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 11 oktober 2026.
 * Editorial research cutoff: 2026-10-11T08:23:53+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.scb.se/hitta-statistik/publiceringskalendern/?dateFrom=2026-01-01&dateTo=2026-12-31&paging=6&period=Custom
 * P0_SOURCE[primary]: https://www.dustingroup.com/sv/node/1217
 * P0_SOURCE[primary]: https://www.ericsson.com/sv/investors
 * P0_SOURCE[primary]: https://investors.avanza.se/ir/kalender/kommande-handelser/delarsrapport-januari-september-2026/
 */
export const BORSSVERIGE_11_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-11-oktober-2026",
  slug: "borssverige-11-oktober-2026",
  title: "Veckan som kommer: Ericsson och Avanza rapporterar – KPI och konsumtion i fokus",
  summary:
    "SCB publicerar septemberutfall för KPI och hushållens konsumtion på onsdag. Samma vecka kommer Dustins bokslut, Ericssons Q3 och Avanzas delårsrapport.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-11T08:24:10+02:00",
  url: "/news/borssverige-11-oktober-2026",
  featured: true,
  imageAlt: "Veckan som kommer på Stockholmsbörsen den 11 oktober 2026 med svenska rapporter och statistik i fokus.",
  readingMinutes: 5,
  seoTitle: "Ericsson och Avanza rapporterar – svenska börsveckan",
  seoDescription:
    "SCB publicerar KPI och konsumtionsdata på onsdag. Ericsson rapporterar på torsdag och Avanza på fredag under en tung svensk rapportvecka.",
  seoKeywords: [
    "Stockholmsbörsen veckan som kommer",
    "Ericsson Q3 2026",
    "Avanza rapport Q3 2026",
    "Dustin bokslut 2026",
    "svensk inflation september 2026",
    "hushållens konsumtion september 2026",
    "BörsSverige",
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "Q3", "inflation", "konsumtion", "telekom", "nätmäklare"],
    companies: ["Dustin", "Ericsson", "Avanza"],
    tickers: ["DUST", "ERIC B", "AZA"],
    relatedNewsSlugs: [
      "borssverige-10-oktober-2026",
      "borssverige-9-oktober-2026",
      "norden-i-centrum-11-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Nästa svenska börsvecka får två tydliga nav: onsdagens statistikpaket från SCB och rapporterna som följer från Dustin, Ericsson och Avanza. På onsdag publiceras septemberutfall för både konsumentprisindex och hushållens konsumtion.",
    "Dustin lämnar bokslut samma morgon. Ericsson publicerar Q3 på torsdag omkring klockan 07.00 och Avanza följer på fredag klockan 07.45. Det ger investerare verifierbara kontrollpunkter för prisutveckling, konsumtion, företagens IT-efterfrågan, telekominvesteringar och sparaktivitet.",
    "Inga kommande utfall eller kursreaktioner anges i förväg. Söndagens uppgift är att visa vad som faktiskt står på kalendern och vilka delar av beskeden som blir viktigast när primärkällorna publiceras.",
  ],
  sections: [
    {
      heading: "Onsdag: KPI och konsumtion ger ett dubbelt konjunkturtest",
      paragraphs: [
        "SCB:s publiceringskalender anger att konsumentprisindex för september publiceras onsdagen den 14 oktober. Samma dag kommer månadsindikatorn för hushållens konsumtion i september och veckoindikatorn till och med vecka 40.",
        "Den ordinarie KPI-publiceringen följer efter veckans preliminära inflationsbesked. Den blir viktig eftersom den ger den fullständiga prisbilden och mer detaljer om vilka delar av hushållens kostnader som förändrats. Några slutliga septembertal föregrips inte här.",
        "Konsumtionsindikatorn ger samtidigt en separat signal om efterfrågan. Kombinationen av priser och faktisk konsumtionsutveckling är relevant för detaljhandel, banker, fastighetsbolag och andra svenska bolag som påverkas direkt av hushållens ekonomi.",
      ],
    },
    {
      heading: "Dustin öppnar rapportblocket med bokslut",
      paragraphs: [
        "Dustin publicerar bokslutet för räkenskapsåret 2025/26 onsdagen den 14 oktober klockan 08.00 CEST. Vd Samuel Skott och finanschef Julia Lagerqvist presenterar resultatet i en telefon- och webbsänd konferens klockan 09.30.",
        "Rapporten blir en kontrollpunkt för efterfrågan på IT-produkter och tjänster bland företag och offentlig sektor i Norden och Benelux. För investerare blir försäljning, lönsamhet, kassaflöde och skuldsättning centrala delar att kontrollera.",
        "Bolagets inbjudan anger tidpunkterna men innehåller inget färdigt bokslutsutfall. Artikeln gör därför inga antaganden om resultatet eller om hur aktien kommer att reagera.",
      ],
    },
    {
      heading: "Torsdag: Ericsson blir veckans tyngsta svenska rapport",
      paragraphs: [
        "Ericsson publicerar sin Q3-rapport torsdagen den 15 oktober omkring klockan 07.00. Rapporten är redan en huvudpunkt i dagens nordiska veckoförhandsvisning, men dess vikt för Stockholmsbörsen motiverar en tydligare svensk kontrollista.",
        "Fokus ligger på försäljning, bruttomarginal och rörelseresultat samt bolagets kommentarer om operatörernas investeringar. Utvecklingen i mobilnätsverksamheten och effekten av tidigare effektiviseringsåtgärder blir viktigare än enskilda formuleringar utan stöd i siffrorna.",
        "Rapporten behöver också läsas i relation till de finansiella mål och utsikter som Ericsson faktiskt kommunicerar. Något resultat eller analytikerkonsensus används inte innan det går att verifiera mot rapporten och en stark sekundärkälla.",
      ],
    },
    {
      heading: "Fredag: Avanza visar spararnas aktivitet",
      paragraphs: [
        "Avanza publicerar delårsrapporten för januari–september fredagen den 16 oktober klockan 07.45. En webbsänd presentation hålls klockan 10.00.",
        "För nätmäklaren blir courtageintäkter, fond- och valutaintäkter, räntenetto, kostnader och kundtillväxt naturliga kontrollpunkter. De visar både hur aktiv handeln varit och hur ränteläget påverkat affärsmodellen.",
        "Rapporten blir också en signal om svenska privatsparares aktivitet under Q3. Den ska däremot inte användas som ett direkt mått på hela hushållssektorn; därför blir jämförelsen med onsdagens officiella konsumtionsstatistik särskilt värdefull.",
      ],
    },
    {
      heading: "Vad är nytt jämfört med veckan som gick?",
      paragraphs: [
        "Lördagens BörsSverige gav svar på den tidigare öppna aktivitetsfrågan genom SCB:s starka augustidata och följde dessutom Prisjakts stämning mot Google samt Sleep Cycles föreslagna omvända förvärv. De berättelserna saknar nya verifierade söndagsbesked och upprepas därför inte i detalj.",
        "Nästa vecka skiftar fokus från enstaka sena besked till en sammanhängande svensk informationskedja: inflation och konsumtion på onsdag, Ericsson på torsdag och Avanza på fredag. Dustins bokslut ger dessutom en tidig bolagssignal samma morgon som SCB-statistiken.",
        "När beskeden publiceras ska utfallen verifieras mot respektive rapport eller statistikmeddelande. Eventuella kursrörelser kan först beskrivas med färsk marknadsdata efter Stockholmsbörsens öppning.",
      ],
    },
  ],
  sources: [
    {
      text: "SCB:s publiceringskalender: KPI och hushållens konsumtion för september 2026 publiceras den 14 oktober",
      href: "https://www.scb.se/hitta-statistik/publiceringskalendern/?dateFrom=2026-01-01&dateTo=2026-12-31&paging=6&period=Custom",
    },
    {
      text: "Dustin: bokslutet för 2025/26 publiceras den 14 oktober 2026 klockan 08.00 CEST och presenteras klockan 09.30",
      href: "https://www.dustingroup.com/sv/node/1217",
    },
    {
      text: "Ericsson: Q3-rapporten publiceras den 15 oktober 2026 omkring klockan 07.00",
      href: "https://www.ericsson.com/sv/investors",
    },
    {
      text: "Avanza: delårsrapporten januari–september publiceras den 16 oktober 2026 klockan 07.45",
      href: "https://investors.avanza.se/ir/kalender/kommande-handelser/delarsrapport-januari-september-2026/",
    },
  ],
};
