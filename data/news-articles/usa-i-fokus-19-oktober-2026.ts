import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 19 oktober 2026.
 * Editorial research cutoff: 2026-10-19T14:00:49+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://ir.steeldynamics.com/steel-dynamics-announces-third-quarter-2026-earnings-conference-call-and-webcast/
 * P0_SOURCE[primary]: https://ir.halliburton.com/news-releases/news-release-details/halliburton-third-quarter-2026-earnings-conference-call
 * P0_SOURCE[primary]: https://ir.netflix.net/investor-news-and-events/financial-releases/press-release-details/2026/Netflix-to-Announce-Third-Quarter-2026-Financial-Results/default.aspx
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-st-futures-climb-ai-stocks-rebound-oil-yields-fall-2026-10-19/
 */
export const USA_I_FOKUS_19_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-19-oktober-2026-nasdaq-ai-olja-rapporter",
  slug: "usa-i-fokus-19-oktober-2026-nasdaq-ai-olja-rapporter",
  title: "USA i fokus 19 oktober: Nasdaqterminen stiger när AI-aktier studsar",
  summary:
    "Nasdaq 100-terminen stiger 1,05 procent inför Wall Streets öppning när AI-relaterade aktier återhämtar sig. Lägre olja och räntor ger stöd, medan Steel Dynamics rapporterar efter stängning.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-19T14:00:49+02:00",
  url: "/news/usa-i-fokus-19-oktober-2026-nasdaq-ai-olja-rapporter",
  featured: true,
  readingMinutes: 5,
  seoTitle: "USA i fokus: Nasdaqterminen stiger inför rapporter",
  seoDescription:
    "Wall Street idag: Nasdaq 100-terminen stiger 1,05 procent när AI-aktier återhämtar sig. Steel Dynamics rapporterar efter stängning.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "Nasdaq terminer",
    "USA börsen 19 oktober 2026",
    "AI aktier",
    "Steel Dynamics rapport",
    "Netflix rapport",
    "Halliburton rapport",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "Nasdaq",
      "artificiell intelligens",
      "statsräntor",
      "oljepris",
      "rapportperiod",
    ],
    companies: ["CoreWeave", "Steel Dynamics", "Netflix", "Halliburton"],
    tickers: ["CRWV", "STLD", "NFLX", "HAL"],
    relatedNewsSlugs: [
      "usa-i-fokus-18-oktober-2026-veckan-som-kommer-netflix-tesla-ibm",
      "usa-i-fokus-16-oktober-2026-ppi-detaljhandel-tech",
      "borssverige-19-oktober-2026",
      "norden-i-centrum-19-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en försiktig teknikledd återhämtning efter fredagens breda nedgång. Vid Reuters verifierade ögonblicksbild klockan 07.05 östkusttid steg Nasdaq 100-terminen 1,05 procent och S&P 500-terminen 0,47 procent. Dow-terminen var samtidigt ned 0,14 procent.",
    "Söndagens USA i fokus ställde frågan om tekniksektorn kunde stabiliseras. Måndagens förhandel ger ett första, begränsat svar: AI-relaterade aktier studsar upp, men rörelserna sker före kontanthandelns öppning och är inget slutresultat.",
  ],
  sections: [
    {
      heading: "AI-aktier återhämtar en del av fredagens fall",
      paragraphs: [
        "CoreWeave steg 3,4 procent i förhandeln efter att aktien tappat mer än 25 procent under föregående vecka. Uppgången kommer efter att finansieringen av stora AI-investeringar blivit en tydligare riskfråga för tekniksektorn.",
        "Nasdaq och S&P 500 hade på fredagen sina svagaste veckor sedan slutet av juni. Måndagens terminsuppgång ska därför läsas som en inledande återhämtning, inte som att förra veckans oro redan är borta.",
        "Den viktiga kontrollpunkten efter öppningen klockan 15.30 svensk tid är om uppgången håller när kontanthandeln börjar och om styrkan breddas bortom de mest pressade AI-aktierna.",
      ],
    },
    {
      heading: "Lägre olja och ränta ger stöd",
      paragraphs: [
        "Brentoljan var ned 1,3 procent till omkring 108,5 dollar per fat i Reuters senaste verifierade marknadsbild. Den amerikanska tioårsräntan sjönk samtidigt till 5,0812 procent.",
        "Både oljan och räntan ligger fortfarande på nivåer som kan påverka bolagens kostnader och värderingen av framtida vinster. Dagens nedgångar minskar däremot det omedelbara trycket jämfört med fredagen.",
        "Det går inte att slå fast att dessa två rörelser ensamma orsakar terminsuppgången. De utgör stödjande marknadskontext samtidigt som teknikaktierna försöker återhämta sig.",
      ],
    },
    {
      heading: "Steel Dynamics rapporterar efter stängning",
      paragraphs: [
        "Steel Dynamics publicerar resultatet för tredje kvartalet efter USA-börsens stängning måndagen den 19 oktober. Bolagets rapportkonferens börjar tisdagen den 20 oktober klockan 11.00 östkusttid, motsvarande 17.00 svensk tid.",
        "Rapporten blir dagens tydligaste bekräftade bolagskatalysator efter kontanthandeln. DivLabs redaktionella bevakningspunkter är utvecklingen inom stål, metallåtervinning och bolagets utsikter, men inga siffror eller kursreaktioner föregrips.",
        "Eftersom rapporten kommer efter artikelns cutoff och efter börsstängning kan utfallet först beskrivas när bolagets material har publicerats och faktakontrollerats.",
      ],
    },
    {
      heading: "Netflix och Halliburton står på tisdagens schema",
      paragraphs: [
        "Netflix publicerar Q3-resultat och affärsutsikter tisdagen den 20 oktober omkring klockan 13.01 Stillahavstid, cirka 22.01 svensk tid. Ledningens videointervju börjar klockan 13.45 Stillahavstid, cirka 22.45 svensk tid.",
        "Halliburton publicerar sin Q3-rapport före konferenssamtalet samma dag. Samtalet börjar klockan 08.00 central tid, motsvarande klockan 15.00 svensk tid.",
        "Netflix blir ett test av digital konsumenttillväxt och lönsamhet, medan Halliburton ger en ny datapunkt för energisektorn. Det är DivLabs redaktionella prioritering; de faktiska resultaten och marknadsreaktionerna är ännu okända.",
      ],
    },
    {
      heading: "Det här bevakar Wall Street efter cutoff",
      paragraphs: [
        "Kontanthandeln öppnar klockan 15.30 svensk tid. Därefter blir det möjligt att verifiera om Nasdaqs förhandelsstyrka håller, hur CoreWeave och övriga AI-relaterade aktier faktiskt handlas och om lägre räntor ger bredare stöd.",
        "Efter stängning flyttas fokus till Steel Dynamics. På tisdagen följer Halliburton under eftermiddagen svensk tid och Netflix efter den amerikanska börsstängningen.",
        "Alla kommande tider är verifierade mot bolagens egna investerarsidor. Artikeln innehåller inga påstådda utfall eller kursreaktioner efter research-cutoff.",
      ],
    },
  ],
  sources: [
    {
      text: "Steel Dynamics Investor Relations: officiellt schema för Q3-resultat efter börsstängning den 19 oktober och konferenssamtal den 20 oktober 2026",
      href: "https://ir.steeldynamics.com/steel-dynamics-announces-third-quarter-2026-earnings-conference-call-and-webcast/",
    },
    {
      text: "Halliburton Investor Relations: officiellt schema för Q3-resultat och konferenssamtal den 20 oktober 2026",
      href: "https://ir.halliburton.com/news-releases/news-release-details/halliburton-third-quarter-2026-earnings-conference-call",
    },
    {
      text: "Netflix Investor Relations: officiellt schema för Q3-resultat, affärsutsikter och ledningsintervju den 20 oktober 2026",
      href: "https://ir.netflix.net/investor-news-and-events/financial-releases/press-release-details/2026/Netflix-to-Announce-Third-Quarter-2026-Financial-Results/default.aspx",
    },
    {
      text: "Reuters: tidsstämplad USA-terminsbild, AI-relaterad förhandel, Brentolja och amerikansk tioårsränta den 19 oktober 2026",
      href: "https://www.reuters.com/business/wall-st-futures-climb-ai-stocks-rebound-oil-yields-fall-2026-10-19/",
    },
  ],
};
