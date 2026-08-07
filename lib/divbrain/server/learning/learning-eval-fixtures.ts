/**
 * DivBrain roadmap Ticket 1C-3 — deterministic Learning retrieval eval fixture.
 *
 * Curated manually. No LLM generation/judging, network calls, current-time
 * dependence, or paid provider usage. Prompts are intentionally kept only in
 * the fixture/input side and are never copied into eval reports.
 */

export type DivBrainLearningEvalCategory =
  | "premiepension"
  | "fire"
  | "sparkvot"
  | "aktie"
  | "borja_investera"
  | "indexfond"
  | "tid_till_frihet"
  | "direktavkastning"
  | "sparande"
  | "no_match";

export type DivBrainLearningEvalCase = {
  readonly id: string;
  readonly category: DivBrainLearningEvalCategory;
  readonly prompt: string;
  /** Null means retrieval must honestly return zero hits. */
  readonly expectedTopSlug: string | null;
};

export const DIVBRAIN_LEARNING_EVAL_CATEGORIES = [
  "premiepension",
  "fire",
  "sparkvot",
  "aktie",
  "borja_investera",
  "indexfond",
  "tid_till_frihet",
  "direktavkastning",
  "sparande",
  "no_match",
] as const satisfies readonly DivBrainLearningEvalCategory[];

export const DIVBRAIN_LEARNING_EVAL_CASES = [
  {
    id: "learning-premiepension-01",
    category: "premiepension",
    prompt: "premiepension AP7 Såfa",
    expectedTopSlug: "ta-kontroll-over-premiepensionen",
  },
  {
    id: "learning-premiepension-02",
    category: "premiepension",
    prompt: "ta kontroll över premiepensionen",
    expectedTopSlug: "ta-kontroll-over-premiepensionen",
  },
  {
    id: "learning-premiepension-03",
    category: "premiepension",
    prompt: "hur fungerar premiepensionen och AP7",
    expectedTopSlug: "ta-kontroll-over-premiepensionen",
  },
  {
    id: "learning-fire-01",
    category: "fire",
    prompt: "FIRE ekonomisk frihet",
    expectedTopSlug: "fire-ekonomisk-frihet",
  },
  {
    id: "learning-fire-02",
    category: "fire",
    prompt: "financial independence retire early FIRE",
    expectedTopSlug: "fire-ekonomisk-frihet",
  },
  {
    id: "learning-fire-03",
    category: "fire",
    prompt: "ekonomisk frihet med FIRE",
    expectedTopSlug: "fire-ekonomisk-frihet",
  },
  {
    id: "learning-sparkvot-01",
    category: "sparkvot",
    prompt: "sparkvot budgetera lönen i procent",
    expectedTopSlug: "sparkvot-budgetera-lonen-i-procent",
  },
  {
    id: "learning-sparkvot-02",
    category: "sparkvot",
    prompt: "vad betyder sparkvot",
    expectedTopSlug: "sparkvot-budgetera-lonen-i-procent",
  },
  {
    id: "learning-sparkvot-03",
    category: "sparkvot",
    prompt: "hur räknar jag sparkvoten",
    expectedTopSlug: "sparkvot-budgetera-lonen-i-procent",
  },
  {
    id: "learning-aktie-01",
    category: "aktie",
    prompt: "vad är en aktie",
    expectedTopSlug: "vad-ar-en-aktie",
  },
  {
    id: "learning-aktie-02",
    category: "aktie",
    prompt: "hur fungerar aktier",
    expectedTopSlug: "vad-ar-en-aktie",
  },
  {
    id: "learning-aktie-03",
    category: "aktie",
    prompt: "aktie ägarandel i bolag",
    expectedTopSlug: "vad-ar-en-aktie",
  },
  {
    id: "learning-borja-investera-01",
    category: "borja_investera",
    prompt: "börja investera på börsen",
    expectedTopSlug: "borja-investera-pa-borsen",
  },
  {
    id: "learning-borja-investera-02",
    category: "borja_investera",
    prompt: "hur börjar jag investera på börsen",
    expectedTopSlug: "borja-investera-pa-borsen",
  },
  {
    id: "learning-borja-investera-03",
    category: "borja_investera",
    prompt: "nybörjare börja investera börsen",
    expectedTopSlug: "borja-investera-pa-borsen",
  },
  {
    id: "learning-indexfond-01",
    category: "indexfond",
    prompt: "vad är en indexfond",
    expectedTopSlug: "vad-ar-en-indexfond",
  },
  {
    id: "learning-indexfond-02",
    category: "indexfond",
    prompt: "hur fungerar indexfonder",
    expectedTopSlug: "vad-ar-en-indexfond",
  },
  {
    id: "learning-indexfond-03",
    category: "indexfond",
    prompt: "indexfond följer index",
    expectedTopSlug: "vad-ar-en-indexfond",
  },
  {
    id: "learning-tid-frihet-01",
    category: "tid_till_frihet",
    prompt: "tid till ekonomisk frihet",
    expectedTopSlug: "tid-till-ekonomisk-frihet",
  },
  {
    id: "learning-tid-frihet-02",
    category: "tid_till_frihet",
    prompt: "hur lång tid till ekonomisk frihet",
    expectedTopSlug: "tid-till-ekonomisk-frihet",
  },
  {
    id: "learning-tid-frihet-03",
    category: "tid_till_frihet",
    prompt: "beräkna tid till ekonomisk frihet",
    expectedTopSlug: "tid-till-ekonomisk-frihet",
  },
  {
    id: "learning-direktavkastning-01",
    category: "direktavkastning",
    prompt: "direktavkastning och utdelningssäkerhet",
    expectedTopSlug: "direktavkastning-och-utdelningssakerhet",
  },
  {
    id: "learning-direktavkastning-02",
    category: "direktavkastning",
    prompt: "vad är direktavkastning",
    expectedTopSlug: "direktavkastning-och-utdelningssakerhet",
  },
  {
    id: "learning-direktavkastning-03",
    category: "direktavkastning",
    prompt: "utdelningssäkerhet direktavkastning",
    expectedTopSlug: "direktavkastning-och-utdelningssakerhet",
  },
  {
    id: "learning-sparande-01",
    category: "sparande",
    prompt: "sparande i början",
    expectedTopSlug: "sparande-i-borjan",
  },
  {
    id: "learning-sparande-02",
    category: "sparande",
    prompt: "kom igång med sparande i början",
    expectedTopSlug: "sparande-i-borjan",
  },
  {
    id: "learning-sparande-03",
    category: "sparande",
    prompt: "börja med sparande i början",
    expectedTopSlug: "sparande-i-borjan",
  },
  {
    id: "learning-no-match-01",
    category: "no_match",
    prompt: "hur byter man tändstift på en veteranmotorcykel",
    expectedTopSlug: null,
  },
  {
    id: "learning-no-match-02",
    category: "no_match",
    prompt: "recept på surdegsbröd med rågmjöl",
    expectedTopSlug: null,
  },
  {
    id: "learning-no-match-03",
    category: "no_match",
    prompt: "hur konfigurerar man en Ericsson MINI-LINK",
    expectedTopSlug: null,
  },
  {
    id: "learning-no-match-04",
    category: "no_match",
    prompt: "vilka öar finns utanför Karlstad och Kristinehamn",
    expectedTopSlug: null,
  },
  {
    id: "learning-no-match-05",
    category: "no_match",
    prompt: "hur länge klarar man sig i tjugo grader vatten",
    expectedTopSlug: null,
  },
  {
    id: "learning-no-match-06",
    category: "no_match",
    prompt: "när hade Top Gun premiär i Sverige",
    expectedTopSlug: null,
  },
  {
    id: "learning-no-match-07",
    category: "no_match",
    prompt: "hur många liter färg behövs för ett trähus",
    expectedTopSlug: null,
  },
  {
    id: "learning-no-match-08",
    category: "no_match",
    prompt: "vilket däcktryck ska en personbil ha",
    expectedTopSlug: null,
  },
  {
    id: "learning-no-match-09",
    category: "no_match",
    prompt: "hur kokar man perfekt basmatiris",
    expectedTopSlug: null,
  },
] as const satisfies readonly DivBrainLearningEvalCase[];
