import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 28 August 2026.
 *
 * Editorial research cutoff: 07:45 CEST, 28 August 2026.
 * Verified editorial anchors:
 * - Statistics Finland, 28 Aug: Q2 GDP +0.4% QoQ; exports +5.7%; imports +2.2%;
 *   private investments +0.5%; private consumption +0.1%.
 * - BW LPG Q2, 28 Aug: NPAT USD 138m; profit attributable to equity holders USD 120m;
 *   EPS USD 0.79; Shipping TCE USD 74,000/available day; Q3 ~92% fixed at ~USD 88,000/day;
 *   cash dividend USD 0.95/share.
 * - SCB: ordinary Swedish Q2 national accounts scheduled for 08:00 CEST on 28 Aug;
 *   preliminary Q2 GDP indicator was +1.4% QoQ and +2.8% YoY calendar-adjusted.
 * - SSB: July retail trade figures scheduled for 28 Aug; June retail excluding motor vehicles
 *   rose 1.8% MoM and fell 0.3% YoY calendar-adjusted.
 * - Statistics Denmark: Q2 wage index scheduled for 28 Aug; Q1 wages +3.2% YoY.
 *   Danish retail sales rose 1.3% MoM in July, the third consecutive monthly increase.
 *
 * Cover:
 * public/news-demo/norden-i-centrum-2026-08-28.png
 */
export const NORDEN_I_CENTRUM_28_AUGUSTI_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-28-augusti-2026",
  slug: "norden-i-centrum-28-augusti-2026",
  title:
    "Norden i centrum – 28 augusti: Finland växer och BW LPG höjer utdelningen – svensk BNP nästa test",
  summary:
    "Finlands ekonomi växte med 0,4 procent under Q2 samtidigt som BW LPG redovisar starka fraktrater och höjer utdelningen till 0,95 dollar per aktie. Klockan 08.00 väntar nya besked från Sverige, Norge och Danmark som kan sätta tonen för fredagens nordiska börshandel.",
  category: "market",
  source: "DivLab",
  publishedAt: "2026-08-28T07:46:00+02:00",
  url: "/news/norden-i-centrum-28-augusti-2026",
  featured: true,
  imageUrl: "/news-demo/norden-i-centrum-2026-08-28.png",
  thumbnailObjectPosition: "center 50%",
  mobileThumbnailObjectPosition: "center 50%",
  imageAlt:
    "Norden i centrum 28 augusti 2026 med BW LPG, Sveriges BNP, Finlands BNP, norsk detaljhandel och dansk lönestatistik i fokus.",
  imageCaption: "Illustration: DivLab.",
  readingMinutes: 5,
  seoTitle: "Norden i centrum: Finland växer – BW LPG höjer utdelningen",
  seoDescription:
    "Finlands BNP växer och BW LPG höjer utdelningen. Samtidigt väntar svensk BNP, norsk detaljhandel och dansk lönestatistik den 28 augusti.",
  seoKeywords: [
    "Norden i centrum",
    "nordiska börsen idag",
    "nordiska börser",
    "Stockholmsbörsen idag",
    "Oslo-börsen idag",
    "Helsingforsbörsen idag",
    "Köpenhamnsbörsen idag",
    "Finland BNP Q2 2026",
    "Sverige BNP Q2 2026",
    "BW LPG Q2 2026",
    "BW LPG utdelning",
    "norsk detaljhandel",
    "dansk lönestatistik",
    "börsnyheter",
    "28 augusti 2026",
  ],
  internalLinking: {
    topics: ["Norden", "Q2 2026", "BNP", "shipping", "konsumtion"],
    companies: ["BW LPG"],
    relatedNewsSlugs: [
      "norden-i-centrum-27-augusti-2026",
      "borssverige-27-augusti-2026",
      "usa-borsen-nvidia-nasdaq-ai-rally-27-augusti-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Fredagen börjar med ett tydligt nordiskt makrofokus. Finlands ekonomi fortsatte växa under Q2 samtidigt som norska BW LPG levererar stark intjäning inom shipping och höjer utdelningen. Nästa stora test kommer redan klockan 08.00, när nya siffror från Sverige, Norge och Danmark ger en färsk temperaturmätning på den nordiska ekonomin.",
    "Det innebär ett tydligt skifte från torsdagens rapport- och AI-fokus. I dag finns det ovanligt mycket egen nordisk information att förhålla sig till, vilket gör att handeln kan styras mer av konjunktur, konsumtion och bolagsspecifika besked än av en enskild signal från Wall Street.",
  ],
  sections: [
    {
      heading: "Finland växer vidare – exporten lyfter Q2",
      paragraphs: [
        "Finlands BNP ökade med 0,4 procent under andra kvartalet jämfört med Q1, enligt färska siffror från Statistikcentralen. Exportvolymen steg samtidigt med 5,7 procent från föregående kvartal, medan importen ökade med 2,2 procent.",
        "Även de privata investeringarna steg, med 0,5 procent, medan den privata konsumtionen ökade med 0,1 procent. Statistikcentralen pekar på att förädlingsvärdet växte brett inom industrin, med tydlig styrka bland annat i skogs-, metall-, el- och elektronikindustrin.",
        "För Helsingforsbörsen är exporten särskilt viktig. Finland har en stor andel industri- och exportbolag, vilket gör en starkare internationell efterfrågan relevant för allt från verkstad och skog till banker som är exponerade mot företagssektorn.",
        "Siffrorna är därför försiktigt positiva: återhämtningen fortsätter och exporten ger stöd, men den privata konsumtionen växer fortfarande långsamt. Det talar för en ekonomi som förbättras utan att ännu vara i någon kraftig högkonjunktur.",
      ],
    },
    {
      heading: "BW LPG levererar starka fraktrater och höjer utdelningen",
      paragraphs: [
        "I Norge kommer morgonens tydligaste bolagsbesked från BW LPG. Shippingbolaget redovisar en nettovinst efter skatt på 138 miljoner dollar under Q2. Vinsten hänförlig till aktieägarna blev 120 miljoner dollar, motsvarande 0,79 dollar per aktie.",
        "Den viktigaste signalen finns samtidigt i själva shippingverksamheten. BW LPG nådde en TCE-intäkt på 74 000 dollar per tillgänglig fartygsdag under kvartalet. TCE är ett vanligt mått inom shipping som gör det möjligt att jämföra hur mycket ett fartyg tjänar per dag mellan olika resor och kontrakt.",
        "Inför Q3 är omkring 92 procent av de tillgängliga fartygsdagarna redan bokade till en genomsnittlig nivå på cirka 88 000 dollar per dag. Det ger marknaden ovanligt god insyn i intjäningen under det pågående kvartalet.",
        "Styrelsen beslutar dessutom om en kontantutdelning på 0,95 dollar per aktie. Det är högre än Q1-utdelningen på 0,67 dollar per aktie, där en del bestod av extra kapitalåterföring från bolagets handelsverksamhet.",
      ],
    },
    {
      heading: "Längre transportvägar hjälper shippingmarknaden",
      paragraphs: [
        "Bakom de höga fraktraterna finns en ovanligt stökig global LPG-marknad. BW LPG beskriver hur störningar i Mellanöstern har förändrat handelsflödena och ökat intresset för amerikansk LPG, samtidigt som lägre vattennivåer i Panamakanalen har bidragit till att fler fartyg tar den längre rutten runt Godahoppsudden.",
        "För ett shippingbolag kan längre resor ge stöd åt fraktraterna. När varje fartyg binds upp under fler dagar minskar den effektiva tillgången på fartyg, vilket kan göra kapaciteten mer värdefull.",
        "BW LPG uppger också att amerikanska LPG-exporter som transporterades med stora VLGC-fartyg ökade med 16 procent under första halvåret jämfört med samma period i fjol. Samtidigt föll exporterna från Mellanöstern kraftigt.",
        "Det förklarar varför bolaget går in i Q3 med höga bokade fraktrater. Samtidigt är marknaden fortsatt känslig för geopolitik, eftersom förändrade handelsvägar snabbt kan påverka både transportsträckor och fartygsefterfrågan.",
      ],
    },
    {
      heading: "Sverige: nu ska den starka BNP-signalen bekräftas",
      paragraphs: [
        "För Stockholmsbörsen kommer fredagens viktigaste svenska makrobesked klockan 08.00, när SCB publicerar den ordinarie beräkningen av Sveriges BNP för Q2.",
        "Den preliminära BNP-indikatorn visade att ekonomin växte med 1,4 procent under andra kvartalet jämfört med Q1. Kalenderkorrigerat låg BNP 2,8 procent högre än under motsvarande kvartal 2025. Det var en tydlig förbättring efter att BNP minskade med 0,2 procent under årets första kvartal.",
        "Dagens ordinarie nationalräkenskaper bygger på ett bredare underlag än BNP-indikatorn och kan därför både bekräfta och revidera den preliminära bilden.",
        "För marknaden blir det inte bara viktigt hur mycket ekonomin växte, utan också vad som drev utvecklingen. En bred förbättring i hushållens konsumtion, investeringar och export skulle ge ett starkare konjunkturbesked än om uppgången främst förklaras av mer tillfälliga lager- eller exporteffekter.",
      ],
    },
    {
      heading: "Norge: detaljhandeln ger nästa besked om hushållen",
      paragraphs: [
        "Även Norge får nya konsumtionssiffror under morgonen när Statistisk sentralbyrå publicerar detaljhandeln för juli.",
        "I juni steg försäljningsvolymen i detaljhandeln exklusive motorfordon med 1,8 procent från maj. Jämfört med juni 2025 låg den kalenderjusterade volymen samtidigt 0,3 procent lägre.",
        "Julis utfall blir därför en viktig kontroll av om uppgången i juni var början på en stabilare förbättring eller främst en återhämtning efter den svagare månaden före.",
        "För Oslo-börsen blir kombinationen intressant: BW LPG ger en stark bolagssignal från den internationella shippingmarknaden, medan detaljhandeln säger mer om hur den norska hemmamarknaden och hushållen utvecklas.",
      ],
    },
    {
      heading: "Danmark: handeln stiger – nu kommer lönerna",
      paragraphs: [
        "Danmark har redan fått en positiv signal från hushållens konsumtion. Det danska detaljhandelsindexet steg med 1,3 procent i juli jämfört med juni, justerat för priser, säsong och handelsdagar. Det var tredje månaden i rad med stigande detaljhandel.",
        "Under årets första sju månader låg den danska detaljhandeln 4,2 procent högre än under motsvarande period 2025. Det är en tydlig förbättring trots att konsumentförtroendet fortfarande är negativt.",
        "På fredagen kommer nästa pusselbit när Danmarks Statistik publicerar löneindexet för Q2. Under Q1 steg lönerna med 3,2 procent jämfört med samma kvartal året före.",
        "Lönerna är viktiga från två håll. Starkare reallöner ger hushållen mer utrymme att konsumera, men en alltför hög löneökningstakt kan samtidigt göra det svårare att få ned inflationen, särskilt inom tjänstesektorn.",
      ],
    },
    {
      heading: "En nordisk fredag på egna meriter",
      paragraphs: [
        "Fredagen sticker ut genom mängden egen nordisk information. Finland visar fortsatt tillväxt och stark export. BW LPG går in i Q3 med höga bokade fraktrater och en högre utdelning. Sverige får ett viktigt besked om styrkan i återhämtningen, Norge mäter hushållens konsumtion och Danmark ger nya ledtrådar om löner och köpkraft.",
        "Den gemensamma nämnaren är den nordiska konjunkturen. Efter flera år präglade av hög inflation, stigande räntor och pressade hushåll börjar fler indikatorer peka åt rätt håll, men utvecklingen ser olika ut mellan länderna och är fortfarande ojämn.",
        "För den nordiska börsdagen blir den viktigaste frågan därför om fredagens nya siffror stärker bilden av en bredare återhämtning – eller om förbättringen fortfarande är för smal för att ge tydligt stöd åt börsens mer konjunkturkänsliga bolag.",
      ],
    },
  ],
  sources: [
    {
      text: "Statistikcentralen – Finlands samhällsekonomi ökade ytterligare under andra kvartalet 2026, 28 augusti 2026",
      href: "https://stat.fi/sv/publikation/cmfql1cwv04mw0evy5vav0lbs",
    },
    {
      text: "BW LPG – Financial Results for Q2 2026, 28 August 2026",
      href: "https://www.bwlpg.com/bw-lpg-limited-financial-results-for-q2-2026/",
    },
    {
      text: "SCB – BNP-indikator juni 2026 och publiceringsplan för ordinarie Q2-beräkning",
      href: "https://www.scb.se/hitta-statistik/statistik-efter-amne/nationalrakenskaper/ovrigt/nationalrakenskaper-ovrigt/pong/statistiknyhet/nationalrakenskaper-ovrigt-bnp-indikator-manad-juni-2026/?menu=open",
    },
    {
      text: "Statistisk sentralbyrå – Varehandelsindeksen, juni 2026 och nästa publicering 28 augusti",
      href: "https://www.ssb.no/varehandel-og-tjenesteyting/varehandel/statistikk/varehandelsindeksen",
    },
    {
      text: "Danmarks Statistik – Detailsalget steg i juli, 25 augusti 2026",
      href: "https://www.dst.dk/da/Statistik/udgivelser/NytHtml?cid=52390",
    },
    {
      text: "Danmarks Statistik – Lønningerne er steget 3,2 pct. det seneste år, 29 maj 2026",
      href: "https://www.dst.dk/da/Statistik/udgivelser/NytHtml?cid=51696",
    },
  ],
};
