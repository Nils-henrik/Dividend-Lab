import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 8 oktober 2026.
 * Editorial research cutoff: 2026-10-08T08:24:12+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.mfn.se/a/industrivarden/delarsrapport-1-januari-30-september-2026
 * P0_SOURCE[primary]: https://news.cision.com/se/svensk-maklarstatistik/r/okande-priser-pa-bostadsratter-medan-villor-minskade-nagot-i-september,c4405725
 * P0_SOURCE[primary]: https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-10-08/
 */
export const BORSSVERIGE_8_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-8-oktober-2026",
  slug: "borssverige-8-oktober-2026",
  title: "BörsSverige: Industrivärdens substansvärde stiger 17 procent – bostadsrätter upp 1,6",
  summary:
    "Industrivärdens substansvärde steg 17 procent under årets första nio månader och bolaget köpte aktier för 3,3 miljarder kronor. Samtidigt visar ny bostadsstatistik att bostadsrättspriserna ökade 1,6 procent i september.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-08T08:24:30+02:00",
  url: "/news/borssverige-8-oktober-2026",
  featured: true,
  readingMinutes: 5,
  seoTitle: "Industrivärdens substansvärde stiger 17 procent",
  seoDescription:
    "Industrivärdens substansvärde steg 17 procent under januari–september. Bostadsrätter ökade samtidigt 1,6 procent i september.",
  seoKeywords: [
    "Industrivärden rapport 2026",
    "Industrivärden substansvärde",
    "bostadspriser september 2026",
    "svenska börsen idag",
    "Stockholmsbörsen 8 oktober 2026",
    "BörsSverige",
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "investmentbolag", "bostadsmarknad", "Riksbanken"],
    companies: ["Industrivärden", "Essity", "Handelsbanken", "Volvo", "SCA", "Alleima"],
    tickers: ["INDU A", "INDU C", "ESSITY B", "SHB A", "VOLV B", "SCA B", "ALLEI"],
    relatedNewsSlugs: [
      "borssverige-7-oktober-2026",
      "borssverige-6-oktober-2026",
      "norden-i-centrum-8-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Industrivärdens substansvärde var 223,3 miljarder kronor, motsvarande 517 kronor per aktie, den 30 september. Under årets första nio månader ökade substansvärdet med 17 procent, eller 74 kronor per aktie.",
    "Rapporten ger ett verifierat svar på den kontrollpunkt som stod öppen i gårdagens BörsSverige. För den svenska marknaden tillkommer i dag nya bostadspriser: bostadsrätter steg 1,6 procent i september medan villor sjönk 0,4 procent.",
  ],
  sections: [
    {
      heading: "Industrivärden köpte aktier för 3,3 miljarder",
      paragraphs: [
        "Industrivärdens totalavkastning under januari–september var 31 procent för A-aktien och 30 procent för C-aktien. Som jämförelse steg Stockholmsbörsens totalavkastningsindex SIXRX med 11 procent under samma period.",
        "Investmentbolaget köpte aktier för totalt 3,3 miljarder kronor under perioden. Av detta gick 1,2 miljarder till Essity, 0,9 miljarder till Handelsbanken, 0,8 miljarder till Volvo, 0,3 miljarder till SCA och 0,1 miljarder till Alleima.",
        "Skuldsättningsgraden var 2 procent vid utgången av september, jämfört med 3 procent vid utgången av 2025. Det innebär att den tydliga substansvärdeökningen kombinerades med en fortsatt låg redovisad belåning.",
      ],
    },
    {
      heading: "Gårdagens öppna fråga har fått ett svar",
      paragraphs: [
        "När onsdagens BörsSverige publicerades hade Industrivärdens rapport ännu inte kommit. Den publicerades senare under dagen, klockan 10.00, och dagens artikel kan därför ersätta vänteläget med verifierade siffror.",
        "Rapporten visar vad som förändrats i portföljen och hur substansvärdet utvecklats, men den använda primärkällan innehåller inget verifierat analytikerkonsensus. Utfallet beskrivs därför inte som bättre eller sämre än väntat.",
        "Stockholmsbörsen har ännu inte öppnat vid artikelns cutoff. Någon kursreaktion för Industrivärden eller andra svenska aktier anges därför inte.",
      ],
    },
    {
      heading: "Bostadsrätter upp – villor ned i september",
      paragraphs: [
        "Svensk Mäklarstatistiks nya mätning visar att bostadsrättspriserna i riket steg 1,6 procent i september. På tolv månader var uppgången 5,4 procent. Villapriserna sjönk samtidigt 0,4 procent under månaden men låg 3,9 procent högre än ett år tidigare.",
        "Antalet försäljningar ökade också. Under september såldes 18 500 bostäder, jämfört med 17 000 samma månad förra året, vilket motsvarar en ökning på 9 procent. Fördelningen var 11 800 bostadsrätter och 6 700 villor.",
        "Bostadsmarknaden är relevant för banker, bygg- och fastighetsbolag samt hushållens ekonomi. Siffrorna är däremot inte i sig ett bevis för hur en enskild börsaktie kommer att utvecklas.",
      ],
    },
    {
      heading: "Vad följer vi härnäst?",
      paragraphs: [
        "Riksbankschef Erik Thedéen talar klockan 15.35 i dag om det ekonomiska läget och aktuell penningpolitik. Riksbanken anger att en sammanfattning publiceras samtidigt, så eventuella nya budskap ska bedömas först när texten finns tillgänglig.",
        "För Industrivärden blir nästa kontrollpunkt hur portföljens värde och de nya köpen utvecklas efter rapportperiodens slut. Dagens morgonartikel drar ingen slutsats från kursdata efter den 30 september.",
        "Svensk Mäklarstatistik anger att nästa månadsuppdatering publiceras den 6 november klockan 06.00. Då går det att se om september månads skillnad mellan bostadsrätter och villor består.",
      ],
    },
  ],
  sources: [
    {
      text: "Industrivärden via MFN: delårsrapport januari–september 2026 med substansvärde, totalavkastning, aktieköp och skuldsättningsgrad",
      href: "https://www.mfn.se/a/industrivarden/delarsrapport-1-januari-30-september-2026",
    },
    {
      text: "Svensk Mäklarstatistik via Cision: bostadspriser och antal försäljningar i september 2026",
      href: "https://news.cision.com/se/svensk-maklarstatistik/r/okande-priser-pa-bostadsratter-medan-villor-minskade-nagot-i-september,c4405725",
    },
    {
      text: "Sveriges Riksbank: Erik Thedéens tal om ekonomiska läget och aktuell penningpolitik den 8 oktober 2026 klockan 15.35",
      href: "https://www.riksbank.se/sv/press-och-publicerat/kalender/kalender-2026/2026-10-08/",
    },
  ],
};
