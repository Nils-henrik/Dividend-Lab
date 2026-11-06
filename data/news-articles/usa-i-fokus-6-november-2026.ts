import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 6 november 2026.
 * Editorial research cutoff: 2026-11-06T14:06:56+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://humana.gcs-web.com/news-releases/news-release-details/humana-reports-third-quarter-2026-financial-results-raises-full
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/news_release/empSit.htm
 * P0_SOURCE[secondary]: https://www.reuters.com/business/nasdaq-futures-rise-after-steep-ai-selloff-chip-stocks-stabilize-2026-11-06/
 */
export const USA_I_FOKUS_6_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-6-november-2026-nasdaq-humana-jobbrapport",
  slug: "usa-i-fokus-6-november-2026-nasdaq-humana-jobbrapport",
  title: "USA i fokus 6 november: Nasdaq studsar – Humana höjer prognosen",
  summary:
    "Nasdaq 100-terminen stiger efter torsdagens AI-ledda ras. Humana höjer helårsprognosen, medan marknaden väntar på USA:s jobbrapport före öppningen.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-06T14:06:56+01:00",
  url: "/news/usa-i-fokus-6-november-2026-nasdaq-humana-jobbrapport",
  featured: true,
  readingMinutes: 5,
  seoTitle: "Nasdaq idag: AI-aktier studsar inför jobbrapporten",
  seoDescription:
    "Nasdaq 100-terminen stiger efter teknikraset. Humana höjer prognosen och USA:s jobbrapport publiceras före Wall Streets öppning.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "Nasdaq 100 terminer",
    "S&P 500 terminer",
    "Nvidia aktie",
    "Humana rapport",
    "USA jobbrapport",
    "AI aktier",
  ],
  internalLinking: {
    topics: ["Wall Street", "USA-terminer", "Nasdaq 100", "S&P 500", "rapportperiod", "artificiell intelligens", "halvledare", "USA arbetsmarknad"],
    companies: ["Nvidia", "AMD", "Intel", "Broadcom", "Micron", "Humana", "Airbnb", "Atlassian"],
    tickers: ["NVDA", "AMD", "INTC", "AVGO", "MU", "HUM", "ABNB", "TEAM"],
    relatedNewsSlugs: [
      "usa-i-fokus-5-november-2026-nasdaq-qualcomm-uber-jobbrapport",
      "usa-i-fokus-4-november-2026-wall-street-amd-val-qualcomm",
      "usa-i-fokus-2-november-2026-wall-street-estee-lauder-apple-palantir",
      "usa-i-fokus-1-november-2026-veckan-som-kommer-jobb-ai-rapporter",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Nasdaq går mot en tydlig rekyl efter torsdagens teknikras. Vid Reuters senaste verifierade mätpunkt steg Nasdaq 100-terminen 1,41 procent och S&P 500-terminen 0,29 procent, medan Dow-terminen föll 0,91 procent.",
    "Torsdagens AI-ledda försäljning raderade nära 3 biljoner dollar i marknadsvärde för bolagen i S&P 500. Nasdaq Composite noterade sin största dagsnedgång på 19 månader och gick in i korrektionsfas.",
    "I förhandeln återhämtades flera av de hårdast pressade halvledaraktierna. Samtidigt höjde Humana sin helårsprognos, medan den amerikanska jobbrapporten återstår efter artikelns cutoff.",
  ],
  sections: [
    {
      heading: "Halvledare studsar efter torsdagens ras",
      paragraphs: [
        "Nvidia steg 4,5 procent i Reuters senaste premarketbild efter sin svagaste handelsdag sedan januari 2025. AMD, Intel, Broadcom och Micron steg mellan 4,6 och 8,2 procent.",
        "Även flera datacenteroperatörer, AI-infrastrukturbolag och kraftleverantörer återhämtade delar av torsdagens djupa nedgångar. Rekylen följer dock på en mycket svag session och visar ännu inte att marknadens oro kring AI-investeringar och reglering är borta.",
        "S&P 500 var samtidigt på väg mot sin svagaste börsvecka sedan mars 2025. Den positiva Nasdaq-terminen ska därför ses mot ett fortsatt pressat veckoläge.",
      ],
    },
    {
      heading: "Humana höjer helårsprognosen",
      paragraphs: [
        "Humana redovisade en vinst per aktie på 1,33 dollar för tredje kvartalet. På justerad basis blev resultatet en förlust på 0,70 dollar per aktie.",
        "Försäkringssegmentets redovisade kostnadskvot för vårdförmåner var 93,7 procent, vilket var bättre än bolagets egen tidigare vägledning om strax över 94 procent.",
        "Bolaget höjde prognosen för justerad vinst per aktie 2026 till minst 9,50 dollar från minst 9,00 dollar. Den redovisade prognosen höjdes samtidigt till minst 15,09 dollar per aktie från minst 6,52 dollar, där värderingsjusteringar påverkar jämförelsen.",
      ],
    },
    {
      heading: "Bredden är fortsatt ojämn",
      paragraphs: [
        "Dow-terminens nedgång på 0,91 procent går i motsatt riktning mot Nasdaq-rekylen. Det visar att fredagens återhämtning främst drivs av teknik- och tillväxtaktier snarare än av hela marknaden.",
        "Airbnb steg 12,2 procent i förhandeln efter att bolaget höjt sin prognos för intäktstillväxten 2026. Atlassian föll samtidigt 14,1 procent efter sin kvartalsrapport.",
        "Oljepriset var i stort sett oförändrat på fredagen men låg fortsatt på väg mot en kraftig veckonedgång. Energisektorn i S&P 500 var enligt Reuters på väg mot ett veckofall på mer än 11 procent.",
      ],
    },
    {
      heading: "Jobbrapporten kommer före öppningen",
      paragraphs: [
        "Bureau of Labor Statistics publicerar sysselsättningsrapporten för oktober klockan 08.30 amerikansk östkusttid, motsvarande klockan 14.30 svensk tid.",
        "Publiceringen ligger efter artikelns research-cutoff men före Wall Streets ordinarie öppning. Rapporten ger nya besked om sysselsättning, arbetslöshet och löneutveckling och kan påverka marknadens ränteförväntningar.",
        "Inget utfall från jobbrapporten och ingen efterföljande marknadsreaktion anges i förväg.",
      ],
    },
  ],
  sources: [
    {
      text: "Humana Investor Relations: officiellt resultat för tredje kvartalet och höjd helårsprognos den 6 november 2026",
      href: "https://humana.gcs-web.com/news-releases/news-release-details/humana-reports-third-quarter-2026-financial-results-raises-full",
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiell publiceringstid för sysselsättningsrapporten för oktober 2026",
      href: "https://www.bls.gov/schedule/news_release/empSit.htm",
    },
    {
      text: "Reuters: aktuell terminsbild, AI-sektorns rekyl och marknadsläget inför Wall Street den 6 november 2026",
      href: "https://www.reuters.com/business/nasdaq-futures-rise-after-steep-ai-selloff-chip-stocks-stabilize-2026-11-06/",
    }
  ],
};
