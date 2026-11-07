import type { NewsArticle } from "@/types/news";

/**
 * BörsSverige — Veckan som gått, 7 november 2026.
 * Editorial research cutoff: 2026-11-07T08:19:01+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://investors.yubico.com/en/interim-report-july-september-2026/
 * P0_SOURCE[primary]: https://www.mfn.se/one/a/bts-group/bts-group-ab-publ-delarsrapport-januari-september-2026-c5e38af3
 * P0_SOURCE[primary]: https://www.scb.se/en/finding-statistics/statistics-by-subject-area/prices-and-economic-trends/price-statistics/consumer-price-index-cpi/pong/statistical-news/cpi-flash-estimate-october-2026/
 * P0_SOURCE[secondary]: https://www.reuters.com/markets/europe/european-shares-set-fall-global-ai-rout-gathers-pace-2026-11-06/
 * P0_SOURCE[secondary]: https://www.marketscreener.com/quote/index/OMX-STOCKHOLM-30-INDEX-7399/news-history/
 */
export const BORSSVERIGE_7_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "borssverige-7-november-2026",
  slug: "borssverige-7-november-2026",
  title: "Veckan som gått: OMXS30 nära noll – Yubico och BTS lyfter vinsten",
  summary:
    "OMXS30 avslutade veckan nära oförändrat efter fredagens nedgång. Samtidigt visade Yubico och BTS kraftiga vinstlyft, medan SCB:s preliminära inflationsmått föll i oktober.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-07T08:19:06+01:00",
  url: "/news/borssverige-7-november-2026",
  featured: true,
  imageAlt: "BörsSverige den 7 november 2026 – veckans viktigaste svenska börs- och ekonominyheter.",
  readingMinutes: 6,
  seoTitle: "Stockholmsbörsen veckan: Yubico och BTS lyfter vinsten",
  seoDescription:
    "Veckan som gått på Stockholmsbörsen: OMXS30 nära oförändrat, starka rapporter från Yubico och BTS samt lägre preliminär inflation.",
  seoKeywords: [
    "Stockholmsbörsen veckan",
    "veckan som gått börsen",
    "OMXS30 vecka 45 2026",
    "Yubico Q3 2026",
    "BTS Q3 2026",
    "svensk inflation oktober 2026",
    "svenska börsen"
  ],
  internalLinking: {
    topics: [
      "Sverige",
      "Stockholmsbörsen",
      "veckan som gått",
      "rapportperiod",
      "cybersäkerhet",
      "konsultbolag",
      "inflation",
      "AI-oro",
      "lönsamhet"
    ],
    companies: ["Yubico", "BTS Group"],
    tickers: ["YUBICO", "BTS-B"],
    relatedNewsSlugs: [
      "borssverige-6-november-2026",
      "borssverige-5-november-2026",
      "borssverige-4-november-2026",
      "norden-i-centrum-7-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Stockholmsbörsen är stängd i dag. När fredagens handel summerades hade OMXS30 fallit 1,01 procent till 3 267,88 punkter och avslutat femdagarsperioden nära oförändrad.",
    "Den breda marknadsoron kom samtidigt som svenska rapporter visade tydlig vinsttillväxt. Yubico mer än fördubblade EBIT och BTS ökade EBITA med 79 procent i tredje kvartalet.",
    "Veckans makrobild blev mer komplex när SCB:s preliminära inflationsmått föll i oktober. Det definitiva utfallet publiceras den 12 november."
  ],
  sections: [
    {
      heading: "Fredagens nedgång raderade veckans uppgång",
      paragraphs: [
        "OMXS30 stängde på 3 267,88 punkter på fredagen, en nedgång med 1,01 procent. Över fem dagar var indexet samtidigt nära oförändrat, vilket visar hur fredagens försäljningar åt upp tidigare uppgångar.",
        "Nedgången var del av en bredare europeisk riskminskning. STOXX 600 föll 1 procent på fredagen när oro för höga värderingar, skuldfinansierade AI-investeringar och avkastningen på stora datacentersatsningar spred sig från USA.",
        "Det finns ingen lördagsreaktion att rapportera eftersom Stockholmsbörsen är stängd. Nästa verifierbara marknadstest kommer när handeln öppnar på måndag."
      ]
    },
    {
      heading: "Yubico kombinerar tillväxt med ett stort marginallyft",
      paragraphs: [
        "Yubicos nettoomsättning ökade 29,3 procent till 708,0 miljoner kronor i tredje kvartalet. Den organiska tillväxten var 28,3 procent.",
        "EBIT steg till 179,3 miljoner kronor från 79,6 miljoner och EBIT-marginalen förbättrades till 25,3 procent från 14,5 procent. Bokningarna ökade 88,2 procent till 949,0 miljoner kronor.",
        "Skillnaden mellan försäljningstillväxten och bokningsökningen är viktig eftersom bokningarna ger en signal om framtida efterfrågan, även om de inte är samma sak som redovisade intäkter. Bolaget antog dessutom nya långsiktiga mål om 15–20 procents genomsnittlig årlig försäljningstillväxt och en uthållig EBIT-marginal som rör sig mot 20 procent till 2031."
      ]
    },
    {
      heading: "BTS gör sitt starkaste tredje kvartal",
      paragraphs: [
        "BTS ökade omsättningen till 716 miljoner kronor från 626 miljoner. Tillväxten justerad för valutaeffekter var 13 procent och helt organisk.",
        "EBITA steg 79 procent till 81 miljoner kronor och marginalen förbättrades till 11,4 procent från 7,2 procent. Resultatet efter skatt ökade till 40 miljoner kronor från 12 miljoner.",
        "Kassaflödet från den löpande verksamheten var 109 miljoner kronor, mot 100 miljoner ett år tidigare. Bolaget räknar med att helårets EBITA blir väsentligt bättre än 2025.",
        "För niomånadersperioden behöver resultatutvecklingen läsas med en redovisningspost på 52 miljoner kronor kopplad till en tilläggsköpeskilling. Exklusive den posten ökade resultatet efter skatt till 117 miljoner kronor från 77 miljoner."
      ]
    },
    {
      heading: "Två rapporter – två olika tillväxtsignaler",
      paragraphs: [
        "Yubico och BTS verkar i olika marknader, men rapporterna har en gemensam nämnare: vinst och marginal växte snabbare än omsättningen.",
        "Yubicos bokningsökning på 88,2 procent pekar mot en stark orderbild, medan BTS visade att organisk tillväxt kunde omvandlas till ett tydligt marginallyft. Det är en starkare kvalitativ signal än omsättningstillväxt som enbart drivs av förvärv eller valuta.",
        "Samtidigt ska kvartalstalen inte behandlas som en garanti för nästa period. För Yubico blir kapitalmarknadsdagen den 19 november nästa kontrollpunkt. För BTS blir det viktigt att den högre lönsamheten håller och att redovisningsposten inte skymmer den operativa utvecklingen."
      ]
    },
    {
      heading: "Inflationsflashen föll i oktober",
      paragraphs: [
        "SCB:s preliminära KPI-inflation sjönk till 0,9 procent i oktober från 1,1 procent i september. KPI var oförändrat jämfört med föregående månad.",
        "KPIF, Riksbankens målvariabel, minskade till 1,1 procent från 1,5 procent. KPIF exklusive energi föll till 0,1 procent från 0,5 procent.",
        "Siffrorna är preliminära och mer detaljerade definitiva data publiceras den 12 november. Det gör den publiceringen viktig för att bedöma om den lägre inflationstakten bekräftas eller revideras."
      ]
    },
    {
      heading: "Det följer vi nästa vecka",
      paragraphs: [
        "För Stockholmsbörsen blir måndagens öppning det första testet på om fredagens globala AI-oro håller i sig eller om riskaptiten stabiliseras.",
        "Den 12 november kommer SCB:s definitiva inflationsdata för oktober. Yubico håller kapitalmarknadsdag den 19 november, där bolaget ska utveckla sina nya mål för 2027–2031.",
        "Rapportveckans viktigaste svenska slutsats är att stark lönsamhet fortfarande belönar bolagsspecifika berättelser, men att den breda börsen samtidigt är känslig för globala värderings- och tekniksignaler."
      ]
    }
  ],
  sources: [
    {
      text: "Yubico: officiellt Q3-meddelande publicerat den 5 november 2026 med omsättning, organisk tillväxt, EBIT, marginal, bokningar och nya långsiktiga mål",
      href: "https://investors.yubico.com/en/interim-report-july-september-2026/"
    },
    {
      text: "BTS Group: bolagsdistribuerat officiellt Q3-meddelande publicerat den 6 november 2026 med omsättning, organisk tillväxt, EBITA, kassaflöde, redovisningspost och helårsutsikt",
      href: "https://www.mfn.se/one/a/bts-group/bts-group-ab-publ-delarsrapport-januari-september-2026-c5e38af3"
    },
    {
      text: "SCB: officiell preliminär inflationsstatistik för oktober 2026 med KPI, KPIF, KPIF exklusive energi och datum för definitiv publicering",
      href: "https://www.scb.se/en/finding-statistics/statistics-by-subject-area/prices-and-economic-trends/price-statistics/consumer-price-index-cpi/pong/statistical-news/cpi-flash-estimate-october-2026/"
    },
    {
      text: "Reuters: europeisk marknadssammanfattning den 6 november 2026 om fredagens breda riskminskning och oron kring AI-investeringar",
      href: "https://www.reuters.com/markets/europe/european-shares-set-fall-global-ai-rout-gathers-pace-2026-11-06/"
    },
    {
      text: "MarketScreener: OMXS30-marknadsdata med fredagens stängningsnivå, dagsförändring och femdagarsutveckling den 6 november 2026",
      href: "https://www.marketscreener.com/quote/index/OMX-STOCKHOLM-30-INDEX-7399/news-history/"
    }
  ]
};
