import type { NewsArticle } from "@/types/news";

/**
 * Börsnyheter — 13 August 2026.
 * Fact basis: Candle Lake Limited's mandatory public cash offer announcement.
 * Editorial framing intentionally distinguishes a mandatory bid from a voluntary takeover attempt.
 */
export const MILJARDBUD_PA_EVOLUTION_ARTICLE: NewsArticle = {
  id: "miljardbud-pa-evolution",
  slug: "miljardbud-pa-evolution",
  title: "Miljardbud på Evolution",
  summary:
    "Storägaren Candle Lake erbjuder 695 kronor kontant per Evolution-aktie efter att ha passerat gränsen för budplikt. Budet värderar hela bolaget till omkring 131,7 miljarder kronor – men är inte ett vanligt uppköpsförsök.",
  category: "company",
  source: "DivLab",
  publishedAt: "2026-08-13T12:55:00+02:00",
  url: "/news/miljardbud-pa-evolution",
  featured: true,
  imageUrl: "/news-demo/file_00000000b36881f489650afecf2504af.png",
  thumbnailObjectPosition: "center 38%",
  mobileThumbnailObjectPosition: "center 30%",
  mobileHeadlineFirst: true,
  showImageBrandOverlay: true,
  imageAlt:
    "Illustration till Börsnyheten Miljardbud på Evolution med Evolution-logotyp, svensk flagga och kursgrafik.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 4,
  seoTitle: "Miljardbud på Evolution – Candle Lake erbjuder 695 kronor",
  seoDescription:
    "Candle Lake lägger ett budpliktsbud på Evolution på 695 kronor per aktie. Budet värderar hela bolaget till cirka 131,7 miljarder kronor.",
  seoKeywords: [
    "Evolution",
    "Evolution aktie",
    "bud Evolution",
    "Miljardbud på Evolution",
    "Candle Lake",
    "Kenneth Dart",
    "budplikt",
    "budpliktsbud",
    "Stockholmsbörsen",
    "börsnyheter",
  ],
  showDisclaimer: true,
  intro: [
    "Det har kommit ett miljardbud på Evolution. Storägaren Candle Lake erbjuder övriga aktieägare 695 kronor kontant per aktie, vilket värderar hela bolaget till omkring 131,7 miljarder kronor.",
    "Men det finns en viktig detalj: det här är inte ett vanligt frivilligt uppköpsbud. Candle Lake är skyldigt att lämna erbjudandet efter att storägaren passerat gränsen för budplikt.",
    "Candle Lake säger dessutom uttryckligen att budet inte är motiverat av någon avsikt att köpa samtliga aktier i Evolution.",
  ],
  sections: [
    {
      heading: "Därför måste Candle Lake lägga bud",
      paragraphs: [
        "Bakgrunden är ett aktieköp den 24 juli. Candle Lake köpte då ytterligare 2,05 miljoner aktier i Evolution och passerade därmed 30 procent av rösterna i bolaget.",
        "På den svenska aktiemarknaden är 30 procent en viktig gräns. När en ägare genom köp når eller passerar 30 procent av rösterna i ett börsnoterat bolag uppstår normalt budplikt. Ägaren måste då antingen minska sitt innehav eller lämna ett erbjudande till övriga aktieägare.",
        "Candle Lake valde att lämna ett budpliktsbud. Priset är 695 kronor per aktie, samma högsta pris som Candle Lake betalade i samband med köpet den 24 juli.",
        "Bolaget uppger också att det under de senaste sex månaderna inte har köpt Evolution-aktier till ett högre pris än 695 kronor.",
      ],
    },
    {
      heading: "Budet värderar Evolution till nära 132 miljarder",
      paragraphs: [
        "Budpriset på 695 kronor per aktie innebär ett värde på omkring 131,7 miljarder kronor för samtliga aktier i Evolution som ligger till grund för erbjudandet.",
        "Candle Lake äger redan 59 798 619 aktier. Räknat på de utestående aktier som används i erbjudandet motsvarar det cirka 31,56 procent av aktierna och rösterna.",
        "Eftersom storägaren redan kontrollerar en stor del av bolaget är värdet på de aktier som Candle Lake ännu inte äger betydligt lägre än värderingen av hela Evolution. Enligt budmeddelandet uppgår värdet på erbjudandet för de återstående aktierna till cirka 90,1 miljarder kronor.",
      ],
    },
    {
      heading: "Det ovanliga: budet ligger under börskursen",
      paragraphs: [
        "Ett vanligt uppköpsbud innehåller ofta en premie. Köparen erbjuder då mer än den senaste börskursen för att få aktieägare att sälja.",
        "Här är situationen den motsatta. Evolution stängde onsdagen den 12 augusti på 737,20 kronor. Budet på 695 kronor ligger därmed cirka 5,7 procent under den senaste stängningskursen före erbjudandet.",
        "Budpriset ligger också omkring 3,3 procent under aktiens volymvägda genomsnittskurs under de 20 handelsdagarna fram till den 12 augusti, enligt Candle Lakes budmeddelande.",
        "Det är en viktig förklaring till varför erbjudandet inte ska läsas som ett traditionellt uppköpsbud där en köpare försöker locka aktieägare med en tydlig budpremie.",
      ],
    },
    {
      heading: "Candle Lake säger att man inte vill köpa hela Evolution",
      paragraphs: [
        "Candle Lake beskriver Evolution som en långsiktig finansiell investering och lyfter fram bolagets lönsamhet, ledning och position inom live casino.",
        "Samtidigt skriver storägaren uttryckligen att erbjudandet inte är motiverat av en avsikt att förvärva samtliga aktier i Evolution.",
        "Candle Lake uppger också att man i nuläget inte planerar några större förändringar av Evolutions verksamhet, ledning, personal eller verksamhetsplatser med anledning av erbjudandet.",
        "Det är därför viktigt att skilja mellan ett budpliktsbud och ett besked om att Evolution ska köpas ut från börsen. Något sådant besked finns inte i det officiella budmeddelandet.",
      ],
    },
    {
      heading: "Vem ligger bakom budet?",
      paragraphs: [
        "Candle Lake Limited är ett investeringsbolag registrerat på Caymanöarna och ägs till 100 procent av investeraren Kenneth Dart.",
        "Bolaget har successivt byggt upp sin investering i Evolution sedan mitten av 2024 och är nu Evolutions största ägare.",
        "Candle Lake har även ekonomisk exponering mot Evolution genom så kallade total return swaps. De instrumenten är separata från de aktier som bolaget direkt äger och förändrar inte antalet röster som följer med det direkta aktieinnehavet.",
      ],
    },
    {
      heading: "Vad händer nu?",
      paragraphs: [
        "Det fullständiga erbjudandedokumentet väntas offentliggöras omkring den 14 augusti.",
        "Den preliminära acceptperioden är 17 augusti till 15 september. Utbetalning till de aktieägare som accepterar erbjudandet planeras därefter att börja omkring den 23 september. Tidsplanen kan ändras.",
        "Evolutions styrelse ska också lämna sitt formella uttalande om erbjudandet under processen.",
        "Budet är inte villkorat av att Candle Lake når en viss ägarandel. Om ägandet trots den uttalade avsikten skulle överstiga 90 procent uppger Candle Lake att man avser att inleda tvångsinlösen av resterande aktier och verka för en avnotering av Evolution från Nasdaq Stockholm.",
      ],
    },
    {
      heading: "Ett miljardbud – men inte ett vanligt sådant",
      paragraphs: [
        "Rubriken är stor: ett erbjudande som värderar Evolution till nära 132 miljarder kronor. För aktieägarna är bakgrunden minst lika viktig som beloppet.",
        "Candle Lake lägger budet eftersom storägaren har passerat gränsen för budplikt. Samtidigt säger bolaget att Evolution är en långsiktig investering och att man inte har som mål att köpa samtliga aktier.",
        "Med ett budpris på 695 kronor, under den senaste börskursen före erbjudandet, skiljer sig situationen tydligt från ett traditionellt uppköpsbud med en lockande premie.",
        "Nästa viktiga besked blir Evolutions styrelses syn på erbjudandet och hur de övriga aktieägarna väljer att agera.",
      ],
    },
  ],
};
