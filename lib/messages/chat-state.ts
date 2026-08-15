import type { ChatContact, ConversationSummary, PresenceView } from "./types";

export const CHAT_WINDOW_STORAGE_KEY = "divlab.chat.windows.v1";
export const CHAT_HISTORY_STATE_KEY = "divlabChat";

export const DESKTOP_CHAT_WINDOW_WIDTH = 328;
export const DESKTOP_CHAT_WINDOW_GAP = 12;
export const DESKTOP_RAIL_WIDTH = 288;
export const DESKTOP_RAIL_MIN_VIEWPORT = 1280;
export const DESKTOP_CHAT_MIN_VIEWPORT = 1024;

export const CONVERSATION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type DesktopChatWindowState = {
  conversationId: string;
  minimized: boolean;
};

export type MobileChatLayer = "closed" | "inbox" | "conversation";

export type PersistedChatUiState = {
  windows: DesktopChatWindowState[];
  mobileLayer: MobileChatLayer;
  mobileConversationId: string | null;
};

export type MobileChatHistoryState = {
  layer: Exclude<MobileChatLayer, "closed">;
  conversationId: string | null;
};

const emptyPersistedState: PersistedChatUiState = {
  windows: [],
  mobileLayer: "closed",
  mobileConversationId: null,
};

export function isConversationId(value: unknown): value is string {
  return typeof value === "string" && CONVERSATION_ID_PATTERN.test(value);
}

function sanitizeWindows(value: unknown): DesktopChatWindowState[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const windows: DesktopChatWindowState[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const conversationId = (item as { conversationId?: unknown }).conversationId;
    if (!isConversationId(conversationId) || seen.has(conversationId)) {
      continue;
    }

    seen.add(conversationId);
    windows.push({
      conversationId,
      minimized: Boolean((item as { minimized?: unknown }).minimized),
    });
  }

  return windows;
}

export function sanitizePersistedChatUiState(
  value: unknown,
): PersistedChatUiState {
  if (!value || typeof value !== "object") {
    return emptyPersistedState;
  }

  const record = value as Record<string, unknown>;
  const mobileLayer =
    record.mobileLayer === "inbox" || record.mobileLayer === "conversation"
      ? record.mobileLayer
      : "closed";
  const mobileConversationId = isConversationId(record.mobileConversationId)
    ? record.mobileConversationId
    : null;

  return {
    windows: sanitizeWindows(record.windows),
    mobileLayer,
    mobileConversationId:
      mobileLayer === "conversation" ? mobileConversationId : null,
  };
}

export function parsePersistedChatUiState(
  raw: string | null,
): PersistedChatUiState {
  if (!raw) {
    return emptyPersistedState;
  }

  try {
    return sanitizePersistedChatUiState(JSON.parse(raw));
  } catch {
    return emptyPersistedState;
  }
}

export function serializePersistedChatUiState(state: PersistedChatUiState) {
  return JSON.stringify({
    windows: state.windows.map((windowState) => ({
      conversationId: windowState.conversationId,
      minimized: windowState.minimized,
    })),
    mobileLayer: state.mobileLayer,
    mobileConversationId: state.mobileConversationId,
  });
}

export function persistedStateContainsTranscript(raw: string) {
  return /"body"\s*:/.test(raw) || /"messages"\s*:/.test(raw);
}

export function getMaxOpenDesktopWindows(params: {
  viewportWidth: number;
  sidebarWidth: number;
  railVisible: boolean;
}) {
  const railWidth = params.railVisible ? DESKTOP_RAIL_WIDTH : 0;
  const available =
    params.viewportWidth - params.sidebarWidth - railWidth - 32;

  return Math.max(
    1,
    Math.floor(
      (available + DESKTOP_CHAT_WINDOW_GAP) /
        (DESKTOP_CHAT_WINDOW_WIDTH + DESKTOP_CHAT_WINDOW_GAP),
    ),
  );
}

export function reconcileDesktopWindows(
  windows: DesktopChatWindowState[],
  maxOpen: number,
): DesktopChatWindowState[] {
  const openIds = windows
    .filter((windowState) => !windowState.minimized)
    .map((windowState) => windowState.conversationId);

  if (openIds.length <= maxOpen) {
    return windows;
  }

  const overflowIds = new Set(openIds.slice(0, openIds.length - maxOpen));

  return windows.map((windowState) =>
    overflowIds.has(windowState.conversationId)
      ? { ...windowState, minimized: true }
      : windowState,
  );
}

export function openDesktopWindow(
  windows: DesktopChatWindowState[],
  conversationId: string,
  maxOpen: number,
): DesktopChatWindowState[] {
  const existing = windows.find(
    (windowState) => windowState.conversationId === conversationId,
  );
  const next = existing
    ? [
        ...windows.filter(
          (windowState) => windowState.conversationId !== conversationId,
        ),
        { conversationId, minimized: false },
      ]
    : [...windows, { conversationId, minimized: false }];

  return reconcileDesktopWindows(next, maxOpen);
}

export function sortChatContacts(
  contacts: ChatContact[],
  presenceByUserId: Record<string, PresenceView>,
) {
  return [...contacts].sort((first, second) => {
    const firstPresence = presenceByUserId[first.userId]?.kind ?? "offline";
    const secondPresence = presenceByUserId[second.userId]?.kind ?? "offline";
    const firstOnline = firstPresence === "online" ? 0 : 1;
    const secondOnline = secondPresence === "online" ? 0 : 1;

    if (firstOnline !== secondOnline) {
      return firstOnline - secondOnline;
    }

    const firstActivity = first.lastActivityAt
      ? Date.parse(first.lastActivityAt)
      : 0;
    const secondActivity = second.lastActivityAt
      ? Date.parse(second.lastActivityAt)
      : 0;

    if (firstActivity !== secondActivity) {
      return secondActivity - firstActivity;
    }

    return first.name.localeCompare(second.name, "sv");
  });
}

export function filterAcceptedContacts<T extends { accepted?: boolean }>(
  contacts: T[],
) {
  return contacts.filter((contact) => contact.accepted !== false);
}

export function applyIncomingUnread(params: {
  unreadConversationIds: string[];
  conversationId: string;
  senderId: string;
  currentUserId: string;
  isOpenAndVisible: boolean;
}) {
  if (params.senderId === params.currentUserId || params.isOpenAndVisible) {
    return params.unreadConversationIds;
  }

  if (params.unreadConversationIds.includes(params.conversationId)) {
    return params.unreadConversationIds;
  }

  return [...params.unreadConversationIds, params.conversationId];
}

export function markConversationUnreadCleared(
  unreadConversationIds: string[],
  conversationId: string,
) {
  return unreadConversationIds.filter((id) => id !== conversationId);
}

export function countUnread(
  chats: ConversationSummary[],
  requests: ConversationSummary[],
  unreadConversationIds: string[],
) {
  const unread = new Set(unreadConversationIds);

  for (const conversation of [...chats, ...requests]) {
    if (conversation.hasUnread) {
      unread.add(conversation.id);
    }
  }

  return unread.size;
}

export function reduceMobileChatLayer(
  current: MobileChatLayer,
  action: "open" | "openConversation" | "back" | "close",
): MobileChatLayer {
  if (action === "close") {
    return "closed";
  }

  if (action === "open") {
    return current === "conversation" ? "conversation" : "inbox";
  }

  if (action === "openConversation") {
    return "conversation";
  }

  if (current === "conversation") {
    return "inbox";
  }

  return "closed";
}

export function shouldCoverMainContent(params: {
  viewportWidth: number;
  railVisible: boolean;
}) {
  return params.railVisible && params.viewportWidth < DESKTOP_RAIL_MIN_VIEWPORT;
}

export function filterChatSearch(params: {
  query: string;
  chats: ConversationSummary[];
  contacts: ChatContact[];
}) {
  const query = params.query.trim().toLowerCase();
  if (!query) {
    return {
      chats: params.chats,
      contacts: [] as ChatContact[],
    };
  }

  const chats = params.chats.filter((chat) => {
    const name = chat.otherParticipant?.name.toLowerCase() ?? "";
    const username = chat.otherParticipant?.username?.toLowerCase() ?? "";
    return (
      name.includes(query) ||
      username.includes(query) ||
      chat.lastMessagePreview.toLowerCase().includes(query)
    );
  });
  const matchedChatUserIds = new Set(
    chats
      .map((chat) => chat.otherParticipant?.id)
      .filter((id): id is string => Boolean(id)),
  );
  const contacts = params.contacts.filter((contact) => {
    if (matchedChatUserIds.has(contact.userId)) {
      return false;
    }

    return (
      contact.name.toLowerCase().includes(query) ||
      (contact.username?.toLowerCase().includes(query) ?? false)
    );
  });

  return { chats, contacts };
}

export function formatUnreadChatBadgeLabel(count: number) {
  if (count <= 0) {
    return "Meddelanden";
  }

  if (count === 1) {
    return "Meddelanden, 1 oläst konversation";
  }

  const displayCount = count > 9 ? "9+" : String(count);
  return `Meddelanden, ${displayCount} olästa konversationer`;
}
