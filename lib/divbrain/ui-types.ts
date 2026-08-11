import type { DivBrainArchiveScope } from "./brain-routes";
import type { DivBrainShellAttachment } from "./attachments";

export type { DivBrainArchiveScope };
export type { DivBrainShellAttachment };

export type DivBrainShellConversationListItem = {
  id: string;
  title: string;
  summary: string | null;
  updatedAt: string;
  archived: boolean;
};

export type DivBrainShellTranscriptSource = {
  id: string;
  title: string;
  publisher?: string;
  attribution?: string;
  internalRoute?: string;
  canonicalUrl?: string;
};

export type DivBrainShellTranscriptItem =
  | {
      kind: "user_message";
      id: string;
      content: string;
      createdAt: string;
      attachments?: readonly DivBrainShellAttachment[];
    }
  | {
      kind: "assistant_message";
      id: string;
      content: string;
      createdAt: string;
      sources?: readonly DivBrainShellTranscriptSource[];
    }
  | {
      kind: "provider_unavailable";
      id: string;
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

export type DivBrainShellViewModel =
  | {
      state: "empty";
      archiveScope: DivBrainArchiveScope;
      conversations: readonly DivBrainShellConversationListItem[];
      hasMoreConversations: boolean;
      selectedConversationId: null;
    }
  | {
      state: "ready";
      archiveScope: DivBrainArchiveScope;
      conversations: readonly DivBrainShellConversationListItem[];
      hasMoreConversations: boolean;
      selectedConversation: DivBrainShellSelectedConversation;
    }
  | {
      state: "conversation_not_found";
      archiveScope: DivBrainArchiveScope;
      conversations: readonly DivBrainShellConversationListItem[];
      hasMoreConversations: boolean;
    }
  | {
      state: "data_unavailable";
    };
