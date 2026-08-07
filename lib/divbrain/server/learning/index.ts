/**
 * DivBrain Learning retrieval + context integration server surface
 * (Tickets 1C-1 / 1C-2 / roadmap 1C-3 evals).
 *
 * Must never be imported by client components.
 * Retrieval/evals are deterministic/local; no provider or network call occurs here.
 */

export {
  assembleDivBrainLearningContext,
  createDivBrainLearningContextAssembler,
  type CreateDivBrainLearningContextAssemblerOptions,
} from "./context-assembler";
export {
  DIVBRAIN_LEARNING_RETRIEVAL_MAX_EXCERPT_LENGTH,
  DIVBRAIN_LEARNING_RETRIEVAL_MAX_RESULTS,
  DIVBRAIN_LEARNING_RETRIEVAL_MIN_SCORE,
  DIVBRAIN_LEARNING_RETRIEVAL_MIN_STRONG_SCORE,
  DIVBRAIN_LEARNING_ROUTE_PREFIX,
  DIVBRAIN_LEARNING_SCORE_WEIGHTS,
  DIVBRAIN_LEARNING_SOURCE_PUBLISHER,
} from "./constants";
export {
  buildDivBrainLearningCorpus,
  getDivBrainLearningCorpus,
  learningArticleToCorpusRecord,
  normalizeLearningQuery,
} from "./corpus";
export {
  DIVBRAIN_LEARNING_EVAL_CASES,
  DIVBRAIN_LEARNING_EVAL_CATEGORIES,
  DIVBRAIN_LEARNING_EVAL_SCHEMA_VERSION,
  evaluateDivBrainLearningEvalCase,
  runDivBrainLearningEvals,
  type DivBrainLearningEvalCase,
  type DivBrainLearningEvalCaseReport,
  type DivBrainLearningEvalCategory,
  type DivBrainLearningEvalReport,
} from "./learning-evals";
export {
  normalizeDivBrainLearningText,
  stemDivBrainLearningToken,
  tokenizeDivBrainLearningText,
} from "./normalize";
export { retrieveDivBrainLearningSources } from "./retrieve";
export {
  compareLearningCandidates,
  meetsRetrievalThreshold,
  rankAndDedupeLearningCandidates,
  scoreDivBrainLearningCorpus,
  scoreDivBrainLearningSection,
} from "./score";
export {
  learningCandidateToSource,
  learningCandidatesToSources,
  learningRecordRef,
  learningSourceId,
  toLearningCitationInput,
} from "./to-source";
export type {
  DivBrainLearningCitationInput,
  DivBrainLearningCorpusRecord,
  DivBrainLearningCorpusSection,
  DivBrainLearningRetrievalHit,
  DivBrainLearningRetrievalResult,
  DivBrainLearningRetrieveOptions,
} from "./types";
