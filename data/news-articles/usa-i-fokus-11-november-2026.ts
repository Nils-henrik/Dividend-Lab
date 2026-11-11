import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 11 november 2026.
 * Editorial research cutoff: 2026-11-11T14:08:06+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://www.reuters.com/business/sp-500-nasdaq-futures-rise-after-coreweave-soothes-ai-spending-fears-2026-11-11/
 * P0_SOURCE[primary]: https://investors.coreweave.com/news/news-details/2026/CoreWeave-Reports-Strong-Third-Quarter-2026-Results/default.aspx
 * P0_SOURCE[primary]: https://www.bls.gov/news.release/archives/cpi_11102026.htm
 * P0_SOURCE[primary]: https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m11/cisco-schedules-conference-call-for-q1-fiscal-year-2027-financial-results.html
 * P0_SOURCE[primary]: https://www.appliedmaterials.com/us/en/newsroom/press-releases/102226-applied-to-report-fourth-quarter-fiscal-2026-results.html
 */
export const USA_I_FOKUS_11_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-11-november-2026",
  slug: "usa-i-fokus-11-november-2026-coreweave-inflation-nasdaq",
  title: "USA i fokus 11 november: Nasdaq-terminen lyfter – CoreWeave stiger över 13 procent",
  summary:
    "Nasdaq 100-terminen stiger 1,9 procent efter CoreWeaves rapport. Samtidigt ger oktoberinflationen ett stramare ränteläge inför torsdagens rapporter från Cisco och Applied Materials.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-11T14:08:11+01:00",
  url: "/news/usa-i-fokus-11-november-2026-coreweave-inflation-nasdaq",
  featured: true,
  readingMinutes: 5,
  seoTitle: "USA-börsen idag: CoreWeave lyfter Nasdaq-terminen",
  seoDescription:
    "Nasdaq 100-terminen stiger 1,9 procent när CoreWeave lyfter över 13 procent. Läs om Q3, oktoberinflationen och torsdagens Cisco- och Applied Materials-rapporter.",
  seoKeywords: [
    "USA-börsen idag",
    "Nasdaq terminer",
    "CoreWeave Q3 2026",
    "USA inflation oktober 2026",
    "Nvidia premarket",
    "Cisco rapport",
    "Applied Materials rapport",
    "Wall Street idag"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Wall Street",
      "Nasdaq",
      "artificiell intelligens",
      "molninfrastruktur",
      "inflation",
      "Federal Reserve",
      "halvledare"
    ],
    companies: ["CoreWeave", "Nvidia", "Marvell Technology", "Micron Technology", "Cisco", "Applied Materials"],
    tickers: ["CRWV", "NVDA", "MRVL", "MU", "CSCO", "AMAT"],
    relatedNewsSlugs: [
      "usa-i-fokus-9-november-2026",
      "usa-i-fokus-8-november-2026",
      "usa-i-fokus-7-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en teknikledd öppning. Klockan 06.39 amerikansk östkusttid steg Nasdaq 100-terminen 1,9 procent, S&P 500-terminen 0,86 procent och Dow-terminen 0,11 procent.",
    "Två av söndagens öppna frågor har nu fått svar. CoreWeave har redovisat kraftig tillväxt men också en stor nettoförlust, medan oktoberinflationen kom in på 0,4 procent för totalindex och 0,3 procent exklusive mat och energi.",
    "Den gemensamma nämnaren är att investerare åter väger AI-investeringarnas intäktspotential mot finansieringskostnader och ett ränteläge som inte ger någon omedelbar lättnad."
  ],
  sections: [
    {
      heading: "CoreWeave sätter tonen i premarket",
      paragraphs: [
        "CoreWeave steg mer än 13 procent i förhandeln enligt Reuters. Nvidia ökade 5,2 procent, Marvell 8 procent och Micron 6,8 procent. Rörelserna ger tekniksektorn ett tydligt försprång före öppningen, men är ögonblicksbilder från före artikelns cutoff.",
        "Premarketbilden följer på en bredare, men selektiv, terminsuppgång i söndagens USA i fokus. Skillnaden i dag är att marknaden har både ett verifierat bolagsutfall och färska inflationsdata att prissätta.",
        "Den amerikanska obligationsmarknaden är stängd för Veterans Day. Det begränsar dagens direkta signal från statsräntorna och gör aktie- och valutamarknadens reaktion relativt viktigare."
      ]
    },
    {
      heading: "Intäkterna ökar – men finansieringskostnaden är tung",
      paragraphs: [
        "CoreWeaves omsättning steg till 3,661 miljarder dollar i tredje kvartalet, från 1,365 miljarder ett år tidigare. Justerad EBITDA blev 2,256 miljarder dollar med 62 procents marginal, jämfört med 838 miljoner och 61 procent året före.",
        "Rörelseresultatet blev 207 miljoner dollar och rörelsemarginalen 6 procent. Samtidigt ökade räntekostnaden till 846 miljoner dollar från 310 miljoner, och nettoförlusten växte till 709 miljoner dollar från 110 miljoner.",
        "Rapporten bekräftar därmed både efterfrågan på AI-infrastruktur och kostnaden för att bygga kapaciteten. Orderstocken uppgick till cirka 132,5 miljarder dollar, men resultatbilden visar att finansieringen förblir en central riskfaktor."
      ]
    },
    {
      heading: "Höjd prognos och större capexram",
      paragraphs: [
        "Bolaget höjde helårsprognosen för omsättningen till 13,0–13,3 miljarder dollar. Prognosen för justerat rörelseresultat är 1,275–1,375 miljarder dollar.",
        "Investeringsbudgeten väntas samtidigt bli 37–39 miljarder dollar, jämfört med en tidigare nedre gräns på 35 miljarder. CoreWeave räknar med en annualiserad intäktstakt på 20–21 miljarder dollar vid årets slut och mer än 1,85 gigawatt aktiv effekt.",
        "Bolaget väntar dessutom omkring 9 miljarder dollar i kundförskott och depositioner under de kommande tre månaderna. Det kan stödja expansionen, men förändrar inte att skuld, ränta och kassaflöde behöver följas tillsammans med tillväxten."
      ]
    },
    {
      heading: "Oktoberinflationen ger ett stramare bakgrundsläge",
      paragraphs: [
        "USA:s konsumentprisindex steg 0,4 procent i oktober efter 0,6 procent i september. Index exklusive mat och energi ökade 0,3 procent, samma månadstakt som i augusti och september.",
        "Boendekostnaderna ökade 0,3 procent och stod för mer än 30 procent av totalindexets månadsuppgång. Mat steg 0,5 procent och energi 0,7 procent efter 5,2 procent i september.",
        "Enligt Reuters var utfallet starkare än marknaden väntat och ökade förväntningarna på en räntehöjning. För tillväxtbolag som CoreWeave innebär det att högre intäkter fortsatt måste vägas mot en dyr finansieringsmiljö."
      ]
    },
    {
      heading: "Nästa kontrollpunkter kommer efter cutoff",
      paragraphs: [
        "Cisco rapporterar sitt första kvartal i räkenskapsåret 2027 efter torsdagens börsstängning. Bolagets konferenssamtal börjar klockan 16.30 amerikansk östkusttid, motsvarande 22.30 i Stockholm.",
        "Applied Materials publicerar samtidigt resultat för sitt fjärde kvartal och helåret 2026. Även dess konferenssamtal börjar torsdag klockan 16.30 amerikansk östkusttid, motsvarande 22.30 i Stockholm.",
        "Resultat och marknadsreaktioner från dessa två rapporter ligger efter artikelns cutoff och föregrips inte. Investerare får främst följa guidning, marginaler och efterfrågesignaler från nätverk respektive halvledarutrustning."
      ]
    }
  ],
  sources: [
    {
      text: "Reuters: amerikanska indexterminer och premarket-rörelser klockan 06.39 ET den 11 november 2026 samt marknadskontext efter inflationsutfallet",
      href: "https://www.reuters.com/business/sp-500-nasdaq-futures-rise-after-coreweave-soothes-ai-spending-fears-2026-11-11/"
    },
    {
      text: "CoreWeave Investor Relations: officiell Q3 2026-rapport med omsättning, resultat, marginaler, orderstock, prognoser och investeringsplan",
      href: "https://investors.coreweave.com/news/news-details/2026/CoreWeave-Reports-Strong-Third-Quarter-2026-Results/default.aspx"
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiellt konsumentprisindex för oktober 2026, publicerat den 10 november 2026",
      href: "https://www.bls.gov/news.release/archives/cpi_11102026.htm"
    },
    {
      text: "Cisco Newsroom: officiell tidplan för rapporten avseende Q1 i räkenskapsåret 2027 den 12 november 2026",
      href: "https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m11/cisco-schedules-conference-call-for-q1-fiscal-year-2027-financial-results.html"
    },
    {
      text: "Applied Materials: officiell tidplan för rapporten avseende Q4 och helåret 2026 den 12 november 2026",
      href: "https://www.appliedmaterials.com/us/en/newsroom/press-releases/102226-applied-to-report-fourth-quarter-fiscal-2026-results.html"
    }
  ]
};
