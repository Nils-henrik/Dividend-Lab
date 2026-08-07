/**
 * DivBrain shell UI server surface (Tickets 1A-9a / 1A-9b / 1C-3).
 *
 * Server-only by convention (`lib/divbrain/server/`). Must never be imported
 * by client components.
 */

export {
  DIVBRAIN_SHELL_CONVERSATION_PAGE_SIZE,
  DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS,
  DIVBRAIN_SHELL_TRANSCRIPT_MAX_SCANNED_ROWS,
  DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT,
  type DivBrainArchiveScope,
  type DivBrainShellConversationListItem,
  type DivBrainShellSelectedConversation,
  type DivBrainShellTranscriptItem,
  type DivBrainShellTranscriptSource,
  type DivBrainShellTranscriptView,
  type DivBrainShellViewModel,
} from "./types";

export {
  DIVBRAIN_ACTION_STATE_IDLE,
  createDivBrainActionState,
  type DivBrainActionState,
  type DivBrainActionStatus,
} from "./action-state";

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
