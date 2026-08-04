/**
 * Browser-safe DivBrain shell view-model contracts (Ticket 1A-9a).
 *
 * Must never include actor/user/owner ids, emails, profiles, raw repository
 * errors, system messages, policy/context, or environment state.
 *
 * Server-only module — do not import from client components.
 */

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

export type DivBrainShellConversationListItem = {
  id: string;
  title: string;
  summary: string | null;
  updatedAt: string;
  archived: boolean;
};

/**
 * Safe transcript presentation kinds.
 * Content is plain text only — never HTML, sources, or hidden reasoning.
 */
export type DivBrainShellTranscriptItem =
  | {
      kind: "user_message";
      id: string;
      content: string;
      createdAt: string;
    }
  | {
      kind: "assistant_message";
      id: string;
      content: string;
      createdAt: string;
    }
  | {
      kind: "provider_unavailable";
      id: string;
      /** Catalog-safe Swedish message. */
      message: string;
      createdAt: string;
    }
  | {
      kind: "failed";
      id: string;
      message: string;
      createdAt: string;
    }
  | {
      kind: "cancelled";
      id: string;
      message: string;
      createdAt: string;
    }
  | {
      kind: "incomplete";
      id: string;
      message: string;
      createdAt: string;
    }
  | {
      kind: "blocked";
      id: string;
      message: string;
      createdAt: string;
    }
  | {
      kind: "unavailable";
      id: string;
      message: string;
      createdAt: string;
    };

export type DivBrainShellTranscriptView =
  | {
      status: "ready";
      items: readonly DivBrainShellTranscriptItem[];
      historyTruncated: boolean;
    }
  | {
      status: "empty";
    }
  | {
      status: "data_unavailable";
    };

export type DivBrainShellSelectedConversation = {
  id: string;
  title: string;
  archived: boolean;
  updatedAt: string;
  transcript: DivBrainShellTranscriptView;
};

/**
 * Discriminated browser-safe shell view model.
 * Never includes actor id, allowlist data, or repository internals.
 */
export type DivBrainShellViewModel =
  | {
      state: "empty";
      conversations: readonly DivBrainShellConversationListItem[];
      hasMoreConversations: boolean;
      selectedConversationId: null;
    }
  | {
      state: "ready";
      conversations: readonly DivBrainShellConversationListItem[];
      hasMoreConversations: boolean;
      selectedConversation: DivBrainShellSelectedConversation;
    }
  | {
      state: "conversation_not_found";
      conversations: readonly DivBrainShellConversationListItem[];
      hasMoreConversations: boolean;
    }
  | {
      state: "data_unavailable";
    };
