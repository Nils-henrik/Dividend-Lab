import type { NewsArticle } from "@/types/news";

/**
 * Wall Street / US market — 18 August 2026.
 *
 * Editorial cutoff: 14:50 Europe/Stockholm, before the US cash-market open.
 * Premarket and futures moves are snapshots and may change during regular trading.
 *
 * Verified market check:
 * - Reuters, 18 Aug 2026: S&P 500 futures -0.47%, Nasdaq 100 futures -1.21%,
 *   Dow futures near flat at the cited snapshot.
 * - Reuters: Nvidia -2% premarket; AMD, Intel, Micron and Marvell -2% to -5%;
 *   Sandisk and Western Digital about -6%.
 * - Reuters: US 30-year Treasury yield at its highest level since 2007;
 *   10-year yield near its highest since January 2025.
 * - Reuters: Brent +0.4% around three-week highs as US-Iran peace hopes faded.
 * - Reuters: Home Depot +2.3% premarket after beating Q2 sales estimates.
 *
 * The 18 Aug BLS July import-price outcome is deliberately omitted because the
 * directly verifiable BLS current-release page still exposed the June release at
 * editorial cutoff. This follows the DivLab US-market release-status guardrail.
 *
 * Cover uploaded by the editor:
 * public/news-demo/file_00000000e114820ab7fe53313df8d3ee.png
 */
export const TECHFROSSA_WALL_STREET_NVIDIA_LANGRANTAN_18_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "techfrossa-wall-street-nvidia-langrantan-18-augusti-2026",
  slug: "techfrossa-wall-street-nvidia-langrantan-18-augusti-2026",
  title: "Techfrossa inför Wall Street – Nvidia faller när långräntan når 19-årstopp",
  summary:
    "Nasdaq går mot en tung öppning när Nvidia och flera chipbolag faller i förhandeln. Samtidigt når den amerikanska 30-årsräntan sin högsta nivå sedan 2007 och ny oro kring Iran håller inflationsfrågan vid liv.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-18T14:50:00+02:00",
  url: "/news/techfrossa-wall-street-nvidia-langrantan-18-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_00000000e114820ab7fe53313df8d3ee.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  mobileHeadlineFirst: true,
  imageAlt:
    "DivLab-omslag om Wall Street den 18 augusti 2026 med amerikanska flaggan och rubriken Techfrossa idag – räntor upp och Nasdaq pressas.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle: "Wall Street idag: Nvidia faller när räntorna stiger",
  seoDescription:
    "Nasdaq går mot en svag öppning när Nvidia och chipaktier faller. USA:s 30-årsränta är på den högsta nivån sedan 2007. Här är det som pressar Wall Street.",
  seoKeywords: [
    "Wall Street idag",
    "USA-börsen idag",
    "Nasdaq",
    "Nasdaq 100",
    "Nvidia aktie",
    "chipaktier",
    "USA ränta",
    "30-årsränta USA",
    "S&P 500",
    "Dow Jones",
    "Home Depot",
    "börsnyheter",
  ],
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en tydligt svagare öppning på tisdagen den 18 augusti. Pressen är framför allt koncentrerad till tekniksektorn, där Nvidia och flera andra stora chipbolag faller i förhandeln.",
    "I den senaste Reuters-snapshoten låg terminen för Nasdaq 100 omkring 1,2 procent lägre och S&P 500-terminen cirka 0,5 procent ned. Dow Jones-terminen låg däremot nära oförändrat. Det gör dagens rörelse mer till en techledd nedgång än en bred börspanik.",
    "Samtidigt har den amerikanska 30-åriga statsobligationsräntan stigit till den högsta nivån sedan 2007. Kombinationen av höga långräntor, dyr energi och förnyad geopolitisk oro sätter därmed press på de delar av marknaden som värderas högst på framtida tillväxt.",
  ],
  sections: [
    {
      heading: "Nvidia och chipbolagen faller inför öppningen",
      paragraphs: [
        "Nvidia handlades omkring 2 procent lägre i förhandeln i Reuters senaste marknadssnapshot. Även Micron, Marvell, AMD och Intel föll mellan ungefär 2 och 5 procent.",
        "Ännu större nedgångar syntes bland flera lagringsbolag. Sandisk och Western Digital tappade omkring 6 procent vardera och hörde till de tydligaste förlorarna inför öppningen.",
        "Det kommer efter en period där AI- och halvledaraktier varit några av de viktigaste motorerna bakom den amerikanska börsuppgången. När samma grupp börjar falla samtidigt får det därför snabbt stor effekt på Nasdaq.",
      ],
    },
    {
      heading: "Långräntan når nivåer från 2007",
      paragraphs: [
        "Den stora rörelsen finns inte bara på aktiemarknaden. Räntan på den amerikanska 30-åriga statsobligationen har nått sin högsta nivå sedan 2007, medan tioårsräntan ligger nära den högsta nivån sedan januari 2025.",
        "Höga långräntor är särskilt känsliga för tillväxtbolag. En stor del av värderingen i snabbväxande teknikföretag bygger på vinster som väntas långt fram i tiden. När marknadsräntan stiger blir de framtida vinsterna mindre värda i dagens kalkyl, samtidigt som finansieringskostnaderna ökar.",
        "Det betyder inte att Nvidias verksamhet plötsligt har försämrats. Men det kan förändra hur mycket investerare är beredda att betala för framtida AI-tillväxt.",
      ],
    },
    {
      heading: "Iran och oljan håller inflationsoron vid liv",
      paragraphs: [
        "Ränteoron får samtidigt bränsle från geopolitiken. Förhoppningarna om en mer permanent lösning mellan USA och Iran har minskat efter att den tillfälliga vapenvilan löpte ut den 17 augusti.",
        "Enligt Reuters steg Brentoljan omkring 0,4 procent och låg kvar nära den högsta nivån på ungefär tre veckor. Dyrare energi kan på nytt göra inflationsutvecklingen svårare för centralbankerna, vilket bidrar till pressen på obligationsmarknaden.",
        "För Wall Street blir sambandet därför viktigt: högre energipriser kan öka inflationsoron, som i sin tur kan hålla långräntorna höga. Det är framför allt den räntedelen som slår mot dagens högt värderade teknikaktier.",
      ],
    },
    {
      heading: "Home Depot går mot strömmen",
      paragraphs: [
        "Alla stora amerikanska aktier faller inte. Home Depot steg omkring 2,3 procent i förhandeln efter att bolagets försäljning i det andra kvartalet kom in över marknadens förväntningar.",
        "Uppgången hjälper till att förklara varför Dow Jones-terminen står emot betydligt bättre än Nasdaq 100. Det förstärker bilden av att tisdagens svaghet hittills framför allt är koncentrerad till teknik och andra räntekänsliga tillväxtaktier.",
      ],
    },
    {
      heading: "Det här blir viktigast när Wall Street öppnar",
      paragraphs: [
        "Den amerikanska kontantmarknaden öppnar klockan 15.30 svensk tid. Då får vi det första riktiga testet på om den tydliga svagheten i terminer och förhandel håller i sig när den ordinarie handeln börjar.",
        "Först blir Nasdaq viktigt. Om en nedgång runt en procent eller mer består efter öppningen blir det en tydlig signal om att investerare fortsätter minska risken i tekniksektorn.",
        "Därefter är Nvidia och halvledarna centrala. En snabb återhämtning där kan dra med sig Nasdaq uppåt. Om nedgångarna i stället fördjupas kan de bli en betydligt större broms för hela indexet.",
        "Slutligen behöver obligationsräntorna följas. Fortsätter den amerikanska långräntan upp blir motvinden för högt värderade tillväxtbolag svårare att ignorera.",
      ],
    },
    {
      heading: "DivLabs bild: techpress – inte börspanik",
      paragraphs: [
        "Inför öppningen ser det här mer ut som en räntedriven techsmäll än en bred börspanik. Dow Jones håller emot samtidigt som Nvidia, chipbolag och lagringsaktier faller betydligt mer.",
        "Det är en viktig skillnad. Marknaden säljer inte allt urskillningslöst, utan pressen ligger främst där värderingarna och räntekänsligheten är som högst.",
        "Den stora frågan i eftermiddag blir därför inte bara om Nasdaq öppnar på minus. Den blir om investerarna börjar köpa tillbaka AI- och chipaktier efter den första nedgången – eller om stigande långräntor får marknaden att fortsätta skruva ned vad den är beredd att betala för framtida tillväxt.",
      ],
    },
  ],
};
