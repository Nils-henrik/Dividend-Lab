/**
 * DivBrain roadmap Ticket 1C-3 — deterministic Learning retrieval eval fixture.
 *
 * Curated manually. Positive cases deliberately test the lexical retriever's
 * deterministic title/topic contract; broader semantic phrasing belongs in
 * later quality evals. No LLM generation/judging, network calls, current-time
 * dependence, or paid provider usage. Prompts never appear in eval reports.
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
    prompt:
      "Din valbara pension kan bli värd mer än du tror – så tar du kontroll över premiepensionen",
    expectedTopSlug: "ta-kontroll-over-premiepensionen",
  },
  {
    id: "learning-premiepension-02",
    category: "premiepension",
    prompt:
      "din valbara pension kan bli värd mer än du tror så tar du kontroll över premiepensionen",
    expectedTopSlug: "ta-kontroll-over-premiepensionen",
  },
  {
    id: "learning-premiepension-03",
    category: "premiepension",
    prompt: "valbara pension premiepension kontroll AP7 Såfa fondval",
    expectedTopSlug: "ta-kontroll-over-premiepensionen",
  },
  {
    id: "learning-fire-01",
    category: "fire",
    prompt: "FIRE: så bygger du ekonomisk frihet – steg för steg",
    expectedTopSlug: "fire-ekonomisk-frihet",
  },
  {
    id: "learning-fire-02",
    category: "fire",
    prompt: "fire så bygger du ekonomisk frihet steg för steg",
    expectedTopSlug: "fire-ekonomisk-frihet",
  },
  {
    id: "learning-fire-03",
    category: "fire",
    prompt: "FIRE ekonomisk frihet sparkvot 4 procentsregeln",
    expectedTopSlug: "fire-ekonomisk-frihet",
  },
  {
    id: "learning-sparkvot-01",
    category: "sparkvot",
    prompt: "Så budgeterar du lönen i procent – en guide till sparkvot",
    expectedTopSlug: "sparkvot-budgetera-lonen-i-procent",
  },
  {
    id: "learning-sparkvot-02",
    category: "sparkvot",
    prompt: "så budgeterar du lönen i procent en guide till sparkvot",
    expectedTopSlug: "sparkvot-budgetera-lonen-i-procent",
  },
  {
    id: "learning-sparkvot-03",
    category: "sparkvot",
    prompt: "sparkvot budgetera lönen procentbudget",
    expectedTopSlug: "sparkvot-budgetera-lonen-i-procent",
  },
  {
    id: "learning-aktie-01",
    category: "aktie",
    prompt: "Vad är en aktie? En guide för nybörjare",
    expectedTopSlug: "vad-ar-en-aktie",
  },
  {
    id: "learning-aktie-02",
    category: "aktie",
    prompt: "vad är en aktie en guide för nybörjare",
    expectedTopSlug: "vad-ar-en-aktie",
  },
  {
    id: "learning-aktie-03",
    category: "aktie",
    prompt: "aktie ägarandel företag aktier nybörjare",
    expectedTopSlug: "vad-ar-en-aktie",
  },
  {
    id: "learning-borja-investera-01",
    category: "borja_investera",
    prompt: "Börja investera på börsen – en steg-för-steg-guide för nybörjare",
    expectedTopSlug: "borja-investera-pa-borsen",
  },
  {
    id: "learning-borja-investera-02",
    category: "borja_investera",
    prompt: "börja investera på börsen en steg för steg guide för nybörjare",
    expectedTopSlug: "borja-investera-pa-borsen",
  },
  {
    id: "learning-borja-investera-03",
    category: "borja_investera",
    prompt: "börja investera börsen nybörjare buffert ISK fonder aktier",
    expectedTopSlug: "borja-investera-pa-borsen",
  },
  {
    id: "learning-indexfond-01",
    category: "indexfond",
    prompt: "Vad är en indexfond? En enkel guide för nybörjare",
    expectedTopSlug: "vad-ar-en-indexfond",
  },
  {
    id: "learning-indexfond-02",
    category: "indexfond",
    prompt: "vad är en indexfond en enkel guide för nybörjare",
    expectedTopSlug: "vad-ar-en-indexfond",
  },
  {
    id: "learning-indexfond-03",
    category: "indexfond",
    prompt: "indexfond index avgifter riskspridning aktivt förvaltade fonder",
    expectedTopSlug: "vad-ar-en-indexfond",
  },
  {
    id: "learning-tid-frihet-01",
    category: "tid_till_frihet",
    prompt: "Vad påverkar tiden till ekonomisk frihet mest?",
    expectedTopSlug: "tid-till-ekonomisk-frihet",
  },
  {
    id: "learning-tid-frihet-02",
    category: "tid_till_frihet",
    prompt: "vad påverkar tiden till ekonomisk frihet mest",
    expectedTopSlug: "tid-till-ekonomisk-frihet",
  },
  {
    id: "learning-tid-frihet-03",
    category: "tid_till_frihet",
    prompt: "tiden ekonomisk frihet sparande avkastning utdelningar tålamod",
    expectedTopSlug: "tid-till-ekonomisk-frihet",
  },
  {
    id: "learning-direktavkastning-01",
    category: "direktavkastning",
    prompt: "Direktavkastning och utdelningssäkerhet",
    expectedTopSlug: "direktavkastning-och-utdelningssakerhet",
  },
  {
    id: "learning-direktavkastning-02",
    category: "direktavkastning",
    prompt: "direktavkastning utdelningssäkerhet",
    expectedTopSlug: "direktavkastning-och-utdelningssakerhet",
  },
  {
    id: "learning-direktavkastning-03",
    category: "direktavkastning",
    prompt: "direktavkastning hållbar utdelning kassaflöde utdelningssäkerhet",
    expectedTopSlug: "direktavkastning-och-utdelningssakerhet",
  },
  {
    id: "learning-sparande-01",
    category: "sparande",
    prompt: "Varför sparandet betyder mest i början",
    expectedTopSlug: "sparande-i-borjan",
  },
  {
    id: "learning-sparande-02",
    category: "sparande",
    prompt: "varför sparandet betyder mest i början",
    expectedTopSlug: "sparande-i-borjan",
  },
  {
    id: "learning-sparande-03",
    category: "sparande",
    prompt: "sparandet början insättningar vanor tålamod första åren",
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
