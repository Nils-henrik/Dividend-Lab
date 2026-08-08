/**
 * DivBrain shell UI server surface constants plus browser-safe view type
 * re-exports. The serializable view contracts live outside `server/` so client
 * components can consume them without importing a server-owned module.
 */

export type {
  DivBrainArchiveScope,
  DivBrainShellConversationListItem,
  DivBrainShellSelectedConversation,
  DivBrainShellTranscriptItem,
  DivBrainShellTranscriptSource,
  DivBrainShellTranscriptView,
  DivBrainShellViewModel,
} from "../../ui-types";

export const DIVBRAIN_SHELL_CONVERSATION_PAGE_SIZE = 30 as const;

/** Maximum listMessages page rounds while seeking the transcript tail. */
export const DIVBRAIN_SHELL_TRANSCRIPT_MAX_PAGE_ROUNDS = 10 as const;

/** Maximum rendered user/assistant messages after reaching the tail. */
export const DIVBRAIN_SHELL_TRANSCRIPT_RENDER_LIMIT = 100 as const;

/**
 * Maximum rows scanned: page rounds × repository max page size (50) = 500.
 * Declared here for documentation and tests; loader uses repository max size.
 */
export const DIVBRAIN_SHELL_TRANSCRIPT_MAX_SCANNED_ROWS = 500 as const;
