import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 21 november 2026, Veckan som gått.
 * Editorial research cutoff: 2026-11-21T14:00:29+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/business/view-nasdaq-plunges-5-day-after-anthropic-debut-investors-still-believe-ai-2026-11-20/
 * P0_SOURCE[secondary]: https://www.reuters.com/world/us/secs-nvidia-probe-is-examining-potential-accounting-issues-sources-say-2026-11-20/
 * P0_SOURCE[primary]: https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Third-Quarter-Fiscal-2027/
 * P0_SOURCE[primary]: https://www.bea.gov/news/schedule
 * P0_SOURCE[primary]: https://www.federalreserve.gov/newsevents.htm
 */
export const USA_I_FOKUS_21_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-21-november-2026",
  slug: "usa-i-fokus-21-november-2026-veckan-ai-ras-nvidia-anthropic",
  title: "USA i fokus 21 november – Veckan som gått: AI-raset sänker Nasdaq 10 procent",
  summary:
    "Nasdaq föll 10 procent under veckan när AI-handeln vände tvärt. Nvidia tappade 23 procent trots rekordrapport, Anthropic föll efter debuten och nästa veckas PCE, BNP och Beige Book står i fokus.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-21T14:00:34+01:00",
  url: "/news/usa-i-fokus-21-november-2026-veckan-ai-ras-nvidia-anthropic",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-21.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-21.png",
  imageAlt: "USA i fokus 2026-11-21 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 6,
  seoTitle: "Veckan på Wall Street: Nasdaq faller 10 procent i AI-ras",
  seoDescription:
    "USA-börsen veckan som gått: Nasdaq tappar 10 procent, Nvidia faller 23 procent och Anthropics debutlyft vänder. PCE, BNP och Beige Book väntar.",
  seoKeywords: [
    "USA-börsen veckan",
    "Wall Street veckan som gått",
    "Nasdaq faller",
    "Nvidia aktie",
    "Anthropic aktie",
    "AI-aktier",
    "PCE inflation",
    "USA BNP",
    "Federal Reserve Beige Book"
  ],
  internalLinking: {
    topics: ["USA i fokus", "Veckan som gått", "Wall Street", "Nasdaq", "S&P 500", "artificiell intelligens", "halvledare", "USA-räntor", "Federal Reserve", "PCE-inflation"],
    companies: ["Nvidia", "Anthropic"],
    tickers: ["NVDA", "ANT"],
    relatedNewsSlugs: [
      "usa-i-fokus-20-november-2026-anthropic-intuit-ross-keysight",
      "usa-i-fokus-19-november-2026-anthropic-walmart-fed",
      "usa-i-fokus-18-november-2026-nvidia-target-lowes"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Veckans öppna fråga har fått ett tydligt svar. Anthropics starka börsdebut stabiliserade inte AI-handeln: Nasdaq föll 5,3 procent på fredagen och 10 procent under veckan, den största veckonedgången sedan 2020.",
    "Nvidia blev den tydligaste symbolen för omsvängningen. Aktien föll 14 procent på fredagen och 23 procent under veckan trots att bolagets kvartalsrapport visade rekordintäkter och en högre prognos för nästa kvartal.",
    "Det är lördag och den amerikanska kontantmarknaden är stängd. Den här utgåvan sammanfattar därför verifierade utfall till och med fredagens stängning och blickar fram mot nästa veckas makroagenda."
  ],
  sections: [
    {
      heading: "Veckan kulminerar i fredagens breda ras",
      paragraphs: [
        "Nasdaq föll 5,3 procent på fredagen och S&P 500 backade 3,7 procent. Volatilitetsindexet VIX steg 33 procent till 37, samtidigt som Philadelphia halvledarindex tappade 11 procent.",
        "Nasdaqs veckonedgång på 10 procent blev den största sedan 2020. Rörelsen visar att veckans AI-oro inte stannade vid ett enskilt bolag utan spreds till den bredare teknik- och halvledarhandeln.",
        "Den amerikanska tioårsräntan sjönk 12 räntepunkter till 4,93 procent på fredagen. Det gav ingen stabilisering åt aktiemarknaden före stängningen."
      ]
    },
    {
      heading: "Nvidias rekordrapport räcker inte",
      paragraphs: [
        "Nvidia redovisade kvartalsintäkter på 115,8 miljarder dollar, 103 procent mer än året före. Datacenterintäkterna steg 110 procent till 107,6 miljarder dollar, den justerade bruttomarginalen var 74,9 procent och den justerade vinsten per aktie 2,68 dollar.",
        "Bolaget guidar för intäkter på 130 miljarder dollar, plus eller minus 3 procent, i det fjärde kvartalet. Prognosen räknar inte med några intäkter från datacenterberäkning i Kina.",
        "Trots siffrorna föll Nvidia 14 procent på fredagen och 23 procent under veckan. Utfallet besvarar veckans centrala fråga: stark efterfrågan och höjd guidning räckte inte för att vända den pågående omvärderingen av AI-aktier."
      ]
    },
    {
      heading: "Reuters rapporterar om SEC-granskning av Nvidia",
      paragraphs: [
        "Reuters rapporterade på fredagen, med hänvisning till personer som informerats om saken, att amerikanska SEC granskar möjliga redovisningsfrågor hos Nvidia. SEC avböjde att kommentera och Nvidia hade inte omedelbart svarat Reuters.",
        "Det är inte känt när granskningen inleddes eller exakt vilka frågor den omfattar. En myndighetsgranskning är inte bevis för felaktigheter och kan avslutas utan åtgärd.",
        "Nvidia var redan ned mer än 6 procent innan Reuters publicering och föll omkring 13 procent efter uppgifterna. Det går därför inte att tillskriva hela fredagsnedgången en enda nyhet."
      ]
    },
    {
      heading: "Anthropics debut blir ingen vändpunkt",
      paragraphs: [
        "Efter torsdagens starka börsdebut föll Anthropic 9 procent på fredagen. Därmed fick gårdagens kontrollpunkt ett verifierat utfall: debutlyftet höll inte och gav inte heller något stöd åt den bredare AI-handeln.",
        "Sambandet mellan Anthropic, Nvidia och halvledarindexet var veckans tydligaste marknadsberättelse. Investerarna flyttade fokus från enskilda tillväxtsiffror till hur höga värderingar och stora investeringsbehov ska försvaras.",
        "Det betyder inte att den långsiktiga AI-efterfrågan har försvunnit. Men veckans kursutfall visar att starka bolagsbesked inte längre automatiskt ger stöd åt hela sektorn."
      ]
    },
    {
      heading: "Nästa vecka: PCE, BNP och Beige Book",
      paragraphs: [
        "På onsdag den 25 november klockan 08.30 amerikansk östkusttid, motsvarande 14.30 i Stockholm, publicerar Bureau of Economic Analysis både den andra uppskattningen av BNP för tredje kvartalet och Personal Income and Outlays för oktober, där PCE-inflationen ingår.",
        "Federal Reserve publicerar Beige Book samma dag klockan 14.00 amerikansk östkusttid, motsvarande 20.00 i Stockholm. Torsdagen den 26 november är Thanksgiving i USA.",
        "Samtliga händelser ligger efter artikelns cutoff och beskrivs därför endast framåtblickande. Marknaden kommer framför allt att väga inflationsbilden och BNP-revideringen mot veckans kraftiga rörelser i både aktier och räntor."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters: verifierad fredagsstängning med index, Nvidia, Anthropic, halvledare, VIX och amerikansk tioårsränta",
      href: "https://www.reuters.com/business/view-nasdaq-plunges-5-day-after-anthropic-debut-investors-still-believe-ai-2026-11-20/"
    },
    {
      text: "Reuters: rapportering om SEC:s granskning av möjliga redovisningsfrågor hos Nvidia, inklusive bolagets kursutveckling och centrala förbehåll",
      href: "https://www.reuters.com/world/us/secs-nvidia-probe-is-examining-potential-accounting-issues-sources-say-2026-11-20/"
    },
    {
      text: "Nvidia Investor Relations: officiell rapport för tredje kvartalet 2027 med intäkter, datacenter, marginal, resultat och Q4-prognos",
      href: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Third-Quarter-Fiscal-2027/"
    },
    {
      text: "U.S. Bureau of Economic Analysis: officiell publiceringskalender med BNP och Personal Income and Outlays den 25 november 2026",
      href: "https://www.bea.gov/news/schedule"
    },
    {
      text: "Federal Reserve: officiell kalender med Beige Book den 25 november 2026 och Thanksgiving den 26 november",
      href: "https://www.federalreserve.gov/newsevents.htm"
    }
  ]
};
