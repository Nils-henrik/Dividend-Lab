import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 14 november 2026.
 * Editorial research cutoff: 2026-11-14T14:06:50+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[secondary]: https://apnews.com/article/wall-street-stocks-dow-nasdaq-12c1e8155fb85c3c7b09e058ed6d3c74
 * P0_SOURCE[primary]: https://www.bls.gov/news.release/ppi.nr0.htm
 * P0_SOURCE[primary]: https://nvidianews.nvidia.com/news/nvidia-announces-ceo-transition
 * P0_SOURCE[primary]: https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m11/cisco-reports-first-quarter-earnings.html
 * P0_SOURCE[primary]: https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-announces-fourth-quarter-and-fiscal-year-2026
 */
export const USA_I_FOKUS_14_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-14-november-2026",
  slug: "usa-i-fokus-14-november-2026-veckan-wall-street-nvidia-inflation",
  title: "Veckan som gått: Wall Street bryter förlustsviten – Nvidia pressar teknik",
  summary:
    "S&P 500 steg 2,5 procent under veckan trots fredagens tekniknedgång. Nvidia bytte vd, producentpriserna ökade 6,5 procent i årstakt och Cisco samt Applied Materials redovisade rekordintäkter.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-14T14:06:55+01:00",
  url: "/news/usa-i-fokus-14-november-2026-veckan-wall-street-nvidia-inflation",
  featured: true,
  imageUrl: "/news/generated/usa-i-fokus-2026-11-14.png",
  thumbnailImageUrl: "/news/generated/usa-i-fokus-2026-11-14.png",
  imageAlt: "USA i fokus 2026-11-14 – DivLabs översikt över den amerikanska börsmarknaden inför Wall Streets öppning.",
  readingMinutes: 6,
  seoTitle: "Wall Street veckan: Nvidia, PPI, Cisco och Applied Materials",
  seoDescription:
    "Veckan på Wall Street: S&P 500 steg 2,5 procent, Nvidia bytte vd, USA:s PPI ökade 6,5 procent och Cisco samt Applied Materials slog intäktsrekord.",
  seoKeywords: [
    "Wall Street veckan",
    "USA-börsen veckan",
    "S&P 500",
    "Nasdaq",
    "Nvidia vd",
    "USA PPI oktober 2026",
    "Cisco Q1 2027",
    "Applied Materials Q4 2026"
  ],
  internalLinking: {
    topics: [
      "USA i fokus",
      "Veckan som gått",
      "Wall Street",
      "S&P 500",
      "Nasdaq",
      "artificiell intelligens",
      "inflation",
      "Federal Reserve",
      "halvledare",
      "bolagsrapporter"
    ],
    companies: ["Nvidia", "Cisco", "Applied Materials", "CoreWeave"],
    tickers: ["NVDA", "CSCO", "AMAT", "CRWV"],
    relatedNewsSlugs: [
      "usa-i-fokus-13-november-2026-nvidia-cisco-applied-materials",
      "usa-i-fokus-12-november-2026-nasdaq-brookfield-nvidia",
      "usa-i-fokus-11-november-2026-coreweave-inflation-nasdaq",
      "usa-i-fokus-8-november-2026-veckan-som-kommer-inflation-ai"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Wall Street avslutade en stökig teknikvecka med fredagsnedgångar, men samtliga fyra stora index steg över veckan. S&P 500 ökade 2,5 procent, Nasdaq Composite 2,3 procent, Dow Jones 2,1 procent och Russell 2000 1,3 procent.",
    "Veckans största förändring kom i AI-sektorn. Nvidia meddelade att Jensen Huang lämnat vd-posten och styrelsen med omedelbar verkan, medan finanschefen Colette Kress utsetts till tillförordnad vd.",
    "Samtidigt fick två öppna frågor verifierade svar. Producentpriserna steg 0,3 procent i oktober och 6,5 procent på ett år, medan Cisco och Applied Materials redovisade rekordintäkter och starka framtidsintervall."
  ],
  sections: [
    {
      heading: "Första positiva börsveckan sedan början av oktober",
      paragraphs: [
        "S&P 500 stängde på 7 561,67 efter att ha fallit 0,4 procent på fredagen. Nasdaq Composite sjönk 0,9 procent till 25 136,27, medan Dow Jones steg 0,1 procent till 52 347,55.",
        "Veckofacit blev ändå positivt: S&P 500 steg 2,5 procent, Nasdaq 2,3 procent, Dow Jones 2,1 procent och Russell 2000 1,3 procent. Enligt AP var det marknadens första vinstvecka sedan början av oktober.",
        "Fredagens motbild var tydlig. Teknikaktier vägde tyngst på indexen, och Nvidia föll igen dagen efter bolagets verifierade ledarskapsbesked. Veckan visar därför både en bred indexåterhämtning och kvarvarande koncentrationsrisk i AI-komplexet."
      ]
    },
    {
      heading: "PPI gav svaret på veckans sista makrofråga",
      paragraphs: [
        "USA:s producentprisindex för slutlig efterfrågan steg 0,3 procent i oktober, säsongsrensat. I september var månadsökningen 1,4 procent och i augusti 0,4 procent.",
        "Jämfört med oktober året före steg producentpriserna 6,5 procent. Det var den största tolvmånadersökningen sedan november 2022, då uppgången var 7,4 procent.",
        "Varupriserna steg 0,5 procent under månaden och tjänstepriserna 0,2 procent. Måttet exklusive livsmedel, energi och handelstjänster ökade 0,5 procent i oktober och 4,9 procent på ett år. Utfallet gav därmed ett mer nyanserat svar än en enskild rubriksiffra: månadsökningen dämpades, men årstakten var fortsatt hög."
      ]
    },
    {
      heading: "Nvidia går in i rapportveckan med tillförordnad vd",
      paragraphs: [
        "Nvidias styrelse meddelade den 12 november att Jensen Huang avgått som koncernchef, president och styrelseledamot med omedelbar verkan. Colette Kress fortsätter som finanschef samtidigt som hon tjänstgör som tillförordnad vd.",
        "Styrelsen har inlett en sökning efter en permanent efterträdare och ska överväga både interna och externa kandidater. Harvey C. Jones har samtidigt utsetts till bolagets första styrelseordförande.",
        "Nvidia uppger att resultatet för tredje kvartalet i räkenskapsåret 2027 publiceras tisdag den 17 november omkring klockan 13.20 Stillahavstid, följt av konferenssamtal klockan 14.00. Resultat och marknadsreaktion ligger efter artikelns cutoff och föregrips inte."
      ]
    },
    {
      heading: "Cisco och Applied Materials bekräftar stark AI-efterfrågan",
      paragraphs: [
        "Cisco ökade intäkterna 24 procent till rekordhöga 18,5 miljarder dollar i det första kvartalet av räkenskapsåret 2027. GAAP-vinsten per aktie blev 1,14 dollar och den justerade vinsten per aktie 1,40 dollar.",
        "Cisco höjde helårsprognosen till intäkter på 74,8–75,8 miljarder dollar och justerad vinst per aktie på 5,47–5,53 dollar. Bolaget höjde samtidigt förväntningen på intäkter från AI-infrastruktur till hyperskalare till 9 miljarder dollar.",
        "Applied Materials redovisade rekordintäkter på 10,41 miljarder dollar i fjärde kvartalet, 53 procent mer än ett år tidigare. GAAP-vinsten per aktie var 3,40 dollar och den justerade vinsten 4,16 dollar. För nästa kvartal guidar bolaget för intäkter på 11,1 miljarder dollar plus eller minus 500 miljoner och justerad vinst per aktie på 4,35 dollar plus eller minus 0,20."
      ]
    },
    {
      heading: "Vad tar vi med oss till nästa vecka?",
      paragraphs: [
        "Veckan gav svar på de frågor som söndagens och vardagarnas USA-artiklar pekade ut: inflationen förblev ett ränteproblem, CoreWeave visade fortsatt AI-efterfrågan och Cisco samt Applied Materials levererade starka rapporter. Den nya osäkerheten är i stället Nvidias ledarskap.",
        "Nästa verifierade kontrollpunkt är Nvidias rapport på tisdag. Investerare får då skilja mellan tre frågor: den operativa utvecklingen, efterfrågan på AI-beräkning och hur bolaget hanterar vd-sökningen.",
        "Lördagens artikel använder fredagens stängningsdata och beskriver ingen pågående handel. Kommande rapportutfall, räntebesked och kursreaktioner behandlas först efter att de har publicerats och verifierats."
      ]
    }
  ],
  sources: [
    {
      text: "Associated Press: fredagens stängningsnivåer och verifierade veckoförändringar för S&P 500, Dow Jones, Nasdaq Composite och Russell 2000 den 13 november 2026",
      href: "https://apnews.com/article/wall-street-stocks-dow-nasdaq-12c1e8155fb85c3c7b09e058ed6d3c74"
    },
    {
      text: "U.S. Bureau of Labor Statistics: officiellt producentprisindex för oktober 2026 med månads- och årsförändringar för slutlig efterfrågan, varor, tjänster och kärnmåttet",
      href: "https://www.bls.gov/news.release/ppi.nr0.htm"
    },
    {
      text: "Nvidia Newsroom: officiellt besked den 12 november 2026 om Jensen Huangs avgång, Colette Kress som tillförordnad vd, efterträdarsökningen och tidplanen för Q3-rapporten",
      href: "https://nvidianews.nvidia.com/news/nvidia-announces-ceo-transition"
    },
    {
      text: "Cisco Newsroom: officiell Q1-rapport för räkenskapsåret 2027 med intäkter, resultat, marginaler, AI-intäktsmål och höjd helårsprognos",
      href: "https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2026/m11/cisco-reports-first-quarter-earnings.html"
    },
    {
      text: "Applied Materials Investor Relations: officiell Q4- och helårsrapport 2026 med intäkter, marginaler, resultat och utsikter för Q1 2027",
      href: "https://ir.appliedmaterials.com/news-releases/news-release-details/applied-materials-announces-fourth-quarter-and-fiscal-year-2026"
    }
  ]
};
