import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus — 22 oktober 2026.
 * Editorial research cutoff: 2026-10-22T14:07:01+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://assets-ir.tesla.com/tesla-contents/IR/TSLA-Q3-2026-Update.pdf
 * P0_SOURCE[primary]: https://newsroom.ibm.com/2026-10-21-IBM-RELEASES-THIRD-QUARTER-RESULTS
 * P0_SOURCE[primary]: https://about.att.com/story/2026/3q-earnings.html
 * P0_SOURCE[secondary]: https://www.reuters.com/business/nasdaq-futures-drop-over-1-ai-worries-resurface-oil-climbs-2026-10-22/
 */
export const USA_I_FOKUS_22_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-22-oktober-2026-nasdaq-tesla-ibm-olja",
  slug: "usa-i-fokus-22-oktober-2026-nasdaq-tesla-ibm-olja",
  title: "USA i fokus 22 oktober: Nasdaq-terminen faller efter Tesla och IBM",
  summary:
    "Nasdaq 100-terminen faller tydligt inför Wall Street. Tesla redovisar lägre vinst trots positivt fritt kassaflöde, IBM höjer kassaflödesutsikten och oljepriset stiger.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-22T14:07:01+02:00",
  url: "/news/usa-i-fokus-22-oktober-2026-nasdaq-tesla-ibm-olja",
  featured: true,
  readingMinutes: 4,
  seoTitle: "USA i fokus: Nasdaq faller efter Tesla och IBM",
  seoDescription:
    "Nasdaqterminen faller inför Wall Street den 22 oktober. Tesla och IBM har rapporterat, medan olja och räntor formar marknadsläget.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "Nasdaq terminer",
    "USA börsen 22 oktober 2026",
    "Tesla rapport",
    "IBM rapport",
    "oljepris",
    "USA räntor",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "Nasdaq 100",
      "S&P 500",
      "rapportperiod",
      "artificiell intelligens",
      "olja",
      "USA-räntor",
    ],
    companies: ["Tesla", "IBM", "AT&T"],
    tickers: ["TSLA", "IBM", "T"],
    relatedNewsSlugs: [
      "usa-i-fokus-21-oktober-2026-netflix-att-tesla-ibm",
      "usa-i-fokus-20-oktober-2026-gm-halliburton-3m-netflix",
      "usa-i-fokus-19-oktober-2026-nasdaq-ai-olja-rapporter",
      "bolaget-i-fokus-sandvik-22-oktober-2026",
      "borssverige-22-oktober-2026",
      "norden-i-centrum-22-oktober-2026",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Wall Street går mot en svagare öppning efter att gårdagens stora teknikrapporter gett marknaden nya siffror att värdera. Vid Reuters senaste verifierade mätpunkt var Dow-terminen ned 0,69 procent, S&P 500-terminen ned 1,04 procent och Nasdaq 100-terminen ned 1,72 procent.",
    "Gårdagens öppna frågor har därmed fått svar. Tesla visar positivt fritt kassaflöde men lägre vinst, medan IBM växer och höjer sin kassaflödesutsikt. Samtidigt stiger oljan och den amerikanska tioårsräntan ligger strax över 5 procent.",
  ],
  sections: [
    {
      heading: "Tesla: oförändrad omsättning och lägre vinst",
      paragraphs: [
        "Tesla redovisade en omsättning på 28,046 miljarder dollar för tredje kvartalet, i stort sett oförändrad från året före. Bruttovinsten ökade 9 procent till 5,494 miljarder dollar och bruttomarginalen steg till 19,6 procent.",
        "Rörelseresultatet föll 56 procent till 718 miljoner dollar och GAAP-vinsten hänförlig till stamaktieägarna minskade 43 procent till 787 miljoner dollar. Utspädd GAAP-vinst per aktie blev 0,22 dollar, medan justerad vinst per aktie var 0,48 dollar.",
        "Det operativa kassaflödet uppgick till 6,263 miljarder dollar och det fria kassaflödet till 1,531 miljarder. Kapitalinvesteringarna var 4,732 miljarder dollar. I Reuters terminsbild föll Tesla 3,6 procent före öppningen.",
      ],
    },
    {
      heading: "IBM höjer utsikten för fritt kassaflöde",
      paragraphs: [
        "IBM:s omsättning ökade 5 procent till 17,1 miljarder dollar. Mätt i fasta valutor var ökningen 6 procent. Mjukvaruintäkterna steg 8 procent, medan infrastruktur ökade 4 procent och konsultintäkterna var oförändrade.",
        "GAAP-vinsten per aktie blev 2,31 dollar och den justerade vinsten per aktie 2,95 dollar. Under årets första nio månader uppgick det fria kassaflödet till 7,8 miljarder dollar.",
        "Bolaget behåller prognosen om 4–5 procents intäktstillväxt i fasta valutor och räknar nu med att årets fria kassaflöde ökar med mer än 1 miljard dollar jämfört med 2025. Trots rapporten föll IBM 4,7 procent i Reuters senaste premarketbild.",
      ],
    },
    {
      heading: "Oljan stiger medan tioårsräntan sjunker något",
      paragraphs: [
        "Brentoljan steg 2,8 procent till 111,92 dollar per fat i Reuters senaste verifierade marknadsbild. Den amerikanska tioårsräntan låg samtidigt omkring 5,0648 procent efter en rörelse mot säkrare tillgångar.",
        "Kombinationen av ett högre oljepris och en lägre långränta ger inte en entydig signal. För aktiemarknaden betyder den i stället att både inflationsrisk och riskaptit behöver följas när kontanthandeln börjar.",
        "DivLabs redaktionella bedömning är att dagens viktigaste fråga blir om nedgången stannar i teknik- och AI-relaterade aktier eller breddas. Det är en bevakningspunkt, inte en prognos om dagens stängning.",
      ],
    },
    {
      heading: "AT&T visar styrka men upprepas inte som huvudnummer",
      paragraphs: [
        "AT&T, som var en av gårdagens huvudrapporter, redovisade 32,3 miljarder dollar i omsättning, justerad vinst per aktie på 0,65 dollar och 5,0 miljarder dollar i fritt kassaflöde.",
        "Bolaget höjde sin utsikt för justerad vinst per aktie 2026 till omkring 2,40 dollar och räknar med minst 18 miljarder dollar i fritt kassaflöde för helåret.",
        "Siffrorna är relevanta som kontrast till dagens teknikpress, men dagens fokus ligger på de nya utfallen från Tesla och IBM. Efter artikelns cutoff återstår att se hur deras premarketreaktioner står sig i den ordinarie handeln.",
      ],
    },
    {
      heading: "Detta bevakar marknaden efter cutoff",
      paragraphs: [
        "Efter cutoff riktas fokus mot Wall Streets öppning och om nedgången i Nasdaqterminen bekräftas i kontanthandeln. Inga kursutfall efter cutoff ingår i artikeln.",
        "Särskilt viktiga kontrollpunkter är Tesla och IBM efter rapporterna, oljeprisets fortsatta riktning och om den amerikanska tioårsräntan fortsätter ned från morgonens nivå.",
        "Artikeln beskriver endast verifierad information till och med research-cutoff. Senare rörelser eller bolagsbesked behöver bedömas mot nya källor.",
      ],
    },
  ],
  sources: [
    {
      text: "Tesla Investor Relations: officiell Q3-uppdatering med resultat, marginaler, kassaflöde och operativa nyckeltal, publicerad 21 oktober 2026",
      href: "https://assets-ir.tesla.com/tesla-contents/IR/TSLA-Q3-2026-Update.pdf",
    },
    {
      text: "IBM Newsroom: officiellt Q3-resultat, segmentutfall och uppdaterad helårsutsikt, publicerat 21 oktober 2026",
      href: "https://newsroom.ibm.com/2026-10-21-IBM-RELEASES-THIRD-QUARTER-RESULTS",
    },
    {
      text: "AT&T: officiellt Q3-resultat, kunddata och uppdaterad helårsutsikt, publicerat 21 oktober 2026",
      href: "https://about.att.com/story/2026/3q-earnings.html",
    },
    {
      text: "Reuters: aktuell terminsbild, verifierade premarketreaktioner, oljepris och amerikansk tioårsränta den 22 oktober 2026",
      href: "https://www.reuters.com/business/nasdaq-futures-drop-over-1-ai-worries-resurface-oil-climbs-2026-10-22/",
    },
  ],
};
