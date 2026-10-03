import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus – Veckan som gått, 3 oktober 2026.
 * Editorial research cutoff: 2026-10-03T14:05:14+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.bls.gov/news.release/empsit.nr0.htm
 * P0_SOURCE[primary]: https://bea.gov/index.php/news/2026/personal-income-and-outlays-august-2026
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-gain-yields-oil-prices-ease-ahead-jobs-report-2026-10-02/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/us-equity-funds-post-second-weekly-inflow-ai-optimism-tempers-yield-concerns-2026-10-02/
 */
export const USA_I_FOKUS_3_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-3-oktober-2026-veckan-som-gatt-jobbrapport-nasdaq",
  slug: "usa-i-fokus-3-oktober-2026-veckan-som-gatt-jobbrapport-nasdaq",
  title: "USA i fokus – Veckan som gått: Svag jobbrapport gav Nasdaq en stark avslutning",
  summary:
    "Wall Street avslutade veckan med breda uppgångar efter en svagare amerikansk jobbrapport. Nasdaq steg även för veckan, medan S&P 500 och Dow Jones backade trots lugnare PCE-inflation.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-03T14:05:30+02:00",
  url: "/news/usa-i-fokus-3-oktober-2026-veckan-som-gatt-jobbrapport-nasdaq",
  featured: true,
  imageAlt: "USA i fokus – Veckan som gått den 3 oktober 2026 med Wall Street, jobbrapport och Nasdaq.",
  readingMinutes: 6,
  seoTitle: "USA i fokus veckan som gått: Jobbrapport och Nasdaq",
  seoDescription:
    "Veckan på Wall Street: 29 000 nya jobb, 4,2 procents arbetslöshet, svalare PCE och en stark fredagsavslutning för Nasdaq.",
  seoKeywords: [
    "USA i fokus veckan som gått",
    "Wall Street vecka 40 2026",
    "USA jobbrapport september 2026",
    "Nasdaq veckan",
    "S&P 500 veckan",
    "PCE inflation USA",
    "Federal Reserve ränta",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-jobb",
      "Federal Reserve",
      "PCE-inflation",
      "Nasdaq",
      "amerikanska räntor",
      "AI-aktier",
    ],
    companies: ["Nvidia", "Tesla", "Nike", "Micron Technology"],
    tickers: ["NVDA", "TSLA", "NKE", "MU"],
    relatedNewsSlugs: [
      "usa-i-fokus-30-september-2026-pce-boeing-micron",
      "usa-i-fokus-29-september-2026-chipaktier-rantor-jolts",
      "usa-i-fokus-27-september-2026-veckan-som-kommer-jobbrapport-micron",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street är stängt på lördagen. Veckans sista handel gav ändå ett tydligt svar på den fråga DivLab lyfte inför veckan: den amerikanska jobbrapporten blev svagare än marknaden hade räknat med och dämpade förväntningarna på en ny räntehöjning i oktober.",
    "Fredagens lättnadsrally räckte inte till en bred veckouppgång. Nasdaq steg 0,45 procent under veckan, medan S&P 500 föll 0,27 procent och Dow Jones backade 1,26 procent. Det sammanfattar en marknad där AI-optimism fortfarande ger stöd, men där räntor och konjunkturdata styr riskviljan.",
  ],
  sections: [
    {
      heading: "Jobbrapporten gav veckans tydligaste besked",
      paragraphs: [
        "USA:s sysselsättning utanför jordbrukssektorn ökade med 29 000 personer i september, enligt Bureau of Labor Statistics. Arbetslösheten var 4,2 procent och antalet arbetslösa uppgick till 7,1 miljoner.",
        "Jobbtillväxten låg under Reutersenkätens prognos på 90 000. Dessutom reviderades juli och augusti tillsammans ned med 60 000 jobb. Genomsnittlig timlön steg 0,1 procent under månaden och 3,0 procent i årstakt.",
        "BLS beskriver både sysselsättningen och arbetslösheten som relativt lite förändrade. Det är viktigt: rapporten visar en svalare arbetsmarknad, men myndighetens data ger inte stöd för att beskriva läget som massuppsägningar eller en fastställd recession.",
      ],
    },
    {
      heading: "Fredagen blev stark – men veckan var blandad",
      paragraphs: [
        "Dow Jones steg 0,49 procent på fredagen till 51 176,96. S&P 500 ökade 0,73 procent till 7 722,72 och Nasdaq Composite klättrade 1,19 procent till 27 190,86, enligt Reuters.",
        "Uppgången kom när marknadens prissättning för en räntehöjning på minst 25 punkter vid Feds oktobermöte föll till 22,7 procent. En vecka tidigare låg motsvarande sannolikhet på 64,2 procent, enligt den CME-data som Reuters återgav.",
        "Trots fredagens uppgång föll S&P 500 0,27 procent och Dow Jones 1,26 procent under veckan. Nasdaq steg däremot 0,45 procent och noterade sin femte veckouppgång på sex veckor.",
      ],
    },
    {
      heading: "Inflationen svalnade men räntorna fortsatte störa",
      paragraphs: [
        "Veckans andra stora svar kom från Bureau of Economic Analysis. PCE-prisindex steg 0,3 procent i augusti och 3,4 procent jämfört med ett år tidigare. Kärn-PCE, exklusive mat och energi, steg 0,2 procent under månaden och 3,0 procent i årstakt.",
        "Hushållens konsumtion ökade samtidigt 0,9 procent i löpande priser och 0,6 procent justerat för prisförändringar. Det gav en kombination av svalare inflationstakt och fortsatt tydlig konsumtion.",
        "Inflationsutfallet minskade enligt Reuters trycket på Federal Reserve att höja räntan redan i oktober. Ändå nådde den amerikanska tioårsräntan flerårshögsta nivåer under veckan, vilket höll värderingsfrågan levande för teknik- och tillväxtbolag.",
      ],
    },
    {
      heading: "AI-stödet höll Nasdaq uppe",
      paragraphs: [
        "Nvidia steg 1,3 procent och Tesla 4,7 procent under fredagens handel och hörde till de största positiva bidragen till S&P 500. Småbolagsindexet Russell 2000 steg 0,9 procent och noterade sin bästa dag på en månad.",
        "Kapitalflödena visar samtidigt att intresset för USA-aktier bestod. Amerikanska aktiefonder fick nettoinflöden på 20,6 miljarder dollar under veckan till och med den 30 september, enligt LSEG Lipper-data som Reuters publicerade.",
        "Stora USA-bolagsfonder tog emot 19,33 miljarder dollar. Samtidigt hade teknikfonder nettoutflöden på 3,79 miljarder dollar, vilket visar att optimismen inte var jämnt fördelad inom marknaden.",
      ],
    },
    {
      heading: "Nike och lagringsbolagen gick mot strömmen",
      paragraphs: [
        "Nike föll 3,6 procent på fredagen efter att bolaget varnat för en kraftig nedgång i årsomsättningen, pekat på svag efterfrågan i Kina och aviserat jobbminskningar samt förändringar i verksamheten.",
        "Western Digital och Seagate föll omkring 10 procent vardera efter uppgifter om att Toshiba planerar att fördubbla produktionskapaciteten för hårddiskar till AI-datacenter under räkenskapsåret 2027.",
        "De rörelserna påminner om att AI-temat inte lyfter alla teknikbolag samtidigt. Konkurrens, investeringstakt och bolagsspecifik guidning fortsätter att skilja vinnare från förlorare.",
      ],
    },
    {
      heading: "Veckans slutsats",
      paragraphs: [
        "Veckans viktigaste förändring var att räntemarknadens bild av ett snabbt nytt Fed-steg försvagades. Det kom efter både lugnare PCE-inflation och en jobbrapport med endast 29 000 nya jobb.",
        "Samtidigt var veckoutvecklingen i index splittrad. Nasdaq fick stöd av stora teknikaktier, men S&P 500 och Dow Jones avslutade ändå veckan på minus.",
        "Nästa vecka behöver investerare väga den svalare arbetsmarknaden mot fortsatt hög inflation, höga långräntor och kommande bolagsbesked. Alla nya marknadsrörelser måste verifieras när den amerikanska handeln öppnar igen.",
      ],
    },
  ],
  sources: [
    {
      text: "BLS: Employment Situation för september 2026 – 29 000 nya jobb, 4,2 procents arbetslöshet och nedrevideringar för juli–augusti",
      href: "https://www.bls.gov/news.release/empsit.nr0.htm",
    },
    {
      text: "BEA: Personal Income and Outlays för augusti 2026 – PCE-inflation, kärn-PCE, inkomster och konsumtion",
      href: "https://bea.gov/index.php/news/2026/personal-income-and-outlays-august-2026",
    },
    {
      text: "Reuters: Wall Street stängde högre den 2 oktober efter jobbrapporten; index-, bolags- och veckodata",
      href: "https://www.reuters.com/business/wall-st-futures-gain-yields-oil-prices-ease-ahead-jobs-report-2026-10-02/",
    },
    {
      text: "Reuters: Amerikanska aktiefonder hade nettoinflöden under veckan till och med den 30 september",
      href: "https://www.reuters.com/business/us-equity-funds-post-second-weekly-inflow-ai-optimism-tempers-yield-concerns-2026-10-02/",
    },
  ],
};
