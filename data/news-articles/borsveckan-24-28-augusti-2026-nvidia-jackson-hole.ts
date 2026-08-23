import type { NewsArticle } from "@/types/news";

/**
 * Börsveckan 24–28 augusti 2026 — publicerad 23 augusti 2026.
 *
 * Redaktionellt fokus: veckan framåt med Nvidia, amerikansk PCE/BNP,
 * Jackson Hole, svenska rapporter och en mycket lätt teknisk bild för
 * OMXS30 och Nasdaq Composite.
 *
 * Källor kontrollerade inför publicering:
 * - Nvidia Investor Relations: Q2 FY2027 rapport 26 augusti, resultat ca 22.20 CEST,
 *   konferenssamtal 23.00 CEST samt bolagets Q2-guidning om 91 md USD +/- 2%.
 * - U.S. Bureau of Economic Analysis: Personal Income and Outlays samt reviderad
 *   Q2-BNP publiceras 26 augusti kl. 14.30 CEST.
 * - Federal Reserve / Kansas City Fed: Jackson Hole 27–29 augusti och Fed-chefen
 *   Kevin Warshs keynote 28 augusti kl. 16.00 CEST.
 * - SCB: fullständiga nationalräkenskaper för Q2 och detaljhandel juli 28 augusti.
 * - Finwire/Placera kalender vecka 35: svenska rapportdatum och Riksbankens protokoll.
 * - Reuters/AP/marknadsdata: Nasdaq Composite stängde 21 augusti på 26 180,45 och
 *   föll 2,05% under veckan. OMXS30 stängde omkring 3 292 punkter.
 *
 * Ingen rå källista visas i den publika artikeln enligt DivLabs redaktionella standard.
 *
 * Editor-uploaded asset:
 * - cover: public/news-demo/file_0000000029108246b664b7b3ad7dee25.png
 */
export const BORSVECKAN_24_28_AUGUSTI_2026_NVIDIA_JACKSON_HOLE_ARTICLE: NewsArticle = {
  id: "borsveckan-24-28-augusti-2026-nvidia-jackson-hole",
  slug: "borsveckan-24-28-augusti-2026-nvidia-jackson-hole",
  title:
    "Börsveckan 24–28 augusti: Nvidia, Jackson Hole och nivåerna som kan sätta tonen för september",
  summary:
    "Nvidia rapporterar, PCE och amerikansk BNP släpps och Fed samlas i Jackson Hole. DivLab går igenom veckans viktigaste hållpunkter och gör en lätt teknisk lägesbild för OMXS30 och Nasdaq – med både positiva och negativa scenarier inför fredagens stängning.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-23T20:04:00+02:00",
  url: "/news/borsveckan-24-28-augusti-2026-nvidia-jackson-hole",
  featured: true,
  imageUrl: "/news-demo/file_0000000029108246b664b7b3ad7dee25.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  mobileHeadlineFirst: true,
  imageAlt:
    "DivLab-omslag för Börsveckan 24–28 augusti 2026 med Nvidia, OMXS30 och Nasdaq i fokus och texten Köp till sillen – sälj till kräftorna?",
  imageCaption: "AI-illustration: DivLab.",
  readingMinutes: 9,
  seoTitle: "Börsveckan 24–28 augusti: Nvidia, OMXS30 och Nasdaq",
  seoDescription:
    "Nvidia, PCE, Jackson Hole och svensk BNP står i fokus. DivLab går igenom vecka 35 och viktiga nivåer för OMXS30 och Nasdaq.",
  seoKeywords: [
    "börsveckan",
    "vecka 35",
    "Nvidia rapport",
    "Nvidia Q2 2027",
    "OMXS30",
    "Nasdaq",
    "Jackson Hole",
    "PCE inflation",
    "Kevin Warsh",
    "svensk BNP",
    "teknisk analys",
    "börsen nästa vecka",
  ],
  internalLinking: {
    topics: [
      "börsveckan",
      "OMXS30",
      "Nasdaq",
      "Nvidia",
      "Jackson Hole",
      "PCE",
      "teknisk analys",
    ],
    companies: ["Nvidia", "BioArctic", "Elekta", "Lundbergs", "Systemair", "Intrum", "Tobii"],
    tickers: ["NVDA"],
    relatedNewsSlugs: [
      "veckan-som-gatt-21-augusti-2026",
      "techfrossa-wall-street-nvidia-langrantan-18-augusti-2026",
      "borsvecka-34-omxs30-volvo-seb-inwido",
    ],
    relatedLearningSlugs: ["teknisk-analys-for-nyborjare"],
  },
  showDisclaimer: true,
  intro: [
    "\"Köp till sillen – sälj till kräftorna\" lyder ett gammalt svenskt börsuttryck. Det är förstås ingen regel som bestämmer vart marknaden ska ta vägen, men tajmingen är svår att bortse från just den här veckan. Kräftskivorna är igång, sommaren går mot sitt slut och börsen står inför flera besked som kan sätta tonen inför september.",
    "Nvidia rapporterar på onsdag kväll. Samma dag kommer amerikansk PCE-inflation och en ny uppskattning av USA:s BNP. Från torsdag samlas centralbankirer i Jackson Hole och på fredag väntar Fed-chefen Kevin Warshs huvudtal. I Sverige får vi dessutom Riksbankens protokoll, flera bolagsrapporter och färska BNP- och detaljhandelssiffror.",
    "Utgångsläget är samtidigt känsligt. OMXS30 stängde fredagen kring 3 292 punkter efter en stark avslutning, medan Nasdaq Composite stängde på 26 180,45 men föll 2,05 procent sett över hela veckan. I [förra veckans sammanfattning](/news/veckan-som-gatt-21-augusti-2026) var stigande långräntor en av de tydligaste röda trådarna – och även den här veckan kan räntemarknaden bli avgörande.",
  ],
  sections: [
    {
      heading: "Köp till sillen – sälj till kräftorna?",
      paragraphs: [
        "Börsuttrycket fungerar bättre som en påminnelse om säsongen än som en handelsstrategi. Kalendern skapar varken vinster eller förluster av sig själv, och ett enskilt år kan utvecklas helt annorlunda än historiska mönster.",
        "Men sensommaren är ofta en period där handelsaktiviteten återvänder, investerare börjar blicka mot hösten och höga värderingar på nytt måste försvaras av faktiska vinster, räntor och ekonomisk data. Just den kombinationen får vi mycket av under vecka 35.",
        "Frågan är därför inte om kräftorna automatiskt betyder säljläge. Frågan är om marknaden under veckan ger oss skäl att bli mer optimistiska – eller mer försiktiga – inför september.",
      ],
    },
    {
      heading: "Nvidia blir veckans stora bolagshändelse",
      paragraphs: [
        "Onsdag kväll riktas blickarna mot Nvidia. Bolaget offentliggör resultatet för sitt andra kvartal i räkenskapsåret 2027 omkring klockan 22.20 svensk tid och håller konferenssamtal omkring 23.00.",
        "Efter förra kvartalet guidade Nvidia för intäkter på omkring 91 miljarder dollar, plus eller minus 2 procent. Bolaget räknade då inte med några intäkter från datacenter-compute i Kina i prognosen. Det gör både den faktiska försäljningen och kommentarerna om efterfrågan framåt särskilt viktiga.",
        "För marknaden blir fokus större än en enskild vinstsiffra. Investerare kommer vilja höra om efterfrågan på AI-infrastruktur, datacenterinvesteringar, nästa generations system, leveranskapacitet och bruttomarginaler. Nvidia har blivit en temperaturmätare för stora delar av AI-handeln och en kraftig reaktion kan därför snabbt sprida sig till resten av Nasdaq.",
        "Det positiva Nvidia-scenariot är enkelt: en rapport som överträffar förväntningarna, fortsatt stark efterfrågan och en prognos som visar att AI-investeringarna håller hög fart – samtidigt som aktien faktiskt belönas efter rapporten.",
        "Det negativa scenariot kräver inte nödvändigtvis en dålig rapport. När förväntningarna är höga kan en rapport som bara är bra ändå bli en besvikelse. Svagare marginaler, försiktigare utsikter eller tecken på att investeringsviljan hos de största kunderna mattas skulle kunna pressa hela tekniksektorn.",
      ],
    },
    {
      heading: "Onsdagens makro kan bli lika viktigt som Nvidia",
      paragraphs: [
        "Redan innan Nvidia rapporterar får marknaden en tung amerikansk datapunkt. Klockan 14.30 svensk tid på onsdag publiceras rapporten Personal Income and Outlays för juli, där PCE-inflationen ingår. Samtidigt kommer den andra uppskattningen av USA:s BNP för andra kvartalet.",
        "PCE är särskilt viktig eftersom måttet följs nära av Federal Reserve. Om den underliggande inflationen fortsätter vara hög samtidigt som tillväxten håller uppe kan marknaden börja räkna med ett stramare ränteläge under längre tid. Det skulle vara ett svårare utgångsläge för högt värderade tillväxtaktier.",
        "Ett lugnare inflationsutfall, utan tydlig försämring i ekonomin, skulle däremot kunna minska trycket på långräntorna och ge Nasdaq bättre förutsättningar inför Nvidia-rapporten några timmar senare.",
      ],
    },
    {
      heading: "Svenska veckan: Riksbanken, BioArctic, Elekta och BNP",
      paragraphs: [
        "På tisdag klockan 09.30 publicerar Riksbanken protokollet från det penningpolitiska mötet bakom räntebeskedet den 20 augusti. Efter att styrräntan lämnats oförändrad på 1,75 procent blir nyanserna i diskussionen viktiga, framför allt hur direktionen ser på inflationen och risken för en senare höjning.",
        "Onsdagens svenska rapportlista innehåller bland annat BioArctic och Sleep Cycle. Torsdagen är tyngre med Elekta, Lundbergs, Eolus, Systemair, Resurs och Sivers Semiconductors. På fredag rapporterar bland andra Intrum och Tobii.",
        "Fredagsmorgonen blir dessutom viktig för den svenska konjunkturbilden. Klockan 08.00 publicerar SCB de fullständiga nationalräkenskaperna för andra kvartalet samt detaljhandeln för juli. Klockan 09.00 följer Konjunkturinstitutets barometer.",
        "För OMXS30 är det inte en enskild rapportdag som dominerar veckan på samma sätt som Nvidia gör i USA. I stället blir kombinationen av svenska konjunktursignaler, räntor och det internationella risksentimentet viktigast.",
      ],
    },
    {
      heading: "Jackson Hole kan avgöra hur veckan slutar",
      paragraphs: [
        "Federal Reserve Bank of Kansas City håller årets Jackson Hole-symposium den 27–29 augusti. På fredag klockan 16.00 svensk tid håller Fed-chefen Kevin Warsh huvudanförandet.",
        "Efter den senaste tidens stora rörelser i amerikanska statsobligationer lär marknaden lyssna noga efter formuleringar om inflation, tillväxt och ränteläget. Börsen behöver inte nödvändigtvis ett löfte om lägre räntor för att reagera positivt. Det kan räcka med ett budskap som inte förstärker rädslan för ännu högre långräntor.",
        "Om Warsh däremot låter tydligt mer hökaktig än marknaden räknar med samtidigt som PCE-inflationen är besvärande kan fredagseftermiddagen snabbt bli veckans mest volatila del.",
      ],
    },
    {
      heading: "OMXS30 – 3 300 blir första testet",
      paragraphs: [
        "Vi håller den tekniska bilden medvetet enkel. OMXS30 stängde fredagen omkring 3 292 punkter och handlades under dagen upp mot området kring 3 300. Det gör 3 300–3 312 till den första zonen vi vill se index ta sig igenom.",
        "Ett etablerat utbrott över den zonen skulle vara ett positivt styrketecken. Därefter ligger 52-veckorshögsta i området runt 3 349 punkter som nästa tydliga referens.",
        "På nedsidan är området kring 3 258–3 260 första kortsiktiga stödet. Under det blir ungefär 3 235–3 240 mer intressant. Ett tydligt brott genom även den zonen skulle göra 3 200 till nästa naturliga psykologiska nivå att bevaka.",
        "DivLabs grundbild inför veckan är därför försiktigt positiv så länge index håller sig ovanför de senaste bottnarna, men marknaden behöver visa att fredagens uppgång kan följas av ett riktigt brott över 3 300. Den som vill läsa mer om grunderna bakom stöd och motstånd hittar dem i [DivLabs guide till teknisk analys](/learning/teknisk-analys-for-nyborjare).",
      ],
    },
    {
      heading: "Nasdaq – 26 000 är veckans försvarslinje",
      paragraphs: [
        "Nasdaq Composite stängde fredagen på 26 180,45 efter en uppgång på omkring 0,4 procent för dagen. Veckan som helhet slutade däremot 2,05 procent lägre, vilket gör den korta bilden mer känslig än för OMXS30.",
        "Området kring 26 000–26 050 blir den första försvarslinjen. Både torsdagens och fredagens handel sökte sig ner mot den zonen innan köpare kom tillbaka. Så länge området håller finns möjlighet till en ny återhämtning.",
        "På ovansidan är ungefär 26 450 första tydliga nivån. Därefter väntar 26 650–26 900, där index handlades innan förra veckans nedgång tog fart. Ovanför det ligger 52-veckorshögsta runt 27 190.",
        "Ett tydligt veckobrott under 26 000 skulle däremot försvaga bilden och öka risken för att marknaden söker sig ner mot området kring 25 500. Den senaste [teknikfrossan på Wall Street](/news/techfrossa-wall-street-nvidia-langrantan-18-augusti-2026) visar hur snabbt räntor och värderingsoro kan slå mot halvledar- och AI-aktier.",
      ],
    },
    {
      heading: "Det positiva utfallet för börsveckan",
      paragraphs: [
        "I det starkare scenariot visar PCE att inflationstrycket inte accelererar, långräntorna lugnar sig och Nvidia levererar en rapport med stark efterfrågan och trovärdiga framtidsutsikter. Warsh undviker samtidigt att ge marknaden nya skäl att prisa in ett ännu stramare ränteläge.",
        "Då vill vi se OMXS30 etablera sig över 3 300 och börja närma sig området kring 3 349. För Nasdaq skulle en återgång över 26 450 följd av ett försök mot 26 650–26 900 vara ett tydligt tecken på att köparna återtagit initiativet.",
        "Ett sådant slut på veckan skulle ge marknaden ett betydligt bättre tekniskt och fundamentalt utgångsläge när september börjar.",
      ],
    },
    {
      heading: "Det negativa utfallet",
      paragraphs: [
        "Det svagare scenariot är att PCE överraskar uppåt, långräntorna fortsätter stiga och Nvidia inte lyckas motsvara de höga förväntningarna. Om Warsh dessutom förstärker bilden av ett stramt ränteläge kan pressen på teknikaktierna snabbt tillta.",
        "För OMXS30 skulle ett brott under 3 235–3 240 göra den korta bilden klart försiktigare. För Nasdaq är 26 000 nivån vi framför allt inte vill se förlorad på veckobasis.",
        "Om båda indexen tappar sina stödområden samtidigt som räntorna fortsätter upp skulle det gamla uttrycket om att sälja till kräftorna sannolikt få betydligt mer uppmärksamhet när augusti går mot sitt slut.",
      ],
    },
    {
      heading: "Det här vill vi se när marknaden stänger på fredag",
      paragraphs: [
        "När Wall Street stänger på fredag kväll kommer DivLab framför allt kontrollera fyra saker.",
        "För OMXS30 vill vi helst se en veckostängning över 3 300 och gärna en rörelse närmare den tidigare toppen runt 3 349. För Nasdaq vill vi se 26 000 intakt, och helst att index återtagit åtminstone 26 450.",
        "För Nvidia räcker det inte att siffrorna ser starka ut på papperet. Vi vill också se att marknaden faktiskt belönar rapporten efter att ha hunnit läsa både resultatet och prognosen.",
        "Slutligen vill vi se en obligationsmarknad som inte återigen slår undan benen på tillväxtaktierna. Om räntorna stabiliseras samtidigt som indexen håller eller bryter sina viktigaste nivåer blir signalen betydligt starkare än om enbart aktiekurserna stiger.",
        "Så när kräftskivorna dukas fram är frågan inte om ett gammalt börsordspråk har rätt eller fel. Frågan är vad marknaden faktiskt visar oss. När handeln är avslutad på fredag kväll vet vi betydligt mer om vilken börs vi tar med oss in i september.",
      ],
    },
  ],
};
