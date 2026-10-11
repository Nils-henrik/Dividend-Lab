import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 11 oktober 2026.
 * Editorial research cutoff: 2026-10-11T08:04:41+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.dst.dk/en/Statistik/planlagte
 * P0_SOURCE[primary]: https://www.abgsc.com/abgsc-to-publish-q3-2026-interim-report-on-13-october/
 * P0_SOURCE[primary]: https://www.ericsson.com/en/investors/financial-calendar/2026/q3-2026
 * P0_SOURCE[primary]: https://www.nordea.com/en/press/2026-10-01/nordea-to-present-its-third-quarter-results-2026-on-15-october?translation=da
 */
export const NORDEN_I_CENTRUM_11_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-11-oktober-2026",
  slug: "norden-i-centrum-11-oktober-2026",
  title: "Veckan som kommer: Ericsson och Nordea rapporterar – dansk inflation först ut",
  summary:
    "Danmarks septemberinflation öppnar den nordiska veckan på måndag. Därefter följer ABG Sundal Colliers Q3 på tisdag och en tung torsdag med rapporter från Ericsson och Nordea.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-11T08:05:00+02:00",
  url: "/news/norden-i-centrum-11-oktober-2026",
  featured: true,
  imageUrl: "/news/generated/norden-i-centrum-2026-10-11.png",
  thumbnailImageUrl: "/news/generated/norden-i-centrum-2026-10-11.png",
  imageAlt: "Norden i centrum 2026-10-11 – DivLabs morgonöversikt över nordiska börsnyheter.",
  readingMinutes: 5,
  seoTitle: "Ericsson och Nordea rapporterar – nordiska veckan som kommer",
  seoDescription:
    "Danmarks inflation publiceras på måndag. Ericsson och Nordea rapporterar på torsdag när den nordiska Q3-säsongen växlar upp.",
  seoKeywords: [
    "nordiska börsen veckan som kommer",
    "Ericsson Q3 2026",
    "Nordea Q3 2026",
    "ABG Sundal Collier Q3 2026",
    "dansk inflation september 2026",
    "nordiska rapporter oktober 2026",
    "Norden i centrum",
  ],
  internalLinking: {
    topics: ["Norden", "Sverige", "Norge", "Danmark", "Finland", "Q3", "inflation", "bank", "telekom"],
    companies: ["Ericsson", "Nordea", "ABG Sundal Collier"],
    tickers: ["ERIC B", "NDA SE", "ABG"],
    relatedNewsSlugs: [
      "norden-i-centrum-10-oktober-2026",
      "norden-i-centrum-9-oktober-2026",
      "borssverige-10-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Nästa nordiska börsvecka börjar med makro och övergår snabbt i rapportfokus. Danmarks Statistik publicerar septemberutfallet för konsumentprisindex och nettoprisindex på måndag klockan 08.00. Utfallet blir veckans första test av om pristrycket förändrats.",
    "På tisdag rapporterar norska ABG Sundal Collier Q3. Torsdagen blir veckans tyngsta rapportdag: Ericsson publicerar sin Q3-rapport omkring klockan 07.00 CEST och Nordea följer med sina siffror omkring klockan 07.30 EET.",
    "Inga resultat, inflationsutfall eller kursreaktioner föregrips. Söndagens uppgift är att ringa in de verifierade kontrollpunkterna och vad investerare behöver leta efter när beskeden faktiskt publiceras.",
  ],
  sections: [
    {
      heading: "Måndag: dansk inflation öppnar veckan",
      paragraphs: [
        "Danmarks Statistik har bekräftat att konsumentprisindex, nettoprisindex och EU-harmoniserat konsumentprisindex för september publiceras måndagen den 12 oktober klockan 08.00. Något septemberutfall finns ännu inte i den verifierade kalendern och anges därför inte här.",
        "Inflationsbeskedet blir relevant långt utanför den danska räntemarknaden. Det ger en ny signal om hushållens kostnadsläge och om prisutvecklingen rör sig i en riktning som kan påverka förväntningarna på räntor, konsumtion och värderingen av räntekänsliga bolag.",
        "Det viktiga blir inte bara huvudtalet. Fördelningen mellan varor och tjänster samt utvecklingen i det harmoniserade måttet ger en bättre bild av hur brett pristrycket är. Den analysen kan först göras när Statistiks Danmark har publicerat det faktiska utfallet.",
      ],
    },
    {
      heading: "Tisdag: ABG Sundal Collier ger en tidig kapitalmarknadssignal",
      paragraphs: [
        "ABG Sundal Collier publicerar sina Q3-siffror tisdagen den 13 oktober klockan 08.00 CEST. Interim-vd Kristian B. Fyksen presenterar därefter resultatet i en webbsändning klockan 09.00.",
        "Som nordisk investmentbank är ABG:s aktivitetsnivå en konkret kontrollpunkt för kapitalmarknaden. Intäkter från företagsaffärer, aktie- och skuldtransaktioner samt mäklar- och analysverksamhet kan visa om börsnoteringar och finansiering har fått tydligare fart under kvartalet.",
        "Bolaget har ännu inte publicerat Q3-utfallet. Fokus bör därför ligga på den faktiska intäktsmixen, kostnadsutvecklingen och ledningens beskrivning av transaktionsmarknaden, inte på antaganden om resultatet.",
      ],
    },
    {
      heading: "Torsdag: Ericsson och Nordea gör veckan rapporttung",
      paragraphs: [
        "Ericsson publicerar sin Q3-rapport torsdagen den 15 oktober omkring klockan 07.00 CEST. Rapporten blir en viktig kontrollpunkt för efterfrågan på mobilnätsutrustning, lönsamheten och bolagets utveckling efter de effektiviseringsåtgärder som präglat de senaste åren.",
        "Nordea publicerar sin Q3-rapport samma dag omkring klockan 07.30 EET. Vd Frank Vang-Jensen presenterar resultatet klockan 11.00 EET. För banken blir räntenetto, kreditförluster, kostnader, kapitalstyrka och eventuell ny vägledning centrala delar att kontrollera.",
        "Att telekom och bank rapporterar samma morgon gör torsdagen till veckans bredaste nordiska temperaturmätare. Ericsson speglar investeringar i digital infrastruktur, medan Nordea ger en bild av hushåll, företag, kreditkvalitet och ränteläget i flera nordiska marknader.",
      ],
    },
    {
      heading: "Vad har förändrats sedan veckan som gick?",
      paragraphs: [
        "Lördagens Norden i centrum sammanfattade höjd prognos från Demant, NCC:s försäljning av Industry, KH Groups skärpta prognos och Grieg Seafoods lägre slaktvolym. De berättelsernas nästa större kontrollpunkter ligger främst i kommande rapporter och transaktionssteg, inte i nya verifierade söndagsbesked.",
        "Den nya veckan flyttar därför fokus från sena bolagsbesked till en fast kalender med inflation och Q3-rapporter. Det är ett bättre redaktionellt vägval än att repetera fredagens och lördagens nyheter utan nytt informationsvärde.",
        "Ordningen är tydlig: dansk inflation på måndag, ABG Sundal Collier på tisdag och Ericsson samt Nordea på torsdag. När utfallen publiceras ska de bedömas mot bolagens egna rapporter och den officiella statistiken; eventuella kursreaktioner behöver verifieras nära respektive marknadsöppning.",
      ],
    },
  ],
  sources: [
    {
      text: "Danmarks Statistik: bekräftad publiceringskalender för september månads konsumentprisindex, nettoprisindex och HICP den 12 oktober 2026 klockan 08.00",
      href: "https://www.dst.dk/en/Statistik/planlagte",
    },
    {
      text: "ABG Sundal Collier: Q3-rapport publiceras den 13 oktober 2026 klockan 08.00 CEST och presenteras klockan 09.00",
      href: "https://www.abgsc.com/abgsc-to-publish-q3-2026-interim-report-on-13-october/",
    },
    {
      text: "Ericsson: officiell finansiell kalender för Q3-rapporten den 15 oktober 2026 omkring klockan 07.00 CEST",
      href: "https://www.ericsson.com/en/investors/financial-calendar/2026/q3-2026",
    },
    {
      text: "Nordea: Q3-rapport publiceras den 15 oktober 2026 omkring klockan 07.30 EET med presentation klockan 11.00 EET",
      href: "https://www.nordea.com/en/press/2026-10-01/nordea-to-present-its-third-quarter-results-2026-on-15-october?translation=da",
    },
  ],
};
