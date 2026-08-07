/**
 * DivBrain Learning retrieval public server surface (Ticket 1C-1).
 *
 * Must never be imported by client components.
 * Pure lexical retrieval over `data/learning` — no provider or UI wiring.
 */

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
