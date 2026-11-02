import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 2 november 2026.
 * Editorial research cutoff: 2026-11-02T14:01:51+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.elcompanies.com/en/news-and-media/newsroom/press-releases/2026/11-02-2026-110046663
 * P0_SOURCE[primary]: https://investors.palantir.com/news-details/2026/Palantir-Announces-Date-of-Third-Quarter-2026-Earnings-Release-and-Webcast/
 * P0_SOURCE[primary]: https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/?trk=article-ssr-frontend-pulse_little-text-block
 * P0_SOURCE[secondary]: https://www.reuters.com/business/media-telecom/wall-street-futures-rise-ai-stocks-catch-their-breath-midterms-focus-2026-11-02/
 */
export const USA_I_FOKUS_2_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-2-november-2026-wall-street-estee-lauder-apple-palantir",
  slug: "usa-i-fokus-2-november-2026-wall-street-estee-lauder-apple-palantir",
  title: "USA i fokus 2 november: Wall Street studsar – Estée Lauder höjer prognosen",
  summary:
    "USA-terminerna stiger efter fredagens teknikras och oljepriset faller. Estée Lauder höjer helårsprognosen, medan Apple och Palantir rapporterar efter stängning.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-02T14:01:51+01:00",
  url: "/news/usa-i-fokus-2-november-2026-wall-street-estee-lauder-apple-palantir",
  featured: true,
  readingMinutes: 5,
  seoTitle: "Wall Street idag: Estée Lauder höjer prognosen",
  seoDescription:
    "USA-terminerna stiger inför börsöppningen. Estée Lauder höjer prognosen och Apple samt Palantir rapporterar efter stängning.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "S&P 500 terminer",
    "Nasdaq 100 terminer",
    "Estée Lauder rapport",
    "Apple rapport",
    "Palantir rapport",
    "ISM industriindex",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "S&P 500",
      "Nasdaq 100",
      "rapportperiod",
      "artificiell intelligens",
      "olja",
      "USA industri",
    ],
    companies: ["Estée Lauder", "Apple", "Palantir", "Intel", "Alphabet"],
    tickers: ["EL", "AAPL", "PLTR", "INTC", "GOOGL"],
    relatedNewsSlugs: [
      "usa-i-fokus-1-november-2026-veckan-som-kommer-jobb-ai-rapporter",
      "usa-i-fokus-25-oktober-2026-veckan-som-kommer-fed-bnp-alphabet-amazon",
      "usa-i-fokus-24-oktober-2026-veckan-som-gatt-teknik-olja",
      "norden-i-centrum-2-november-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en högre öppning efter fredagens kraftiga teknikfall. Vid Reuters senaste verifierade mätpunkt var Dow-terminen upp 0,49 procent, S&P 500-terminen upp 0,46 procent och Nasdaq 100-terminen upp 0,74 procent.",
    "Gårdagens fråga om tekniksektorn får därmed en första, men inte slutgiltig, uppföljning: de stora tillväxtaktierna återhämtar sig i förhandeln, samtidigt som Intel fortsätter ned efter fredagens ras och svaga utsikter. Apple och Palantir lämnar nya rapportsvar först efter dagens stängning.",
    "Utanför tekniksektorn har Estée Lauder redan publicerat ett tydligt utfall med högre försäljning, förbättrad vinst och höjd helårsprognos. Oljepriset faller samtidigt mer än 4 procent, vilket ger marknaden en ny energipunkt att väga mot räntor och bolagsvinster.",
  ],
  sections: [
    {
      heading: "Estée Lauder höjer helårsprognosen",
      paragraphs: [
        "Estée Lauders redovisade nettoomsättning ökade 7 procent till 3,72 miljarder dollar under det första kvartalet i räkenskapsåret 2027. Den organiska försäljningen steg 6 procent.",
        "Den justerade vinsten per aktie ökade till 0,72 dollar från 0,32 dollar ett år tidigare. Hudvårdsförsäljningen steg 4 procent och doftkategorin växte 20 procent, medan den redovisade rörelsevinsten ökade till 408 miljoner dollar från 169 miljoner.",
        "Bolaget höjde prognosen för organisk helårstillväxt till 4,0–5,5 procent från tidigare 3–5 procent. Prognosen för justerad vinst per aktie höjdes till 3,20–3,45 dollar från 3,10–3,35 dollar. Aktien steg 2,6 procent i Reuters senaste premarketbild.",
      ],
    },
    {
      heading: "Teknikterminerna studsar efter fredagens ras",
      paragraphs: [
        "Nasdaq 100-terminens uppgång på 0,74 procent kommer efter att oro för AI-investeringarnas avkastning pressade tekniksektorn hårt på fredagen. Reuters uppger att Nasdaq 100 förlorade mer än 2,5 biljoner dollar i marknadsvärde under oktober.",
        "Intel föll ytterligare omkring 1 procent i förhandeln efter att bolaget redovisat sin svagaste handelsdag sedan 1980-talet på fredagen. Bolagets prognos låg under marknadens förväntningar och ledningen räknar inte med positivt kassaflöde i år.",
        "Samtidigt föll oljepriset mer än 4 procent. Artikeln tillskriver inte terminsuppgången en enskild orsak, men konstaterar att både teknikaktiernas utgångsläge och energipriset förbättrades inför öppningen.",
      ],
    },
    {
      heading: "Apple och Palantir rapporterar efter stängning",
      paragraphs: [
        "Apple och Palantir publicerar kvartalsresultat efter den amerikanska börsens stängning. Apple handlades 0,4 procent lägre i Reuters senaste premarketbild inför sin rapport.",
        "Palantirs officiella investerarkalender anger att resultatet för tredje kvartalet publiceras efter stängning och att webcasten börjar klockan 17.00 amerikansk östkusttid, motsvarande klockan 23.00 svensk tid.",
        "Rapporterna får visa om försäljning, kassaflöde och guidning kan möta de höga förväntningarna på teknik- och AI-bolag. Inga rapportutfall eller efterföljande kursreaktioner föregrips.",
      ],
    },
    {
      heading: "ISM blir nästa kontrollpunkt efter öppning",
      paragraphs: [
        "Institute for Supply Management publicerar sitt amerikanska industriindex för oktober klockan 10.00 amerikansk östkusttid, motsvarande klockan 16.00 svensk tid. Publiceringen ligger efter artikelns research-cutoff och efter Wall Streets ordinarie öppning.",
        "Indexet ger en färsk bild av aktivitet, orderingång, sysselsättning och priser i tillverkningsindustrin. Utfallet blir därför dagens viktigaste bekräftade makropunkt efter öppningen.",
        "Inget ISM-utfall eller någon marknadsreaktion anges i förväg. Efter cutoff bevakas även om terminsuppgången och Estée Lauders premarketreaktion består i kontanthandeln.",
      ],
    },
  ],
  sources: [
    {
      text: "Estée Lauder Companies: officiellt resultat, segmentutveckling och höjd helårsprognos den 2 november 2026",
      href: "https://www.elcompanies.com/en/news-and-media/newsroom/press-releases/2026/11-02-2026-110046663",
    },
    {
      text: "Palantir Investor Relations: officiell tid för Q3-resultat och webcast den 2 november 2026",
      href: "https://investors.palantir.com/news-details/2026/Palantir-Announces-Date-of-Third-Quarter-2026-Earnings-Release-and-Webcast/",
    },
    {
      text: "Institute for Supply Management: officiell kalender för industri-PMI den 2 november 2026",
      href: "https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/?trk=article-ssr-frontend-pulse_little-text-block",
    },
    {
      text: "Reuters: aktuell terminsbild, oljepris, Estée Lauder och tekniksektorn inför Wall Street den 2 november 2026",
      href: "https://www.reuters.com/business/media-telecom/wall-street-futures-rise-ai-stocks-catch-their-breath-midterms-focus-2026-11-02/",
    },
  ],
};
