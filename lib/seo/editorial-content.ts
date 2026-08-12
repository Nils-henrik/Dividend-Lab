import type { LearningArticle } from "@/data/learning/types";
import type { NewsArticle } from "@/types/news";

export const DIVLAB_EDITORIAL_AUTHOR = "DivLab Redaktion";

type NewsSeoOverride = {
  seoTitle: string;
  seoDescription?: string;
};

type LearningSeoOverride = {
  seoTitle: string;
  description: string;
  relatedArticleSlugs: string[];
};

/**
 * Search-intent titles for the currently published Börsnyheter archive.
 * The on-page H1/title remains editorial; these strings are optimized for
 * Google title links and must not include the global "| DivLab" suffix.
 */
export const NEWS_SEO_OVERRIDES: Record<string, NewsSeoOverride> = {
  "aktierekar-infor-nasta-vecka-microsoft-meta-amazon-sinch": {
    seoTitle: "Aktierekar: Microsoft, Meta, Amazon och svenska aktier",
  },
  "amazon-rusar-micron-tvavander-ai-boomen-wall-street": {
    seoTitle: "Amazon rusar, Micron faller: AI-aktier i fokus",
  },
  "borssverige-12-augusti-2026": {
    seoTitle: "Börsen idag 12 augusti: G5 tappar, Ferronordic vänder",
    seoDescription:
      "G5 tappar intäkter medan Ferronordic vänder till vinst. Här är dagens viktigaste svenska rapporter, order och börsnyheter den 12 augusti.",
  },
  "borsvecka-32-investor-inflation-usa-jobb": {
    seoTitle: "Börsen vecka 32: Investor, inflation och USA-jobb",
  },
  "borsvecka-33": {
    seoTitle: "Börsen vecka 33: inflation, räntor och rapporter",
  },
  "borsveckan-i-korthet-ai-frossa-oljerusning-rantehot": {
    seoTitle: "Börsveckan i korthet: AI-frossa, oljerusning och räntehot",
  },
  "borsveckan-som-gick-vecka-32-2026": {
    seoTitle: "Börsveckan vecka 32: det viktigaste som hände",
  },
  "iran-oljepris-hormuz-borsen": {
    seoTitle: "Iran och Hormuz: så påverkas oljepriset och börsen",
  },
  "nokia-overraskar-ai-forsaljningen-fordubblades": {
    seoTitle: "Nokia överraskar: AI-försäljningen fördubblas",
  },
  "norden-i-centrum-4-augusti-2026": {
    seoTitle: "Nordiska börsen 4 augusti: Asmodee, olja och Novo Nordisk",
    seoDescription:
      "Asmodee överraskar, oljan styr Oslo och Novo Nordisk står inför rapport. Här är de viktigaste nordiska börsnyheterna den 4 augusti 2026.",
  },
  "norden-i-centrum-5-augusti-2026": {
    seoTitle: "Nordiska börsen 5 augusti: Novo Nordisk, Coffee Stain och W5",
    seoDescription:
      "Novo Nordisk möter marknaden, Coffee Stain växer och W5 Solutions dubblar försäljningen. Här är nordiska börsen den 5 augusti 2026.",
  },
  "norden-i-centrum-6-augusti-2026": {
    seoTitle: "Nordiska börsen 6 augusti: Yubico, Nordic Semi och Hexagon",
    seoDescription:
      "Yubico lyfter lönsamheten, Nordic Semiconductor växer och Hexagon Composites höjer prognosen. Här är nordiska börsen den 6 augusti 2026.",
  },
  "norden-i-centrum-7-augusti-2026": {
    seoTitle: "Nordiska börsen 7 augusti: USA-jobb, olja och rapporter",
    seoDescription:
      "USA:s jobbrapport, stigande oljepris och rapporter från EQL Pharma, Safello, Tokmanni och Suominen står i fokus på nordiska börsen den 7 augusti.",
  },
  "norden-i-centrum-10-augusti-2026": {
    seoTitle: "Nordiska börsen 10 augusti: olja, Novo Nordisk och Nilörngruppen",
    seoDescription:
      "Oljepriset och Hormuz sätter tonen när Novo Nordisk söker fotfäste och Nilörngruppen gör sista handelsdagen. Nordiska börsen den 10 augusti.",
  },
  "norden-i-centrum-11-augusti-2026": {
    seoTitle: "Nordiska börsen 11 augusti: olja, Storskogen och RevolutionRace",
    seoDescription:
      "Oljepriset stiger samtidigt som Storskogen och RevolutionRace står i fokus. Här är nordiska börsen och dagens viktigaste aktier den 11 augusti.",
  },
  "norden-i-centrum-12-augusti-2026": {
    seoTitle: "Nordiska börsen 12 augusti: Sampo, Ferronordic och Demant",
    seoDescription:
      "Sampo höjer utsikterna, Ferronordic vänder till vinst och Demant höjer prognosen. Här är dagens viktigaste nordiska börsnyheter den 12 augusti.",
  },
  "onsdagens-rapporter-tesla-ibm": {
    seoTitle: "Tesla och IBM rapporterar: det här bevakar marknaden",
  },
  "sinch-rasar-efter-q2-rapporten-2026": {
    seoTitle: "Sinch Q2: aktien rasar 13 procent efter rapporten",
  },
  "sivers-rusar-ai-fotonik-usa-importregler": {
    seoTitle: "Sivers rusar: AI-fotonik och USA-regler lyfter aktien",
  },
  "ukraina-wildberries-ryssland-bensin-inflation": {
    seoTitle: "Ukraina, Wildberries och rysk bensin: marknaden i fokus",
  },
  "usa-borsen-faller-alphabet-tesla-olja": {
    seoTitle: "USA-börsen faller: Alphabet, Tesla och oljepriset i fokus",
  },
};

/**
 * Search-intent copy and internal-link clusters for the full Learning library.
 * These are deliberately factual and evergreen; article bodies remain unchanged.
 */
export const LEARNING_SEO_OVERRIDES: Record<string, LearningSeoOverride> = {
  "borja-investera-pa-borsen": {
    seoTitle: "Börja investera på börsen: guide för nybörjare 2026",
    description:
      "Lär dig börja investera på börsen steg för steg. Vi går igenom buffert, risk, ISK, indexfonder, aktier, avgifter och vanliga nybörjarmisstag.",
    relatedArticleSlugs: [
      "vad-ar-en-aktie",
      "vad-ar-en-indexfond",
      "isk-eller-kapitalforsakring",
      "ranta-pa-ranta",
      "pe-tal-vad-betyder-det",
    ],
  },
  "direktavkastning-och-utdelningssakerhet": {
    seoTitle: "Direktavkastning: så bedömer du en hållbar utdelning",
    description:
      "Vad är direktavkastning och hur bedömer man om en utdelning är hållbar? Lär dig om kassaflöde, utdelningsandel, skulder och vanliga fallgropar.",
    relatedArticleSlugs: [
      "vad-ar-en-aktie",
      "pe-tal-vad-betyder-det",
      "borja-investera-pa-borsen",
      "vad-ar-en-etf",
    ],
  },
  "fire-ekonomisk-frihet": {
    seoTitle: "FIRE: ekonomisk frihet och 4-procentsregeln",
    description:
      "Vad är FIRE och hur mycket kapital krävs för ekonomisk frihet? Lär dig om sparkvot, 4-procentsregeln, risker och svenska förutsättningar.",
    relatedArticleSlugs: [
      "tid-till-ekonomisk-frihet",
      "sparkvot-budgetera-lonen-i-procent",
      "ranta-pa-ranta",
      "sparande-i-borjan",
      "borja-investera-pa-borsen",
    ],
  },
  "isk-eller-kapitalforsakring": {
    seoTitle: "ISK eller kapitalförsäkring (KF): skillnaden 2026",
    description:
      "ISK och kapitalförsäkring beskattas på liknande sätt men skiljer sig i ägande, källskatt och förmånstagare. Så fungerar ISK och KF 2026.",
    relatedArticleSlugs: [
      "borja-investera-pa-borsen",
      "vad-ar-en-aktie",
      "vad-ar-en-indexfond",
      "vad-ar-en-etf",
      "direktavkastning-och-utdelningssakerhet",
    ],
  },
  "pe-tal-vad-betyder-det": {
    seoTitle: "P/E-tal: vad betyder P/E och hur räknar man?",
    description:
      "Vad betyder P/E-tal? Lär dig hur P/E räknas ut, vad högt och lågt P/E kan säga om en aktie och varför nyckeltalet aldrig bör användas ensamt.",
    relatedArticleSlugs: [
      "vad-ar-en-aktie",
      "direktavkastning-och-utdelningssakerhet",
      "borja-investera-pa-borsen",
    ],
  },
  "ranta-pa-ranta": {
    seoTitle: "Ränta på ränta: så fungerar effekten + exempel",
    description:
      "Vad är ränta på ränta och varför blir tiden så viktig? Se enkla exempel på hur månadssparande och avkastning kan få kapitalet att växa.",
    relatedArticleSlugs: [
      "sparande-i-borjan",
      "sparkvot-budgetera-lonen-i-procent",
      "fire-ekonomisk-frihet",
      "tid-till-ekonomisk-frihet",
      "borja-investera-pa-borsen",
    ],
  },
  "sparande-i-borjan": {
    seoTitle: "Spara pengar i början: därför betyder månadssparandet mest",
    description:
      "Varför betyder sparandet mest i början? Se hur månadssparande, vanor och ränta på ränta påverkar vägen från ett litet till ett större kapital.",
    relatedArticleSlugs: [
      "ranta-pa-ranta",
      "sparkvot-budgetera-lonen-i-procent",
      "borja-investera-pa-borsen",
      "fire-ekonomisk-frihet",
    ],
  },
  "sparkvot-budgetera-lonen-i-procent": {
    seoTitle: "Sparkvot: så räknar du och budgeterar lönen i procent",
    description:
      "Vad är sparkvot och hur räknar man ut den? Lär dig budgetera lönen i procent, hitta en hållbar sparnivå och följa hur sparkvoten utvecklas.",
    relatedArticleSlugs: [
      "sparande-i-borjan",
      "ranta-pa-ranta",
      "fire-ekonomisk-frihet",
      "tid-till-ekonomisk-frihet",
    ],
  },
  "ta-kontroll-over-premiepensionen": {
    seoTitle: "Premiepension (PPM): så fungerar fondval och pension",
    description:
      "Hur fungerar premiepensionen och PPM? Lär dig om fondval, avgifter, risk och vad du kan kontrollera själv i den svenska premiepensionen.",
    relatedArticleSlugs: [
      "vad-ar-en-indexfond",
      "vad-ar-en-etf",
      "borja-investera-pa-borsen",
      "ranta-pa-ranta",
    ],
  },
  "tid-till-ekonomisk-frihet": {
    seoTitle: "Ekonomisk frihet: så räknar du ut hur lång tid det tar",
    description:
      "Hur lång tid tar det att nå ekonomisk frihet? Se hur sparkvot, kapital, avkastning och utgifter påverkar vägen till ditt ekonomiska mål.",
    relatedArticleSlugs: [
      "fire-ekonomisk-frihet",
      "sparkvot-budgetera-lonen-i-procent",
      "ranta-pa-ranta",
      "sparande-i-borjan",
    ],
  },
  "vad-ar-en-aktie": {
    seoTitle: "Vad är en aktie? Enkel guide för nybörjare",
    description:
      "Vad är en aktie och hur fungerar aktiemarknaden? Lär dig om ägande, avkastning, utdelning, risk och vad som får en aktiekurs att röra sig.",
    relatedArticleSlugs: [
      "borja-investera-pa-borsen",
      "pe-tal-vad-betyder-det",
      "direktavkastning-och-utdelningssakerhet",
      "vad-ar-en-indexfond",
    ],
  },
  "vad-ar-en-etf": {
    seoTitle: "Vad är en ETF? Börshandlade fonder förklarade",
    description:
      "Vad är en ETF och hur skiljer den sig från en vanlig fond? Lär dig hur börshandlade fonder fungerar, vilka kostnader som finns och vilka risker du bör känna till.",
    relatedArticleSlugs: [
      "vad-ar-en-indexfond",
      "borja-investera-pa-borsen",
      "isk-eller-kapitalforsakring",
      "vad-ar-en-aktie",
    ],
  },
  "vad-ar-en-indexfond": {
    seoTitle: "Vad är en indexfond? Så fungerar indexfonder",
    description:
      "Vad är en indexfond och varför är avgiften viktig? Lär dig hur indexfonder följer marknaden, hur riskspridning fungerar och vad du bör jämföra.",
    relatedArticleSlugs: [
      "vad-ar-en-etf",
      "borja-investera-pa-borsen",
      "isk-eller-kapitalforsakring",
      "ranta-pa-ranta",
    ],
  },
};

export function applyNewsSearchSeo(article: NewsArticle): NewsArticle {
  const override = article.slug ? NEWS_SEO_OVERRIDES[article.slug] : undefined;

  return {
    ...article,
    seoTitle: override?.seoTitle ?? article.seoTitle ?? article.title,
    seoDescription:
      override?.seoDescription ?? article.seoDescription ?? article.summary,
  };
}

export function applyLearningSearchSeo(article: LearningArticle): LearningArticle {
  const override = LEARNING_SEO_OVERRIDES[article.slug];

  return {
    ...article,
    ...(override
      ? {
          seoTitle: override.seoTitle,
          description: override.description,
          relatedArticleSlugs: override.relatedArticleSlugs,
        }
      : {
          seoTitle: article.seoTitle ?? article.title,
        }),
    authorName: article.authorName ?? DIVLAB_EDITORIAL_AUTHOR,
  };
}
