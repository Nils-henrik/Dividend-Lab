import type { NewsArticle } from "@/types/news";

/**
 * Börsvecka 36 — publicerad 30 augusti 2026.
 *
 * Redaktionellt fokus: veckan 31 augusti–4 september med USA:s jobbrapport,
 * euroområdets inflation, Broadcom, svensk PMI och en lätt teknisk lägesbild
 * för OMXS30 och Nasdaq Composite.
 *
 * Källor kontrollerade omedelbart före publicering:
 * - Federal Reserve: Kevin Warshs Jackson Hole-tal 28 augusti, FOMC-beslutet
 *   29 juli och kalendern för mötet 15–16 september.
 * - U.S. Bureau of Labor Statistics: Employment Situation juli 2026,
 *   publiceringskalender för augustirapporten samt JOLTS juli.
 * - Institute for Supply Management: officiell PMI-kalender för september 2026.
 * - Broadcom Investor Relations: Q3 FY2026 publiceringstid och Q2 FY2026-resultat/guidning.
 * - Eurostat: juliinflation 2,9 procent och flash-estimat för augusti 1 september.
 * - ECB: protokoll från mötet 22–23 juli samt möteskalender 9–10 september.
 * - Swedbank/Silf: PMI industri och tjänster för juli samt nästa publiceringsdatum.
 * - AcadeMedia, Mycronic, Clas Ohlson och Sectra: respektive officiell IR/kalender.
 * - Reuters: marknadsreaktion efter Jackson Hole samt konsensus för USA-jobben.
 * - Historisk marknadsdata: OMXS30 och Nasdaq Composite till och med 28 augusti.
 *
 * Ingen rå källista visas i den publika artikeln enligt DivLabs redaktionella standard.
 *
 * Cover:
 * public/news-demo/borsvecka-36-2026-08-30.png
 */
export const BORSVECKA_36_2026_JOBBRAPPORT_BROADCOM_EUROINFLATION_ARTICLE: NewsArticle = {
  id: "borsvecka-36-2026-jobbrapport-broadcom-euroinflation",
  slug: "borsvecka-36-2026-jobbrapport-broadcom-euroinflation",
  title:
    "Börsvecka 36: USA:s jobbrapport, euroinflation och Broadcom i fokus",
  summary:
    "Börsvecka 36 inleder september med USA:s jobbrapport, euroområdets inflation och Broadcoms Q3-rapport. DivLab går igenom OMXS30, Nasdaq, svensk PMI och veckans viktigaste börshändelser.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-30T13:55:00+02:00",
  url: "/news/borsvecka-36-2026-jobbrapport-broadcom-euroinflation",
  featured: true,
  imageUrl: "/news-demo/borsvecka-36-2026-08-30.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  mobileHeadlineFirst: true,
  imageAlt:
    "DivLab-omslag för Börsvecka 36 2026 med Stockholm, jobbrapport, inflation och AI i fokus.",
  imageCaption: "AI-illustration: DivLab.",
  readingMinutes: 7,
  seoTitle: "Börsvecka 36 2026: USA-jobb, Broadcom, OMXS30 och Nasdaq",
  seoDescription:
    "Börsvecka 36 2026: USA:s jobbrapport, euroinflation, Broadcom och svensk PMI. DivLab går igenom OMXS30, Nasdaq och veckans viktigaste nivåer.",
  seoKeywords: [
    "börsvecka 36",
    "börsen vecka 36 2026",
    "börsen nästa vecka",
    "USA jobbrapport",
    "nonfarm payrolls",
    "Broadcom rapport",
    "euroområdet inflation",
    "OMXS30",
    "Nasdaq",
    "svensk PMI",
    "Federal Reserve",
    "ECB",
    "AcadeMedia",
    "Mycronic",
    "Clas Ohlson",
    "Sectra",
  ],
  internalLinking: {
    topics: [
      "börsvecka 36",
      "USA arbetsmarknad",
      "inflation",
      "Federal Reserve",
      "ECB",
      "AI",
      "teknisk analys",
    ],
    companies: [
      "Broadcom",
      "Nvidia",
      "AcadeMedia",
      "Mycronic",
      "Clas Ohlson",
      "Sectra",
    ],
    tickers: ["AVGO", "NVDA", "OMXS30", "Nasdaq Composite"],
    relatedNewsSlugs: [
      "veckan-som-gatt-29-augusti-2026",
      "borsveckan-24-28-augusti-2026-nvidia-jackson-hole",
      "usa-borsen-nvidia-nasdaq-ai-rally-27-augusti-2026",
      "borssverige-28-augusti-2026",
      "norden-i-centrum-28-augusti-2026",
    ],
    relatedLearningSlugs: ["teknisk-analys-for-nyborjare"],
  },
  showDisclaimer: true,
  intro: [
    "Börsvecka 36 börjar med en ovanligt tydlig konflikt mellan två krafter. Nvidia har precis bekräftat att investeringarna i AI-infrastruktur fortfarande är mycket starka, samtidigt som Fed-chefen Kevin Warsh använde Jackson Hole till att markera att inflationen fortfarande är för hög. Efter talet steg marknadens prissättning för en amerikansk räntehöjning i september tydligt och låg sent på fredagen kring 57 procent.",
    "Det gör USA:s jobbrapport på fredag till veckans viktigaste besked. En Reuters-enkät pekar inför rapporten mot cirka 58 000 nya jobb i augusti och en arbetslöshet på 4,1 procent. Efter att sysselsättningen oväntat minskade med 23 000 jobb i juli är spelrummet smalt: för stark arbetsmarknad kan öka ränteoron, men ett nytt tydligt bakslag kan i stället väcka konjunkturoro.",
    "Samtidigt väntar euroområdets preliminära inflation för augusti, Broadcoms Q3-rapport, svensk PMI och rapporter eller kapitalmarknadsdagar från AcadeMedia, Mycronic, Clas Ohlson och Sectra. OMXS30 går in i veckan på 3 331 punkter och Nasdaq Composite på 26 402. I [förra veckans sammanfattning](/news/veckan-som-gatt-29-augusti-2026) konstaterade DivLab att börsen klarade AI-testet – vecka 36 visar om den också klarar räntetestet.",
  ],
  sections: [
    {
      heading: "Fredagens jobbrapport blir veckans stora test",
      paragraphs: [
        "Fredagen den 4 september klockan 14.30 svensk tid publicerar U.S. Bureau of Labor Statistics arbetsmarknadsrapporten för augusti. Det är veckans viktigaste makrobesked eftersom Federal Reserve möts den 15–16 september och arbetsmarknaden är en central del av centralbankens dubbla mandat.",
        "Julirapporten var svagare än väntat. Antalet jobb utanför jordbrukssektorn minskade med 23 000 och arbetslösheten låg kvar på 4,1 procent. Inför augusti pekar en Reuters-enkät mot omkring 58 000 nya jobb och fortsatt 4,1 procents arbetslöshet. Prognosen är inte ett facit, men den visar hur låg ribban för jobbtillväxt har blivit.",
        "För börsen är utfallet tvåsidigt. Ett klart starkare jobbskapande tillsammans med hög löneökningstakt kan öka sannolikheten för en Fed-höjning och pressa räntekänsliga tillväxtaktier. Ett nytt mycket svagt utfall kan däremot flytta fokus från inflation till konjunktur och företagsvinster. Det mest börsvänliga scenariot är därför sannolikt en kontrollerad avmattning: arbetsmarknaden svalnar utan att ge tydliga tecken på att den bryts sönder.",
      ],
    },
    {
      heading: "Vägen mot fredag börjar redan på tisdag",
      paragraphs: [
        "Marknaden behöver inte vänta till fredag för att få ledtrådar. På tisdag klockan 16.00 svensk tid kommer JOLTS-statistiken över lediga jobb för juli. Samtidigt publicerar Institute for Supply Management sitt PMI för den amerikanska tillverkningsindustrin.",
        "På torsdag klockan 16.00 kommer ISM:s tjänste-PMI. Tjänstesektorn väger tungt i USA:s ekonomi, och marknaden lär titta extra noga på delkomponenter för sysselsättning och priser.",
        "Varje stark eller svag datapunkt kan flytta förväntningarna inför fredagen. Efter Warshs tal i Jackson Hole har räntemarknaden blivit mer känslig för tecken på att inflationstrycket kan bestå.",
      ],
    },
    {
      heading: "Broadcom blir nästa test för AI-handeln",
      paragraphs: [
        "På onsdag efter Wall Streets stängning kommer Broadcoms rapport för det tredje kvartalet i räkenskapsåret 2026. Bolagets konferenssamtal börjar klockan 23.00 svensk tid.",
        "Broadcom är ett viktigt komplement till Nvidia eftersom bolaget säljer både halvledarlösningar och infrastrukturprogramvara och har stor exponering mot specialdesignade AI-acceleratorer och nätverk för datacenter. I Q2 ökade omsättningen med 48 procent till 22,2 miljarder dollar. AI-relaterade halvledarintäkter var 10,8 miljarder dollar, upp 143 procent från året före.",
        "Inför Q3 har Broadcom guidat för omkring 29,4 miljarder dollar i total omsättning och cirka 16 miljarder dollar i AI-relaterade halvledarintäkter. Efter Nvidias starka rapport blir frågan om Broadcom kan bekräfta att investeringarna fortsätter med samma kraft även utanför Nvidias egen produktportfölj.",
        "En stark rapport skulle ge ytterligare stöd åt AI-handeln. En svagare guidning skulle däremot kunna väcka frågan om marknadens förväntningar har sprungit före den faktiska investeringscykeln.",
      ],
    },
    {
      heading: "Euroinflationen kommer före ECB-mötet",
      paragraphs: [
        "På tisdag publicerar Eurostat snabbestimatet för inflationen i euroområdet i augusti. Den årliga inflationen låg på 2,9 procent i juli, klart över ECB:s mål på 2 procent.",
        "Siffran får extra tyngd eftersom ECB-rådet möts den 9–10 september. I protokollet från julimötet betonade ledamöterna att en ytterligare räntehöjning sannolikt skulle bli nödvändig om inflationsutsikterna inte förbättras tydligt, samtidigt som ECB uttryckligen inte ville låsa sig vid ett septemberbeslut.",
        "För europeiska aktier blir därför riktningen viktigare än en enskild decimal. Ett tydligt högre inflationstryck kan lyfta marknadsräntorna och pressa räntekänsliga sektorer. Ett lugnare utfall skulle ge ECB mer handlingsutrymme inför mötet veckan därpå.",
      ],
    },
    {
      heading: "Sverige: PMI visar om återhämtningen håller",
      paragraphs: [
        "Sverige får två tidiga temperaturmätare på konjunkturen. Swedbank och Silf publicerar PMI för tillverkningsindustrin på tisdag klockan 08.30 och PMI för tjänstesektorn på torsdag klockan 08.30.",
        "Industrins PMI sjönk i juli till 55,8 från reviderade 58,0 i juni. Tjänste-PMI föll samtidigt till 54,2 från reviderade 56,5. Båda indexen låg fortfarande över 50, vilket indikerar tillväxt jämfört med föregående månad, men julisiffrorna visade att tempot mattades.",
        "För Stockholmsbörsen vore en stabilisering eller återhämtning i orderingång och aktivitet positiv. Samtidigt är kostnadskomponenterna viktiga eftersom lägre insatsvarupriser skulle passa bättre ihop med en svensk återhämtning utan nytt inflationstryck.",
      ],
    },
    {
      heading: "AcadeMedia, Mycronic, Clas Ohlson och Sectra",
      paragraphs: [
        "Rapportsäsongen går mot sitt slut, men några svenska bolag är ändå värda att hålla koll på.",
        "Måndag: AcadeMedia publicerar sin rapport för fjärde kvartalet och helåret 2025/26 klockan 07.00. Senare under dagen håller Mycronic kapitalmarknadsdag i Täby mellan klockan 13.00 och 16.30. Mycronic blir särskilt intressant eftersom bolaget i sin Q2-rapport beskrev hur utbyggnaden av AI-infrastruktur driver investeringar hos tillverkare av avancerade serverkort och stärker efterfrågan inom bland annat PCB Test.",
        "Torsdag: Clas Ohlson publicerar både rapporten för första kvartalet 2026/27 och försäljningssiffrorna för augusti klockan 07.00. Juliförsäljningen uppgick till 1 164 miljoner kronor, 15 procent högre än året före, vilket ger ett starkt försäljningsmässigt utgångsläge inför rapportdagen.",
        "Fredag: Sectra publicerar sin tremånadersrapport för 2026/27 klockan 08.15 och håller presentation klockan 10.00. Bolaget är verksamt inom medicinsk bild-IT och cybersäkerhet.",
      ],
    },
    {
      heading: "OMXS30 – 3 350 blir första stora testet",
      paragraphs: [
        "OMXS30 stängde fredagen på 3 331,26 punkter efter att ha stigit cirka 1,2 procent under veckan. Fredagens högsta notering var 3 346,30 och 52-veckorshögsta ligger på 3 349,20.",
        "Det gör området 3 345–3 350 till den första tydliga motståndszonen. Ett utbrott över området är mest intressant om index också lyckas stänga och etablera sig ovanför det, snarare än att bara sticka över intradag. Därefter blir 3 400 en naturlig psykologisk referens.",
        "På nedsidan är 3 300–3 310 första området att bevaka. Under det ligger 3 285–3 290, nära bottennivåerna från måndagens handel förra veckan. Ett tydligt veckobrott under båda zonerna skulle göra den kortsiktiga bilden svagare.",
        "Nivåerna är tekniska referenspunkter, inte prognoser. Den som vill förstå hur DivLab använder stöd och motstånd kan läsa [Teknisk analys för nybörjare](/learning/teknisk-analys-for-nyborjare).",
      ],
    },
    {
      heading: "Nasdaq – 26 700 är första hindret",
      paragraphs: [
        "Nasdaq Composite stängde fredagen på 26 402,42 efter en nedgång på 0,52 procent för dagen men en uppgång på cirka 0,8 procent för veckan. Under fredagen handlades index som högst på 26 700,68.",
        "Det gör 26 550–26 700 till första motståndsområdet. Ovanför det ligger 26 850–26 900, nära topparna från mitten av augusti.",
        "På nedsidan är 26 250–26 300 första försvarszonen. Om den ger vika ligger 25 900–26 000 nära förra måndagens botten och blir ett viktigare område att hålla.",
        "Nasdaq har alltså återhämtat en stor del av den tidigare nedgången, men vecka 36 blir ett test av om AI-styrkan kan överleva samtidigt som marknaden hanterar högre ränterisk. [Nvidias rapport förra veckan](/news/usa-borsen-nvidia-nasdaq-ai-rally-27-augusti-2026) visade att efterfrågan finns – nu måste räntesidan också samarbeta.",
      ],
    },
    {
      heading: "Det positiva scenariot för vecka 36",
      paragraphs: [
        "DivLabs positiva scenario kräver inte perfekta siffror. Det kräver snarare en kombination där USA:s arbetsmarknad stabiliseras efter julis nedgång utan att bli så stark att räntehöjningsoron accelererar.",
        "Samtidigt behöver Broadcom bekräfta fortsatt hög efterfrågan på AI-infrastruktur och euroområdets inflation helst inte överraska kraftigt uppåt. Om marknadsräntorna då stabiliseras kan OMXS30 få en chans att etablera sig över 3 350 och Nasdaq åter utmana området över 26 700.",
      ],
    },
    {
      heading: "Det negativa scenariot",
      paragraphs: [
        "Det negativa scenariot kan komma från två håll. En het amerikansk jobbrapport kan få marknaden att prisa in en Fed-höjning ännu hårdare, medan ett nytt kraftigt svagt jobbutfall i stället kan skapa oro för tillväxt och företagsvinster.",
        "Om det kombineras med högre euroinflation eller en Broadcom-rapport som inte lever upp till AI-förväntningarna kan flera riskfaktorer träffa marknaden samtidigt. För OMXS30 blir ett fall tillbaka under 3 300 en första varningssignal. För Nasdaq blir ett brott under 26 250 mer problematiskt, särskilt om 26 000 därefter inte håller.",
      ],
    },
    {
      heading: "Det här vill vi se när marknaden stänger på fredag",
      paragraphs: [
        "När marknaden stänger på fredag vill vi framför allt ha svar på fyra frågor.",
        "Har OMXS30 lyckats etablera sig över 3 350? Har Nasdaq tagit sig tillbaka över 26 700? Visar den amerikanska arbetsmarknaden en kontrollerad avmattning snarare än antingen ny överhettning eller tydlig konjunktursvaghet? Och har obligationsräntorna kunnat hålla sig i schack efter veckans data?",
        "[Förra veckans summering](/news/veckan-som-gatt-29-augusti-2026) visade att börsen klarade AI-testet men tog med sig räntefrågan in i september. Vecka 36 blir första riktiga svaret på om den kombinationen går att leva med.",
        "Förra veckan handlade om huruvida AI-boomen fortfarande hade stöd i bolagens siffror. Den här veckan handlar om något svårare: kan börsen fortsätta stiga när både Fed och ECB samtidigt har skäl att hålla räntedörren öppen?",
      ],
    },
  ],
};
