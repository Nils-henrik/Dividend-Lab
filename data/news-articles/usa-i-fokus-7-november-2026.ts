import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 7 november 2026.
 * Editorial research cutoff: 2026-11-07T14:00:51+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.bls.gov/news.release/archives/empsit_11062026.htm
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/11_sched_list.htm
 * P0_SOURCE[primary]: https://www.nyse.com/index?trk=public_post_reshare-text
 * P0_SOURCE[secondary]: https://www.reuters.com/business/view-strong-october-jobs-report-sends-yields-higher-2026-11-06/
 * P0_SOURCE[secondary]: https://www.fidelity.com/news/article/us-markets/202611061602RTRSNEWSCOMBINED_L6N46N1AI_1
 */
export const USA_I_FOKUS_7_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-7-november-2026-veckan-som-gatt-jobb-ai",
  slug: "usa-i-fokus-7-november-2026-veckan-som-gatt-jobb-ai",
  title: "USA i fokus – Veckan som gått: Nasdaq repar sig men faller för fjärde veckan",
  summary:
    "Nasdaq återhämtade sig på fredagen efter torsdagens AI-ledda nedgång, men avslutade ändå sin fjärde raka förlustvecka. En stark amerikansk jobbrapport flyttar nu fokus mot inflationen.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-07T14:00:51+01:00",
  url: "/news/usa-i-fokus-7-november-2026-veckan-som-gatt-jobb-ai",
  featured: true,
  readingMinutes: 5,
  seoTitle: "Wall Street veckan: Nasdaq föll trots fredagsrekyl",
  seoDescription:
    "Nasdaq steg på fredagen men föll för fjärde veckan i rad. USA skapade 165 000 jobb i oktober och nästa fokus blir inflationsdata.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street veckan",
    "Nasdaq veckan",
    "S&P 500 veckan",
    "USA jobbrapport",
    "USA inflation",
    "AI aktier",
    "Fed ränta",
  ],
  internalLinking: {
    topics: ["Wall Street", "Nasdaq Composite", "S&P 500", "Dow Jones", "USA arbetsmarknad", "USA inflation", "Federal Reserve", "artificiell intelligens", "halvledare"],
    companies: ["Nvidia", "AMD", "Intel", "Micron"],
    tickers: ["NVDA", "AMD", "INTC", "MU"],
    relatedNewsSlugs: [
      "usa-i-fokus-6-november-2026-nasdaq-humana-jobbrapport",
      "usa-i-fokus-5-november-2026-nasdaq-qualcomm-uber-jobbrapport",
      "usa-i-fokus-4-november-2026-wall-street-amd-val-qualcomm",
      "usa-i-fokus-1-november-2026-veckan-som-kommer-jobb-ai-rapporter",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Den amerikanska kontantmarknaden är stängd på lördagen. Den senaste verifierade sessionen är fredagens handel, då S&P 500 steg 0,31 procent och Nasdaq Composite 1,1 procent, medan Dow Jones föll 0,46 procent.",
    "Rekylen kom efter torsdagens kraftiga tekniknedgång. Halvledaraktier återhämtade sig, men Nasdaq avslutade ändå sin fjärde raka förlustvecka och samtliga tre stora USA-index föll sett över hela veckan.",
    "Veckans öppna fråga om arbetsmarknaden fick samtidigt ett tydligt svar: USA:s sysselsättning utanför jordbrukssektorn ökade med 165 000 personer i oktober och arbetslösheten var 4,1 procent.",
  ],
  sections: [
    {
      heading: "Fredagsrekylen räckte inte för att vända veckan",
      paragraphs: [
        "Tekniksektorn ledde fredagens återhämtning. Philadelphia Semiconductor Index steg 4,2 procent efter torsdagens kraftiga fall, medan bland andra Nvidia och AMD återhämtade delar av veckans nedgångar.",
        "Trots fredagens uppgång för S&P 500 och Nasdaq slutade Dow Jones, S&P 500 och Nasdaq veckan på minus. Nasdaq noterade därmed en fjärde rak förlustvecka.",
        "Det gör fredagens rörelse till en rekyl i ett fortsatt pressat veckoläge, inte ett bevis på att oron kring värderingar, AI-investeringar och reglering är borta.",
      ],
    },
    {
      heading: "Jobbrapporten överraskade uppåt",
      paragraphs: [
        "Bureau of Labor Statistics rapporterade att antalet sysselsatta utanför jordbrukssektorn ökade med 165 000 i oktober. Arbetslösheten var 4,1 procent och antalet arbetslösa uppgick till 7,1 miljoner.",
        "Augusti och september reviderades tillsammans upp med 84 000 jobb. Septemberutfallet höjdes till 60 000 från tidigare rapporterade 29 000.",
        "Den genomsnittliga timlönen steg 0,4 procent under månaden och 3,1 procent jämfört med ett år tidigare. Det ger Federal Reserve ytterligare arbetsmarknadsdata att väga mot inflationsläget.",
      ],
    },
    {
      heading: "Räntor och dollar steg efter statistiken",
      paragraphs: [
        "Efter jobbrapporten steg den amerikanska tvåårsräntan 6 baspunkter till 4,52 procent i Reuters verifierade marknadsbild. Tioårsräntan steg 3 baspunkter till 4,87 procent.",
        "Dollarindex steg samtidigt 0,7 procent till 102,22. Marknadens prissättning av sannolikheten för en räntehöjning i december ökade enligt Reuters till 78 procent från 70 procent före rapporten.",
        "Rörelserna visar att fredagens starkare arbetsmarknadsdata flyttade fokus tillbaka mot räntor och inflation, även om aktiemarknadens sektorbild förblev splittrad.",
      ],
    },
    {
      heading: "Nästa kontrollpunkt är inflationen",
      paragraphs: [
        "Bureau of Labor Statistics publicerar konsumentprisindex för oktober på tisdag den 10 november klockan 08.30 amerikansk östkusttid, motsvarande klockan 14.30 svensk tid.",
        "Samma tid publiceras reala inkomster för oktober. Producentprisindex följer på fredag den 13 november klockan 08.30 amerikansk östkusttid.",
        "Dessa publiceringar ligger efter artikelns cutoff. Inga utfall eller marknadsreaktioner föregrips.",
      ],
    },
  ],
  sources: [
    {
      text: "U.S. Bureau of Labor Statistics: officiell sysselsättningsrapport för oktober 2026, publicerad den 6 november",
      href: "https://www.bls.gov/news.release/archives/empsit_11062026.htm",
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiell publiceringskalender för november 2026",
      href: "https://www.bls.gov/schedule/2026/11_sched_list.htm",
    },
    {
      text: "New York Stock Exchange: officiell marknadsöversikt och stängningsnivåer den 6 november 2026",
      href: "https://www.nyse.com/index?trk=public_post_reshare-text",
    },
    {
      text: "Reuters: jobbrapportens omedelbara reaktion i amerikanska räntor, dollar och index den 6 november 2026",
      href: "https://www.reuters.com/business/view-strong-october-jobs-report-sends-yields-higher-2026-11-06/",
    },
    {
      text: "Reuters via Fidelity: fredagens USA-stängning och Nasdaqs fjärde raka förlustvecka den 6 november 2026",
      href: "https://www.fidelity.com/news/article/us-markets/202611061602RTRSNEWSCOMBINED_L6N46N1AI_1",
    },
  ],
};
