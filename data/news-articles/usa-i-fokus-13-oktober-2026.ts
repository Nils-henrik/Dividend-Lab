import type { NewsArticle } from "@/types/news";

/**
 * USA i fokus, 13 oktober 2026.
 * Editorial research cutoff: 2026-10-13T14:04:38+02:00
 * P0_FACT_GATE=PASS
 * P0_SOURCE[primary]: https://www.jpmorganchase.com/ir/quarterly-earnings
 * P0_SOURCE[primary]: https://www.wellsfargo.com/about/investor-relations/quarterly-earnings/
 * P0_SOURCE[primary]: https://www.goldmansachs.com/investor-relations/financials/quarterly-earnings-releases
 * P0_SOURCE[primary]: https://www.citigroup.com/global/news/press-release/2026/citi-third-quarter-2026-earnings-call
 * P0_SOURCE[secondary]: https://www.reuters.com/business/sp-500-futures-muted-investors-await-big-bank-earnings-chip-weakness-weighs-2026-10-13/
 * P0_SOURCE[secondary]: https://www.reuters.com/business/finance/goldman-sachs-quarterly-profit-rises-equities-strength-2026-10-13/
 */
export const USA_I_FOKUS_13_OKTOBER_2026_ARTICLE: NewsArticle = {
  id: "usa-i-fokus-13-oktober-2026-goldman-jpmorgan-chipaktier",
  slug: "usa-i-fokus-13-oktober-2026-goldman-jpmorgan-chipaktier",
  title: "USA i fokus 13 oktober: Goldman lyfter när chipaktier pressar Nasdaq",
  summary:
    "Goldman Sachs redovisar stark aktiehandel medan JPMorgan och Wells Fargo faller trots högre vinster. Nasdaq-terminen backar när chipaktier pressas inför Wall Streets öppning.",
  category: "market",
  source: "DivLab Redaktion",
  publishedAt: "2026-10-13T14:04:50+02:00",
  url: "/news/usa-i-fokus-13-oktober-2026-goldman-jpmorgan-chipaktier",
  featured: true,
  imageAlt:
    "USA i fokus 13 oktober 2026 med Goldman Sachs, amerikanska storbanker och pressade chipaktier inför Wall Street.",
  readingMinutes: 5,
  seoTitle: "USA i fokus 13 oktober: Goldman och chipaktier",
  seoDescription:
    "Wall Street idag: Goldman lyfter på stark aktiehandel, JPMorgan och Wells Fargo faller och chipaktier pressar Nasdaq-terminen.",
  seoKeywords: [
    "USA i fokus",
    "Wall Street idag",
    "USA börsen 13 oktober 2026",
    "Goldman Sachs rapport",
    "JPMorgan rapport",
    "Wells Fargo rapport",
    "Nasdaq terminer",
    "chipaktier",
  ],
  internalLinking: {
    topics: [
      "Wall Street",
      "USA-terminer",
      "rapportsäsong",
      "amerikanska banker",
      "investment banking",
      "aktiehandel",
      "chipaktier",
      "Nasdaq",
    ],
    companies: ["Goldman Sachs", "JPMorgan Chase", "Wells Fargo", "Nvidia"],
    tickers: ["GS", "JPM", "WFC", "NVDA"],
    relatedNewsSlugs: [
      "usa-i-fokus-12-oktober-2026-olja-storbanker-terminer",
      "usa-i-fokus-11-oktober-2026-veckan-som-kommer-storbanker-kpi",
      "usa-i-fokus-10-oktober-2026-veckan-som-gatt-rekord-rantor-humana",
    ],
  },
  showDisclaimer: true,
  intro: [
    "Tisdagens rapportstart ger ett tudelat besked inför Wall Streets öppning. Goldman Sachs lyfter i förhandeln efter stark aktiehandel, medan JPMorgan Chase och Wells Fargo faller trots att båda bankerna redovisar högre vinst än för ett år sedan.",
    "Samtidigt är indexbilden blandad. Vid Reuters verifierade marknadsuppdatering steg Dow-terminen 0,18 procent, medan S&P 500-terminen föll 0,13 procent och Nasdaq 100-terminen backade 0,59 procent. Svagheten är tydligast bland chipaktier.",
  ],
  sections: [
    {
      heading: "Goldman Sachs får stöd av aktiehandeln",
      paragraphs: [
        "Goldman Sachs redovisar en Q3-vinst på 5,29 miljarder dollar, motsvarande 17,01 dollar per aktie. Ett år tidigare var vinsten 4,10 miljarder dollar eller 12,25 dollar per aktie.",
        "Nettointäkterna steg 23 procent till 18,68 miljarder dollar. Intäkterna från aktiehandel ökade 72 procent till 6,44 miljarder dollar, medan investmentbankens avgifter steg 21 procent till 3,22 miljarder dollar.",
        "Goldman-aktien var upp 3,4 procent i förhandeln vid Reuters senaste uppdatering. Det är en färsk förhandsrörelse och inte en slutkurs.",
      ],
    },
    {
      heading: "JPMorgan och Wells Fargo möts av försiktighet",
      paragraphs: [
        "JPMorgan redovisar högre Q3-vinst med stöd från investment banking och trading, men Reuters uppger att vinsten blev lägre än analytikernas genomsnittliga förväntan. Aktien föll 3,4 procent i förhandeln.",
        "Wells Fargo redovisar en nettovinst på 5,95 miljarder dollar, eller 1,87 dollar per aktie, jämfört med 5,59 miljarder dollar och 1,66 dollar per aktie ett år tidigare. Räntenettot steg 5 procent till 12,52 miljarder dollar.",
        "Wells Fargo-aktien föll 1,0 procent i Reuters samlade marknadsuppdatering. Reaktionen visar att högre vinst inte automatiskt räcker när marknaden väger utfallet mot förväntningar och framtida finansieringskostnader.",
      ],
    },
    {
      heading: "Chipaktier tynger Nasdaq-terminen",
      paragraphs: [
        "Nasdaq 100-terminen utvecklades svagast av de tre stora terminsindexen. Reuters kopplar pressen till fortsatt oro för konkurrens inom minneschip efter rapporter om tekniska framsteg hos kinesiska CXMT.",
        "Nvidia föll 1,0 procent i förhandeln. Flera andra amerikanska chip- och lagringsbolag backade mer, men rörelserna är preliminära och kan ändras när kontanthandeln öppnar.",
        "Dagens skillnad mellan Dow- och Nasdaq-terminerna visar att marknaden inte behandlar rapportstarten som ett enda riskpåslag. Bankresultat, chipkonkurrens och ränteläget drar indexen åt olika håll.",
      ],
    },
    {
      heading: "Citi-utfallet lämnas utanför vid cutoff",
      paragraphs: [
        "Citigroup uppgav inför tisdagen att Q3-resultatet skulle publiceras omkring klockan 08.00 östkusttid, motsvarande 14.00 svensk tid. Vid artikelns verifierade research-cutoff fanns inget tillräckligt kontrollerat Citi-utfall i det använda källunderlaget.",
        "Artikeln föregriper därför varken Citis siffror eller kursreaktion. Ett senare utfall måste verifieras separat mot bolagets rapportmaterial innan det kan beskrivas som inträffat.",
        "Detta följer samma princip som i gårdagens USA i fokus: kalenderpunkter är bekräftade i förväg, men rapportutfall tas endast med när de är publicerade och faktakontrollerade.",
      ],
    },
    {
      heading: "Vad händer efter öppningen?",
      paragraphs: [
        "NYSE och Nasdaq öppnar klockan 15.30 svensk tid, efter artikelns cutoff. Den första kontrollpunkten blir om Goldmans positiva förhandsreaktion står sig och om pressen på JPMorgan, Wells Fargo och chipaktier fortsätter.",
        "Senare i veckan väntar september-KPI, producentpriser och detaljhandel. De utfallen blir viktiga för hur investerare bedömer samspelet mellan bankvinster, konsumentstyrka och Federal Reserves räntebana.",
        "DivLabs redaktionella bedömning är att dagens huvudberättelse är splittringen under ytan: starka rapportdetaljer belönas selektivt, samtidigt som chiporon håller tillbaka Nasdaq. Det är en sammanvägning av verifierade data, inte en prognos om dagens slutkurser.",
      ],
    },
  ],
  sources: [
    {
      text:
        "JPMorgan Chase Investor Relations: officiell sida för kvartalsrapporter och Q3-material 2026",
      href: "https://www.jpmorganchase.com/ir/quarterly-earnings",
    },
    {
      text:
        "Wells Fargo Investor Relations: officiell Q3-rapport, presentation och kvartalssupplement 2026",
      href: "https://www.wellsfargo.com/about/investor-relations/quarterly-earnings/",
    },
    {
      text:
        "Goldman Sachs Investor Relations: officiell sida för Q3-rapporten och kvartalsmaterial 2026",
      href: "https://www.goldmansachs.com/investor-relations/financials/quarterly-earnings-releases",
    },
    {
      text:
        "Citigroup Investor Relations: officiellt publiceringsschema för Q3-resultat och rapportkonferens den 13 oktober 2026",
      href: "https://www.citigroup.com/global/news/press-release/2026/citi-third-quarter-2026-earnings-call",
    },
    {
      text:
        "Reuters: tidsstämplad terminsbild, bankreaktioner och chipaktier inför Wall Streets öppning den 13 oktober 2026",
      href: "https://www.reuters.com/business/sp-500-futures-muted-investors-await-big-bank-earnings-chip-weakness-weighs-2026-10-13/",
    },
    {
      text:
        "Reuters: Goldman Sachs Q3-vinst, intäkter, affärsområden och förhandelsreaktion den 13 oktober 2026",
      href: "https://www.reuters.com/business/finance/goldman-sachs-quarterly-profit-rises-equities-strength-2026-10-13/",
    },
  ],
};
