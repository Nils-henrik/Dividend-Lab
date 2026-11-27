import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 27 november 2026.
 * Editorial research cutoff: 2026-11-27T13:58:17+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.census.gov/econ/indicators/release_schedule.html
 * P0_SOURCE[primary]: https://www.nyse.com/trade/hours-calendars
 * P0_SOURCE[primary]: https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Board-Reinstates-Jensen-Huang-as-President-CEO-and-Board-Director/
 * P0_SOURCE[secondary]: https://www.marketwatch.com/livecoverage/stock-market-today-dow-s-p-500-nasdaq-thanksgiving-holiday-shortened-black-friday-trading
 * P0_SOURCE[secondary]: https://www.reuters.com/business/energy/brent-trades-near-months-high-mideast-conflict-threatens-supply-2026-11-27/
 */
export const USA_I_FOKUS_27_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-27-november-2026",
  slug: "usa-i-fokus-27-november-2026-nasdaq-olja-black-friday",
  title: "USA i fokus 27 november: Nasdaq-terminer pekar upp – oljan nära månadshögsta",
  summary:
    "USA-terminerna pekar mot en tydligt högre öppning efter Thanksgiving, ledda av Nasdaq 100. Samtidigt stiger oljepriset och statsräntorna inför en förkortad Black Friday-session där ny amerikansk handels- och lagerstatistik kommer efter artikelns cutoff.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-27T13:58:18+01:00",
  url: "/news/usa-i-fokus-27-november-2026-nasdaq-olja-black-friday",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-27.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-27.png",
  imageAlt: "USA i fokus 2026-11-27 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 5,
  seoTitle: "USA-börsen idag: Nasdaq-terminer upp inför Black Friday",
  seoDescription:
    "USA i fokus 27 november: Nasdaq-terminerna leder en tydlig uppgång, oljan stiger och Wall Street stänger tidigt under Black Friday.",
  seoKeywords: [
    "USA-börsen idag",
    "Wall Street Black Friday 2026",
    "Nasdaq terminer idag",
    "Nvidia aktie",
    "Anthropic aktie",
    "oljepris idag",
    "USA handelsbalans oktober 2026"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Wall Street",
      "Nasdaq 100",
      "Black Friday",
      "AI-aktier",
      "oljepris",
      "USA-räntor",
      "amerikansk handel"
    ],
    companies: ["Nvidia", "Anthropic"],
    tickers: ["NVDA", "ANT"],
    relatedNewsSlugs: [
      "usa-i-fokus-26-november-2026-pce-bnp-thanksgiving",
      "usa-i-fokus-25-november-2026-ai-press-dell-pce",
      "usa-i-fokus-22-november-2026-veckan-pce-bnp-dell-deere"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en tydligt högre öppning efter Thanksgiving. Vid 13.02 svensk tid indikerade terminerna en uppgång på omkring 2,1 procent för Nasdaq 100, 1,5 procent för S&P 500 och 1,2 procent för Dow Jones.",
    "Teknik är den tydligaste drivkraften i förhandeln. Nvidia var upp mer än 2 procent och Anthropic mer än 3 procent, samtidigt som oljepriset och amerikanska statsräntor steg.",
    "Dagens handel är förkortad och stänger klockan 19.00 svensk tid. Den amerikanska statistikrapport som står närmast i kalendern publiceras först klockan 14.30, efter artikelns cutoff, och något utfall föregrips därför inte."
  ],
  sections: [
    {
      heading: "Teknik leder uppgången före öppning",
      paragraphs: [
        "Efter att USA-börsen höll stängt på torsdagen visar fredagens terminsbild en bred uppgång, men med tydlig övervikt mot teknik. Nasdaq 100-terminen låg omkring 2,1 procent högre, jämfört med cirka 1,5 procent för S&P 500 och 1,2 procent för Dow Jones.",
        "Nvidia och Anthropic hörde till bolagen som drog upp teknikbilden i förhandeln. Rörelserna innebär en kortsiktig motreaktion efter den AI-oro som präglade föregående vecka, men de säger ännu inget om hur fredagens förkortade kontanthandel slutar.",
        "För investerare blir bredden i uppgången viktigare än enstaka förhandelsrörelser. Om uppgången efter öppning förblir koncentrerad till de största AI-bolagen är marknadsbilden smalare än om fler sektorer deltar."
      ]
    },
    {
      heading: "Nvidia står åter i centrum",
      paragraphs: [
        "Nvidias styrelse återinsatte Jensen Huang som vd och styrelseledamot den 23 november. Bolaget uppgav samtidigt att en oberoende utredning fortsätter och att Huang ska samarbeta med den.",
        "Det beskedet är inte nytt i dag, men det hjälper förklara varför Nvidia fortsatt är en central kontrollpunkt när tekniksektorn försöker stabiliseras. Fredagens förhandelsuppgång följer efter flera dagar med stora rörelser och hög osäkerhet kring både ledning och AI-värderingar.",
        "Dagens artikel behandlar därför Nvidia som en del av den bredare tekniksignalen, inte som ett nytt bolagsbesked. Någon slutsats om den slutliga kursreaktionen dras inte före ordinarie handel."
      ]
    },
    {
      heading: "Oljepriset ökar kostnadstrycket",
      paragraphs: [
        "Brentoljan handlades till 96,60 dollar per fat vid 13.39 svensk tid, upp 3 cent för dagen och nära den högsta nivån sedan den 9 november. WTI låg på 85,14 dollar, 1,7 procent över onsdagens stängning.",
        "Reuters kopplar uppgången till oro för leveranser efter attacker mot tankfartyg i Hormuzsundet och saudisk energiinfrastruktur. Det gör energipriset relevant även för aktiemarknaden eftersom en varaktig oljeuppgång kan förstärka inflations- och räntetrycket.",
        "Samtidigt steg amerikanska statsräntor i den förkortade handeln. Kombinationen av högre energi och högre räntor är en motvikt till teknikuppgången, särskilt för högt värderade tillväxtbolag."
      ]
    },
    {
      heading: "Gårdagens öppna fråga får ett första marknadssvar",
      paragraphs: [
        "Torsdagens USA-artikel följde upp PCE-inflationen på 3,8 procent, kärn-PCE på 3,3 procent och en uppreviderad BNP-tillväxt på 4,3 procent. Den öppna frågan var hur marknaden skulle prissätta kombinationen av stark tillväxt och fortsatt hög inflation när handeln återupptogs.",
        "Fredagens terminsbild ger ett första svar: riskaptiten är tydligt bättre inför öppning, framför allt i teknik. Samtidigt visar de högre statsräntorna att inflations- och Fed-frågan inte har försvunnit.",
        "Det är därför för tidigt att beskriva en fullständig omsvängning. Den korta sessionen och tunnare helghandel kan förstärka rörelser åt båda håll."
      ]
    },
    {
      heading: "Statistik efter cutoff – kort handelsdag",
      paragraphs: [
        "Census Bureau publicerar sin rapport över preliminär varuhandel samt detalj- och grossistlager för oktober klockan 08.30 amerikansk östkusttid, motsvarande 14.30 i Stockholm.",
        "Rapporten ligger efter artikelns cutoff. Inga siffror, avvikelser eller marknadsreaktioner från den publiceringen beskrivs därför som redan kända.",
        "NYSE stänger den ordinarie aktiehandeln klockan 13.00 amerikansk östkusttid, motsvarande 19.00 i Stockholm. Efter statistikutfallet blir den viktigaste kontrollpunkten om teknikuppgången håller genom den förkortade sessionen samtidigt som olja och räntor ligger kvar på högre nivåer."
      ]
    }
  ],
  sources: [
    {
      text: "U.S. Census Bureau: officiell publiceringsplan för Advance Economic Indicators avseende oktober 2026 den 27 november klockan 08.30 ET",
      href: "https://www.census.gov/econ/indicators/release_schedule.html"
    },
    {
      text: "NYSE: officiella handels- och helgtider med tidig stängning klockan 13.00 ET den 27 november 2026",
      href: "https://www.nyse.com/trade/hours-calendars"
    },
    {
      text: "Nvidia Investor Relations: officiellt besked den 23 november om att Jensen Huang återinsatts som vd och styrelseledamot",
      href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Board-Reinstates-Jensen-Huang-as-President-CEO-and-Board-Director/"
    },
    {
      text: "MarketWatch: aktuell termins- och förhandelsbild för S&P 500, Dow Jones, Nasdaq 100, Nvidia och Anthropic den 27 november",
      href: "https://www.marketwatch.com/livecoverage/stock-market-today-dow-s-p-500-nasdaq-thanksgiving-holiday-shortened-black-friday-trading"
    },
    {
      text: "Reuters: aktuell oljeprisbild med Brent, WTI och leveransoro den 27 november 2026",
      href: "https://www.reuters.com/business/energy/brent-trades-near-months-high-mideast-conflict-threatens-supply-2026-11-27/"
    }
  ]
};
