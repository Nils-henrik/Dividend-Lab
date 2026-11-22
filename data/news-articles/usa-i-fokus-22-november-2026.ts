import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 22 november 2026, Veckan som kommer.
 * Editorial research cutoff: 2026-11-22T14:05:24+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.bea.gov/news/schedule?output=1
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents/2026-november.htm
 * P0_SOURCE[primary]: https://www.deere.com/en-us/john-deere-news/fy26-q4-announcement
 * P0_SOURCE[primary]: https://www.nyse.com/trade/hours-calendars
 * P0_SOURCE[secondary]: https://e.nyse.com/mac-desk-weekly-recap
 */
export const USA_I_FOKUS_22_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-22-november-2026",
  slug: "usa-i-fokus-22-november-2026-veckan-pce-bnp-dell-deere",
  title: "USA i fokus 22 november – Veckan som kommer: PCE, BNP och Dell i en kort börsvecka",
  summary:
    "En helgstympad Wall Street-vecka samlar PCE-inflation, en ny BNP-uppskattning och Fed Beige Book på onsdag. Dell, Deere, Zoom och Analog Devices leder samtidigt ett koncentrerat rapportsvep.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-22T14:05:29+01:00",
  url: "/news/usa-i-fokus-22-november-2026-veckan-pce-bnp-dell-deere",
  featured: true,
  readingMinutes: 6,
  seoTitle: "Wall Street veckan: PCE, BNP, Dell och Deere i fokus",
  seoDescription:
    "USA-börsen veckan 23–27 november: PCE, BNP och Beige Book kommer onsdag. Dell, Deere, Zoom och Analog Devices rapporterar före Thanksgiving.",
  seoKeywords: [
    "USA-börsen veckan",
    "Wall Street veckan som kommer",
    "PCE inflation november 2026",
    "USA BNP tredje kvartalet",
    "Fed Beige Book",
    "Dell rapport",
    "Deere rapport",
    "Zoom rapport",
    "Thanksgiving börsen"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Veckan som kommer",
      "Wall Street",
      "PCE-inflation",
      "USA BNP",
      "Federal Reserve",
      "Beige Book",
      "bolagsrapporter",
      "statsobligationer",
      "Thanksgiving"
    ],
    companies: ["Dell Technologies", "Deere & Company", "Zoom Communications", "Analog Devices", "Hewlett Packard Enterprise", "HP", "Autodesk", "Workday"],
    tickers: ["DELL", "DE", "ZM", "ADI", "HPE", "HPQ", "ADSK", "WDAY"],
    relatedNewsSlugs: [
      "usa-i-fokus-21-november-2026-veckan-ai-ras-nvidia-anthropic",
      "usa-i-fokus-20-november-2026-anthropic-intuit-ross-keysight",
      "usa-i-fokus-19-november-2026-anthropic-walmart-fed"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Efter förra veckans kraftiga AI- och tekniknedgång flyttas Wall Streets fokus nu från det inträffade raset till tre nya kontrollpunkter: onsdagens PCE-inflation och BNP-uppdatering, en koncentrerad rapportkalender samt Fed Beige Book.",
    "Veckan är kort. De amerikanska börserna håller stängt på torsdag för Thanksgiving och stänger tidigt på fredag, vilket samlar merparten av de marknadspåverkande beskeden till måndag–onsdag.",
    "Det är söndag och den amerikanska kontantmarknaden är stängd. Alla händelser nedan ligger efter artikelns cutoff och beskrivs därför enbart framåtblickande."
  ],
  sections: [
    {
      heading: "Onsdag 14.30: PCE och BNP blir veckans makrotest",
      paragraphs: [
        "Bureau of Economic Analysis publicerar Personal Income and Outlays för oktober onsdagen den 25 november klockan 08.30 amerikansk östkusttid, motsvarande 14.30 i Stockholm. Rapporten innehåller Federal Reserves centrala PCE-inflationsmått samt uppgifter om inkomster och konsumtion.",
        "Samtidigt kommer den andra uppskattningen av BNP och företagsvinster för tredje kvartalet 2026. Kombinationen gör publiceringen viktig för både tillväxt- och inflationsbilden: marknaden får två centrala pusselbitar i samma tidsfönster.",
        "Inget utfall kan fastställas före publiceringen. Kontrollpunkterna blir hur inflationstakten förändras, om BNP revideras och om hushållens inkomster och konsumtion pekar åt samma håll."
      ]
    },
    {
      heading: "Fed Beige Book följer på onsdagskvällen",
      paragraphs: [
        "Federal Reserve publicerar Beige Book klockan 14.00 amerikansk östkusttid på onsdagen, motsvarande 20.00 i Stockholm. Rapporten sammanställer regionala observationer om aktivitet, arbetsmarknad, priser och kreditvillkor.",
        "Beige Book kommer efter PCE- och BNP-statistiken samma dag. Den kan därför ge kvalitativ kontext till de nationella siffrorna, men den är inte ett räntebesked och ska inte läsas som en förhandsprognos för nästa Fed-möte.",
        "Veckans amerikanska statistik börjar redan på måndagen med preliminära inköpschefsindex. På tisdagen följer bland annat konsumentförtroende, bostadspriser och Richmond Feds industriindex."
      ]
    },
    {
      heading: "Rapportsvepet kulminerar på tisdag",
      paragraphs: [
        "Måndagens efterhandel innehåller rapporter från bland andra Hewlett Packard Enterprise och Zoom. På tisdagsmorgonen följer Analog Devices, Best Buy, Dollar Tree och Medtronic.",
        "Efter tisdagens stängning rapporterar bland andra Dell Technologies, HP, Autodesk och Workday. Dell har officiellt bekräftat att bolaget diskuterar resultatet för tredje kvartalet i räkenskapsåret 2027 den 24 november.",
        "För tekniksektorn blir Dell, HP och Hewlett Packard Enterprise relevanta kontrollpunkter efter den senaste veckans AI-oro. Viktigast blir redovisad efterfrågan, marginaler, kassaflöde och guidning; inga kursreaktioner eller rapportutfall föregrips."
      ]
    },
    {
      heading: "Deere avslutar rapportfönstret före helgen",
      paragraphs: [
        "Deere & Company publicerar material för sitt fjärde kvartal 2026 på onsdagen. Bolagets resultatgenomgång börjar klockan 09.00 amerikansk centraltid, motsvarande 16.00 i Stockholm.",
        "Rapporten blir veckans tydligaste stora industribesked i USA. Investerare får framför allt bevaka försäljning, lönsamhet och bolagets utsikter för jordbruks- och anläggningsmaskiner.",
        "NYSE:s veckokalender placerar Deere före onsdagens öppning. Det innebär att rapporten konkurrerar om uppmärksamheten med PCE, BNP och övrig statistik samma dag."
      ]
    },
    {
      heading: "Thanksgiving kortar handeln och samlar ränterisken",
      paragraphs: [
        "NYSE håller stängt torsdagen den 26 november för Thanksgiving. Fredagen den 27 november stänger den ordinarie aktiehandeln klockan 13.00 amerikansk östkusttid, motsvarande 19.00 i Stockholm.",
        "USA:s finansdepartement genomför samtidigt auktioner i kortare och medellånga löptider under måndag–onsdag, däribland två-, fem- och sjuåriga statspapper enligt NYSE:s veckokalender. Efter förra veckans stora ränterörelser blir efterfrågan i auktionerna en relevant kontrollpunkt.",
        "Den korta veckan kan koncentrera handelsflöden före torsdagens stängning. DivLab följer därför först de faktiska makro- och rapportutfallen, därefter eventuella förändringar i guidning och slutligen marknadsreaktionen när respektive besked har publicerats."
      ]
    }
  ],
  sources: [
    {
      text: "U.S. Bureau of Economic Analysis: officiell kalender med PCE, personliga inkomster och utgifter samt BNP och företagsvinster den 25 november 2026 klockan 08.30 ET",
      href: "https://www.bea.gov/news/schedule?output=1"
    },
    {
      text: "Federal Reserve: officiell novemberkalender med Beige Book den 25 november 2026 klockan 14.00 ET och Thanksgiving den 26 november",
      href: "https://www.federalreserve.gov/newsevents/2026-november.htm"
    },
    {
      text: "Deere & Company: officiellt besked om fjärde kvartalets resultatgenomgång den 25 november 2026 klockan 09.00 CT",
      href: "https://www.deere.com/en-us/john-deere-news/fy26-q4-announcement"
    },
    {
      text: "NYSE: officiella handels- och helgtider med stängt på Thanksgiving och tidig stängning klockan 13.00 ET den 27 november 2026",
      href: "https://www.nyse.com/trade/hours-calendars"
    },
    {
      text: "NYSE MAC Desk: veckokalender med amerikansk statistik, rapporter och statspappersauktioner den 23–27 november 2026",
      href: "https://e.nyse.com/mac-desk-weekly-recap"
    }
  ]
};
