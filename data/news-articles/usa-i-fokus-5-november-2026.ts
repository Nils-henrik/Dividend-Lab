import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 5 november 2026.
 * Editorial research cutoff: 2026-11-05T14:00:54+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.sec.gov/Archives/edgar/data/804328/000080432826000127/qcom092726erex991.htm
 * P0_SOURCE[primary]: https://investor.uber.com/news-events/news/press-release-details/2026/Uber-Announces-Results-for-Third-Quarter-2026/default.aspx
 * P0_SOURCE[primary]: https://www.bls.gov/schedule/2026/11_sched_list.htm
 * P0_SOURCE[secondary]: https://www.reuters.com/business/sp-500-futures-steady-after-midterm-rally-nasdaq-lags-chip-weakness-2026-11-05/
 */
export const USA_I_FOKUS_5_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-5-november-2026-nasdaq-qualcomm-uber-jobbrapport",
  slug: "usa-i-fokus-5-november-2026-nasdaq-qualcomm-uber-jobbrapport",
  title: "USA i fokus 5 november: Nasdaq pressas – Qualcomm faller 9,6 procent",
  summary:
    "Nasdaq 100-terminen faller när halvledaraktier pressas. Qualcomm tappar efter rapporten, Uber visar stark tillväxt och jobbrapporten väntar på fredag.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-05T14:00:54+01:00",
  url: "/news/usa-i-fokus-5-november-2026-nasdaq-qualcomm-uber-jobbrapport",
  featured: true,
  readingMinutes: 5,
  seoTitle: "Nasdaq idag: Qualcomm faller efter rapporten",
  seoDescription:
    "Nasdaq 100-terminen faller när Qualcomm och halvledaraktier pressas. Uber växer och USA:s jobbrapport väntar på fredag.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "Nasdaq 100 terminer",
    "S&P 500 terminer",
    "Qualcomm rapport",
    "Uber rapport",
    "halvledaraktier",
    "USA jobbrapport",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "Nasdaq 100",
      "S&P 500",
      "rapportperiod",
      "halvledare",
      "artificiell intelligens",
      "USA arbetsmarknad",
    ],
    companies: ["Qualcomm", "Uber", "Nvidia", "Marvell", "Intel", "AppLovin"],
    tickers: ["QCOM", "UBER", "NVDA", "MRVL", "INTC", "APP"],
    relatedNewsSlugs: [
      "usa-i-fokus-4-november-2026-wall-street-amd-val-qualcomm",
      "usa-i-fokus-2-november-2026-wall-street-estee-lauder-apple-palantir",
      "usa-i-fokus-1-november-2026-veckan-som-kommer-jobb-ai-rapporter",
      "usa-i-fokus-25-oktober-2026-veckan-som-kommer-fed-bnp-alphabet-amazon",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en blandad öppning efter onsdagens breda uppgång. Vid Reuters senaste verifierade mätpunkt var Dow-terminen upp 0,62 procent och S&P 500-terminen upp 0,20 procent, medan Nasdaq 100-terminen föll 0,51 procent.",
    "Halvledarsektorn står i centrum. Qualcomm föll 9,6 procent i förhandeln efter att bolagets smartphonechipförsäljning missat marknadens förväntningar. Nvidia, Marvell och Intel handlades också lägre.",
    "Gårdagens öppna fråga om Qualcomms rapport har därmed fått ett tydligt svar. Samtidigt visar Uber hög bokningstillväxt och förbättrad lönsamhet, medan marknaden redan riktar blicken mot fredagens amerikanska jobbrapport.",
  ],
  sections: [
    {
      heading: "Qualcomm pressas av svagare smartphonechip",
      paragraphs: [
        "Qualcomms redovisade omsättning sjönk 8 procent till 10,322 miljarder dollar under det fjärde kvartalet i räkenskapsåret 2026. Den redovisade vinsten per aktie var 1,17 dollar, medan den justerade vinsten per aktie uppgick till 2,17 dollar.",
        "Intäkterna i chipverksamheten QCT minskade 8 procent till 9,015 miljarder dollar. Smartphoneintäkterna föll 26 procent till 5,137 miljarder dollar, medan fordonsintäkterna steg 89 procent till rekordhöga 1,990 miljarder dollar.",
        "För det första kvartalet i räkenskapsåret 2027 guidar Qualcomm för omsättning på 10,4–11,2 miljarder dollar och justerad vinst per aktie på 2,15–2,35 dollar. Bolaget upprepade samtidigt målet om 5 miljarder dollar i datacenterintäkter under räkenskapsåret 2027.",
      ],
    },
    {
      heading: "Nasdaq släpar när halvledare faller",
      paragraphs: [
        "Qualcomms nedgång sammanfaller med fortsatt press på chip- och datacenterrelaterade aktier. Nvidia föll 0,8 procent, Marvell 3,4 procent och Intel 2 procent i Reuters senaste premarketbild.",
        "Dow- och S&P 500-terminerna höll sig samtidigt på plus. Amazon, Meta och Alphabet steg mer än 1 procent, vilket visar att svagheten främst var koncentrerad till delar av halvledar- och AI-infrastruktursegmentet.",
        "Oljepriset blev en annan kontrollpunkt efter onsdagens kraftiga fall. Brent steg mer än 1 procent efter att ha tappat över 8 procent föregående session.",
      ],
    },
    {
      heading: "Uber växer och höjer lönsamheten",
      paragraphs: [
        "Ubers bruttoförmedlingsvärde steg 20 procent till 59,8 miljarder dollar under tredje kvartalet, medan omsättningen ökade 10 procent till 14,8 miljarder dollar. Antalet resor steg 16 procent till 4,1 miljarder.",
        "Det redovisade rörelseresultatet ökade 30 procent till 1,4 miljarder dollar. Justerad EBITDA steg 31 procent till 3,0 miljarder dollar och fritt kassaflöde uppgick till 2,5 miljarder dollar.",
        "För fjärde kvartalet räknar Uber med bruttoförmedlingsvärde på 63,25–65,25 miljarder dollar och justerad vinst per aktie på 0,95–0,99 dollar.",
      ],
    },
    {
      heading: "Produktivitet i dag – jobbrapport på fredag",
      paragraphs: [
        "Bureau of Labor Statistics publicerar preliminär produktivitet och arbetskostnader för tredje kvartalet klockan 08.30 amerikansk östkusttid, motsvarande klockan 14.30 svensk tid. Publiceringen ligger efter artikelns research-cutoff men före börsöppningen.",
        "På fredag klockan 08.30 amerikansk östkusttid, motsvarande klockan 14.30 svensk tid, publiceras sysselsättningsrapporten för oktober. Den blir nästa stora kontrollpunkt för arbetsmarknaden och ränteförväntningarna.",
        "Inget utfall från dagens produktivitetsdata eller fredagens jobbrapport och ingen efterföljande marknadsreaktion anges i förväg.",
      ],
    },
  ],
  sources: [
    {
      text: "Qualcomm/SEC: officiellt resultat för fjärde kvartalet och helåret 2026 samt utsikter för första kvartalet 2027",
      href: "https://www.sec.gov/Archives/edgar/data/804328/000080432826000127/qcom092726erex991.htm",
    },
    {
      text: "Uber Investor Relations: officiellt resultat för tredje kvartalet och utsikter för fjärde kvartalet 2026",
      href: "https://investor.uber.com/news-events/news/press-release-details/2026/Uber-Announces-Results-for-Third-Quarter-2026/default.aspx",
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiell publiceringskalender för november 2026",
      href: "https://www.bls.gov/schedule/2026/11_sched_list.htm",
    },
    {
      text: "Reuters: aktuell terminsbild, Qualcomm-reaktion och halvledarsektorn inför Wall Street den 5 november 2026",
      href: "https://www.reuters.com/business/sp-500-futures-steady-after-midterm-rally-nasdaq-lags-chip-weakness-2026-11-05/",
    }
  ],
};
