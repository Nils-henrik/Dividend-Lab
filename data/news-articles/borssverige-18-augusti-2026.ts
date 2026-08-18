import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 18 August 2026.
 *
 * Cutoff: shortly before the Stockholm market open on 18 Aug 2026.
 * Editorial rule for this edition: no Q1 figures or old quarter data used as filler.
 *
 * Primary checks:
 * - Bahnhof financial calendar: Q2 report scheduled for 18 Aug 2026.
 * - OssDsign financial calendar: Q2 report scheduled for 18 Aug 2026.
 * - Zaplox investor calendar: Q2 report scheduled for 18 Aug 2026.
 * - Titania financial calendar: Jan-Jun report scheduled for 18 Aug 2026.
 * - DevPort financial calendar: Jan-Jun report scheduled for 18 Aug 2026 at 08:00.
 * - At the publication cutoff, the checked official report pages still did not expose
 *   the new Q2 report files in a way that could be verified reliably.
 *
 * No visible raw source list in the article according to DivLab's editorial standard.
 */
export const BORSSVERIGE_18_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "borssverige-18-augusti-2026",
  slug: "borssverige-18-augusti-2026",
  title: "BörsSverige – 18 augusti: Rapportmorgon på Stockholmsbörsen",
  summary:
    "Flera svenska bolag har Q2 på kalendern den 18 augusti. Bahnhof, OssDsign, Zaplox, Titania och DevPort hör till namnen att följa när rapportflödet tar fart inför börsöppningen.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-18T08:53:00+02:00",
  url: "/news/borssverige-18-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/borssverige-18-augusti-2026.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 18 augusti 2026 med Stockholm i morgonljus och en segelbåt på vattnet.",
  imageCaption: "Bild: DivLab.",
  readingMinutes: 3,
  seoTitle: "BörsSverige 18 augusti: Bahnhof och dagens Q2-rapporter",
  seoDescription:
    "Rapportmorgon på Stockholmsbörsen den 18 augusti. Bahnhof, OssDsign, Zaplox, Titania och DevPort finns bland dagens svenska Q2-bolag.",
  seoKeywords: [
    "BörsSverige",
    "börsen idag",
    "Stockholmsbörsen",
    "Q2 2026",
    "Bahnhof",
    "OssDsign",
    "Zaplox",
    "Titania",
    "DevPort",
    "börsnyheter",
    "börsen 18 augusti 2026",
  ],
  showDisclaimer: true,
  intro: [
    "Det är en rapporttät tisdag på den svenska börsen. Flera svenska bolag har Q2 på kalendern den 18 augusti och nya besked kan snabbt sätta tonen i enskilda aktier när handeln drar i gång.",
    "När DivLab färdigställer morgonbriefen strax före börsöppningen går de nya Q2-utfallen ännu inte att verifiera i de officiella rapportflöden vi kontrollerar. Därför fyller vi inte artikeln med gamla kvartalssiffror. Det är dagens rapporter som gäller.",
  ],
  sections: [
    {
      heading: "Bahnhof ett av dagens viktigaste namn",
      paragraphs: [
        "Bahnhof har Q2 den 18 augusti i sin finansiella kalender och är ett av morgonens mest intressanta svenska bolag.",
        "Bolaget befinner sig samtidigt mitt i processen kring Telenors planerade förvärv av en kontrollerande ägarandel. Det gör dagens besked extra intressant: marknaden får en ny temperaturmätare på verksamheten samtidigt som ägarbilden är på väg att förändras.",
        "När rapporten går att verifiera blir fokus på dagens faktiska utveckling, marginaler, kassaflöde och vad ledningen säger om resten av 2026.",
      ],
    },
    {
      heading: "OssDsign har Q2 på kalendern",
      paragraphs: [
        "OssDsign har också Q2 den 18 augusti. Medicinteknikbolaget är ett av de mindre svenska namn där en rapport kan ge stora procentuella rörelser.",
        "Här blir ledningens kommentarer minst lika viktiga som själva resultatraderna. Marknaden kommer vilja se vad bolaget säger om försäljningstakten, kostnaderna och utvecklingen framåt.",
        "DivLab väntar med slutsatser tills dagens rapport faktiskt går att verifiera.",
      ],
    },
    {
      heading: "Zaplox väntas med nya besked",
      paragraphs: [
        "Zaplox har Q2 2026 på sin finansiella kalender den 18 augusti. MFN:s kalender har uppskattat publicering till morgonen.",
        "Det gör Zaplox till ytterligare ett bolag att bevaka runt öppningen. För mindre tillväxtbolag kan marknaden reagera kraftigt både på det som förbättrats och på det som blivit sämre.",
        "Vi använder därför inte äldre kvartal som ersättning för dagens besked. När Q2 finns ute är det de siffrorna som ska bedömas.",
      ],
    },
    {
      heading: "Titania och DevPort finns också på dagens kalender",
      paragraphs: [
        "Titania har rapport för januari–juni på kalendern den 18 augusti. Även DevPort har sin halvårsrapport schemalagd i dag, med klockan 08.00 angiven i bolagets finansiella kalender.",
        "Vid DivLabs kontroll inför publicering visade de officiella rapportsidorna ännu inte de nya rapportfilerna på ett sätt som gick att verifiera säkert.",
        "Det betyder inte att rapporterna inte kan dyka upp när som helst. Det betyder bara att vi inte sätter siffror i artikeln innan vi kan kontrollera dem.",
      ],
    },
    {
      heading: "Rapporterna kan sätta tonen vid öppningen",
      paragraphs: [
        "Stockholmsbörsen öppnar klockan 09.00 och dagens rapporter kan ge tydliga rörelser i flera mindre och medelstora svenska aktier.",
        "En stark rapport handlar inte bara om högre vinst. Marginaler, kassaflöde, finansiering och framtidsutsikter kan väga minst lika tungt. På samma sätt kan en svag detalj få stor betydelse även om rubriksiffrorna ser bra ut.",
        "Det är den balansen DivLab följer i dag: vad som faktiskt blivit bättre, vad som blivit sämre och vad bolagen säger om resten av året.",
      ],
    },
    {
      heading: "Dagens börs – inte gårdagens siffror",
      paragraphs: [
        "Den här morgonbriefen är medvetet byggd utan gamla Q1-siffror. Om dagens Q2-rapporter ännu inte är verifierbara fyller vi inte utrymmet med äldre resultat bara för att göra artikeln längre.",
        "När rapporterna landar är det dagens siffror som gäller. Då kan både styrkor och svagheter bedömas på färsk information.",
      ],
    },
  ],
};
