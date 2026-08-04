/**
 * Read-only DivBrain shell page loader (Ticket 1A-9a).
 *
 * Dependency-injected for deterministic tests. Actor id is trusted server data.
 * Selected conversation id from navigation is treated as untrusted.
 *
 * Viewing never creates, updates, archives, restores, or deletes conversations.
 * Unexpected repository or mapping throws collapse to data_unavailable.
 *
 * Server-only — must never be imported by client components.
 */

import { isDivBrainUuid } from "../repository/ids";
import type {
  DivBrainConversationRepository,
  DivBrainTrustedActorId,
} from "../repository";
import type { DivBrainConversation } from "../../types";
import { loadDivBrainShellTranscript } from "./transcript";
import {
  DIVBRAIN_SHELL_CONVERSATION_PAGE_SIZE,
  type DivBrainShellConversationListItem,
  type DivBrainShellViewModel,
} from "./types";

export type LoadDivBrainShellDataParams = {
  /** Trusted authenticated actor id from the server session. */
  actorId: DivBrainTrustedActorId;
  /** Untrusted query parameter — may be missing, malformed, or cross-owner. */
  selectedConversationId?: string | null;
  repository: DivBrainConversationRepository;
};

function toListItem(
  conversation: DivBrainConversation,
): DivBrainShellConversationListItem {
  return {
    id: conversation.id,
    title: conversation.title,
    summary:
      typeof conversation.summary === "string" &&
      conversation.summary.trim().length > 0
        ? conversation.summary
        : null,
    updatedAt: conversation.updatedAt,
    archived: Boolean(conversation.archivedAt),
  };
}

async function loadDivBrainShellDataInner(
  params: LoadDivBrainShellDataParams,
): Promise<DivBrainShellViewModel> {
  const listResult = await params.repository.listConversations({
    actorId: params.actorId,
    archiveFilter: "active",
    pageSize: DIVBRAIN_SHELL_CONVERSATION_PAGE_SIZE,
  });

  if (!listResult.ok) {
    return { state: "data_unavailable" };
  }

  const conversations = listResult.data.items.map(toListItem);
  const hasMoreConversations = listResult.data.nextCursor !== null;
  const requestedId =
    typeof params.selectedConversationId === "string"
      ? params.selectedConversationId.trim()
      : "";

  if (requestedId.length === 0) {
    if (conversations.length === 0) {
      return {
        state: "empty",
        conversations,
        hasMoreConversations,
        selectedConversationId: null,
      };
    }

    const defaultConversation = listResult.data.items[0];
    const transcript = await loadDivBrainShellTranscript({
      repository: params.repository,
      actorId: params.actorId,
      conversationId: defaultConversation.id,
    });

    if (!transcript.ok) {
      return { state: "data_unavailable" };
    }

    return {
      state: "ready",
      conversations,
      hasMoreConversations,
      selectedConversation: {
        id: defaultConversation.id,
        title: defaultConversation.title,
        archived: Boolean(defaultConversation.archivedAt),
        updatedAt: defaultConversation.updatedAt,
        transcript: transcript.data,
      },
    };
  }

  if (!isDivBrainUuid(requestedId)) {
    return {
      state: "conversation_not_found",
      conversations,
      hasMoreConversations,
    };
  }

  const owned = await params.repository.getConversation({
    actorId: params.actorId,
    conversationId: requestedId,
  });

  if (!owned.ok) {
    // Missing and cross-owner both surface as not_found from the repository.
    // Any other typed failure collapses to data_unavailable.
    if (
      owned.error.code === "not_found" ||
      owned.error.code === "invalid_request"
    ) {
      return {
        state: "conversation_not_found",
        conversations,
        hasMoreConversations,
      };
    }

    return { state: "data_unavailable" };
  }

  const transcript = await loadDivBrainShellTranscript({
    repository: params.repository,
    actorId: params.actorId,
    conversationId: owned.data.id,
  });

  if (!transcript.ok) {
    return { state: "data_unavailable" };
  }

  // Explicit archived selection may be rendered read-only even though the
  // active list omits it — ensure the selected item appears in the rail.
  const listIds = new Set(conversations.map((item) => item.id));
  const selectedListItem = toListItem(owned.data);
  const railConversations = listIds.has(selectedListItem.id)
    ? conversations
    : [selectedListItem, ...conversations];

  return {
    state: "ready",
    conversations: railConversations,
    hasMoreConversations,
    selectedConversation: {
      id: owned.data.id,
      title: owned.data.title,
      archived: Boolean(owned.data.archivedAt),
      updatedAt: owned.data.updatedAt,
      transcript: transcript.data,
    },
  };
}

/**
 * Build the browser-safe shell view model for an allowlisted actor.
 * Does not perform Alpha access checks — the page must gate first.
 * Unexpected throws never escape the page lifecycle.
 */
export async function loadDivBrainShellData(
  params: LoadDivBrainShellDataParams,
): Promise<DivBrainShellViewModel> {
  try {
    return await loadDivBrainShellDataInner(params);
  } catch {
    return { state: "data_unavailable" };
  }
}

/**
 * Map repository construction failure to the safe data-unavailable state.
 */
export function divBrainShellDataUnavailable(): DivBrainShellViewModel {
  return { state: "data_unavailable" };
}
