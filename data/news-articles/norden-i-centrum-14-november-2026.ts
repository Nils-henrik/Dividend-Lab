import type { NewsArticle } from "@/types/news";

/**
 * Norden i centrum — 14 november 2026.
 * Editorial research cutoff: 2026-11-14T08:03:33+01:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://view.news.eu.nasdaq.com/view?id=b8d3f7369bbe44747fe2fc91227c2e29e&lang=en
 * P0_SOURCE[primary]: https://www.afgruppen.com/4abcfb/siteassets/investor-en-dokumenter/quarterly-reports/af-gruppen-quarterly-report-q3-2026.pdf
 * P0_SOURCE[primary]: https://mb.cision.com/Public/22546/4422309/95926d6de6e17132.pdf
 * P0_SOURCE[primary]: https://www.scb.se/en/PR0101
 */
export const NORDEN_I_CENTRUM_14_NOVEMBER_2026_ARTICLE: NewsArticle = {
  id: "norden-i-centrum-14-november-2026",
  slug: "norden-i-centrum-14-november-2026",
  title: "Veckan som gått: Vestas lyfter marginalen – AF Gruppen ökar EBIT 42 procent",
  summary:
    "Vestas förbättrar Q3-marginalen men får lägre orderingång och fritt kassaflöde. AF Gruppen lyfter EBIT 42 procent, Mandatum växer i kapital-lätta affärer och svensk inflation faller.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-11-14T08:03:38+01:00",
  url: "/news/norden-i-centrum-14-november-2026",
  featured: true,
  imageAlt: "Norden i centrum 14 november 2026 – Veckan som gått på de nordiska marknaderna.",
  readingMinutes: 5,
  seoTitle: "Nordiska börsen veckan: Vestas, AF Gruppen och Mandatum",
  seoDescription:
    "Veckan som gått i Norden: Vestas lyfter marginalen, AF Gruppen ökar EBIT, Mandatum växer kapital-lätt och svensk inflation faller.",
  seoKeywords: [
    "nordiska börsen veckan",
    "Veckan som gått",
    "Vestas Q3 2026",
    "AF Gruppen Q3 2026",
    "Mandatum Q3 2026",
    "svensk inflation oktober 2026",
    "nordiska börser"
  ],
  internalLinking: {
    topics: [
      "Norden",
      "veckosammanfattning",
      "rapportperiod",
      "vindkraft",
      "bygg och anläggning",
      "kapitalförvaltning",
      "inflation",
      "orderingång",
      "kassaflöde",
      "utdelning"
    ],
    companies: ["Vestas", "AF Gruppen", "Mandatum"],
    tickers: ["VWS", "AFG", "MANTA"],
    relatedNewsSlugs: [
      "norden-i-centrum-13-november-2026",
      "norden-i-centrum-12-november-2026",
      "norden-i-centrum-11-november-2026"
    ]
  },
  showDisclaimer: true,
  intro: [
    "Veckan som gått i Norden gav flera rapporter med förbättrad underliggande lönsamhet, men också tydliga motfrågor. Danska Vestas ökade Q3-omsättningen 6 procent och lyfte EBIT-marginalen före särskilda poster till 8,5 procent, samtidigt som orderingången i megawatt och det justerade fria kassaflödet sjönk.",
    "Norska AF Gruppen ökade rörelseresultatet till 576 miljoner norska kronor från 406 miljoner och höjde marginalen till 6,5 procent. Finska Mandatum växte kapital-lätt resultat och förvaltat kapital, men koncernens resultat före skatt sjönk.",
    "I Sverige föll KPI-inflationen till 0,9 procent och KPIF-inflationen till 1,1 procent i oktober. Lördagens artikel sammanfattar verifierade veckohändelser och beskriver ingen dagsaktuell kursreaktion eftersom de nordiska börserna är stängda."
  ],
  sections: [
    {
      heading: "Vestas förbättrar marginalen men orderingången tappar",
      paragraphs: [
        "Vestas redovisade en Q3-omsättning på 5 677 miljoner euro, 6 procent högre än ett år tidigare. EBIT före särskilda poster blev 483 miljoner euro och marginalen steg till 8,5 procent från 7,8 procent.",
        "Den kombinerade orderboken för turbiner och service uppgick till 77,9 miljarder euro, 9,7 miljarder mer än ett år tidigare. Samtidigt minskade den fasta och ovillkorliga turbinorderingången med 27 procent till 3 377 MW.",
        "Det justerade fria kassaflödet sjönk till 99 miljoner euro från 508 miljoner. Vestas snävade helårsprognosen till 20,5–21,5 miljarder euro i omsättning och 7,5–8,5 procents EBIT-marginal före särskilda poster. Veckans Vestas-besked var alltså starkare lönsamhet och bättre prognossäkerhet, men med svagare nytillflöde och kassaflöde som kontrollpunkter."
      ]
    },
    {
      heading: "AF Gruppen växer och höjer marginalen",
      paragraphs: [
        "AF Gruppens intäkter steg till 8 881 miljoner norska kronor från 7 803 miljoner i tredje kvartalet. Rörelseresultatet ökade 42 procent till 576 miljoner och rörelsemarginalen till 6,5 procent från 5,2 procent.",
        "Kassaflödet från den löpande verksamheten var 1 017 miljoner norska kronor, jämfört med 1 000 miljoner. Orderstocken steg till 45 958 miljoner från 44 382 miljoner.",
        "Kvartalets orderingång sjönk däremot till 5 073 miljoner från 7 692 miljoner. Styrelsen beslutade samtidigt om en extra utdelning på 4,50 norska kronor per aktie, upp från 4,00. Nästa test blir om den stora orderstocken kan hålla intäkter och marginal uppe när den kortsiktiga orderingången är svagare."
      ]
    },
    {
      heading: "Mandatum växer i kärnaffären men totalresultatet sjunker",
      paragraphs: [
        "Mandatums kapital-lätta resultat före skatt ökade 18 procent till 28,9 miljoner euro i Q3. Avgiftsresultatet steg 11 procent till 24,0 miljoner och kundernas förvaltade kapital ökade 13 procent till 16,8 miljarder euro.",
        "Koncernens resultat före skatt sjönk samtidigt till 44,1 miljoner euro från 55,7 miljoner. Nettot av finansiella poster föll till 26,9 miljoner från 39,4 miljoner, medan nettinflödet minskade till 55 miljoner euro från 163 miljoner.",
        "Solvenskvoten efter antagen utdelning var 213 procent. Exklusive övergångsregeln var den 198 procent, över bolagets målintervall på 160–180 procent. För investerare blir balansen mellan växande avgiftsaffär, svagare nettinflöde och kapitalåterföring central."
      ]
    },
    {
      heading: "Svensk inflation föll i oktober",
      paragraphs: [
        "SCB:s definitiva siffror visade att KPI-inflationen var 0,9 procent i oktober, ned från 1,1 procent i september. KPI var oförändrat från september till oktober.",
        "KPIF-inflationen sjönk till 1,1 procent från 1,5 procent. Därmed fick veckans tidigare öppna fråga ett verifierat svar: både det vanliga KPI-måttet och måttet med fast ränta föll.",
        "Siffrorna är relevanta för svenska ränteförväntningar och räntekänsliga bolag, men artikeln anger inget säkert orsakssamband till enskilda marknadsrörelser. Nästa officiella KPI-publicering är daterad till den 4 december."
      ]
    },
    {
      heading: "Vad tar vi med oss till nästa vecka?",
      paragraphs: [
        "Vestas behöver visa att högre lönsamhet kan förenas med starkare orderingång och kassaflöde. Den stora service- och turbinorderboken ger stöd, men ersätter inte nya projekt.",
        "AF Gruppen går in i nästa period med högre marginal och stor orderstock, men den lägre kvartalsorderingången blir en tydlig kontrollpunkt. För Mandatum står nettinflöden, avgiftsresultat och användningen av det starka solvensöverskottet i centrum.",
        "På makrosidan flyttas fokus från själva svenska oktoberutfallet till hur kommande data och centralbankskommunikation påverkar ränteläget. Veckans samlade nordiska bild är förbättrad bolagslönsamhet, men med orderingång, kassaflöde och kapitalallokering som nästa bevis."
      ]
    }
  ],
  sources: [
    {
      text: "Vestas officiella Q3-meddelande med omsättning, EBIT-marginal, orderingång, orderbok, kassaflöde och snävare helårsprognos",
      href: "https://view.news.eu.nasdaq.com/view?id=b8d3f7369bbe44747fe2fc91227c2e29e&lang=en"
    },
    {
      text: "AF Gruppens officiella Q3-rapport med intäkter, rörelseresultat, marginal, kassaflöde, orderingång, orderstock och extra utdelning",
      href: "https://www.afgruppen.com/4abcfb/siteassets/investor-en-dokumenter/quarterly-reports/af-gruppen-quarterly-report-q3-2026.pdf"
    },
    {
      text: "Mandatums officiella Q3-rapport med kapital-lätt resultat, avgiftsresultat, förvaltat kapital, nettinflöde, totalresultat och solvens",
      href: "https://mb.cision.com/Public/22546/4422309/95926d6de6e17132.pdf"
    },
    {
      text: "SCB:s officiella KPI-publicering för oktober 2026 med KPI, månadsförändring, KPIF och nästa publiceringsdatum",
      href: "https://www.scb.se/en/PR0101"
    }
  ]
};
