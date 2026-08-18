import type { NewsArticle } from "@/types/news";

/**
 * Hemnet / JP Morgan — 18 August 2026.
 *
 * Editorial cutoff: morning trading, 18 Aug 2026.
 *
 * Primary checks:
 * - Hemnet Group Q2 2026 interim report, 17 Jul 2026:
 *   net sales SEK 371.7m (-23.1%), EBITDA SEK 172.4m (-33.9%),
 *   operating profit SEK 149.4m (-37.1%), ARPL SEK 9,095 (+12.4%).
 * - Published listings declined 14% YoY in Q2, an improvement from -31% in Q1.
 * - Hemnet says Q2 absorbed the peak timing impact from "Sell first, pay later";
 *   about 40–45% of sellers were choosing the option at the Q2 publication date.
 * - Hemnet reports nearly 40m monthly sessions, 97% brand awareness among sellers,
 *   and about four times more sessions per published listing than its closest competitor.
 * - Hemnet investor calendar: preliminary July sales/listing data due 21 Aug 2026;
 *   Q3 report due 22 Oct 2026.
 *
 * Secondary market check:
 * - Placera/Finwire, 18 Aug 2026: JP Morgan double-upgraded Hemnet from
 *   underweight to overweight and raised its target price from SEK 81 to SEK 126.
 *
 * The article deliberately avoids unverified intraday prices, unverified recent
 * buyback quantities and unverified EGM/personnel details.
 *
 * Cover uploaded by the editor:
 * public/news-demo/file_000000004b1081f4bc3de58d4eeb387b.png
 */
export const HEMNET_RUSAR_JP_MORGAN_18_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "hemnet-rusar-jp-morgan-18-augusti-2026",
  slug: "hemnet-rusar-jp-morgan-18-augusti-2026",
  title: "Hemnet rusar efter JP Morgans helomvändning",
  summary:
    "Hemnet lyfter kraftigt på Stockholmsbörsen efter att JP Morgan vänt från undervikt till övervikt och höjt riktkursen. Bakom kursrörelsen finns också tecken på att annonsnedgången bromsar efter ett mycket svagt första halvår.",
  category: "company",
  source: "DivLab",
  publishedAt: "2026-08-18T10:46:00+02:00",
  url: "/news/hemnet-rusar-jp-morgan-18-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_000000004b1081f4bc3de58d4eeb387b.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "Hemnet rusar efter JP Morgans helomvändning, med Hemnet-motiv, bostad och stigande kursgrafik.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 6,
  seoTitle: "Hemnet rusar efter JP Morgans helomvändning – därför stiger aktien",
  seoDescription:
    "Hemnet rusar efter att JP Morgan höjt aktien till övervikt. Här är Q2-siffrorna, annonsproblemen och vad som avgör om vändningen håller.",
  seoKeywords: [
    "Hemnet",
    "Hemnet aktie",
    "JP Morgan Hemnet",
    "Hemnet riktkurs",
    "Hemnet Q2 2026",
    "Stockholmsbörsen",
    "bostadsmarknaden",
    "börsnyheter",
  ],
  showDisclaimer: true,
  intro: [
    "Hemnet hör till tisdagens tydliga vinnare på Stockholmsbörsen. Kursen lyfter kraftigt efter att JP Morgan gjort en stor förändring i sin syn på bolaget och gått från undervikt till övervikt.",
    "Men dagens uppgång handlar om mer än en ny riktkurs. Hemnet kommer från ett svagt första halvår med färre annonser och lägre resultat. Samtidigt finns tecken på att nedgången i annonsvolymer bromsar och att bolagets nya betalmodell kan börja ge en mer rättvisande bild under kommande kvartal.",
  ],
  sections: [
    {
      heading: "JP Morgan går från undervikt till övervikt",
      paragraphs: [
        "Enligt marknadsuppgifter från Finwire, återgivna av Placera, höjer JP Morgan Hemnet två steg från undervikt till övervikt. Banken höjer samtidigt riktkursen från 81 till 126 kronor.",
        "Det är en betydligt större förändring än en vanlig mindre justering av en riktkurs. Banken går från en tydligt försiktig syn på aktien till att nu se ett mer attraktivt förhållande mellan risk och möjlig utveckling framåt.",
        "En riktkurs är förstås ingen garanti för hur en aktie kommer att utvecklas. Men en så tydlig omsvängning får extra stor betydelse när marknadens förväntningar redan har pressats ned efter en svag period för bolaget.",
      ],
    },
    {
      heading: "Q2 såg svagt ut på ytan",
      paragraphs: [
        "Hemnets senaste kvartalsrapport innehöll flera tydligt svaga siffror. Nettoomsättningen i Q2 föll 23,1 procent till 371,7 miljoner kronor jämfört med samma period förra året.",
        "EBITDA minskade med 33,9 procent till 172,4 miljoner kronor och rörelseresultatet föll 37,1 procent till 149,4 miljoner kronor.",
        "Det är stora nedgångar och de ska inte förklaras bort. Hemnet har haft färre bostadsannonser på plattformen samtidigt som återhämtningen på den svenska bostadsmarknaden gått något långsammare än bolaget räknade med i början av året.",
        "Men Q2-siffrorna påverkas också av hur Hemnets nya betalmodell fungerar. Det gör att resultatraderna behöver läsas tillsammans med utvecklingen för annonser och intäkter per annons.",
      ],
    },
    {
      heading: "Annonsraset bromsar",
      paragraphs: [
        "En av de viktigaste datapunkterna i Q2 var utvecklingen för antalet publicerade annonser. De minskade med 14 procent jämfört med motsvarande kvartal året innan.",
        "Det är fortfarande en tydlig nedgång, men tempot har förbättrats kraftigt. Under Q1 hade antalet publicerade annonser fallit med omkring 31 procent jämfört med året före.",
        "Skillnaden mellan minus 31 och minus 14 procent är viktig. För ett bolag vars värde till stor del bygger på att bostadssäljare fortsätter välja plattformen kan en stabilisering i volymerna förändra marknadens syn långt innan tillväxten faktiskt är tillbaka.",
        "Det betyder inte att problemet är löst. Men det betyder att utvecklingen inte längre försämras i samma takt som tidigare under året.",
      ],
    },
    {
      heading: "Sälj först, betala senare är Hemnets stora test",
      paragraphs: [
        "Hemnet har rullat ut modellen Sälj först, betala senare i hela landet. Den innebär att bostadssäljaren kan vänta med att betala för annonsen tills bostaden faktiskt säljs.",
        "För säljaren sänks tröskeln eftersom kostnaden inte behöver tas redan när bostaden läggs ut. För Hemnet skapar modellen däremot en tidsförskjutning: annonsen kan vara publicerad länge innan intäkten bokförs.",
        "Bolaget beskrev Q2 som kvartalet där övergången väntades ge den största negativa tidseffekten på redovisningen. När fler av de bostäder som lagts ut med den nya modellen senare säljs ska en större del av de uppskjutna intäkterna börja synas.",
        "Vid Q2-rapporten uppgav Hemnet att omkring 40–45 procent av säljarna valde alternativet. Det gör modellen till en central fråga för resten av 2026: kan den både locka tillbaka fler annonser och samtidigt ge en normaliserad intäktsutveckling när övergångseffekten klingar av?",
      ],
    },
    {
      heading: "Hemnet tjänar mer per betald annons",
      paragraphs: [
        "Samtidigt som annonsvolymerna varit svaga fortsätter Hemnet att få mer betalt per betald annons. Den genomsnittliga intäkten per betald bostadsannons, ARPL, steg i Q2 med 12,4 procent till 9 095 kronor.",
        "Det visar att bolaget fortfarande har en stark förmåga att tjäna pengar på de bostäder som faktiskt annonseras på plattformen.",
        "Men ekvationen har en gräns. Högre intäkt per annons kan kompensera för en del av volymtappet, men inte hur länge som helst om antalet annonser fortsätter falla kraftigt.",
        "För en mer uthållig vändning behöver Hemnet därför både stabilare annonsvolymer och fortsatt bra intäkt per annons. Det är just den kombinationen marknaden nu försöker bedöma.",
      ],
    },
    {
      heading: "Nätverkseffekten är fortfarande Hemnets stora styrka",
      paragraphs: [
        "Trots det svaga halvåret är Hemnets räckvidd fortsatt mycket stor. Bolaget uppgav i Q2 att plattformen hade närmare 40 miljoner besökssessioner per månad och en varumärkeskännedom på 97 procent bland bostadssäljare.",
        "Hemnet uppger också att plattformen genererar omkring fyra gånger fler besök per publicerad annons än den närmaste konkurrenten.",
        "Det är kärnan i Hemnets nätverkseffekt. Säljare vill finnas där köparna finns, samtidigt som köpare går till den plats där flest relevanta bostäder finns.",
        "Det är också därför annonsvolymerna är så viktiga. Om Hemnet lyckas stabilisera andelen bostäder som når plattformen stärks nätverkseffekten. Om fler bostäder i stället säljs utanför Hemnet eller innan de når den öppna marknaden blir motsatsen en risk.",
      ],
    },
    {
      heading: "Därför är dagens rusning intressant – men inget bevis på en vändning",
      paragraphs: [
        "Dagens kraftiga uppgång visar att marknaden är beredd att snabbt omvärdera Hemnet när framtidsbilden ser mindre svag ut än tidigare. Det är något annat än att bolagets problem redan är lösta.",
        "Omsättningen och resultatet är fortfarande klart lägre än för ett år sedan. Annonsvolymerna är fortfarande negativa och den nya betalmodellen måste visa att den faktiskt leder till en bättre utveckling när tidsförskjutningen i intäkterna minskar.",
        "Det positiva är framför allt att flera viktiga datapunkter rör sig åt ett bättre håll: annonsnedgången har bromsat, intäkten per annons fortsätter stiga och en stor del av säljarna använder den nya betalmodellen.",
        "Det är den balansen som gör Hemnet mer intressant nu än om aktien bara hade stigit på en lös förhoppning. Marknaden har fått konkreta saker att följa och jämföra under de kommande månaderna.",
      ],
    },
    {
      heading: "Nästa test kommer redan den 21 augusti",
      paragraphs: [
        "Hemnet behöver inte vänta till nästa kvartalsrapport för att ge marknaden nya datapunkter. Den 21 augusti ska bolaget publicera preliminära försäljningssiffror och annonsvolymer för juli.",
        "De siffrorna blir ett tidigt test av tesen bakom dagens optimism. Om annonsvolymerna fortsätter stabiliseras får bilden av en gradvis förbättring mer stöd. Om de åter försämras kan marknaden snabbt börja ifrågasätta hur långt återhämtningen egentligen kommit.",
        "Därefter kommer Q3-rapporten den 22 oktober. Då blir det lättare att se om Sälj först, betala senare har börjat ge den intäktsnormalisering som Hemnet räknat med och om förbättringen i annonsflödet håller i sig.",
      ],
    },
  ],
};
