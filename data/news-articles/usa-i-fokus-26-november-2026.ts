import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 26 november 2026.
 * Editorial research cutoff: 2026-11-26T13:58:43+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://bea.gov/news/2026/personal-income-and-outlays-october-2026
 * P0_SOURCE[primary]: https://www.bea.gov/news/2026/gdp-second-estimate-and-corporate-profits-3rd-quarter-2026
 * P0_SOURCE[primary]: https://www.federalreserve.gov/monetarypolicy/beigebook202611-summary.htm
 * P0_SOURCE[primary]: https://www.nyse.com/trade/hours-calendars?ecid=PSBINSGCGAENPX
 * P0_SOURCE[secondary]: https://apnews.com/article/wall-street-stocks-dow-nasdaq-94fdb0ecb060ec65c0b02879ce0d2d09
 * P0_SOURCE[secondary]: https://apnews.com/article/stocks-markets-ai-oil-bonds-320cd8c9c286a7773797bf2f478ef314
 */
export const USA_I_FOKUS_26_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-26-november-2026",
  slug: "usa-i-fokus-26-november-2026-pce-bnp-thanksgiving",
  title: "USA i fokus 26 november: PCE stiger till 3,8 procent – Wall Street håller stängt",
  summary:
    "USA:s PCE-inflation steg till 3,8 procent samtidigt som BNP-tillväxten reviderades upp till 4,3 procent. Wall Street är stängt för Thanksgiving efter en volatil onsdag där teknikindex återhämtade större delen av dagens fall.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-26T13:58:48+01:00",
  url: "/news/usa-i-fokus-26-november-2026-pce-bnp-thanksgiving",
  featured: true,
  imageAlt: "USA i fokus 26 november 2026 – PCE-inflation, amerikansk BNP och stängd Wall Street-handel på Thanksgiving.",
  readingMinutes: 6,
  seoTitle: "USA-börsen: PCE 3,8 procent, BNP 4,3 och Thanksgiving",
  seoDescription:
    "USA i fokus 26 november: PCE-inflationen stiger till 3,8 procent, BNP revideras upp till 4,3 procent och Wall Street håller stängt för Thanksgiving.",
  seoKeywords: [
    "USA-börsen idag",
    "Wall Street Thanksgiving",
    "PCE inflation oktober 2026",
    "USA BNP tredje kvartalet 2026",
    "Fed Beige Book november 2026",
    "Nasdaq november 2026",
    "Wall Street öppettider Thanksgiving"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Wall Street",
      "PCE-inflation",
      "USA BNP",
      "Federal Reserve",
      "Beige Book",
      "Thanksgiving",
      "Nasdaq",
      "USA-räntor"
    ],
    companies: ["Nvidia", "Anthropic", "Broadcom"],
    tickers: ["NVDA", "ANT", "AVGO"],
    relatedNewsSlugs: [
      "usa-i-fokus-25-november-2026-ai-press-dell-pce",
      "usa-i-fokus-22-november-2026-veckan-pce-bnp-dell-deere",
      "usa-i-fokus-21-november-2026-veckan-ai-ras-nvidia-anthropic"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Gårdagens två viktigaste öppna frågor har nu fått verifierade svar. USA:s PCE-inflation steg till 3,8 procent i oktober, medan den underliggande kärninflationen var 3,3 procent. Samtidigt reviderades tillväxten under tredje kvartalet upp till 4,3 procent i årstakt.",
    "Kombinationen visar en ekonomi med starkare tillväxt men fortsatt hög prisökningstakt. Det är en mer krävande mix för Federal Reserve än om inflationen hade fallit samtidigt som aktiviteten bromsade.",
    "Den amerikanska aktiemarknaden är stängd i dag för Thanksgiving. Det finns därför ingen ordinarie förhandel eller ny kontanthandel att rapportera; dagens artikel följer i stället upp gårdagens makro- och marknadsutfall och blickar fram mot fredagens förkortade session."
  ],
  sections: [
    {
      heading: "PCE-inflationen stiger till 3,8 procent",
      paragraphs: [
        "PCE-prisindex ökade 0,3 procent i oktober jämfört med september och 3,8 procent jämfört med samma månad året före. Kärnindex, där livsmedel och energi räknas bort, steg också 0,3 procent från månaden före och 3,3 procent i årstakt.",
        "Den nominella konsumtionen ökade 0,3 procent, men real PCE minskade marginellt med mindre än 0,1 procent. Personliga inkomster steg 0,7 procent och disponibla inkomster 0,8 procent.",
        "Sparkvoten var 4,1 procent. Det betyder att hushållens inkomster förbättrades tydligt i löpande priser, samtidigt som den inflationsjusterade konsumtionen i stort sett stod stilla."
      ]
    },
    {
      heading: "BNP revideras upp från 3,4 till 4,3 procent",
      paragraphs: [
        "USA:s reala BNP ökade med 4,3 procent i årstakt under tredje kvartalet. Det är 0,9 procentenhet mer än den första uppskattningen på 3,4 procent och en tydlig acceleration från andra kvartalets 2,2 procent.",
        "Upprevideringen drevs främst av högre investeringar och starkare konsumtion än i den första uppskattningen. Real slutlig försäljning till privata inhemska köpare ökade 5,8 procent.",
        "Företagsvinster från löpande produktion ökade med 206 miljarder dollar under kvartalet. Samtidigt steg real bruttonationalinkomst med 4,4 procent, vilket ger stöd åt bilden av starkare aktivitet."
      ]
    },
    {
      heading: "Beige Book visar tillväxt – men konsumenterna är försiktiga",
      paragraphs: [
        "Federal Reserves Beige Book visar att åtta av tolv distrikt rapporterade svag till måttlig tillväxt, medan fyra beskrev oförändrad aktivitet.",
        "Konsumentutgifterna var i stort sett oförändrade. Hushållen beskrevs som priskänsliga och mer selektiva med frivilliga inköp, samtidigt som bilförsäljningen försvagades.",
        "Sysselsättningen ökade något och lönerna steg måttligt. Priserna ökade måttligt, men företagens insatskostnader växte generellt snabbare än försäljningspriserna eftersom konkurrens och kundernas priskänslighet begränsade möjligheten att föra kostnader vidare."
      ]
    },
    {
      heading: "Wall Street återhämtade större delen av onsdagens fall",
      paragraphs: [
        "S&P 500 föll 0,3 procent till 7 182,78 på onsdagen efter att ha varit ned som mest 3,2 procent under dagen. Nasdaq Composite backade 0,6 procent till 23 585,80 efter ett intradagsfall på som mest 4,6 procent.",
        "Dow Jones steg samtidigt 0,3 procent till 50 182,95 och Russell 2000 ökade 0,7 procent. Den breda slutbilden blev därmed blandad snarare än den kraftiga nedgång som förhandeln pekade mot.",
        "Nvidia föll 3,9 procent, medan Anthropic återhämtade en tidig nedgång och stängde 1,1 procent högre men fortfarande under introduktionskursen 83 dollar. Gårdagens teknikpress blev alltså bestående i flera stora aktier, men den breda marknaden stabiliserades före stängning."
      ]
    },
    {
      heading: "Fredagens handel stänger klockan 19 svensk tid",
      paragraphs: [
        "NYSE håller stängt torsdagen den 26 november för Thanksgiving. Marknaden öppnar igen på fredag men den ordinarie aktiehandeln stänger redan klockan 13.00 amerikansk östkusttid, motsvarande 19.00 i Stockholm.",
        "Den korta sessionen innebär att likviditeten kan vara lägre än under en normal handelsdag. Kursrörelser behöver därför värderas tillsammans med handelsvolymen och inte automatiskt tolkas som ett nytt långsiktigt marknadsbesked.",
        "Efter cutoff var europeiska och asiatiska börser högre, medan terminen för S&P 500 var upp 0,3 procent enligt AP. Eftersom USA:s kontantmarknad är stängd ska den rörelsen inte beskrivas som ett färdigt Wall Street-utfall."
      ]
    }
  ],
  sources: [
    {
      text: "U.S. Bureau of Economic Analysis: officiell rapport för personliga inkomster, konsumtion, sparande och PCE-inflation i oktober 2026",
      href: "https://bea.gov/news/2026/personal-income-and-outlays-october-2026"
    },
    {
      text: "U.S. Bureau of Economic Analysis: officiell andra BNP-uppskattning för tredje kvartalet 2026 med revideringar, inhemsk efterfrågan och företagsvinster",
      href: "https://www.bea.gov/news/2026/gdp-second-estimate-and-corporate-profits-3rd-quarter-2026"
    },
    {
      text: "Federal Reserve: Beige Book från november 2026 med nationell sammanfattning av aktivitet, arbetsmarknad, konsumenter och priser",
      href: "https://www.federalreserve.gov/monetarypolicy/beigebook202611-summary.htm"
    },
    {
      text: "NYSE: officiell kalender med stängt på Thanksgiving och tidig stängning klockan 13.00 ET fredagen den 27 november 2026",
      href: "https://www.nyse.com/trade/hours-calendars?ecid=PSBINSGCGAENPX"
    },
    {
      text: "Associated Press: verifierade stängningsnivåer för S&P 500, Dow Jones, Nasdaq och Russell 2000 den 25 november 2026",
      href: "https://apnews.com/article/wall-street-stocks-dow-nasdaq-94fdb0ecb060ec65c0b02879ce0d2d09"
    },
    {
      text: "Associated Press: global marknadsbild på Thanksgiving, onsdagens intradagsåterhämtning samt amerikanska terminer och AI-aktier",
      href: "https://apnews.com/article/stocks-markets-ai-oil-bonds-320cd8c9c286a7773797bf2f478ef314"
    }
  ]
};
