import type { LearningArticle } from "@/data/learning/types";
import { DIVLAB_EDITORIAL_AUTHOR } from "@/lib/seo/editorial-content";

type LearningSeoOverride = {
  seoTitle: string;
  description: string;
  searchTerms: string[];
  relatedArticleSlugs: string[];
};

/**
 * Search-intent layer for every published Learning article.
 *
 * Principles:
 * - match natural Swedish search phrasing without keyword stuffing
 * - keep the editorial H1 independent from the Google title when useful
 * - use descriptions as useful on-page copy, not a list of keywords
 * - add search aliases for DivLab's own global search
 * - connect articles through genuinely useful topic clusters
 */
export const LEARNING_SEARCH_OVERRIDES: Record<string, LearningSeoOverride> = {
  "aktieaterkop-varfor-koper-bolag-egna-aktier": {
    seoTitle: "Aktieåterköp: vad betyder det och hur påverkas aktien?",
    description:
      "Vad är aktieåterköp och varför köper bolag egna aktier? Lär dig hur återköp påverkar EPS, utestående aktier, ägarandel, utdelning och aktiekurs.",
    searchTerms: [
      "aktieåterköp",
      "vad är aktieåterköp",
      "återköp av egna aktier",
      "varför köper bolag egna aktier",
      "hur påverkar aktieåterköp aktiekursen",
      "utestående aktier",
      "vinst per aktie eps",
    ],
    relatedArticleSlugs: [
      "sa-laser-du-en-kvartalsrapport",
      "pe-tal-vad-betyder-det",
      "direktavkastning-och-utdelningssakerhet",
      "vad-ar-en-aktie",
      "borsens-ordlista",
    ],
  },
  "barnsparande-2026-hur-mycket-ska-man-spara-till-barn": {
    seoTitle: "Barnsparande 2026: hur mycket ska man spara till barn?",
    description:
      "Hur mycket ska man spara till barn 2026? Läs om barnsparande, barnbidraget, 650 kronor i månaden och skillnaden mellan eget namn och barnets namn.",
    searchTerms: [
      "barnsparande",
      "barnsparande 2026",
      "spara till barn",
      "hur mycket ska man spara till barn",
      "hur mycket ska man spara till sitt barn",
      "spara barnbidraget",
      "spara till barn i eget namn",
      "spara i barnets namn",
      "barnsparande isk eller kapitalförsäkring",
    ],
    relatedArticleSlugs: [
      "ranta-pa-ranta",
      "isk-eller-kapitalforsakring",
      "sparande-i-borjan",
      "sparkvot-budgetera-lonen-i-procent",
      "hur-mycket-bor-man-ha-sparat-vid-25-35-45-65",
    ],
  },
  "borja-investera-pa-borsen": {
    seoTitle: "Börja investera på börsen: guide för nybörjare 2026",
    description:
      "Hur börjar man investera på börsen? En guide för nybörjare om buffert, ISK, indexfonder, aktier, risk, avgifter, månadssparande och vanliga misstag.",
    searchTerms: [
      "börja investera",
      "börja investera på börsen",
      "investera för nybörjare",
      "hur börjar man investera",
      "börja med aktier",
      "aktier för nybörjare",
      "börja spara i fonder",
      "isk nybörjare",
    ],
    relatedArticleSlugs: [
      "vad-ar-en-aktie",
      "vad-ar-en-indexfond",
      "isk-eller-kapitalforsakring",
      "ranta-pa-ranta",
      "vad-ar-en-etf",
    ],
  },
  "borsens-ordlista": {
    seoTitle: "Börsordlista: 62 vanliga börstermer förklarade",
    description:
      "Vad betyder P/E-tal, EBITDA, BTA, substansrabatt och short squeeze? DivLabs börsordlista förklarar 62 vanliga börstermer och aktiebegrepp enkelt.",
    searchTerms: [
      "börsordlista",
      "börstermer",
      "aktietermer",
      "aktiebegrepp",
      "ekonomiska begrepp börsen",
      "vad betyder p e tal",
      "vad betyder ebitda",
      "vad betyder bta",
      "vad betyder short squeeze",
      "substansrabatt",
    ],
    relatedArticleSlugs: [
      "sa-laser-du-en-kvartalsrapport",
      "pe-tal-vad-betyder-det",
      "teknisk-analys-for-nyborjare",
      "vad-ar-en-aktie",
      "aktieaterkop-varfor-koper-bolag-egna-aktier",
    ],
  },
  "direktavkastning-och-utdelningssakerhet": {
    seoTitle: "Direktavkastning: vad är det och vad är en bra nivå?",
    description:
      "Vad är direktavkastning och vad är en bra nivå? Lär dig räkna direktavkastning och bedöma utdelningsandel, kassaflöde, skulder och hållbar utdelning.",
    searchTerms: [
      "direktavkastning",
      "vad är direktavkastning",
      "vad är en bra direktavkastning",
      "bra direktavkastning",
      "direktavkastning formel",
      "utdelningsaktier",
      "utdelningsandel",
      "hållbar utdelning",
    ],
    relatedArticleSlugs: [
      "leva-pa-utdelningar-kapital",
      "vad-ar-en-aktie",
      "pe-tal-vad-betyder-det",
      "sa-laser-du-en-kvartalsrapport",
      "aktieaterkop-varfor-koper-bolag-egna-aktier",
    ],
  },
  "fire-ekonomisk-frihet": {
    seoTitle: "FIRE och ekonomisk frihet: så fungerar 4-procentsregeln",
    description:
      "Vad är FIRE och hur når man ekonomisk frihet? Lär dig om sparkvot, 4-procentsregeln, kapitalbehov, risker och svenska förutsättningar.",
    searchTerms: [
      "fire",
      "fire sverige",
      "ekonomisk frihet",
      "financial independence retire early",
      "4 procent regeln",
      "fyra procent regeln",
      "hur mycket pengar behövs för ekonomisk frihet",
      "sluta jobba tidigt",
    ],
    relatedArticleSlugs: [
      "tid-till-ekonomisk-frihet",
      "sparkvot-budgetera-lonen-i-procent",
      "ranta-pa-ranta",
      "sparande-i-borjan",
      "leva-pa-utdelningar-kapital",
    ],
  },
  "hur-mycket-bor-man-ha-sparat-vid-25-35-45-65": {
    seoTitle: "Hur mycket bör man ha sparat vid 25, 35, 45 och 65?",
    description:
      "Hur mycket pengar bör man ha sparat vid 25, 35, 45 och 65? Jämför sparande efter ålder och förstå hur inkomst, pension, mål och risk påverkar nivån.",
    searchTerms: [
      "hur mycket bör man ha sparat",
      "hur mycket pengar bör man ha sparat",
      "hur mycket ska man ha sparat",
      "sparande vid 25",
      "sparande vid 35",
      "sparande vid 45",
      "sparande vid 65",
      "hur mycket sparande är normalt",
    ],
    relatedArticleSlugs: [
      "sparkvot-budgetera-lonen-i-procent",
      "ranta-pa-ranta",
      "fire-ekonomisk-frihet",
      "ta-kontroll-over-premiepensionen",
      "barnsparande-2026-hur-mycket-ska-man-spara-till-barn",
    ],
  },
  "isk-eller-kapitalforsakring": {
    seoTitle: "ISK eller kapitalförsäkring (KF): skillnaden 2026",
    description:
      "ISK eller kapitalförsäkring 2026? Jämför skatt, ägande, källskatt, utländska aktier och förmånstagare och förstå skillnaden mellan ISK och KF.",
    searchTerms: [
      "isk eller kapitalförsäkring",
      "isk vs kf",
      "kapitalförsäkring eller isk",
      "isk skatt 2026",
      "kapitalförsäkring 2026",
      "utländska aktier isk eller kf",
      "källskatt kapitalförsäkring",
      "förmånstagare kapitalförsäkring",
    ],
    relatedArticleSlugs: [
      "borja-investera-pa-borsen",
      "vad-ar-en-indexfond",
      "vad-ar-en-etf",
      "barnsparande-2026-hur-mycket-ska-man-spara-till-barn",
      "direktavkastning-och-utdelningssakerhet",
    ],
  },
  "leva-pa-utdelningar-kapital": {
    seoTitle: "Leva på utdelningar: så mycket kapital krävs",
    description:
      "Hur mycket kapital krävs för att leva på utdelningar? Se räkneexempel för 10 000, 20 000 och 30 000 kronor i månaden och hur direktavkastning påverkar.",
    searchTerms: [
      "leva på utdelningar",
      "hur mycket kapital krävs för utdelningar",
      "hur mycket kapital behövs för utdelningar",
      "utdelning per månad",
      "passiv inkomst aktier",
      "utdelningsportfölj",
      "direktavkastning",
    ],
    relatedArticleSlugs: [
      "direktavkastning-och-utdelningssakerhet",
      "fire-ekonomisk-frihet",
      "ranta-pa-ranta",
      "isk-eller-kapitalforsakring",
      "tid-till-ekonomisk-frihet",
    ],
  },
  "pe-tal-vad-betyder-det": {
    seoTitle: "P/E-tal: vad är ett bra P/E och hur räknar man?",
    description:
      "Vad är P/E-tal och vad räknas som ett bra P/E? Lär dig formeln, skillnaden mellan högt och lågt P/E och hur nyckeltalet används vid aktievärdering.",
    searchTerms: [
      "p e tal",
      "pe tal",
      "vad är p e tal",
      "vad är ett bra p e tal",
      "högt p e tal",
      "lågt p e tal",
      "p e tal formel",
      "värdera aktier",
    ],
    relatedArticleSlugs: [
      "vad-ar-en-aktie",
      "sa-laser-du-en-kvartalsrapport",
      "direktavkastning-och-utdelningssakerhet",
      "aktieaterkop-varfor-koper-bolag-egna-aktier",
      "borsens-ordlista",
    ],
  },
  "ranta-pa-ranta": {
    seoTitle: "Ränta på ränta: så fungerar effekten med exempel",
    description:
      "Vad är ränta på ränta och hur fungerar effekten? Se enkla exempel på månadssparande, avkastning, spartid och hur kapital kan växa över många år.",
    searchTerms: [
      "ränta på ränta",
      "ränta på ränta effekt",
      "hur fungerar ränta på ränta",
      "ränta på ränta exempel",
      "månadssparande ränta på ränta",
      "ränta på ränta formel",
      "avkastning över tid",
    ],
    relatedArticleSlugs: [
      "sparande-i-borjan",
      "sparkvot-budgetera-lonen-i-procent",
      "fire-ekonomisk-frihet",
      "barnsparande-2026-hur-mycket-ska-man-spara-till-barn",
      "tid-till-ekonomisk-frihet",
    ],
  },
  "sa-laser-du-en-kvartalsrapport": {
    seoTitle: "Läsa kvartalsrapport: guide till EBIT, kassaflöde och balans",
    description:
      "Hur läser man en kvartalsrapport? Lär dig tolka omsättning, EBIT, EBITDA, marginaler, kassaflöde och balansräkning och hitta det viktigaste i rapporten.",
    searchTerms: [
      "kvartalsrapport",
      "hur läser man en kvartalsrapport",
      "läsa kvartalsrapport",
      "läsa rapport aktier",
      "ebit",
      "ebitda",
      "kassaflöde",
      "balansräkning",
      "rörelsemarginal",
      "omsättning",
    ],
    relatedArticleSlugs: [
      "aktieaterkop-varfor-koper-bolag-egna-aktier",
      "pe-tal-vad-betyder-det",
      "direktavkastning-och-utdelningssakerhet",
      "borsens-ordlista",
      "teknisk-analys-for-nyborjare",
    ],
  },
  "sparande-i-borjan": {
    seoTitle: "Börja spara pengar: så bygger du kapital från grunden",
    description:
      "Hur börjar man spara pengar från noll? Lär dig bygga buffert, skapa ett hållbart månadssparande och förstå varför de första sparade kronorna betyder mycket.",
    searchTerms: [
      "börja spara",
      "börja spara pengar",
      "hur börjar man spara",
      "spara pengar",
      "månadsspara",
      "bygga kapital",
      "sparande från noll",
      "buffert",
    ],
    relatedArticleSlugs: [
      "ranta-pa-ranta",
      "sparkvot-budgetera-lonen-i-procent",
      "borja-investera-pa-borsen",
      "hur-mycket-bor-man-ha-sparat-vid-25-35-45-65",
      "barnsparande-2026-hur-mycket-ska-man-spara-till-barn",
    ],
  },
  "sparkvot-budgetera-lonen-i-procent": {
    seoTitle: "Sparkvot: hur mycket av lönen bör man spara?",
    description:
      "Vad är sparkvot och hur mycket av lönen bör man spara? Lär dig räkna ut sparkvoten, budgetera lönen i procent och hitta en hållbar nivå för ditt sparande.",
    searchTerms: [
      "sparkvot",
      "vad är sparkvot",
      "hur mycket av lönen bör man spara",
      "hur mycket ska man spara av lönen",
      "spara procent av lön",
      "budgetera lönen",
      "sparande procent av inkomst",
    ],
    relatedArticleSlugs: [
      "sparande-i-borjan",
      "ranta-pa-ranta",
      "fire-ekonomisk-frihet",
      "tid-till-ekonomisk-frihet",
      "hur-mycket-bor-man-ha-sparat-vid-25-35-45-65",
    ],
  },
  "ta-kontroll-over-premiepensionen": {
    seoTitle: "Premiepension och PPM: AP7 Såfa, fondval och avgifter",
    description:
      "Hur fungerar premiepensionen och PPM? Läs om AP7 Såfa, egna fondval, avgifter, risk och vad du kan ändra själv hos Pensionsmyndigheten.",
    searchTerms: [
      "premiepension",
      "ppm",
      "premiepension fonder",
      "ppm fonder",
      "byta ppm fonder",
      "ap7 såfa",
      "pensionsmyndigheten premiepension",
      "fondavgift pension",
    ],
    relatedArticleSlugs: [
      "vad-ar-en-indexfond",
      "vad-ar-en-etf",
      "ranta-pa-ranta",
      "hur-mycket-bor-man-ha-sparat-vid-25-35-45-65",
      "isk-eller-kapitalforsakring",
    ],
  },
  "teknisk-analys-for-nyborjare": {
    seoTitle: "Teknisk analys för nybörjare: RSI, MA200, stöd och motstånd",
    description:
      "Lär dig teknisk analys från grunden. Vi förklarar trend, stöd och motstånd, RSI, MA50, MA200 och volym så att du lättare kan läsa en aktiegraf.",
    searchTerms: [
      "teknisk analys",
      "teknisk analys nybörjare",
      "läsa aktiegraf",
      "stöd och motstånd",
      "rsi",
      "ma50",
      "ma200",
      "glidande medelvärde",
      "volym aktier",
    ],
    relatedArticleSlugs: [
      "vad-ar-en-aktie",
      "sa-laser-du-en-kvartalsrapport",
      "pe-tal-vad-betyder-det",
      "borsens-ordlista",
      "borja-investera-pa-borsen",
    ],
  },
  "tid-till-ekonomisk-frihet": {
    seoTitle: "Ekonomisk frihet: hur mycket kapital behöver du?",
    description:
      "Hur mycket pengar behövs för ekonomisk frihet och hur lång tid tar det? Se hur utgifter, sparkvot, kapital och antagen avkastning påverkar vägen till målet.",
    searchTerms: [
      "ekonomisk frihet",
      "hur mycket pengar behövs för ekonomisk frihet",
      "hur mycket kapital behövs för ekonomisk frihet",
      "hur lång tid till ekonomisk frihet",
      "sluta jobba",
      "frihetskapital",
      "sparkvot ekonomisk frihet",
    ],
    relatedArticleSlugs: [
      "fire-ekonomisk-frihet",
      "sparkvot-budgetera-lonen-i-procent",
      "ranta-pa-ranta",
      "leva-pa-utdelningar-kapital",
      "sparande-i-borjan",
    ],
  },
  "vad-ar-en-aktie": {
    seoTitle: "Vad är en aktie? Så fungerar aktier för nybörjare",
    description:
      "Vad är en aktie och hur fungerar aktier? En enkel guide för nybörjare om ägande, aktiekurs, utdelning, avkastning, risk och hur börsen fungerar.",
    searchTerms: [
      "vad är en aktie",
      "hur fungerar aktier",
      "aktier för nybörjare",
      "köpa aktier",
      "aktiekurs",
      "aktieutdelning",
      "avkastning aktier",
      "hur fungerar börsen",
    ],
    relatedArticleSlugs: [
      "borja-investera-pa-borsen",
      "pe-tal-vad-betyder-det",
      "direktavkastning-och-utdelningssakerhet",
      "vad-ar-en-indexfond",
      "teknisk-analys-for-nyborjare",
    ],
  },
  "vad-ar-en-etf": {
    seoTitle: "Vad är en ETF? Börshandlade fonder förklarade",
    description:
      "Vad är en ETF och hur fungerar en börshandlad fond? Lär dig skillnaden mellan ETF och vanlig fond, handel, avgifter, riskspridning och vanliga risker.",
    searchTerms: [
      "etf",
      "vad är etf",
      "börshandlad fond",
      "etf vs fond",
      "etf eller fond",
      "köpa etf",
      "etf sverige",
      "etf avgift",
    ],
    relatedArticleSlugs: [
      "vad-ar-en-indexfond",
      "borja-investera-pa-borsen",
      "isk-eller-kapitalforsakring",
      "vad-ar-en-aktie",
      "direktavkastning-och-utdelningssakerhet",
    ],
  },
  "vad-ar-en-indexfond": {
    seoTitle: "Vad är en indexfond? Avgifter, risk och global indexfond",
    description:
      "Vad är en indexfond och hur fungerar den? Lär dig om global indexfond, avgifter, riskspridning, passiv förvaltning och skillnaden mot aktivt förvaltade fonder.",
    searchTerms: [
      "indexfond",
      "vad är en indexfond",
      "global indexfond",
      "indexfond avgift",
      "indexfond vs aktiv fond",
      "passiv fond",
      "passiv förvaltning",
      "riskspridning fonder",
    ],
    relatedArticleSlugs: [
      "vad-ar-en-etf",
      "borja-investera-pa-borsen",
      "isk-eller-kapitalforsakring",
      "ranta-pa-ranta",
      "ta-kontroll-over-premiepensionen",
    ],
  },
};

export function applyLearningSearchSeo(article: LearningArticle): LearningArticle {
  const override = LEARNING_SEARCH_OVERRIDES[article.slug];

  return {
    ...article,
    ...(override
      ? {
          seoTitle: override.seoTitle,
          description: override.description,
          searchTerms: override.searchTerms,
          relatedArticleSlugs: override.relatedArticleSlugs,
        }
      : {
          seoTitle: article.seoTitle ?? article.title,
        }),
    authorName: article.authorName ?? DIVLAB_EDITORIAL_AUTHOR,
  };
}
