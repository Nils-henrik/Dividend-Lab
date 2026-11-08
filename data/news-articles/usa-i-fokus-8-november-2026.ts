import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 8 november 2026.
 * Editorial research cutoff: 2026-11-08T14:02:32+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/11_sched_list.htm
 * P0_SOURCE[primary]: https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-report-fourth-quarter-and-fiscal-2026-results
 * P0_SOURCE[primary]: https://investors.coreweave.com/news/news-details/2026/CoreWeave-Announces-Date-of-Third-Quarter-2026-Financial-Results-and-Conference-Call/default.aspx
 * P0_SOURCE[primary]: https://investor.cisco.com/news/news-details/2026/Cisco-Schedules-Conference-Call-for-Q1-Fiscal-Year-2027-Financial-Results/default.aspx
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-week-ahead-tech-swoon-roils-market-us-inflation-data-tap-2026-11-06/
 */
export const USA_I_FOKUS_8_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-8-november-2026-veckan-som-kommer-inflation-ai",
  slug: "usa-i-fokus-8-november-2026-veckan-som-kommer-inflation-ai",
  title: "USA i fokus – Veckan som kommer: Inflationen testar AI-pressad Nasdaq",
  summary:
    "USA:s KPI blir veckans första stora test efter den starka jobbrapporten. CoreWeave, Cisco och Applied Materials sätter samtidigt AI-investeringar och halvledare i centrum.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-08T14:02:32+01:00",
  url: "/news/usa-i-fokus-8-november-2026-veckan-som-kommer-inflation-ai",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-08.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-08.png",
  imageAlt: "USA i fokus 2026-11-08 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 5,
  seoTitle: "Wall Street veckan: USA-inflation och AI-rapporter",
  seoDescription:
    "USA:s KPI och PPI samt rapporter från CoreWeave, Cisco och Applied Materials står i fokus för Wall Street veckan 9–13 november.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street veckan",
    "USA inflation",
    "USA KPI",
    "USA PPI",
    "CoreWeave rapport",
    "Cisco rapport",
    "Applied Materials rapport",
    "Nasdaq veckan",
    "Federal Reserve",
  ],
  internalLinking: {
    topics: ["Wall Street", "Nasdaq Composite", "S&P 500", "USA inflation", "Federal Reserve", "artificiell intelligens", "datacenter", "halvledare", "rapportperiod"],
    companies: ["CoreWeave", "Cisco", "Applied Materials"],
    tickers: ["CRWV", "CSCO", "AMAT"],
    relatedNewsSlugs: [
      "usa-i-fokus-7-november-2026-veckan-som-gatt-jobb-ai",
      "usa-i-fokus-6-november-2026-nasdaq-humana-jobbrapport",
      "usa-i-fokus-5-november-2026-nasdaq-qualcomm-uber-jobbrapport",
      "usa-i-fokus-1-november-2026-veckan-som-kommer-jobb-ai-rapporter",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Den amerikanska kontantmarknaden är stängd på söndagen. Den senaste verifierade sessionen är fredagens handel, då teknikaktier återhämtade delar av torsdagens kraftiga nedgång men de stora USA-indexen ändå avslutade veckan på minus.",
    "Fredagens starka jobbrapport gav ett svar på förra veckans arbetsmarknadsfråga och flyttar nu fokus till inflationen. Konsumentprisindex för oktober publiceras på tisdag och producentprisindex följer på fredag.",
    "Rapportveckan är lugnare än den föregående, men CoreWeave, Cisco och Applied Materials blir viktiga kontrollpunkter för finansieringen av AI-infrastruktur, nätverksinvesteringar och halvledarsektorns efterfrågan.",
  ],
  sections: [
    {
      heading: "Tisdagens KPI blir veckans första stora test",
      paragraphs: [
        "Bureau of Labor Statistics publicerar konsumentprisindex för oktober på tisdag den 10 november klockan 08.30 amerikansk östkusttid, motsvarande klockan 14.30 svensk tid. Reala inkomster för oktober publiceras samtidigt.",
        "Statistiken kommer efter att sysselsättningen utanför jordbrukssektorn ökade med 165 000 i oktober och arbetslösheten var 4,1 procent. Den starkare arbetsmarknadsbilden gör inflationsutfallet centralt för marknadens bedömning av Federal Reserves nästa steg.",
        "Reuters rapporterade efter jobbsiffrorna att marknaden prissatte ungefär 80 procents sannolikhet för en räntehöjning vid mötet den 8–9 december. Det är en marknadsprissättning, inte ett besked från Federal Reserve.",
      ],
    },
    {
      heading: "CoreWeave testar förtroendet för AI-bygget",
      paragraphs: [
        "CoreWeave publicerar resultatet för tredje kvartalet på tisdag den 10 november. Bolagets telefonkonferens börjar klockan 17.00 amerikansk östkusttid, motsvarande klockan 23.00 svensk tid.",
        "Rapporten kommer efter en vecka då oro kring kostnader, finansiering och reglering av datacenter pressade AI-relaterade aktier. Därför blir bolagets kommentarer om projekt, kapacitet och finansiering särskilt relevanta för den bredare tekniksektorn.",
        "Varken rapportutfall, guidning eller kursreaktion föregrips.",
      ],
    },
    {
      heading: "Cisco och Applied Materials rapporterar på torsdag",
      paragraphs: [
        "Cisco publicerar resultatet för sitt första kvartal i räkenskapsåret 2027 efter stängning på torsdag den 12 november. Telefonkonferensen börjar klockan 16.30 amerikansk östkusttid, motsvarande klockan 22.30 svensk tid.",
        "Applied Materials håller sin resultatkonferens för fjärde kvartalet och hela räkenskapsåret 2026 på torsdag klockan 16.30 amerikansk östkusttid, motsvarande klockan 22.30 svensk tid. Tillsammans ger bolagen nya besked om företagens nätverksinvesteringar och efterfrågan på utrustning till halvledarindustrin.",
        "Rapporterna ligger efter artikelns cutoff och beskrivs därför endast som kommande katalysatorer.",
      ],
    },
    {
      heading: "PPI avslutar inflationsveckan",
      paragraphs: [
        "På fredag den 13 november publicerar BLS producentprisindex för oktober klockan 08.30 amerikansk östkusttid, motsvarande klockan 14.30 svensk tid.",
        "PPI blir veckans andra stora inflationspunkt efter tisdagens konsumentprisindex och ger ytterligare underlag om prisutvecklingen tidigare i produktionskedjan.",
        "Inga utfall från KPI, PPI eller bolagsrapporter och inga efterföljande marknadsreaktioner anges i förväg.",
      ],
    },
  ],
  sources: [
    {
      text: "U.S. Bureau of Labor Statistics: officiell publiceringskalender för KPI, reala inkomster och PPI i november 2026",
      href: "https://www.bls.gov/schedule/2026/11_sched_list.htm",
    },
    {
      text: "Applied Materials Investor Relations: officiell tid för resultatkonferensen den 12 november 2026",
      href: "https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-report-fourth-quarter-and-fiscal-2026-results",
    },
    {
      text: "CoreWeave Investor Relations: officiell tid för resultat och telefonkonferens den 10 november 2026",
      href: "https://investors.coreweave.com/news/news-details/2026/CoreWeave-Announces-Date-of-Third-Quarter-2026-Financial-Results-and-Conference-Call/default.aspx",
    },
    {
      text: "Cisco Investor Relations: officiell tid för resultat och telefonkonferens den 12 november 2026",
      href: "https://investor.cisco.com/news/news-details/2026/Cisco-Schedules-Conference-Call-for-Q1-Fiscal-Year-2027-Financial-Results/default.aspx",
    },
    {
      text: "Reuters: aktuell USA-marknadskontext och veckans inflations- och teknikrapportkatalysatorer den 6 november 2026",
      href: "https://www.reuters.com/business/wall-st-week-ahead-tech-swoon-roils-market-us-inflation-data-tap-2026-11-06/",
    },
  ],
};
