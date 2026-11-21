import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — Veckan som gått, 21 november 2026.
 * Editorial research cutoff: 2026-11-21T08:18:48+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary-paxman]: https://investor.paxmangroup.com/mfn_news/paxman-publishes-its-interim-report-for-q3-2026/
 * P0_SOURCE[primary-nibe]: https://www.nibegroup.com/news/nibe-industrier-ab-publ-interim-report-3-2026
 * P0_SOURCE[primary-scb]: https://www.scb.se/en/finding-statistics/statistics-by-subject-area/labour-market/labour-force-supply/labour-force-surveys-lfs/pong/statistical-news/labour-force-surveys-lfs-october-2026/
 */
export const BORSSVERIGE_21_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-21-november-2026",
  slug: "borssverige-21-november-2026",
  title: "Veckan som gått: Paxman och NIBE lyfter lönsamheten – arbetsmarknaden ljusnar",
  summary:
    "Paxman och NIBE avslutade veckan med tydliga lönsamhetsförbättringar, samtidigt som SCB såg fler tecken på en starkare svensk arbetsmarknad. Veckans gemensamma signal är bättre operativ kvalitet, men med olika risker inför nästa steg.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-21T08:18:49+01:00",
  url: "/news/borssverige-21-november-2026",
  featured: true,
  readingMinutes: 5,
  seoTitle: "Veckan som gått: Paxman, NIBE och svensk arbetsmarknad",
  seoDescription:
    "Paxman höjer EBITDA-marginalen, NIBE stärker lönsamheten och SCB ser lägre arbetslöshet. Här är veckans viktigaste svenska börssignaler.",
  seoKeywords: [
    "BörsSverige Veckan som gått",
    "Paxman Q3 2026",
    "NIBE Q3 2026",
    "svensk arbetsmarknad oktober 2026",
    "SCB arbetslöshet",
    "svenska aktier",
    "Stockholmsbörsen",
    "Veckan som gått"
  ],
  internalLinking: {
    topics: [
      "BörsSverige",
      "Veckan som gått",
      "kvartalsrapporter",
      "lönsamhet",
      "medicinteknik",
      "värmepumpar",
      "svensk arbetsmarknad"
    ],
    companies: ["Paxman", "NIBE Industrier"],
    tickers: ["PAX", "NIBE B"],
    relatedNewsSlugs: [
      "borssverige-19-november-2026",
      "borssverige-18-november-2026",
      "borssverige-17-november-2026",
      "norden-i-centrum-21-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Den svenska börsveckan avslutades med tre signaler som tillsammans ger en mer konstruktiv bild än enskilda rubriker. Paxman ökade både försäljning och rapporterad EBITDA-marginal, NIBE fortsatte att förbättra lönsamheten och SCB såg lägre arbetslöshet i oktober.",
    "Det är inte samma berättelse i tre versioner. Paxman växer genom medicinteknisk expansion i USA, NIBE återhämtar marginalen i en större industriverksamhet och arbetsmarknadsstatistiken beskriver hushållens bredare förutsättningar.",
    "Veckans viktigaste förändring är därför kvaliteten i utvecklingen: fler intäktskronor blev rörelseresultat i två rapportbolag samtidigt som sysselsättningen ökade i SCB:s säsongrensade och utjämnade data."
  ],
  sections: [
    {
      heading: "Paxman lyfter EBITDA-marginalen till 17,5 procent",
      paragraphs: [
        "Paxmans koncernintäkter steg till 102,9 MSEK i tredje kvartalet från 86,9 MSEK ett år tidigare. USA-intäkterna uppgick till 67,8 MSEK och ökade 27 procent i lokal valuta.",
        "Den rapporterade EBITDA-marginalen förbättrades till 17,5 procent från 9,0 procent. Nettoresultatet steg till 7,8 MSEK från 1,3 MSEK och resultatet per aktie blev 0,34 kronor, jämfört med 0,05 kronor.",
        "Den justerade EBITDA-marginalen var samtidigt 19,5 procent mot 20,1 procent. Det är en viktig nyans: den stora förbättringen i rapporterad marginal speglar inte en motsvarande ökning i det justerade måttet, som bland annat rensar för förvärvs-, neuropati- och flyttkostnader."
      ]
    },
    {
      heading: "USA driver tillväxten – kassan är nästa kontrollpunkt",
      paragraphs: [
        "Paxmans försäkringsbaserade amerikanska affär stod för 24,9 MSEK och växte 106 procent i lokal valuta. Den utvecklingen visar hur ersättningsmodellen kan bredda användningen av bolagets skalpkylning.",
        "Nettokassan var 98,0 MSEK vid periodens slut, jämfört med 129,5 MSEK i jämförelseperioden. För investerare blir frågan därför om den högre lönsamheten kan finansiera produktlanseringar och fortsatt expansion utan att kassapositionen försvagas för snabbt.",
        "Paxman uppgav också att FDA har accepterat bolagets De Novo-ansökan för neuropatisystemet för fullständig granskning. FDA:s målsatta granskningstid är 150 granskningsdagar, vilket gör regulatorisk framdrift till en tydlig kommande katalysator utan att ett godkännande kan tas för givet."
      ]
    },
    {
      heading: "NIBE kombinerar högre tillväxt med starkare marginal",
      paragraphs: [
        "NIBE:s nettoomsättning ökade till 11 232 MSEK från 10 086 MSEK i Q3. Tillväxten var 11,4 procent och 9,9 procent i fasta valutor.",
        "Rörelseresultatet steg till 1 524 MSEK från 1 139 MSEK. Rörelsemarginalen förbättrades därmed till 13,6 procent från 11,3 procent, medan nettoresultatet ökade till 883 MSEK från 610 MSEK.",
        "Tisdagens BörsSverige beskrev rapportutfallet när det publicerades. Veckoperspektivet tillför jämförelsen med Paxman: båda bolagen visar att försäljningstillväxten nu når resultaträkningen tydligare, även om deras marknader, skala och riskprofiler skiljer sig kraftigt."
      ]
    },
    {
      heading: "SCB ser fler positiva tecken på arbetsmarknaden",
      paragraphs: [
        "SCB redovisade 440 000 arbetslösa i oktober, 69 000 färre än samma månad 2025. Den icke säsongrensade arbetslösheten var 7,7 procent, en nedgång med 1,2 procentenheter på ett år.",
        "I säsongrensade och utjämnade data var 5 318 000 personer sysselsatta och arbetslösheten 8,6 procent. SCB uppgav att sysselsättningen ökade och arbetslösheten minskade jämfört med närmast föregående månader.",
        "Antalet långtidsarbetslösa minskade med 37 000 till 138 000 på ett år. Samtidigt var ungdomsarbetslösheten fortsatt hög på 21,4 procent i den icke säsongrensade statistiken. Förbättringen är alltså tydlig men inte jämnt fördelad."
      ]
    },
    {
      heading: "Varför veckans tre signaler spelar roll",
      paragraphs: [
        "För Stockholmsbörsen är en bättre arbetsmarknad viktig genom hushållens inkomster och efterfrågan. Den kan stödja konsumtion och bostadsrelaterad aktivitet, men kan också påverka hur snabbt inflationstryck och räntor normaliseras.",
        "Bolagsrapporterna visar samtidigt att lönsamhetsförbättring inte bara är en makrofråga. NIBE och Paxman förbättrade den rapporterade rörelsekvaliteten genom högre försäljning och bättre marginalutfall i sina respektive verksamheter.",
        "Det som förändrades under veckan är därför balansen mellan tillväxt och resultat. Signalen är mer användbar än en generell uppgångsberättelse: varje bolag måste fortfarande bevisa att förbättringen håller när jämförelsetal, valuta, investeringar och produktmix ändras."
      ]
    },
    {
      heading: "Vad följer vi nästa vecka?",
      paragraphs: [
        "För Paxman följer vi kassakonverteringen, utvecklingen i den amerikanska försäkringsmodellen och FDA-granskningen av neuropatisystemet. Den regulatoriska processen har gått vidare, men något slutligt beslut är inte fattat.",
        "För NIBE blir uthålligheten i rörelsemarginalen central. Nästa rapport behöver visa om kombinationen av tillväxt och lönsamhet består när säsong, valuta och produktmix förändras.",
        "För svensk ekonomi blir SCB:s nästa arbetskraftsundersökning den 15 december en kontrollpunkt. Ingen kursreaktion tas med i lördagens veckosammanfattning, eftersom underlaget är avgränsat till bolagens rapporter och officiell statistik."
      ]
    }
  ],
  sources: [
    {
      text: "Paxmans officiella Q3-rapport med intäkter, USA-tillväxt, marginaler, resultat, nettokassa och regulatoriska milstolpar",
      href: "https://investor.paxmangroup.com/mfn_news/paxman-publishes-its-interim-report-for-q3-2026/"
    },
    {
      text: "NIBE:s officiella Q3-rapport med omsättning, tillväxt, rörelseresultat, marginal och nettoresultat",
      href: "https://www.nibegroup.com/news/nibe-industrier-ab-publ-interim-report-3-2026"
    },
    {
      text: "SCB:s arbetskraftsundersökning för oktober 2026 med sysselsättning, arbetslöshet och långtidsarbetslöshet",
      href: "https://www.scb.se/en/finding-statistics/statistics-by-subject-area/labour-market/labour-force-supply/labour-force-surveys-lfs/pong/statistical-news/labour-force-surveys-lfs-october-2026/"
    }
  ]
};
