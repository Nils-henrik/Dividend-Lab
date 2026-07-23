import type { NewsArticle } from "@/types/news";
import { IRAN_OLJEPRIS_HORMUZ_BORSEN_ARTICLE } from "@/data/news-articles/iran-oljepris-hormuz-borsen";
import { NOKIA_OVERRASKAR_AI_FORSALJNINGEN_FORDUBBLADES_ARTICLE } from "@/data/news-articles/nokia-overraskar-ai-forsaljningen-fordubblades";
import { ONSDAGENS_RAPPORTER_TESLA_IBM_ARTICLE } from "@/data/news-articles/onsdagens-rapporter-tesla-ibm";
import { SINCH_RASAR_EFTER_Q2_RAPPORTEN_2026_ARTICLE } from "@/data/news-articles/sinch-rasar-efter-q2-rapporten-2026";

/**
 * Temporary demo content for Börsnyheter UI development.
 * Not live or verified financial news — replace via a provider adapter later.
 */
export const DEMO_NEWS_ARTICLES: NewsArticle[] = [
  NOKIA_OVERRASKAR_AI_FORSALJNINGEN_FORDUBBLADES_ARTICLE,
  SINCH_RASAR_EFTER_Q2_RAPPORTEN_2026_ARTICLE,
  ONSDAGENS_RAPPORTER_TESLA_IBM_ARTICLE,
  IRAN_OLJEPRIS_HORMUZ_BORSEN_ARTICLE,
  {
    id: "demo-market-1",
    title: "Stockholmsbörsen öppnade försiktigt upp efter makrosignalerna från USA",
    summary:
      "OMXS30 steg marginellt i öppningshandeln medan investerare vägde in räntebesked och sektorrotation inom verkstad och bank.",
    category: "market",
    source: "DivLab Marknadsnotis (exempel)",
    publishedAt: "2026-07-10T07:45:00+02:00",
    url: null,
    featured: true,
    imageUrl: "/news-demo/market-overview.svg",
  },
  {
    id: "demo-market-2",
    title: "Volatiliteten på europeiska index ligger kvar under veckans medel",
    summary:
      "Handeln beskrivs som selektiv med fokus på rapporter och utdelningskalender snarare än bred marknadsrörelse.",
    category: "market",
    source: "DivLab Marknadsnotis (exempel)",
    publishedAt: "2026-07-09T16:20:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/global-markets.svg",
  },
  {
    id: "demo-company-1",
    title: "Nordisk verkstadskoncern lyfter utsikterna inför Q2",
    summary:
      "Bolaget pekar på stabil orderingång i Norden och förbättrad marginal i eftermarknad, enligt exempelartikel för gränssnittsdesign.",
    category: "company",
    source: "DivLab Bolagsnotis (exempel)",
    publishedAt: "2026-07-10T06:30:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/company-report.svg",
  },
  {
    id: "demo-company-2",
    title: "Svensk banksektor i fokus efter kapitalbuffertdiskussion",
    summary:
      "Marknadsaktörer följer hur nordiska banker balanserar utdelning, återköp och regulatoriska krav i ett exempelscenario.",
    category: "company",
    source: "DivLab Bolagsnotis (exempel)",
    publishedAt: "2026-07-08T11:10:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/company-report.svg",
  },
  {
    id: "demo-macro-1",
    title: "Riksbankens senaste kommunikation väger tyngre än väntat i terminsmarknaden",
    summary:
      "Exempelartikel som visar hur makronyheter kan presenteras med saklig ton utan att ge investeringsråd.",
    category: "macro",
    source: "DivLab Makronotis (exempel)",
    publishedAt: "2026-07-09T09:05:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/macro-economics.svg",
  },
  {
    id: "demo-macro-2",
    title: "Inflationsindikatorer i fokus inför veckans statistikflöde",
    summary:
      "Investerare följer KPI och arbetsmarknadsdata för att bedöma räntebana, presenterat som demonstrationsinnehåll.",
    category: "macro",
    source: "DivLab Makronotis (exempel)",
    publishedAt: "2026-07-07T14:40:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/macro-economics.svg",
  },
  {
    id: "demo-funds-1",
    title: "Utdelnings-ETF:er fortsätter attrahera långsiktigt sparande",
    summary:
      "Flödesdata i exempelform visar intresse för globala utdelningsstrategier och nordiska fokusfonder.",
    category: "funds-etfs",
    source: "DivLab Fondnotis (exempel)",
    publishedAt: "2026-07-09T12:15:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/funds-etfs.svg",
  },
  {
    id: "demo-funds-2",
    title: "Ny fonduppdatering lyfter transparens kring totala avgifter",
    summary:
      "Demonstrationsartikel om fond- och ETF-relaterade nyheter utan att rekommendera specifika produkter.",
    category: "funds-etfs",
    source: "DivLab Fondnotis (exempel)",
    publishedAt: "2026-07-06T08:55:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/funds-etfs.svg",
  },
  {
    id: "demo-dividends-1",
    title: "Fler nordiska bolag bekräftar utdelningsbesked inför sommaren",
    summary:
      "Exempel på hur utdelningsnyheter kan sammanfattas med tydlig källhänvisning och utan köp- eller säljsignaler.",
    category: "dividends",
    source: "DivLab Utdelningsnotis (exempel)",
    publishedAt: "2026-07-10T05:50:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/dividends.svg",
  },
  {
    id: "demo-dividends-2",
    title: "Utdelningskalender: kommande ex-datum i fokus för långsiktiga investerare",
    summary:
      "Demonstrationsartikel som visar hur utdelningshändelser kan presenteras i ett professionellt nyhetsflöde.",
    category: "dividends",
    source: "DivLab Utdelningsnotis (exempel)",
    publishedAt: "2026-07-05T10:25:00+02:00",
    url: null,
    featured: false,
    imageUrl: "/news-demo/dividends.svg",
  },
];
