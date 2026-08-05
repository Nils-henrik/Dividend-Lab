import type { NewsArticle } from "@/types/news";

/**
 * Approved Börsnyheter article — do not rewrite body copy.
 *
 * Verified figures (4 August 2026, intraday while Nasdaq Stockholm open):
 * - SIVE.ST (Yahoo Finance realtime): about SEK 36.84 (+18.15% vs prev close
 *   SEK 31.18) as of 16:44 CEST; day's range SEK 32.50–39.50. Not a closing
 *   price. Title avoids “över 20 procent” because verified move was below 20%.
 * - Reuters (4 Aug 2026, Alexandra Alper / licensed republication): Trump
 *   administration drafting ban on new Chinese optical transceiver imports;
 *   FCC working on measure; proposal not final and may be modified or shelved.
 *   US peers after US open per Reuters: Applied Optoelectronics ~+18%,
 *   Coherent ~+11%, Lumentum ~+7%.
 * - Sivers Q1 2026 interim report (29 May 2026): net sales SEK 61.9 m (−22%);
 *   EBIT SEK −41.5 m; cash flow from operating activities SEK −49.2 m;
 *   opportunity pipeline USD 799 m (+77% YTD vs end-2025).
 * - Directed share issue (press 1 July 2026 / board 30 June 2026): ~SEK 700 m
 *   at SEK 57/share; proceeds for InP laser / optical amplifier capacity for
 *   AI datacenters and Automotive LIDAR, field resources and R&D.
 * - Partnerships (company press): GlobalFoundries (2 June 2026); Jabil 1.6T
 *   LRO module (15 April 2026); O-Net + Enablence ELS / CPO (17 March 2026).
 * - Short interest (Finwire / DI, 4 Aug 2026, citing FI public short register):
 *   D. E. Shaw new public short at 0.59% of capital; total short 2.57%.
 * - Financial calendar (company update 9 July 2026): Q2 2026 interim report
 *   27 August 2026.
 *
 * Cover: original DivLab editorial illustration. See matching .license.txt.
 */
export const SIVERS_RUSAR_AI_FOTONIK_USA_IMPORTREGLER_ARTICLE: NewsArticle = {
  id: "sivers-rusar-ai-fotonik-usa-importregler",
  slug: "sivers-rusar-ai-fotonik-usa-importregler",
  title:
    "Sivers rusar på börsen – USA-uppgifter tänder nytt hopp kring AI-fotonik",
  summary:
    "Sivers Semiconductors tillhör dagens stora vinnare på Stockholmsbörsen. Aktien rusar kraftigt efter uppgifter om att USA kan stoppa importen av vissa kinesiska komponenter till datacenter. Men uppgången bygger på förväntningar – inte på någon ny order till Sivers.",
  category: "company",
  source: "DivLab",
  publishedAt: "2026-08-04T16:50:00+02:00",
  url: "/news/sivers-rusar-ai-fotonik-usa-importregler",
  featured: true,
  imageUrl: "/news-demo/sivers-rusar-ai-fotonik-usa-importregler.webp",
  thumbnailObjectPosition: "center 32%",
  mobileThumbnailObjectPosition: "center 18%",
  imageAlt:
    "Optiska ljusstrålar i ett AI-datacenter med rubriken Sivers rusar",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 4,
  seoTitle: "Sivers rusar på börsen efter USA-uppgifter om AI-fotonik",
  seoDescription:
    "Sivers Semiconductors rusar på börsen efter uppgifter om möjliga amerikanska importrestriktioner. Här är vad som driver uppgången och vilka risker som återstår.",
  seoKeywords: [
    "Sivers aktie",
    "Sivers rusar",
    "Sivers Semiconductors",
    "Sivers AI",
    "Sivers fotonik",
    "AI-datacenter",
    "optiska transceivrar",
    "kiselfotonik",
    "GlobalFoundries",
    "Stockholmsbörsen",
  ],
  showDisclaimer: true,
  intro: [
    "Sivers Semiconductors tillhör dagens stora vinnare på Stockholmsbörsen. Aktien rusar kraftigt efter uppgifter om att USA kan stoppa importen av vissa kinesiska komponenter till datacenter. Men uppgången bygger på förväntningar – inte på någon ny order till Sivers.",
    "Sivers Semiconductors fick rejäl fart under tisdagseftermiddagen. Vid 16.45-tiden handlades aktien omkring 36,84 kronor, vilket motsvarade en uppgång på drygt 18 procent för dagen.",
    "Kursuppgiften är en ögonblicksbild från klockan 16.45 den 4 augusti 2026 och kan ha förändrats sedan artikeln publicerades.",
    "Bakom rusningen ligger framför allt nyheter från USA. Enligt uppgifter arbetar den amerikanska telekommyndigheten FCC med regler som kan stoppa eller begränsa importen av nya kinesiska optiska transceivrar.",
    "Det är komponenter som skickar stora mängder data genom fiberoptiska kablar och som spelar en central roll i moderna AI-datacenter. Något slutligt beslut har ännu inte fattats och förslaget kan fortfarande förändras eller stoppas.",
  ],
  sections: [
    {
      heading: "Amerikanska optikbolag rusade",
      paragraphs: [
        "Uppgifterna fick flera amerikanska tillverkare av optiska komponenter att stiga kraftigt. Applied Optoelectronics avancerade omkring 18 procent, Coherent cirka 11 procent och Lumentum runt 7 procent efter att handeln i USA öppnat.",
        "Även svenska Sivers drogs med i uppgången.",
        "Bolagets Photonics-verksamhet utvecklar avancerade lasrar och optiska komponenter som kan användas för att överföra stora mängder data mellan processorer och annan utrustning i AI-datacenter.",
        "Om amerikanska kunder tvingas välja bort kinesiska leverantörer kan efterfrågan på alternativa lösningar från USA och Europa öka.",
        "Det betyder däremot inte att Sivers automatiskt blir en vinnare.",
        "Det har inte presenterats någon ny order, något nytt kundavtal eller någon prognoshöjning från bolaget som förklarar dagens kursrusning. Marknaden handlar i stället upp aktien på möjligheten att Sivers på längre sikt kan gynnas av en mer västorienterad leveranskedja.",
      ],
    },
    {
      heading: "Sivers har byggt en tydlig position inom AI",
      paragraphs: [
        "Sivers koppling till AI-datacenter är inte enbart en börsberättelse. Bolaget har under året presenterat flera samarbeten inom optisk kommunikation.",
        "I juni meddelade Sivers ett strategiskt samarbete med halvledartillverkaren GlobalFoundries. Sivers laserkomponenter ska ingå i referenslösningar baserade på GlobalFoundries plattform för kiselfotonik.",
        "Tekniken riktas bland annat mot snabbare och mer energieffektiva förbindelser i AI-datacenter.",
        "Bolaget samarbetar även med tillverkaren Jabil kring en optisk transceivermodul med en överföringshastighet på 1,6 terabit per sekund.",
        "Därutöver utvecklar Sivers tillsammans med O-Net och Enablence externa ljuskällor för så kallad co-packaged optics. Det är en teknik där optiska anslutningar placeras närmare de kraftfulla processorer som används för AI.",
        "Det är just den typen av teknik som marknaden hoppas ska få ett kraftigt genombrott när datacentren blir större och traditionella kopparanslutningar får allt svårare att hantera den växande datamängden.",
      ],
    },
    {
      heading: "Stor skillnad mellan potential och resultat",
      paragraphs: [
        "Trots dagens kursrusning är riskerna fortsatt betydande.",
        "I det första kvartalet minskade Sivers omsättning med 22 procent till 61,9 miljoner kronor. Rörelseresultatet uppgick till minus 41,5 miljoner kronor och kassaflödet från den löpande verksamheten var minus 49,2 miljoner kronor.",
        "Samtidigt rapporterade bolaget en affärspipeline på 799 miljoner dollar, vilket var en ökning med 77 procent sedan årsskiftet.",
        "En pipeline består dock av möjliga framtida affärer och ska inte blandas ihop med bindande beställningar eller redovisade intäkter.",
        "I slutet av juni tog Sivers in omkring 700 miljoner kronor genom en riktad nyemission till kursen 57 kronor per aktie.",
        "Trots dagens rusning handlas aktien fortfarande tydligt under emissionskursen – ungefär en tredjedel under emissionskursen.",
        "Kapitalet ska bland annat användas till att utöka tillverkningskapaciteten för lasrar och optiska förstärkare riktade mot AI-datacenter och lidar.",
      ],
    },
    {
      heading: "Blankare positionerar sig för nedgång",
      paragraphs: [
        "Samma dag som aktien rusade blev den amerikanska hedgefonden D. E. Shaw en ny offentlig blankare i Sivers.",
        "Fonden hade enligt offentlig rapportering en kort position motsvarande 0,59 procent av bolagets kapital. Totalt var 2,57 procent av aktierna blankade.",
        "Uppgifterna visar hur delad marknadens syn på Sivers är.",
        "Vissa investerare ser ett svenskt teknikbolag som kan få en viktig roll i den snabbt växande infrastrukturen bakom artificiell intelligens. Andra räknar med att värderingen och förväntningarna ligger långt före bolagets faktiska försäljning och lönsamhet.",
      ],
    },
    {
      heading: "Nu krävs riktiga affärer",
      paragraphs: [
        "Dagens uppgång visar hur känslig Sivers-aktien är för nyheter kring AI, fotonik och handelspolitik.",
        "Ett amerikanskt importförbud skulle kunna förändra konkurrenssituationen, men det är fortfarande oklart hur reglerna utformas, om de blir verklighet och vilka företag som i praktiken gynnas.",
        "För att kursuppgången ska få ett stabilare fundament behöver Sivers omvandla sina samarbeten och sin stora pipeline till volymproduktion, växande intäkter och förbättrat kassaflöde.",
        "Nästa viktiga hållpunkt blir bolagets delårsrapport den 27 augusti 2026.",
        "Fram till dess lär aktien fortsätta präglas av stora rörelser – åt båda håll.",
        "Artikeln är endast avsedd som information och ska inte ses som investeringsrådgivning.",
      ],
    },
  ],
};
