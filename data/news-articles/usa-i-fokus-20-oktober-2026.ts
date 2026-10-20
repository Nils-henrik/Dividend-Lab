import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 20 oktober 2026.
 * Editorial research cutoff: 2026-10-20T14:01:08+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://investor.gm.com/static-files/c79ce1e6-c1f9-41cc-b503-1b98e1dbdfb2
 * P0_SOURCE[primary]: https://ir.halliburton.com/news-releases/news-release-details/halliburton-announces-third-quarter-2026-results
 * P0_SOURCE[primary]: https://investors.3m.com/news-events/press-releases/detail/1946/3m-reports-third-quarter-2026-results-raises-full-year-eps
 * P0_SOURCE[primary]: https://ir.netflix.net/investor-news-and-events/financial-releases/press-release-details/2026/Netflix-to-Announce-Third-Quarter-2026-Financial-Results/default.aspx
 * P0_SOURCE[secondary]: https://www.reuters.com/world/asia-pacific/nasdaq-futures-dip-oil-prices-climb-earnings-loom-2026-10-20/
 */
export const USA_I_FOKUS_20_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-20-oktober-2026-gm-halliburton-3m-netflix",
  slug: "usa-i-fokus-20-oktober-2026-gm-halliburton-3m-netflix",
  title: "USA i fokus 20 oktober: Nasdaqterminen faller när oljan stiger",
  summary:
    "Nasdaq 100-terminen backar 0,62 procent inför Wall Streets öppning när oljepriset stiger och AI-aktier åter pressas. GM, Halliburton och 3M har rapporterat, medan Netflix står näst på tur efter stängning.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-20T14:01:08+02:00",
  url: "/news/usa-i-fokus-20-oktober-2026-gm-halliburton-3m-netflix",
  featured: true,
  readingMinutes: 5,
  seoTitle: "USA i fokus: Nasdaq faller – GM och Halliburton rapporterar",
  seoDescription:
    "Wall Street idag: Nasdaq 100-terminen faller när oljan stiger. GM, Halliburton och 3M har rapporterat före Netflix rapport efter stängning.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "Nasdaq terminer",
    "USA börsen 20 oktober 2026",
    "General Motors rapport",
    "Halliburton rapport",
    "3M rapport",
    "Netflix rapport",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "Nasdaq",
      "oljepris",
      "artificiell intelligens",
      "rapportperiod",
    ],
    companies: ["General Motors", "Halliburton", "3M", "Netflix"],
    tickers: ["GM", "HAL", "MMM", "NFLX"],
    relatedNewsSlugs: [
      "usa-i-fokus-19-oktober-2026-nasdaq-ai-olja-rapporter",
      "usa-i-fokus-18-oktober-2026-veckan-som-kommer-netflix-tesla-ibm",
      "borssverige-20-oktober-2026",
      "norden-i-centrum-20-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Tisdagens amerikanska förhandel visar att måndagens teknikstuds inte höll i sig fullt ut. Vid Reuters tidsstämplade marknadsbild klockan 07.06 östkusttid var Nasdaq 100-terminen ned 0,62 procent och S&P 500-terminen ned 0,20 procent. Dow-terminen var samtidigt upp 0,06 procent.",
    "Oljepriset låg nära den högsta nivån på fem månader, samtidigt som flera AI-relaterade aktier föll i förhandeln. Dagens bolagsflöde är samtidigt tungt: General Motors, Halliburton och 3M har publicerat kvartalssiffror, medan Netflix rapporterar efter börsstängning.",
  ],
  sections: [
    {
      heading: "Måndagens AI-studs möter nytt motstånd",
      paragraphs: [
        "Måndagens öppna fråga var om återhämtningen i AI-relaterade aktier skulle hålla. Nasdaq steg 1,11 procent i går och halvledarindexet bröt en åtta dagar lång nedgång, men tisdagens förhandel ger ett mer försiktigt svar.",
        "CoreWeave föll 4,7 procent och Nebius 4,9 procent i Reuters senaste verifierade förhandelsbild. Apple var ned 1,2 procent, medan Nvidia handlades svagt lägre. Rörelserna är ögonblicksbilder före kontanthandelns öppning och kan ändras snabbt.",
        "Samtidigt låg Brentoljan nära en femmånadershögsta. Det ger en tydligare kostnads- och inflationsrisk i bakgrunden, utan att oljan ensam kan förklara hela nedgången i teknikterminerna.",
      ],
    },
    {
      heading: "GM lyfter resultatet men aktien backar före öppning",
      paragraphs: [
        "General Motors redovisade intäkter på 50,0 miljarder dollar i tredje kvartalet, 2,9 procent mer än ett år tidigare. Nettoresultatet hänförligt till aktieägarna var 3,3 miljarder dollar och justerat EBIT 4,1 miljarder dollar.",
        "Justerad vinst per aktie steg till 3,70 dollar från 2,80 dollar. Bolaget snävade samtidigt in prognosen för justerat EBIT 2026 till 14,5–15,5 miljarder dollar och höjde den nedre delen av intervallet för justerat fritt kassaflöde från bilverksamheten till 11,5 miljarder dollar.",
        "Styrelsen godkände dessutom ett nytt flerårigt återköpsprogram på 20 miljarder dollar. Trots att Reuters beskrev resultatet som bättre än förväntat var GM-aktien ned 5,2 procent i förhandeln. Artikeln tillskriver inte rörelsen en enskild orsak.",
      ],
    },
    {
      heading: "Halliburton stärks efter Q3 – 3M höjer prognosen",
      paragraphs: [
        "Halliburton rapporterade intäkter på 5,7 miljarder dollar och en justerad vinst per aktie på 0,60 dollar. Den justerade rörelsemarginalen var 12,8 procent och det fria kassaflödet 156 miljoner dollar.",
        "Bolaget uppgav att den internationella omsättningen ökade 3 procent från föregående kvartal, medan Nordamerika minskade 5 procent. Halliburton steg 5,7 procent i Reuters verifierade förhandel efter att kvartalsvinsten överträffat marknadens förväntningar.",
        "3M redovisade en omsättning på 6,6 miljarder dollar, justerad vinst per aktie på 2,50 dollar och en justerad rörelsemarginal på 26,2 procent. Bolaget höjde prognosen för justerad helårsvinst per aktie till 9,10–9,15 dollar. Aktien var upp 0,5 procent i förhandeln.",
      ],
    },
    {
      heading: "Netflix blir kvällens stora test",
      paragraphs: [
        "Netflix publicerar resultat och affärsutsikter för tredje kvartalet omkring klockan 13.01 Stillahavstid, motsvarande cirka 22.01 svensk tid. Ledningens videointervju börjar omkring klockan 22.45 svensk tid.",
        "Rapporten kommer efter artikelns research-cutoff och efter den ordinarie USA-handeln. Inga siffror, utsikter eller kursreaktioner föregrips.",
        "Efter en vecka med stora rörelser i teknik och AI blir Netflix nästa tydliga kontrollpunkt för investerarnas vilja att betala för tillväxt. Det är DivLabs redaktionella bedömning; utfallet måste verifieras separat efter publiceringen.",
      ],
    },
    {
      heading: "Det här bevakar Wall Street efter cutoff",
      paragraphs: [
        "Kontanthandeln öppnar klockan 15.30 svensk tid. Först då går det att se om förhandelns nedgång i Nasdaq består, hur rapportbolagen faktiskt handlas och om det höga oljepriset får bredare genomslag i indexen.",
        "General Motors håller sin rapportkonferens klockan 14.30 svensk tid och Halliburtons samtal börjar klockan 15.00. Båda tidpunkterna ligger efter research-cutoff och eventuella nya besked därifrån ingår därför inte.",
        "Efter stängning flyttas fokus till Netflix. Onsdagens rapporter från Tesla och IBM blir nästa steg i veckans test av tekniksektorn.",
      ],
    },
  ],
  sources: [
    {
      text: "General Motors Investor Relations: officiellt Q3-utfall, uppdaterad helårsprognos och nytt återköpsprogram, publicerat 20 oktober 2026",
      href: "https://investor.gm.com/static-files/c79ce1e6-c1f9-41cc-b503-1b98e1dbdfb2",
    },
    {
      text: "Halliburton Investor Relations: officiellt Q3-utfall, marginaler, kassaflöde och regional utveckling, publicerat 20 oktober 2026",
      href: "https://ir.halliburton.com/news-releases/news-release-details/halliburton-announces-third-quarter-2026-results",
    },
    {
      text: "3M Investor Relations: officiellt Q3-utfall och höjd helårsprognos, publicerat 20 oktober 2026",
      href: "https://investors.3m.com/news-events/press-releases/detail/1946/3m-reports-third-quarter-2026-results-raises-full-year-eps",
    },
    {
      text: "Netflix Investor Relations: officiellt schema för Q3-resultat och ledningsintervju den 20 oktober 2026",
      href: "https://ir.netflix.net/investor-news-and-events/financial-releases/press-release-details/2026/Netflix-to-Announce-Third-Quarter-2026-Financial-Results/default.aspx",
    },
    {
      text: "Reuters: tidsstämplad USA-terminsbild, oljepris och verifierade förhandelsrörelser den 20 oktober 2026",
      href: "https://www.reuters.com/world/asia-pacific/nasdaq-futures-dip-oil-prices-climb-earnings-loom-2026-10-20/",
    },
  ],
};
