import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — 7 September 2026.
 *
 * Editorial research cutoff: 08:14 CEST, 7 September 2026.
 * Primary-source anchors:
 * - Rejlers / Multiconsult merger announcement, published 07:30 CEST:
 *   0.9725 Rejlers B shares per Multiconsult share; 54/46 ownership split;
 *   combined LTM revenue SEK 11,662m; adjusted EBITA SEK 795m; 7,731 employees;
 *   expected annual cost synergies SEK 100-120m within three years.
 * - SEB Boprisindikator September 2026, published 06:30 CEST:
 *   indicator 41; 51% expect higher home prices, 10% lower; expected policy rate
 *   in one year 2.04% versus 1.95% in August; 38% report fully variable mortgage rates.
 * - SCB scheduled its August CPI flash estimate for 08:00 CEST today. The fresh
 *   numerical release was not retrievable from the verified source set at cutoff,
 *   so no August inflation figure is stated in this edition.
 *
 * Market status at cutoff: Nasdaq Stockholm had not yet opened. No Rejlers
 * share-price reaction is therefore stated as fact in this morning edition.
 *
 * Correct editor-uploaded cover (7 September date):
 * public/news-demo/file_00000000a1d08210bc8215e79606ddb7.png
 * The other image uploaded in the same commit is intentionally not used.
 */
export const BORSSVERIGE_7_SEPTEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-7-september-2026-rejlers-multiconsult",
  slug: "borssverige-7-september-2026-rejlers-multiconsult",
  title:
    "BörsSverige 7 september: Rejlers och Multiconsult planerar stor nordisk fusion",
  summary:
    "Rejlers och Multiconsult planerar en gränsöverskridande fusion som skulle skapa Multiconsult Rejlers med 11,7 miljarder kronor i intäkter och nära 8 000 anställda. Samtidigt dämpas svenska hushålls boprisoptimism när ränteförväntningarna stiger.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-09-07T08:14:00+02:00",
  url: "/news/borssverige-7-september-2026-rejlers-multiconsult",
  featured: true,
  imageUrl: "/news-demo/file_00000000a1d08210bc8215e79606ddb7.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "BörsSverige 7 september 2026 med Stockholm i morgonljus inför handelsdagen på Stockholmsbörsen.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle: "BörsSverige 7 september: Rejlers och Multiconsult i fusion",
  seoDescription:
    "Rejlers och Multiconsult planerar en fusion som skapar en konsultgrupp med 11,7 miljarder i intäkter och nära 8 000 anställda. Läs dagens BörsSverige.",
  seoKeywords: [
    "BörsSverige",
    "Stockholmsbörsen idag",
    "börsen idag",
    "svenska börsnyheter",
    "svenska aktier",
    "Rejlers",
    "Rejlers aktie",
    "Multiconsult",
    "Multiconsult Rejlers",
    "Rejlers Multiconsult fusion",
    "SEB Boprisindikator",
    "bostadsmarknaden Sverige",
    "7 september 2026",
  ],
  internalLinking: {
    topics: [
      "Stockholmsbörsen",
      "företagsaffärer",
      "teknikkonsulter",
      "bostadsmarknaden",
      "räntor",
    ],
    companies: ["Rejlers", "Multiconsult", "SEB"],
    tickers: ["REJL B", "MULTI", "SEB A"],
    relatedNewsSlugs: [
      "borssverige-4-september-2026-sectra",
      "norden-i-centrum-4-september-2026",
      "norden-i-centrum-3-september-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Rejlers står i centrum inför måndagens handel på Stockholmsbörsen. Den svenska teknikkonsulten och norska Multiconsult har antagit en gemensam plan om att slå samman bolagen i en gränsöverskridande fusion. Den nya koncernen ska heta Multiconsult Rejlers och skulle få närmare 8 000 medarbetare och intäkter på 11,7 miljarder kronor räknat på de senaste tolv månaderna.",
    "Beskedet publicerades klockan 07.30. Researchen för den här morgonupplagan stängdes klockan 08.14, före Stockholmsbörsens öppning, vilket betyder att någon kursreaktion i Rejlers ännu inte går att slå fast. Vid sidan av fusionen visar SEB:s nya Boprisindikator att hushållens optimism dämpas något samtidigt som förväntningarna på framtida räntor stiger.",
  ],
  sections: [
    {
      heading: "Rejlers och Multiconsult planerar fusion",
      paragraphs: [
        "Rejlers och Multiconsult har antagit en gemensam fusionsplan där Rejlers blir det övertagande bolaget. För varje aktie i Multiconsult ska aktieägarna enligt planen få 0,9725 nya B-aktier i Rejlers.",
        "Efter ett genomfört samgående väntas dagens Multiconsult-ägare kontrollera 54 procent av kapitalet i den nya koncernen, medan dagens Rejlers-ägare får 46 procent.",
        "Koncernen ska heta Multiconsult Rejlers. Huvudkontoret placeras i Stockholm och ett huvudkontor för den norska verksamheten blir kvar i Oslo. Rejlers nuvarande vd Viktor Svensson är tänkt att bli vd för den sammanslagna gruppen, medan Multiconsults tillförordnade vd Kristin O. Augestad blir vice vd och chef för Norge.",
        "Planen är också att B-aktien ska vara noterad både på Nasdaq Stockholm och Euronext Oslo Børs. Det ger den nya gruppen en tydligare nordisk kapitalmarknadsprofil än dagens Rejlers.",
      ],
    },
    {
      heading: "11,7 miljarder i intäkter och nära 8 000 anställda",
      paragraphs: [
        "Storleken på den planerade koncernen är den tydligaste förändringen för Rejlers. Under tolvmånadersperioden till och med juni 2026 hade bolagen tillsammans intäkter på 11 662 miljoner kronor.",
        "Det justerade EBITA-resultatet, ett rörelseresultatmått före vissa avskrivningar, uppgick till 795 miljoner kronor. Den justerade EBITA-marginalen var 6,7 procent.",
        "Vid utgången av Q2 hade Multiconsult 4 162 medarbetare och Rejlers 3 569. Tillsammans motsvarar det 7 731 anställda.",
        "Bolagen räknar med att samgåendet kan ge årliga kostnadsbesparingar på omkring 100–120 miljoner kronor inom tre år. Det handlar bland annat om att samordna överlappande funktioner och dra nytta av en större gemensam organisation.",
        "Den nya koncernen avser samtidigt att sätta mål om 10 procents årlig intäktstillväxt och en EBITA-marginal på 10 procent. Det är en tydlig ambition jämfört med den kombinerade marginalen på 6,7 procent i den preliminära sammanställningen.",
      ],
    },
    {
      heading: "Vad fusionen betyder för Rejlers",
      paragraphs: [
        "För Rejlers skulle affären förändra bolagets storlek, ägarbild och geografiska räckvidd i ett enda steg. Multiconsult är särskilt starkt i Norge, medan Rejlers har en etablerad position i Sverige och Finland. Den sammanslagna gruppen får dessutom en bred exponering mot energi, industri, bygg, infrastruktur och försvarsrelaterade projekt.",
        "Större skala är dock inte samma sak som garanterad högre lönsamhet. De beräknade kostnadsbesparingarna ska först genomföras och två stora organisationer ska integreras. Därför är tidsplanen, genomförandet och förmågan att behålla nyckelkompetens centrala frågor efter dagens besked.",
        "Fusionen är ännu inte beslutad av aktieägarna. Extra bolagsstämmor i båda bolagen väntas den 19 oktober och förslaget kräver minst två tredjedelars stöd i både kapital och röster. Därutöver krävs sedvanliga myndighetsgodkännanden och andra villkor innan affären kan slutföras.",
        "Bolagen siktar på att genomföra samgåendet sent 2026 eller i början av 2027. Om villkoren inte är uppfyllda senast den 30 juni 2027 kan fusionsplanen falla.",
      ],
    },
    {
      heading: "SEB: boprisoptimismen dämpas",
      paragraphs: [
        "Samtidigt kommer en färsk svensk signal från hushållen. SEB:s Boprisindikator sjunker med tre enheter till 41 i september, vilket är andra månaden i rad som förväntningarna går ned.",
        "51 procent av hushållen tror fortfarande att bostadspriserna stiger under det kommande året, medan 10 procent räknar med sjunkande priser. 25 procent väntar sig oförändrade priser.",
        "Hushållens ränteförväntningar har samtidigt stigit. De tror nu att styrräntan ligger på 2,04 procent om ett år, jämfört med 1,95 procent i förra månadens undersökning.",
        "Undersökningen visar också att 38 procent av bolånetagarna har helt rörlig ränta. Det tangerar den tidigare högsta nivån i SEB:s mätning och understryker hur känsliga många hushåll är för förändrade räntor.",
        "Boprisindikatorn är inte ett börsbesked i samma storleksklass som Rejlers fusion, men den är relevant för den svenska konjunkturbilden. Högre ränteförväntningar kan på sikt påverka hushållens konsumtion och därmed bolag med stor exponering mot den svenska hemmamarknaden.",
      ],
    },
    {
      heading: "Det här blir viktigt när Stockholmsbörsen öppnar",
      paragraphs: [
        "Rejlers blir den naturliga svenska aktien att följa när handeln startar klockan 09.00. Marknaden får då för första gången sätta ett pris på kombinationen av större skala, nya finansiella mål, utlovade kostnadsbesparingar och den utspädning som följer när Multiconsults ägare får nya Rejlers-aktier.",
        "Klockan 10.00 håller bolagen en gemensam digital investerarpresentation. Där väntas ledningen gå igenom fusionsplanen och svara på frågor, vilket blir nästa viktiga hållpunkt under förmiddagen.",
        "För dagens BörsSverige är huvudbilden därför tydlig: Rejlers har presenterat en affär som kan göra bolaget till en betydligt större nordisk teknikkonsult, men fusionen är fortfarande villkorad och de ekonomiska vinsterna ligger framför bolagen. Samtidigt visar SEB:s hushållsdata att räntan fortfarande är en central svensk marknadsfråga inför hösten.",
      ],
    },
  ],
};
