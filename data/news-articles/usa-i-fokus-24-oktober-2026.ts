import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — Veckan som gått, 24 oktober 2026.
 * Editorial research cutoff: 2026-10-24T14:06:32+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.pmi.spglobal.com/Public/Home/PressRelease/07d16568e63346999890940d47639cd9
 * P0_SOURCE[primary]: https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
 * P0_SOURCE[primary]: https://newsroom.ibm.com/2026-10-21-IBM-RELEASES-THIRD-QUARTER-RESULTS
 * P0_SOURCE[primary]: https://investorcenter.slb.com/news-releases/news-release-details/slb-announces-third-quarter-2026-results
 * P0_SOURCE[secondary]: https://www.reuters.com/business/wall-street-futures-dip-after-ai-rout-telecoms-slide-2026-10-23/
 * P0_SOURCE[secondary]: https://apnews.com/article/wall-street-stocks-dow-nasdaq-e07c72bc5cbe5dffe352ddf30054e35f
 */
export const USA_I_FOKUS_24_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-24-oktober-2026-veckan-som-gatt-teknik-olja",
  slug: "usa-i-fokus-24-oktober-2026-veckan-som-gatt-teknik-olja",
  title: "USA i fokus – Veckan som gått: Teknikoro och olja pressade Wall Street",
  summary:
    "S&P 500 och Nasdaq avslutade veckan på minus när teknikoro och stigande oljepris präglade handeln. Dow stod emot bättre, medan IBM och SLB levererade konkreta rapportbesked.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-24T14:06:32+02:00",
  url: "/news/usa-i-fokus-24-oktober-2026-veckan-som-gatt-teknik-olja",
  featured: true,
  readingMinutes: 5,
  seoTitle: "USA i fokus: Teknikoro och olja präglade veckan",
  seoDescription:
    "Veckan på Wall Street: S&P 500 och Nasdaq föll, Dow steg, oljepriset pressade marknaden och IBM samt SLB rapporterade.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street veckan",
    "S&P 500",
    "Nasdaq",
    "Dow Jones",
    "IBM rapport",
    "SLB rapport",
    "Federal Reserve",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "S&P 500",
      "Nasdaq",
      "Dow Jones",
      "Russell 2000",
      "olja",
      "USA PMI",
      "Federal Reserve",
      "rapportperiod",
    ],
    companies: ["IBM", "SLB"],
    tickers: ["IBM", "SLB"],
    relatedNewsSlugs: [
      "usa-i-fokus-23-oktober-2026-american-express-slb-pmi",
      "usa-i-fokus-22-oktober-2026-nasdaq-tesla-ibm-olja",
      "usa-i-fokus-21-oktober-2026-netflix-att-tesla-ibm",
      "borssverige-24-oktober-2026",
      "norden-i-centrum-24-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Den amerikanska kontantmarknaden är stängd på lördagen. Den senaste verifierade sessionen är fredagen den 23 oktober, då Dow Jones föll 1,23 procent till 52 215,16, S&P 500 backade 0,52 procent till 7 623,68 och Nasdaq Composite sjönk 0,21 procent till 25 955,34.",
    "Veckan slutade med S&P 500 ned 0,5 procent och Nasdaq ned 0,7 procent. Dow steg däremot 0,4 procent och noterade sin tredje raka uppgångsvecka, medan småbolagsindexet Russell 2000 steg 2,0 procent.",
  ],
  sections: [
    {
      heading: "Teknikpressen satte avtryck i veckofacit",
      paragraphs: [
        "Veckans tydligaste förändring mot de föregående dagarnas rapportoptimism var att de stora teknikaktierna inte längre bar hela marknaden. S&P 500 och Nasdaq slutade båda veckan lägre, samtidigt som Dow och Russell 2000 utvecklades bättre.",
        "Det innebär att fredagens svaga stängning inte ska läsas isolerat. Veckofacit visar en tydlig skillnad mellan de tekniktyngda indexen och de bredare delarna av marknaden, utan att en enskild handelsdag ensam förklarar hela rörelsen.",
      ],
    },
    {
      heading: "Olja och räntor ökade trycket på fredagen",
      paragraphs: [
        "Brentoljan steg 3,1 procent på fredagen till över 116 dollar per fat, den högsta nivån sedan juni 2022 enligt AP:s marknadssammanställning. Samtidigt steg räntan på den amerikanska tioåriga statsobligationen till 4,99 procent.",
        "Högre energi- och finansieringskostnader ger investerare ytterligare två datapunkter att väga mot bolagens vinster. Artikeln tillskriver därför inte indexnedgången en enda orsak, men konstaterar att både olja och långränta steg när de stora indexen föll.",
      ],
    },
    {
      heading: "IBM och SLB gav konkreta rapportsvar",
      paragraphs: [
        "IBM redovisade intäkter på 17,1 miljarder dollar i tredje kvartalet, en ökning med 5 procent och 6 procent i konstanta valutor. Mjukvaruintäkterna steg 8 procent, medan konsultintäkterna var oförändrade.",
        "IBM räknar nu med en helårstillväxt på 4–5 procent i konstanta valutor och att det fria kassaflödet ökar med mer än 1 miljard dollar jämfört med föregående år. Det fria kassaflödet uppgick till 7,8 miljarder dollar för årets första nio månader.",
        "SLB:s kvartalsintäkter ökade 6 procent jämfört med ett år tidigare till 9,45 miljarder dollar. Nordamerika växte 24 procent till 2,40 miljarder dollar, medan det fria kassaflödet uppgick till 828 miljoner dollar.",
      ],
    },
    {
      heading: "Tillväxtsignalen höll i sig – Fed väntar nästa vecka",
      paragraphs: [
        "S&P Globals preliminära amerikanska komposit-PMI för oktober blev 57,6, ned från 58,4 i september men fortfarande över 50-gränsen som skiljer expansion från kontraktion. Utfallet ger en fortsatt stark tillväxtsignal samtidigt som rapporten pekade på stigande kostnadstryck.",
        "Nästa bekräftade stora kontrollpunkt är Federal Reserves möte den 27–28 oktober. Eftersom mötet ligger efter artikelns research-cutoff beskrivs inget räntebesked eller någon marknadsreaktion i förväg.",
        "Inför nästa vecka står därför samspelet mellan bolagens resultat, energipriserna, långräntan och Feds besked i centrum. Det är en bevakningslista, inte en prognos för indexens nästa rörelse.",
      ],
    },
  ],
  sources: [
    {
      text: "S&P Global: officiellt preliminärt USA-PMI för oktober 2026",
      href: "https://www.pmi.spglobal.com/Public/Home/PressRelease/07d16568e63346999890940d47639cd9",
    },
    {
      text: "Federal Reserve: officiell FOMC-kalender med mötet den 27–28 oktober 2026",
      href: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    },
    {
      text: "IBM Newsroom: officiellt resultat för tredje kvartalet 2026",
      href: "https://newsroom.ibm.com/2026-10-21-IBM-RELEASES-THIRD-QUARTER-RESULTS",
    },
    {
      text: "SLB Investor Relations: officiellt resultat för tredje kvartalet 2026",
      href: "https://investorcenter.slb.com/news-releases/news-release-details/slb-announces-third-quarter-2026-results",
    },
    {
      text: "Reuters: verifierade stängningsnivåer och veckoutfall på Wall Street den 23 oktober 2026",
      href: "https://www.reuters.com/business/wall-street-futures-dip-after-ai-rout-telecoms-slide-2026-10-23/",
    },
    {
      text: "AP: veckoutfall, Brentolja och amerikansk tioårsränta efter fredagens handel",
      href: "https://apnews.com/article/wall-street-stocks-dow-nasdaq-e07c72bc5cbe5dffe352ddf30054e35f",
    },
  ],
};
