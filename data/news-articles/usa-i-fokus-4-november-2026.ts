import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 4 november 2026.
 * Editorial research cutoff: 2026-11-04T14:03:51+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://ir.amd.com/news-events/press-releases/detail/1303/amd-reports-third-quarter-2026-financial-results
 * P0_SOURCE[primary]: https://investor.qualcomm.com/news-events/press-releases/news-details/2026/Qualcomm-Schedules-Fourth-Quarter-and-Fiscal-2026-Earnings-Release-and-Conference-Call/default.aspx
 * P0_SOURCE[primary]: https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/?trk=article-ssr-frontend-pulse_little-text-block
 * P0_SOURCE[primary]: https://www.bea.gov/news/schedule/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/us-stock-index-futures-steady-democrats-seize-congress-2026-11-04/
 */
export const USA_I_FOKUS_4_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-4-november-2026-wall-street-amd-val-qualcomm",
  slug: "usa-i-fokus-4-november-2026-wall-street-amd-val-qualcomm",
  title: "USA i fokus 4 november: Wall Street stiger – AMD lyfter 6 procent",
  summary:
    "USA-terminerna stiger efter kongressvalet. AMD lyfter på rekordintäkter och stark guidning, medan handelsdata, tjänste-PMI och Qualcomm står näst på tur.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-04T14:03:51+01:00",
  url: "/news/usa-i-fokus-4-november-2026-wall-street-amd-val-qualcomm",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-04.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-04.png",
  imageAlt: "USA i fokus 2026-11-04 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 5,
  seoTitle: "Wall Street idag: AMD lyfter efter rekordkvartal",
  seoDescription:
    "USA-terminerna stiger efter kongressvalet. AMD lyfter efter rekordintäkter, medan handelsdata, tjänste-PMI och Qualcomm väntar.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "S&P 500 terminer",
    "Nasdaq 100 terminer",
    "AMD rapport",
    "Qualcomm rapport",
    "ISM tjänste-PMI",
    "USA handelsbalans",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "S&P 500",
      "Nasdaq 100",
      "rapportperiod",
      "halvledare",
      "artificiell intelligens",
      "USA makro",
    ],
    companies: ["AMD", "Qualcomm", "Amazon", "Meta", "Nvidia", "Alphabet"],
    tickers: ["AMD", "QCOM", "AMZN", "META", "NVDA", "GOOGL"],
    relatedNewsSlugs: [
      "usa-i-fokus-2-november-2026-wall-street-estee-lauder-apple-palantir",
      "usa-i-fokus-1-november-2026-veckan-som-kommer-jobb-ai-rapporter",
      "usa-i-fokus-25-oktober-2026-veckan-som-kommer-fed-bnp-alphabet-amazon",
      "borssverige-4-november-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en tydligt högre öppning. Vid Reuters senaste verifierade mätpunkt var Dow-terminen upp 1,44 procent, S&P 500-terminen upp 1,04 procent och Nasdaq 100-terminen upp 0,93 procent.",
    "Demokraterna vann både senaten och representanthuset i kongressvalet. Marknadens första reaktion präglas av stigande indexterminer, en svagare dollar och lägre långa statsräntor, men artikeln tillskriver inte rörelserna en enda orsak.",
    "Gårdagens öppna fråga om AI- och teknikbolagens vinstkraft får samtidigt ett konkret svar från AMD. Bolaget redovisade rekordintäkter och gav en stark prognos för fjärde kvartalet; aktien steg 6,3 procent i Reuters senaste premarketbild.",
  ],
  sections: [
    {
      heading: "AMD svarar med rekordkvartal",
      paragraphs: [
        "AMD:s omsättning steg 45 procent jämfört med ett år tidigare till 13,377 miljarder dollar under tredje kvartalet. Datacenterintäkterna nådde rekordhöga 8,5 miljarder dollar, en ökning med 97 procent.",
        "Den redovisade bruttomarginalen var 54 procent, rörelseresultatet 2,832 miljarder dollar och nettovinsten 2,428 miljarder dollar. Utspädd vinst per aktie var 1,46 dollar. På justerad basis var bruttomarginalen 56 procent och vinsten per aktie 2,09 dollar.",
        "För fjärde kvartalet räknar AMD med cirka 17 miljarder dollar i omsättning, plus eller minus 3 procent. Mittpunkten motsvarar 66 procents tillväxt jämfört med ett år tidigare och 27 procent sekventiellt. Den justerade bruttomarginalen väntas bli omkring 55 procent.",
      ],
    },
    {
      heading: "Bred terminsuppgång efter valresultatet",
      paragraphs: [
        "Uppgången är bred inför öppningen. Amazon steg omkring 3 procent i förhandeln, medan Meta, Nvidia och Alphabet alla var upp mer än 1 procent i Reuters senaste bild.",
        "Samtidigt var Tesla och SpaceX ned mer än 4 procent. Flera datacenterbolag, däribland IREN, Hut 8 och Applied Digital, handlades också lägre. Det visar att den positiva indexbilden inte omfattar samtliga teknik- och AI-relaterade aktier.",
        "Nasdaq 100 bekräftade en teknisk korrektion i måndags. Dagens terminsuppgång är därför en tydlig förändring mot det svaga utgångsläget, men först kontanthandeln visar om rörelsen består.",
      ],
    },
    {
      heading: "Handelsdata och tjänste-PMI blir dagens makrotest",
      paragraphs: [
        "Bureau of Economic Analysis publicerar USA:s handelsdata för september klockan 14.30 svensk tid. Publiceringen ligger efter artikelns research-cutoff men före Wall Streets ordinarie öppning.",
        "Institute for Supply Management publicerar tjänste-PMI klockan 10.00 amerikansk östkusttid, motsvarande klockan 16.00 svensk tid. Utfallet kommer efter börsöppningen och ger en ny kontrollpunkt för aktivitet, orderingång, sysselsättning och priser.",
        "Inget utfall från handelsdata eller tjänste-PMI och ingen efterföljande marknadsreaktion anges i förväg.",
      ],
    },
    {
      heading: "Qualcomm rapporterar efter stängning",
      paragraphs: [
        "Qualcomm publicerar resultatet för sitt fjärde kvartal och hela räkenskapsåret 2026 efter den amerikanska börsens stängning.",
        "Bolagets telefonkonferens börjar klockan 13.45 amerikansk Stillahavstid, motsvarande klockan 22.45 svensk tid. Investerare får då nya besked om försäljning, marginaler och utsikter.",
        "Qualcomms rapport ligger efter artikelns cutoff. Varken rapportutfall eller kursreaktion föregrips.",
      ],
    },
  ],
  sources: [
    {
      text: "AMD Investor Relations: officiellt resultat för tredje kvartalet och utsikter för fjärde kvartalet 2026",
      href: "https://ir.amd.com/news-events/press-releases/detail/1303/amd-reports-third-quarter-2026-financial-results",
    },
    {
      text: "Qualcomm Investor Relations: officiell tid för resultat och telefonkonferens den 4 november 2026",
      href: "https://investor.qualcomm.com/news-events/press-releases/news-details/2026/Qualcomm-Schedules-Fourth-Quarter-and-Fiscal-2026-Earnings-Release-and-Conference-Call/default.aspx",
    },
    {
      text: "Institute for Supply Management: officiell publiceringskalender för tjänste-PMI",
      href: "https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/?trk=article-ssr-frontend-pulse_little-text-block",
    },
    {
      text: "Bureau of Economic Analysis: officiell publiceringskalender för USA:s utrikeshandel",
      href: "https://www.bea.gov/news/schedule/",
    },
    {
      text: "Reuters: aktuell terminsbild, valutfall och AMD-reaktion inför Wall Street den 4 november 2026",
      href: "https://www.reuters.com/business/us-stock-index-futures-steady-democrats-seize-congress-2026-11-04/",
    }
  ],
};
