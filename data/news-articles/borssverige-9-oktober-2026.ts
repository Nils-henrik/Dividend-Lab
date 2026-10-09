import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 9 oktober 2026.
 * Editorial research cutoff: 2026-10-09T08:26:49+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.mfn.se/a/sleep-cycle/sleep-cycle-foreslar-forvarv-av-audiowell-genom-apportemission
 * P0_SOURCE[primary]: https://www.mfn.se/cis/a/oresund/investment-ab-oresund-delarsrapport-1-januari-30-september-2026-6a82c89d
 * P0_SOURCE[primary]: https://www.mfn.se/cis/a/hexagon/hexagon-forvarvar-rocscience-och-sluter-cirkeln-mellan-overvakning-av-fysiska-miljoer-och-avancerad-simulering-47c14914
 */
export const BORSSVERIGE_9_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-9-oktober-2026",
  slug: "borssverige-9-oktober-2026",
  title: "BörsSverige: Sleep Cycle föreslår miljardförvärv – Öresund slår index",
  summary:
    "Sleep Cycle föreslår ett omvänt förvärv av Audiowell för 2,255 miljarder kronor som skulle späda ut befintliga ägare med cirka 82 procent. Samtidigt slår Öresunds substansvärde index och Hexagon köper Rocscience.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-09T08:27:00+02:00",
  url: "/news/borssverige-9-oktober-2026",
  featured: true,
  imageAlt: "BörsSverige 9 oktober 2026 – Sleep Cycle, Öresund och Hexagon i morgonens svenska bolagsflöde.",
  readingMinutes: 5,
  seoTitle: "Sleep Cycle föreslår miljardförvärv – Öresund slår index",
  seoDescription:
    "Sleep Cycle föreslår ett omvänt förvärv för 2,255 miljarder kronor. Öresunds substansvärde steg 15,6 procent och Hexagon köper Rocscience.",
  seoKeywords: [
    "Sleep Cycle Audiowell förvärv",
    "Sleep Cycle apportemission",
    "Öresund rapport 2026",
    "Hexagon Rocscience förvärv",
    "svenska börsen idag",
    "Stockholmsbörsen 9 oktober 2026",
    "BörsSverige",
  ],
  internalLinking: {
    topics: ["Sverige", "Stockholmsbörsen", "företagsförvärv", "apportemission", "investmentbolag"],
    companies: ["Sleep Cycle", "Audiowell", "Investment AB Öresund", "Hexagon", "Rocscience"],
    tickers: ["SLEEP", "ORES", "HEXA B"],
    relatedNewsSlugs: [
      "borssverige-8-oktober-2026",
      "borssverige-7-oktober-2026",
      "norden-i-centrum-9-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Morgonens mest genomgripande svenska bolagsbesked kommer från Sleep Cycle. Styrelsen föreslår att bolaget köper Audiowell för 2,255 miljarder kronor genom att ge ut drygt 92 miljoner nya aktier. Affären är ett omvänt förvärv och skulle ge de nuvarande Sleep Cycle-ägarna cirka 18 procent av det sammanslagna bolaget.",
    "Samtidigt rapporterar Investment AB Öresund en substansvärdeökning på 15,6 procent under årets första nio månader, mot 10,8 procent för SIX Return Index. Hexagon har dessutom avtalat om att köpa den kanadensiska programvaruleverantören Rocscience till ett företagsvärde på 535 miljoner dollar.",
  ],
  sections: [
    {
      heading: "Sleep Cycle föreslår en affär som ritar om ägarbilden",
      paragraphs: [
        "Köpeskillingen för Audiowell är 2,255 miljarder kronor och ska enligt förslaget betalas helt med 92 042 212 nyemitterade Sleep Cycle-aktier. Teckningskursen är 24,50 kronor per aktie. Antalet aktier skulle öka från 20 277 563 till 112 319 775, vilket innebär cirka 82 procents utspädning för de befintliga ägarna.",
        "Audiowell Group skulle efter genomförandet äga cirka 82 procent av aktierna och rösterna, medan Sleep Cycles nuvarande ägare skulle ha cirka 18 procent. Audiowell redovisade 378 miljoner kronor i omsättning och 216 miljoner i rörelseresultat för 2025, motsvarande en rörelsemarginal på 57 procent.",
        "Eftersom Audiowell Group blir kontrollägare uppstår budplikt. Ägaren har meddelat att ett budpliktsbud på resterande Sleep Cycle-aktier ska lämnas till 24,50 kronor per aktie inom fyra veckor från att transaktionen genomförts.",
      ],
    },
    {
      heading: "Bolagsstämman blir första avgörande kontrollpunkt",
      paragraphs: [
        "Affären kräver bland annat godkännande av apportemissionen på en extra bolagsstämma och myndighetsgodkännande för utländska direktinvesteringar. Stämman väntas hållas den 11 november och slutförandet är planerat till fjärde kvartalet 2026.",
        "För investerare är detta inte ett vanligt kompletteringsförvärv. Den stora utspädningen, den nya kontrollägaren och det efterföljande budpliktsbudet gör villkoren och ägarutfallet centrala. Bolaget undersöker samtidigt möjligheten att behålla Sleep Cycle i noterad miljö.",
        "Någon kursreaktion anges inte. Stockholmsbörsen hade ännu inte öppnat vid artikelns research-cutoff, och primärkällan innehåller inget verifierat analytikerkonsensus.",
      ],
    },
    {
      heading: "Öresund ökar substansvärdet snabbare än index",
      paragraphs: [
        "Investment AB Öresunds substansvärde uppgick till 5 956 miljoner kronor, eller 131 kronor per aktie, den 30 september. Justerat för lämnad utdelning hade substansvärdet stigit 15,6 procent sedan årsskiftet, 4,8 procentenheter mer än SIX Return Index.",
        "Under tredje kvartalet ökade substansvärdet med 4,1 procent, mot 2,4 procent för index. Resultatet per aktie för januari–september blev 18,43 kronor, jämfört med 9,97 kronor motsvarande period föregående år.",
        "Portföljen är koncentrerad. Scandi Standard stod för 30,4 procent av substansvärdet och Bilia för 23,9 procent vid kvartalsskiftet. Det gör utvecklingen i ett fåtal stora innehav särskilt viktig för Öresunds fortsatta substansvärde.",
      ],
    },
    {
      heading: "Hexagon betalar 535 miljoner dollar för Rocscience",
      paragraphs: [
        "Hexagon har kommit överens om att förvärva Rocscience, som utvecklar programvara för geoteknisk analys inom bland annat gruvdrift och infrastruktur. Företagsvärdet är 535 miljoner dollar på kontant- och skuldfri basis.",
        "Rocscience väntas omsätta nära 50 miljoner dollar under 2026. Mer än 80 procent av omsättningen uppges vara årligen återkommande, och EBITAC-marginalen anges till över 40 procent. Hexagon räknar med ett positivt bidrag till nettoresultatet från slutförandet.",
        "Affären väntas slutföras under fjärde kvartalet efter sedvanliga villkor. Den strategiska kontrollpunkten blir hur väl Rocsciences modeller kan kopplas till Hexagons sensor- och övervakningsdata; den finansiella kontrollpunkten är om de utlovade höga marginalerna består efter integrationen.",
      ],
    },
    {
      heading: "Det här följer vi härnäst",
      paragraphs: [
        "För Sleep Cycle är extrastämman den 11 november nästa fasta beslutspunkt. Därefter återstår myndighetsprövning, genomförande och – om affären slutförs – budpliktsbudet till de återstående aktieägarna.",
        "För Öresund står portföljkoncentrationen i fokus inför nästa substansvärdesuppdatering. Bolagets andra utdelningsdel om 3,70 kronor per aktie beräknas betalas den 27 oktober.",
        "För Hexagon återstår transaktionens slutförande och senare rapportering om integrationen. Dagens besked anger villkor och måltal, men ännu inget verifierat utfall från den sammanslagna verksamheten.",
      ],
    },
  ],
  sources: [
    {
      text: "Sleep Cycle via MFN: villkor för det föreslagna omvända förvärvet av Audiowell, apportemissionen, utspädningen och budpliktsbudet",
      href: "https://www.mfn.se/a/sleep-cycle/sleep-cycle-foreslar-forvarv-av-audiowell-genom-apportemission",
    },
    {
      text: "Investment AB Öresund via MFN: delårsrapport januari–september 2026 med substansvärde, indexjämförelse och portföljfördelning",
      href: "https://www.mfn.se/cis/a/oresund/investment-ab-oresund-delarsrapport-1-januari-30-september-2026-6a82c89d",
    },
    {
      text: "Hexagon via MFN: förvärvet av Rocscience med företagsvärde, intäktsprofil, marginal och förväntad slutförandetid",
      href: "https://www.mfn.se/cis/a/hexagon/hexagon-forvarvar-rocscience-och-sluter-cirkeln-mellan-overvakning-av-fysiska-miljoer-och-avancerad-simulering-47c14914",
    },
  ],
};
