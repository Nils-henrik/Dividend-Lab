import type { NewsArticle } from "@/types/news";

/**
 * Veckan som gått — vecka 35, publicerad 29 augusti 2026.
 *
 * Redaktionellt fokus: Norden, Europa och USA efter handelsveckan 24–28 augusti.
 * Artikeln följer upp DivLabs inför-vecka-artikel och skiljer verifierade fakta
 * från DivLabs analys av veckans gemensamma marknadstema.
 *
 * Cover:
 * public/news-demo/file_00000000fc348246b3bac73e46972fe9.png
 */
export const VECKAN_SOM_GATT_29_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "veckan-som-gatt-29-augusti-2026",
  slug: "veckan-som-gatt-29-augusti-2026",
  title:
    "Veckan som gått: Marknaden klarade stresstestet – men räntan följer med in i september",
  summary:
    "Vecka 35 gav stark Nvidia-rapport, stigande nordiska börser och bättre tillväxtdata – men USA:s inflation och Fed håller ränteoron vid liv. DivLab summerar Norden, Europa och USA.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-29T09:46:00+02:00",
  url: "/news/veckan-som-gatt-29-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/file_00000000fc348246b3bac73e46972fe9.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  mobileHeadlineFirst: true,
  imageAlt:
    "Veckan som gått 29 augusti 2026 med Norden, Europa och USA representerade i en DivLab-marknadsbild.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 8,
  seoTitle: "Veckan som gått: Nvidia, Norden och ny ränteoro",
  seoDescription:
    "Vecka 35 gav stark Nvidia-rapport, stigande nordiska börser och bättre tillväxtdata – men USA:s inflation och Fed håller ränteoron vid liv.",
  seoKeywords: [
    "veckan som gått",
    "börsvecka 35",
    "Norden börsen",
    "Europabörserna",
    "Wall Street",
    "OMXS30",
    "Nasdaq",
    "Nvidia",
    "USA inflation",
    "PCE inflation",
    "Federal Reserve",
    "svensk BNP",
    "Finland BNP",
    "börsnyheter",
  ],
  internalLinking: {
    topics: [
      "Vecka 35",
      "Norden",
      "Europa",
      "USA",
      "AI",
      "inflation",
      "räntor",
      "BNP",
    ],
    companies: ["Nvidia", "Novo Nordisk", "Bactiguard", "Sivers Semiconductors", "Tobii"],
    tickers: ["OMXS30", "Nasdaq Composite", "S&P 500"],
    relatedNewsSlugs: [
      "borsveckan-24-28-augusti-2026-nvidia-jackson-hole",
      "borssverige-28-augusti-2026",
      "norden-i-centrum-28-augusti-2026",
      "usa-borsen-nvidia-nasdaq-ai-rally-27-augusti-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Vecka 35 blev ett styrketest för börsen. Nvidia bekräftade att AI-investeringarna fortfarande växer snabbt, svensk och finsk ekonomi visade tydligare livstecken och flera stora börser avslutade veckan på plus. Men samtidigt låg den amerikanska inflationen kvar på en nivå som gör att räntan inte kan räknas bort ur marknadens ekvation.",
    "När DivLab gick in i veckan var fyra frågor särskilt viktiga: skulle Nvidia leverera, skulle inflationen lugna marknaden, skulle OMXS30 kunna ta sig över 3 300 och skulle Nasdaq hålla 26 000? Facit blev mer positivt än negativt – men långt ifrån perfekt.",
    "Det viktiga är därför inte bara att flera börser steg. Veckan gav en tydligare bild av varför marknaden fortfarande orkar upp – och vad som skulle kunna stoppa den när september tar vid.",
  ],
  sections: [
    {
      heading: "Sverige: starkare ekonomi och börs över 3 300",
      paragraphs: [
        "Sverige blev en av veckans tydligare ljuspunkter. SCB:s fullständiga nationalräkenskaper visade på fredagen att svensk BNP ökade med 1,6 procent under Q2 jämfört med föregående kvartal. Jämfört med samma kvartal året före var ökningen 3,3 procent.",
        "Tillväxten kom bland annat från investeringar, export och hushållens konsumtion. Det är en betydligt starkare konjunktursignal än bilden av en svensk ekonomi som bara står och stampar. Samtidigt minskade detaljhandelns försäljningsvolym med 0,2 procent i juli jämfört med juni, vilket påminner om att hushållens återhämtning fortfarande inte är spikrak.",
        "Stockholmsbörsen tog emot veckan väl. Breda OMXSPI steg omkring 1,5 procent över veckan och OMXS30 avslutade fredagen på 3 331 punkter. Det betyder att 3 300-nivån, som DivLab pekade ut inför veckan som det första tydliga testet, klarades.",
        "Under ytan var bilden betydligt mer dramatisk. På fredagen föll Sivers Semiconductors kraftigt efter en svag rapport och Tobii pressades också tydligt, medan Bactiguard steg kraftigt efter att Tombact köpt en kontrollpost i bolaget. Veckan visade därmed hur lugna index kan dölja stora rörelser i enskilda aktier.",
      ],
    },
    {
      heading: "Norge: rekordbörs men svagare konsumtionssignal",
      paragraphs: [
        "Oslo-börsen fortsatte att visa styrka och OSEBX avslutade fredagen nära nya rekordnivåer. Energi, råvaror och shipping fortsätter att ge den norska börsen en annan karaktär än många andra europeiska marknader.",
        "Den inhemska ekonomin gav samtidigt en svagare signal från hushållen. Norges detaljhandelsvolym minskade med 0,7 procent från juni till juli efter uppgång månaden före. Statistisk sentralbyrå konstaterade dessutom att den underliggande trenden fortfarande pekade nedåt.",
        "Kontrasten är viktig: en rekordstark börs behöver inte betyda att den inhemska ekonomin är lika stark. För Norge kan internationella energi- och råvaruflöden lyfta stora börsbolag samtidigt som hushållen fortfarande är försiktiga.",
      ],
    },
    {
      heading: "Finland blev en av Nordens positiva överraskningar",
      paragraphs: [
        "Finland fick ett av veckans tydligare positiva nordiska makrobesked. BNP ökade med 0,4 procent i Q2 jämfört med föregående kvartal. Exportvolymen steg samtidigt med 5,7 procent och privata investeringar bidrog positivt.",
        "En större fartygsleverans hjälpte exportsiffran, vilket gör att 5,7 procent inte bör läsas som en ny normal tillväxttakt. Statistikcentralen konstaterade dock att förbättringen syntes bredare än bara i den enskilda leveransen.",
        "Allt var inte positivt. Offentliga investeringar minskade kraftigt från föregående kvartal. Men kombinationen av BNP-tillväxt, stark export och en bra börsvecka är ändå värd att notera efter en lång period där Finland haft svårt att få ordentlig fart på ekonomin.",
      ],
    },
    {
      heading: "Danmark: bättre tillväxtutsikter men Novo fortsätter dela marknaden",
      paragraphs: [
        "Danmark gav också en tydlig dubbelbild. Landets tillväxtutsikter förbättrades under veckan, samtidigt som läkemedelssektorn fortsatte att spela en ovanligt stor roll för den danska ekonomin och börsen.",
        "Novo Nordisk fick dessutom besked om att kinesiska läkemedelsmyndigheter accepterat bolagets ansökan om den orala versionen av viktminskningsläkemedlet Wegovy. Det är ett positivt regulatoriskt steg på en mycket stor marknad.",
        "Samtidigt fortsatte aktien att vara omdiskuterad efter nya försiktiga analytikerbedömningar. Konkurrensen inom fetmaläkemedel, framtida tillväxt och läkemedelspipelinen är fortfarande centrala frågor. Danmark visar därmed hur beroende en nationell börsbild kan bli av några få mycket stora bolag.",
      ],
    },
    {
      heading: "Europa: grönt på ytan – Frankrike blev veckans varningssignal",
      paragraphs: [
        "Den breda europeiska marknaden lyckades avsluta veckan positivt. STOXX 600 steg på fredagen och noterade en mindre uppgång för veckan efter två raka minusveckor.",
        "Från Europas största ekonomi kom samtidigt bättre siffror. Tysk BNP ökade med 0,3 procent under Q2 jämfört med föregående kvartal, en tiondel mer än i den tidigare snabbberäkningen. Jämfört med samma kvartal året före ökade ekonomin med 1,0 procent, med exporten som en viktig förklaring.",
        "Men Europas tydligaste orosmoln kom från Frankrike. Den franska ekonomin stod still under Q2 efter en nedgång under första kvartalet, samtidigt som hushållens köpkraft per konsumtionsenhet minskade.",
        "På torsdagen föll CAC 40 tydligt och franska banker pressades när marknaden åter började fokusera på landets statsfinanser och politiska osäkerhet. Fredagens återhämtning tog tillbaka en del av nedgången, men veckan blev en påminnelse om att statsfinanser snabbt kan bli en börsfråga igen.",
      ],
    },
    {
      heading: "USA: Nvidia levererade precis det AI-marknaden behövde",
      paragraphs: [
        "Veckans största bolagshändelse kom som väntat från Nvidia. Omsättningen steg till 96,2 miljarder dollar, en ökning på 106 procent från samma kvartal året före. Datacenterverksamheten omsatte 89 miljarder dollar och växte 117 procent.",
        "För det kommande kvartalet guidar Nvidia för cirka 108 miljarder dollar i omsättning, plus eller minus 2 procent. Prognosen räknar dessutom inte med några intäkter från datacenterberäkningar i Kina.",
        "Marknaden belönade rapporten tydligt på torsdagen. Nvidia steg 8,7 procent och Nasdaq Composite lyfte 1,57 procent. Rapporten gav därmed stöd åt en av årets viktigaste börsteser: de stora investeringarna i AI-infrastruktur fortsätter i mycket hög takt.",
        "Det betyder inte att alla AI-aktier är billiga eller att sektorn inte kan falla. Men den fundamentala efterfrågan som har byggt AI-rallyt fick nytt stöd.",
      ],
    },
    {
      heading: "Inflationen vägrade ge Wall Street ett frikort",
      paragraphs: [
        "Den stora motvikten kom från inflationen. Federal Reserves favoritmått PCE steg med 0,2 procent i juli och låg 3,7 procent högre än ett år tidigare. Den underliggande PCE-inflationen, där mat och energi räknas bort, låg på 3,3 procent.",
        "Det är fortfarande klart över Feds mål på 2 procent. Marknaden fick därmed ungefär den kombination den helst hade velat slippa: starka företagsvinster och fortsatt god ekonomisk aktivitet, men en inflation som fortfarande är för hög för att penningpolitiken enkelt ska kunna lättas.",
        "På fredagen förstärktes den bilden när Fed-chefen Kevin Warsh betonade att centralbanken måste vara övertygad om att inflationen rör sig mot 2 procent med tillräcklig fart. Obligationsräntorna steg och teknikaktier tappade en del av torsdagens momentum.",
        "Nasdaq föll på fredagen och Nvidia gav tillbaka en del av rapportlyftet. Trots det slutade hela veckan positivt för de stora amerikanska indexen.",
      ],
    },
    {
      heading: "Facit mot DivLabs bild inför veckan",
      paragraphs: [
        "Inför vecka 35 skrev DivLab att vi framför allt ville se fyra saker när marknaden stängde på fredagen.",
        "För OMXS30 ville vi se en etablering över 3 300. Index stängde på 3 331. Det testet klarades.",
        "För Nasdaq ville vi absolut se 26 000 hålla och helst en återgång över 26 450. Nasdaq stängde på 26 402. Stödet höll, men index missade den högre nivån med liten marginal.",
        "För Nvidia ville vi inte bara se starka siffror utan också att marknaden faktiskt belönade rapporten. Det gjorde den på torsdagen med en uppgång på 8,7 procent, även om en del av rörelsen försvann på fredagen.",
        "Och slutligen ville vi se att obligationsmarknaden inte återigen slog undan benen på tillväxtaktierna. Där fick vi inget riktigt klartecken. Fredagens ränterörelse påminde om att inflationen fortfarande styr en stor del av spelplanen.",
      ],
    },
    {
      heading: "DivLabs analys: marknaden vann veckan – men inte med 4–0",
      paragraphs: [
        "Det mest rättvisa sättet att summera vecka 35 är att börsen klarade stresstestet, men att några av höstens största frågor fortfarande är olösta.",
        "Det positiva är tydligt. AI-investeringarna fortsätter, svensk BNP överraskade med tydlig tillväxt, Finland växte, Tyskland visade bättre fart än den första beräkningen och Stockholmsbörsen tog sig över nivån vi ville se. Det här är inte bilden av en global ekonomi som håller på att falla ihop.",
        "Det negativa är lika viktigt. USA:s inflation ligger fortfarande för högt, höga räntor fortsätter att konkurrera med aktier om kapital och Frankrike visade hur snabbt oro kring statsfinanser kan slå mot banker och en hel nationell börs.",
        "Fredagens reaktion på Wall Street visade kanske veckans viktigaste poäng: även en fantastisk Nvidia-rapport räcker inte för att göra räntan irrelevant.",
        "Efter veckan har vi fått ett ganska tydligt svar på frågan om AI-investeringarna fortfarande håller. Ja, efterfrågan ser fortsatt mycket stark ut. Den svårare frågan är hur högt börsen kan värderas om inflationen samtidigt tvingar centralbankerna att hålla räntorna högre än investerare hade hoppats.",
      ],
    },
    {
      heading: "Nästa test kommer snabbt",
      paragraphs: [
        "Redan nästa vecka kommer nya besked som kan flytta balansen. I USA väntar nya arbetsmarknadsdata, som blir viktiga inför Feds kommande räntebeslut. I Europa flyttas fokus mot färsk inflationsstatistik och nästa besked från ECB.",
        "Vecka 35 gav alltså marknaden något att bygga vidare på. Tillväxten höll bättre än befarat, Nvidia levererade och flera börser steg. Men när augusti nu övergår i september gör marknaden det med samma motståndare som den brottats med större delen av året: inflationen är lägre än under krisåren, men fortfarande för hög för att räntan ska kunna glömmas bort.",
      ],
    },
  ],
  sources: [
    {
      text: "SCB – Nationalräkenskaper, andra kvartalet 2026",
      href: "https://www.scb.se/en/finding-statistics/statistics-by-subject-area/national-accounts/national-accounts/national-accounts-quarterly-and-annual-estimates/pong/statistical-news/national-accounts-second-quarter-2026/",
    },
    {
      text: "Riksbanken – protokoll från penningpolitiska mötet den 19 augusti 2026",
      href: "https://www.riksbank.se/sv/press-och-publicerat/nyheter-och-pressmeddelanden/pressmeddelanden/2026/protokoll-fran-det-penningpolitiska-motet-den-19-augusti-2026/",
    },
    {
      text: "Statistisk sentralbyrå – detaljhandeln ned i juli",
      href: "https://www.ssb.no/varehandel-og-tjenesteyting/varehandel/statistikk/varehandelsindeksen/artikler/detaljhandelen-ned-i-juli",
    },
    {
      text: "Statistikcentralen – Finlands samhällsekonomi ökade under Q2 2026",
      href: "https://stat.fi/en/publication/cmfql1cwv04mw0evy5vav0lbs",
    },
    {
      text: "Destatis – tysk BNP Q2 2026",
      href: "https://www.destatis.de/DE/Presse/Pressemitteilungen/2026/08/PD26_303_811.html",
    },
    {
      text: "INSEE – Frankrikes nationalräkenskaper Q2 2026",
      href: "https://www.insee.fr/fr/statistiques/9039499",
    },
    {
      text: "Nvidia – Financial Results for Second Quarter Fiscal 2027",
      href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Second-Quarter-Fiscal-2027/default.aspx",
    },
    {
      text: "BEA – Personal Income and Outlays, July 2026",
      href: "https://www.bea.gov/news/2026/personal-income-and-outlays-july-2026",
    },
    {
      text: "Federal Reserve – Kevin Warsh, Jackson Hole speech, 28 August 2026",
      href: "https://www.federalreserve.gov/newsevents/speech/warsh20260828a.htm",
    },
    {
      text: "Reuters – European shares and French market, 28 August 2026",
      href: "https://www.reuters.com/markets/europe/european-shares-inch-up-french-stocks-recover-markets-await-warsh-speech-2026-08-28/",
    },
    {
      text: "Reuters – Nvidia forecast refuels AI trade, 27 August 2026",
      href: "https://www.reuters.com/business/nasdaq-futures-take-lead-after-nvidia-forecast-refuels-ai-trade-2026-08-27/",
    },
    {
      text: "Reuters – China regulator accepts Novo Nordisk oral Wegovy application, 27 August 2026",
      href: "https://www.reuters.com/world/china-drug-regulator-accepts-novo-nordisks-application-oral-wegovy-2026-08-27/",
    },
    {
      text: "DivLab – Börsveckan 24–28 augusti 2026",
      href: "https://divlab.se/news/borsveckan-24-28-augusti-2026-nvidia-jackson-hole",
    },
  ],
};
