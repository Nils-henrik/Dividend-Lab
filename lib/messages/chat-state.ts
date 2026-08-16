import type { ChatContact, ConversationSummary, PresenceView } from "./types";

export const CHAT_WINDOW_STORAGE_KEY = "divlab.chat.windows.v1";
export const CHAT_HISTORY_STATE_KEY = "divlabChat";

export const DESKTOP_CHAT_WINDOW_WIDTH = 328;
export const DESKTOP_CHAT_WINDOW_GAP = 12;
export const DESKTOP_CHAT_DRAWER_WIDTH = 352;
export const DESKTOP_CHAT_DOCK_INSET = 16;
export const DESKTOP_CHAT_DOCK_VIEWPORT_GUTTER = 32;
export const DESKTOP_APP_SIDEBAR_WIDTH = 80;
export const DESKTOP_MINIMIZED_BUBBLE_SIZE = 48;
export const DESKTOP_MINIMIZED_BUBBLE_GAP = 10;
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

export function getDesktopChatDockOrigin(railVisible: boolean) {
  return (railVisible ? DESKTOP_RAIL_WIDTH : 0) + DESKTOP_CHAT_DOCK_INSET;
}

export function getDesktopChatUsableWidth(params: {
  viewportWidth: number;
  sidebarWidth: number;
  railVisible: boolean;
}) {
  const railWidth = params.railVisible ? DESKTOP_RAIL_WIDTH : 0;
  return Math.max(
    0,
    params.viewportWidth -
      params.sidebarWidth -
      railWidth -
      DESKTOP_CHAT_DOCK_VIEWPORT_GUTTER,
  );
}

export function getMinimizedBubbleStripWidth(count: number) {
  if (count <= 0) {
    return 0;
  }

  return (
    count * (DESKTOP_MINIMIZED_BUBBLE_SIZE + DESKTOP_MINIMIZED_BUBBLE_GAP) -
    DESKTOP_MINIMIZED_BUBBLE_GAP +
    DESKTOP_CHAT_WINDOW_GAP
  );
}

export function getDesktopChatReservedRightWidth(params: {
  drawerOpen: boolean;
  minimizedCount: number;
}) {
  let width = 0;

  if (params.drawerOpen) {
    width += DESKTOP_CHAT_DRAWER_WIDTH + DESKTOP_CHAT_WINDOW_GAP;
  }

  width += getMinimizedBubbleStripWidth(params.minimizedCount);

  return width;
}

export function getMaxVisibleMinimizedBubbles(params: {
  viewportWidth: number;
  sidebarWidth: number;
  railVisible: boolean;
  drawerOpen: boolean;
  reservedOpenWindowCount: number;
}) {
  const openCount = Math.max(0, params.reservedOpenWindowCount);
  const budget =
    getDesktopChatUsableWidth(params) -
    getDesktopChatReservedRightWidth({
      drawerOpen: params.drawerOpen,
      minimizedCount: 0,
    }) -
    (openCount <= 0
      ? 0
      : openCount * (DESKTOP_CHAT_WINDOW_WIDTH + DESKTOP_CHAT_WINDOW_GAP) -
        DESKTOP_CHAT_WINDOW_GAP);

  if (budget < DESKTOP_MINIMIZED_BUBBLE_SIZE) {
    return 0;
  }

  const maxPossible = Math.floor(budget / DESKTOP_MINIMIZED_BUBBLE_SIZE);
  let count = 0;
  while (
    count < maxPossible &&
    getMinimizedBubbleStripWidth(count + 1) <= budget
  ) {
    count += 1;
  }

  return count;
}

export function selectVisibleMinimizedWindows(
  windows: DesktopChatWindowState[],
  visibleCount: number,
) {
  const minimized = windows.filter((windowState) => windowState.minimized);
  if (visibleCount <= 0) {
    return [];
  }

  if (visibleCount >= minimized.length) {
    return minimized;
  }

  return minimized.slice(minimized.length - visibleCount);
}

export function getDesktopChatDockLayout(params: {
  railVisible: boolean;
  drawerOpen: boolean;
  openWindowCount: number;
  minimizedCount: number;
}) {
  const origin = getDesktopChatDockOrigin(params.railVisible);
  let cursor = origin;

  if (params.drawerOpen) {
    cursor += DESKTOP_CHAT_DRAWER_WIDTH + DESKTOP_CHAT_WINDOW_GAP;
  }

  const minimizedRights: number[] = [];
  for (let index = 0; index < params.minimizedCount; index += 1) {
    minimizedRights.push(cursor);
    cursor += DESKTOP_MINIMIZED_BUBBLE_SIZE + DESKTOP_MINIMIZED_BUBBLE_GAP;
  }

  if (params.minimizedCount > 0) {
    cursor += DESKTOP_CHAT_WINDOW_GAP - DESKTOP_MINIMIZED_BUBBLE_GAP;
  }

  const openWindowRights: number[] = [];
  for (let index = 0; index < params.openWindowCount; index += 1) {
    openWindowRights.push(cursor);
    cursor += DESKTOP_CHAT_WINDOW_WIDTH + DESKTOP_CHAT_WINDOW_GAP;
  }

  return {
    drawerRight: origin,
    minimizedRights,
    openWindowRights,
  };
}

export function getDesktopChatDockOccupiedRightSpan(params: {
  layout: ReturnType<typeof getDesktopChatDockLayout>;
  drawerOpen: boolean;
  minimizedCount: number;
  openWindowCount: number;
}) {
  const { layout } = params;

  if (params.openWindowCount > 0) {
    const right = layout.openWindowRights[params.openWindowCount - 1];
    return (right ?? layout.drawerRight) + DESKTOP_CHAT_WINDOW_WIDTH;
  }

  if (params.minimizedCount > 0) {
    const right = layout.minimizedRights[params.minimizedCount - 1];
    return (right ?? layout.drawerRight) + DESKTOP_MINIMIZED_BUBBLE_SIZE;
  }

  if (params.drawerOpen) {
    return layout.drawerRight + DESKTOP_CHAT_DRAWER_WIDTH;
  }

  return 0;
}

export function resolveDesktopChatLauncherIntent(isDesktop: boolean) {
  return isDesktop ? "toggleInbox" : "openMobileInbox";
}

export function getMaxOpenDesktopWindows(params: {
  viewportWidth: number;
  sidebarWidth: number;
  railVisible: boolean;
  reservedRightWidth?: number;
}) {
  const reserved = params.reservedRightWidth ?? 0;
  const available = getDesktopChatUsableWidth(params) - reserved;

  return Math.max(
    1,
    Math.floor(
      (available + DESKTOP_CHAT_WINDOW_GAP) /
        (DESKTOP_CHAT_WINDOW_WIDTH + DESKTOP_CHAT_WINDOW_GAP),
    ),
  );
}

function sameDesktopWindows(
  first: DesktopChatWindowState[],
  second: DesktopChatWindowState[],
) {
  return (
    first.length === second.length &&
    first.every(
      (windowState, index) =>
        windowState.conversationId === second[index]?.conversationId &&
        windowState.minimized === second[index]?.minimized,
    )
  );
}

export function planDesktopChatDock(params: {
  windows: DesktopChatWindowState[];
  viewportWidth: number;
  sidebarWidth: number;
  railVisible: boolean;
  drawerOpen: boolean;
}) {
  let next = params.windows;
  const maxSteps = Math.max(2, params.windows.length + 2);

  for (let step = 0; step < maxSteps; step += 1) {
    const openCount = next.filter((windowState) => !windowState.minimized).length;
    const maxOpenIgnoringBubbles = getMaxOpenDesktopWindows({
      viewportWidth: params.viewportWidth,
      sidebarWidth: params.sidebarWidth,
      railVisible: params.railVisible,
      reservedRightWidth: getDesktopChatReservedRightWidth({
        drawerOpen: params.drawerOpen,
        minimizedCount: 0,
      }),
    });
    const reservedOpenWindowCount =
      openCount > 0 ? Math.min(openCount, maxOpenIgnoringBubbles) : 0;
    const visibleMinimizedCount = Math.min(
      next.filter((windowState) => windowState.minimized).length,
      getMaxVisibleMinimizedBubbles({
        viewportWidth: params.viewportWidth,
        sidebarWidth: params.sidebarWidth,
        railVisible: params.railVisible,
        drawerOpen: params.drawerOpen,
        reservedOpenWindowCount,
      }),
    );
    const maxOpenWindows = getMaxOpenDesktopWindows({
      viewportWidth: params.viewportWidth,
      sidebarWidth: params.sidebarWidth,
      railVisible: params.railVisible,
      reservedRightWidth: getDesktopChatReservedRightWidth({
        drawerOpen: params.drawerOpen,
        minimizedCount: visibleMinimizedCount,
      }),
    });
    const reconciled = reconcileDesktopWindows(next, maxOpenWindows);

    if (sameDesktopWindows(next, reconciled)) {
      return {
        windows: reconciled,
        visibleMinimizedWindows: selectVisibleMinimizedWindows(
          reconciled,
          visibleMinimizedCount,
        ),
        maxOpenWindows,
        visibleMinimizedCount,
      };
    }

    next = reconciled;
  }

  const openCount = next.filter((windowState) => !windowState.minimized).length;
  const visibleMinimizedCount = Math.min(
    next.filter((windowState) => windowState.minimized).length,
    getMaxVisibleMinimizedBubbles({
      viewportWidth: params.viewportWidth,
      sidebarWidth: params.sidebarWidth,
      railVisible: params.railVisible,
      drawerOpen: params.drawerOpen,
      reservedOpenWindowCount: openCount,
    }),
  );
  const maxOpenWindows = getMaxOpenDesktopWindows({
    viewportWidth: params.viewportWidth,
    sidebarWidth: params.sidebarWidth,
    railVisible: params.railVisible,
    reservedRightWidth: getDesktopChatReservedRightWidth({
      drawerOpen: params.drawerOpen,
      minimizedCount: visibleMinimizedCount,
    }),
  });
  const windows = reconcileDesktopWindows(next, maxOpenWindows);

  return {
    windows,
    visibleMinimizedWindows: selectVisibleMinimizedWindows(
      windows,
      visibleMinimizedCount,
    ),
    maxOpenWindows,
    visibleMinimizedCount,
  };
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

export function listMobileInboxResults(params: {
  query: string;
  chats: ConversationSummary[];
  contacts: ChatContact[];
  composeMode: boolean;
}) {
  if (params.query.trim()) {
    return filterChatSearch(params);
  }

  if (!params.composeMode) {
    return {
      chats: params.chats,
      contacts: [] as ChatContact[],
    };
  }

  const chatUserIds = new Set(
    params.chats
      .map((chat) => chat.otherParticipant?.id)
      .filter((id): id is string => Boolean(id)),
  );

  return {
    chats: params.chats,
    contacts: params.contacts.filter(
      (contact) => !chatUserIds.has(contact.userId),
    ),
  };
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
