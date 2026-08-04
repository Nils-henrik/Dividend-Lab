/**
 * DivBrain shell UI server surface (Ticket 1A-9a).
 *
 * Server-only by convention (`lib/divbrain/server/`). Must never be imported
 * by client components.
 */

export {
  DIVBRAIN_SHELL_CONVERSATION_PAGE_SIZE,
  DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS,
  DIVBRAIN_SHELL_TRANSCRIPT_MAX_SCANNED_ROWS,
  DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT,
  type DivBrainShellConversationListItem,
  type DivBrainShellSelectedConversation,
  type DivBrainShellTranscriptItem,
  type DivBrainShellTranscriptView,
  type DivBrainShellViewModel,
} from "./types";

export {
  formatDivBrainConversationTimestamp,
  formatDivBrainMessageTimestamp,
} from "./dates";

export { createDivBrainRuntimeRepository } from "./runtime";
export type { CreateDivBrainRuntimeRepositoryOptions } from "./runtime";

export {
  DIVBRAIN_SHELL_DIAGNOSTIC_CATEGORIES,
  createDivBrainShellDiagnosticLogger,
  createOnceDivBrainShellDiagnosticSink,
  isDivBrainShellDiagnosticCategory,
  mapListConversationsPersistenceKindToDiagnosticCategory,
  noopDivBrainShellDiagnosticSink,
  type DivBrainShellDiagnosticCategory,
  type DivBrainShellDiagnosticSink,
} from "./diagnostic";

export {
  divBrainShellDataUnavailable,
  loadDivBrainShellData,
  type LoadDivBrainShellDataParams,
} from "./loader";

export {
  loadDivBrainShellTranscript,
  mapDivBrainMessageToShellTranscriptItem,
  mapMessagesToShellTranscriptItems,
  type LoadDivBrainShellTranscriptParams,
} from "./transcript";
