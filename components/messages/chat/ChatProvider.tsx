"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  acceptChatRequestAction,
  declineChatRequestAction,
  ignoreChatRequestAction,
  loadChatThreadAction,
  markChatConversationReadAction,
  openChatWithContactAction,
  peekChatThreadAction,
  sendChatMessageAction,
} from "@/app/messages/actions";
import {
  applyIncomingUnread,
  CHAT_HISTORY_STATE_KEY,
  CHAT_WINDOW_STORAGE_KEY,
  DESKTOP_CHAT_MIN_VIEWPORT,
  DESKTOP_RAIL_MIN_VIEWPORT,
  getDesktopChatReservedRightWidth,
  getMaxOpenDesktopWindows,
  markConversationUnreadCleared,
  openDesktopWindow,
  parsePersistedChatUiState,
  persistedStateContainsTranscript,
  reconcileDesktopWindows,
  reduceMobileChatLayer,
  resolveDesktopChatLauncherIntent,
  serializePersistedChatUiState,
  type DesktopChatWindowState,
  type MobileChatLayer,
} from "@/lib/messages/chat-state";
import {
  applyPresenceRealtimePayload,
  mapPresenceViews,
  PRESENCE_FRESHNESS_TICK_MS,
  PRESENCE_HEARTBEAT_INTERVAL_MS,
} from "@/lib/messages/presence";
import {
  applyMessageToSummaries,
  mapRealtimeMessageRow,
  mergeRealtimeMessage,
} from "@/lib/messages/realtime-messages";
import { createClient } from "@/lib/supabase/client";
import type {
  ChatContact,
  ConversationSummary,
  ConversationThread,
  GlobalChatBootstrap,
  PresenceView,
} from "@/lib/messages/types";

type ChatContextValue = {
  currentUserId: string;
  unreadCount: number;
  contacts: ChatContact[];
  chats: ConversationSummary[];
  requests: ConversationSummary[];
  presenceByUserId: Record<string, PresenceView>;
  realtimeStatus: "connecting" | "connected" | "disconnected";
  windows: DesktopChatWindowState[];
  threads: Record<string, ConversationThread>;
  isWideDesktop: boolean;
  isDesktop: boolean;
  desktopDrawerOpen: boolean;
  mobileLayer: MobileChatLayer;
  mobileConversationId: string | null;
  mobileQuery: string;
  showingRequests: boolean;
  mobileComposeMode: boolean;
  mobileComposeNonce: number;
  unreadByConversationId: Record<string, boolean>;
  pendingConversationId: string | null;
  sendErrorById: Record<string, string>;
  requestErrorById: Record<string, string>;
  pendingRequestAction: {
    conversationId: string;
    action: "accept" | "ignore" | "decline";
  } | null;
  openLauncher: () => void;
  closeDesktopDrawer: () => void;
  openContact: (userId: string) => void;
  openConversation: (conversationId: string) => void;
  closeWindow: (conversationId: string) => void;
  minimizeWindow: (conversationId: string) => void;
  restoreWindow: (conversationId: string) => void;
  mobileBack: () => void;
  setMobileQuery: (value: string) => void;
  setShowingRequests: (value: boolean) => void;
  beginMobileCompose: () => void;
  sendMessage: (conversationId: string, body: string) => Promise<boolean>;
  acceptRequest: (conversationId: string) => void;
  ignoreRequest: (conversationId: string) => void;
  declineRequest: (conversationId: string) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return value;
}

export function useOptionalChat() {
  return useContext(ChatContext);
}

function readPersistedState() {
  if (typeof window === "undefined") {
    return parsePersistedChatUiState(null);
  }

  const raw = window.sessionStorage.getItem(CHAT_WINDOW_STORAGE_KEY);
  if (raw && persistedStateContainsTranscript(raw)) {
    window.sessionStorage.removeItem(CHAT_WINDOW_STORAGE_KEY);
    return parsePersistedChatUiState(null);
  }

  return parsePersistedChatUiState(raw);
}

function isConversationVisible(params: {
  conversationId: string;
  isDesktop: boolean;
  windows: DesktopChatWindowState[];
  mobileLayer: MobileChatLayer;
  mobileConversationId: string | null;
}) {
  if (params.isDesktop) {
    return params.windows.some(
      (windowState) =>
        windowState.conversationId === params.conversationId &&
        !windowState.minimized,
    );
  }

  return (
    params.mobileLayer === "conversation" &&
    params.mobileConversationId === params.conversationId
  );
}

type Props = {
  bootstrap: GlobalChatBootstrap;
  children: React.ReactNode;
};

export default function ChatProvider({ bootstrap, children }: Props) {
  const launcherRestoreRef = useRef<HTMLElement | null>(null);
  const historyDepthRef = useRef(0);
  const visibilityRef = useRef({
    isDesktop: true,
    windows: [] as DesktopChatWindowState[],
    mobileLayer: "closed" as MobileChatLayer,
    mobileConversationId: null as string | null,
    knownConversationIds: new Set<string>(),
  });
  const [contacts, setContacts] = useState(bootstrap.contacts);
  const [chats, setChats] = useState(bootstrap.chats);
  const [requests, setRequests] = useState(bootstrap.requests);
  const [presenceSnapshots, setPresenceSnapshots] = useState(
    bootstrap.presenceByUserId,
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [windows, setWindows] = useState<DesktopChatWindowState[]>(
    () => readPersistedState().windows,
  );
  const [threads, setThreads] = useState<Record<string, ConversationThread>>({});
  const [desktopDrawerOpen, setDesktopDrawerOpen] = useState(false);
  const [mobileLayer, setMobileLayer] = useState<MobileChatLayer>(
    () => readPersistedState().mobileLayer,
  );
  const [mobileConversationId, setMobileConversationId] = useState<string | null>(
    () => readPersistedState().mobileConversationId,
  );
  const [mobileQuery, setMobileQuery] = useState("");
  const [showingRequests, setShowingRequests] = useState(false);
  const [mobileComposeMode, setMobileComposeMode] = useState(false);
  const [mobileComposeNonce, setMobileComposeNonce] = useState(0);
  const [unreadIds, setUnreadIds] = useState<string[]>(() => [
    ...bootstrap.chats.filter((chat) => chat.hasUnread).map((chat) => chat.id),
    ...bootstrap.requests
      .filter((request) => request.hasUnread)
      .map((request) => request.id),
  ]);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(
    null,
  );
  const [sendErrorById, setSendErrorById] = useState<Record<string, string>>({});
  const [requestErrorById, setRequestErrorById] = useState<Record<string, string>>(
    {},
  );
  const [pendingRequestAction, setPendingRequestAction] = useState<{
    conversationId: string;
    action: "accept" | "ignore" | "decline";
  } | null>(null);

  const isDesktop = viewportWidth >= DESKTOP_CHAT_MIN_VIEWPORT;
  const isWideDesktop = viewportWidth >= DESKTOP_RAIL_MIN_VIEWPORT;
  const maxOpenWindows = getMaxOpenDesktopWindows({
    viewportWidth,
    sidebarWidth: 80,
    railVisible: isWideDesktop,
    reservedRightWidth: getDesktopChatReservedRightWidth({
      drawerOpen: desktopDrawerOpen,
      minimizedCount: 0,
    }),
  });
  const dockWindows = useMemo(
    () => reconcileDesktopWindows(windows, maxOpenWindows),
    [maxOpenWindows, windows],
  );

  const presenceByUserId = useMemo(
    () =>
      mapPresenceViews(presenceSnapshots, nowMs, {
        realtimeHonest: realtimeStatus !== "disconnected",
      }),
    [nowMs, presenceSnapshots, realtimeStatus],
  );

  const unreadByConversationId = useMemo(() => {
    const next: Record<string, boolean> = {};
    for (const id of unreadIds) {
      next[id] = true;
    }
    return next;
  }, [unreadIds]);

  const unreadCount = unreadIds.length;

  useEffect(() => {
    visibilityRef.current = {
      isDesktop,
      windows: dockWindows,
      mobileLayer,
      mobileConversationId,
      knownConversationIds: new Set([
        ...chats.map((chat) => chat.id),
        ...requests.map((request) => request.id),
      ]),
    };
  }, [
    chats,
    dockWindows,
    isDesktop,
    mobileConversationId,
    mobileLayer,
    requests,
  ]);

  useEffect(() => {
    function updateViewport() {
      setViewportWidth(window.innerWidth);
    }

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    const payload = serializePersistedChatUiState({
      windows: dockWindows,
      mobileLayer,
      mobileConversationId,
    });
    window.sessionStorage.setItem(CHAT_WINDOW_STORAGE_KEY, payload);
  }, [dockWindows, mobileConversationId, mobileLayer]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, PRESENCE_FRESHNESS_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | null = null;

    async function beat() {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        const supabase = createClient();
        await supabase.rpc("heartbeat_user_presence");
      } catch {
        // Presence stays timeout-based when the heartbeat cannot run.
      }
    }

    function start() {
      void beat();
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      intervalId = window.setInterval(() => {
        void beat();
      }, PRESENCE_HEARTBEAT_INTERVAL_MS);
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        start();
      } else if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    }

    if (!cancelled) {
      handleVisibility();
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const markLocalRead = useCallback((conversationId: string) => {
    setUnreadIds((current) =>
      markConversationUnreadCleared(current, conversationId),
    );
    setChats((current) =>
      current.map((chat) =>
        chat.id === conversationId ? { ...chat, hasUnread: false } : chat,
      ),
    );
    setRequests((current) =>
      current.map((request) =>
        request.id === conversationId ? { ...request, hasUnread: false } : request,
      ),
    );
    setContacts((current) =>
      current.map((contact) =>
        contact.conversationId === conversationId
          ? { ...contact, hasUnread: false }
          : contact,
      ),
    );
    void markChatConversationReadAction(conversationId);
  }, []);

  const ensureThread = useCallback(async (conversationId: string) => {
    const result = await loadChatThreadAction(conversationId);
    if (result.status === "success" && result.data) {
      setThreads((current) => ({
        ...current,
        [conversationId]: result.data!,
      }));
      return result.data;
    }

    return null;
  }, []);

  const openConversationInPlace = useCallback(
    async (conversationId: string) => {
      if (isDesktop) {
        setDesktopDrawerOpen(false);
        setWindows((current) =>
          openDesktopWindow(current, conversationId, maxOpenWindows),
        );
      } else {
        setMobileLayer("conversation");
        setMobileConversationId(conversationId);
        const state = {
          ...(window.history.state ?? {}),
          [CHAT_HISTORY_STATE_KEY]: {
            layer: "conversation",
            conversationId,
          },
        };
        window.history.pushState(state, "");
        historyDepthRef.current += 1;
      }

      const thread = await ensureThread(conversationId);
      if (thread) {
        markLocalRead(conversationId);
      }
    },
    [ensureThread, isDesktop, markLocalRead, maxOpenWindows],
  );

  const openContact = useCallback(
    async (userId: string) => {
      const existing = contacts.find((contact) => contact.userId === userId);
      if (existing?.conversationId && threads[existing.conversationId]) {
        await openConversationInPlace(existing.conversationId);
        return;
      }

      const result = await openChatWithContactAction(userId);
      if (result.status !== "success" || !result.data || !("thread" in result.data)) {
        return;
      }

      const opened = result.data;
      setThreads((current) => ({
        ...current,
        [opened.conversationId]: opened.thread,
      }));
      setContacts((current) =>
        current.map((contact) =>
          contact.userId === userId
            ? { ...contact, conversationId: opened.conversationId }
            : contact,
        ),
      );
      await openConversationInPlace(opened.conversationId);
    },
    [contacts, openConversationInPlace, threads],
  );

  const openLauncher = useCallback(() => {
    launcherRestoreRef.current = document.activeElement as HTMLElement | null;

    if (resolveDesktopChatLauncherIntent(isDesktop) === "toggleInbox") {
      setDesktopDrawerOpen((open) => !open);
      return;
    }

    if (mobileLayer === "closed") {
      setMobileLayer("inbox");
      const state = {
        ...(window.history.state ?? {}),
        [CHAT_HISTORY_STATE_KEY]: {
          layer: "inbox",
          conversationId: null,
        },
      };
      window.history.pushState(state, "");
      historyDepthRef.current += 1;
    }
  }, [isDesktop, mobileLayer]);

  const closeDesktopDrawer = useCallback(() => {
    setDesktopDrawerOpen(false);
  }, []);

  const closeMobileLayer = useCallback(() => {
    setMobileLayer("closed");
    setMobileConversationId(null);
    setShowingRequests(false);
    setMobileComposeMode(false);
    setMobileQuery("");
    launcherRestoreRef.current?.focus();
  }, []);

  const mobileBack = useCallback(() => {
    if (historyDepthRef.current > 0) {
      window.history.back();
      return;
    }

    if (mobileLayer === "conversation") {
      setMobileLayer("inbox");
      setMobileConversationId(null);
      return;
    }

    closeMobileLayer();
  }, [closeMobileLayer, mobileLayer]);

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      const chatState = event.state?.[CHAT_HISTORY_STATE_KEY] as
        | { layer?: string; conversationId?: string | null }
        | undefined;
      historyDepthRef.current = Math.max(0, historyDepthRef.current - 1);

      if (!chatState) {
        closeMobileLayer();
        return;
      }

      if (chatState.layer === "conversation" && chatState.conversationId) {
        setMobileLayer("conversation");
        setMobileConversationId(chatState.conversationId);
        return;
      }

      if (chatState.layer === "inbox") {
        setMobileLayer("inbox");
        setMobileConversationId(null);
      }
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [closeMobileLayer]);

  useEffect(() => {
    if (mobileLayer === "closed") {
      document.body.style.overflow = "";
      return;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileLayer]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      if (!isDesktop && mobileLayer !== "closed") {
        event.preventDefault();
        mobileBack();
        return;
      }

      if (desktopDrawerOpen) {
        setDesktopDrawerOpen(false);
        return;
      }

      const openWindow = [...windows]
        .reverse()
        .find((windowState) => !windowState.minimized);
      if (openWindow) {
        setWindows((current) =>
          current.filter(
            (windowState) => windowState.conversationId !== openWindow.conversationId,
          ),
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [desktopDrawerOpen, isDesktop, mobileBack, mobileLayer, windows]);

  useEffect(() => {
    const conversationIds = [
      ...dockWindows.map((windowState) => windowState.conversationId),
      ...(mobileConversationId ? [mobileConversationId] : []),
    ].filter((conversationId) => !threads[conversationId]);

    if (conversationIds.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      conversationIds.map(async (conversationId) => {
        const result = await loadChatThreadAction(conversationId);
        if (cancelled || result.status !== "success" || !result.data) {
          return;
        }

        setThreads((current) =>
          current[conversationId]
            ? current
            : { ...current, [conversationId]: result.data! },
        );
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [dockWindows, mobileConversationId, threads]);

  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null =
      null;

    try {
      const supabase = createClient();
      channel = supabase
        .channel(`divlab-chat:${bootstrap.currentUserId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            const message = mapRealtimeMessageRow(payload.new ?? {});
            if (!message) {
              return;
            }

            const visible = isConversationVisible({
              conversationId: message.conversationId,
              isDesktop: visibilityRef.current.isDesktop,
              windows: visibilityRef.current.windows,
              mobileLayer: visibilityRef.current.mobileLayer,
              mobileConversationId: visibilityRef.current.mobileConversationId,
            });

            setThreads((current) => {
              const existing = current[message.conversationId];
              if (!existing) {
                return current;
              }

              return {
                ...current,
                [message.conversationId]: {
                  ...existing,
                  messages: mergeRealtimeMessage(existing.messages, message),
                },
              };
            });

            setChats((current) =>
              applyMessageToSummaries(current, message, {
                currentUserId: bootstrap.currentUserId,
                isOpenAndVisible: visible,
              }),
            );
            setRequests((current) =>
              applyMessageToSummaries(current, message, {
                currentUserId: bootstrap.currentUserId,
                isOpenAndVisible: visible,
              }),
            );
            setContacts((current) =>
              current.map((contact) =>
                contact.conversationId === message.conversationId
                  ? {
                      ...contact,
                      hasUnread:
                        message.senderId !== bootstrap.currentUserId && !visible
                          ? true
                          : visible
                            ? false
                            : contact.hasUnread,
                      lastActivityAt: message.createdAt,
                    }
                  : contact,
              ),
            );
            setUnreadIds((current) =>
              applyIncomingUnread({
                unreadConversationIds: current,
                conversationId: message.conversationId,
                senderId: message.senderId,
                currentUserId: bootstrap.currentUserId,
                isOpenAndVisible: visible,
              }),
            );

            if (visible) {
              void markChatConversationReadAction(message.conversationId);
            } else if (
              !visibilityRef.current.knownConversationIds.has(
                message.conversationId,
              )
            ) {
              void peekChatThreadAction(message.conversationId).then((result) => {
                if (result.status !== "success" || !result.data) {
                  return;
                }

                const thread = result.data;
                setThreads((current) => ({
                  ...current,
                  [thread.id]: {
                    ...thread,
                    messages: mergeRealtimeMessage(thread.messages, message),
                  },
                }));
                const summary: ConversationSummary = {
                  id: thread.id,
                  subject: thread.subject,
                  status: thread.status,
                  initiatedBy: thread.initiatedBy,
                  updatedAt: message.createdAt,
                  otherParticipant: thread.otherParticipant,
                  lastMessagePreview: message.body,
                  lastMessageAt: message.createdAt,
                  hasUnread: message.senderId !== bootstrap.currentUserId,
                };
                if (thread.status === "message_request") {
                  setRequests((current) =>
                    current.some((item) => item.id === thread.id)
                      ? current
                      : [summary, ...current],
                  );
                } else if (thread.status === "active") {
                  setChats((current) =>
                    current.some((item) => item.id === thread.id)
                      ? current
                      : [summary, ...current],
                  );
                }
              });
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_presence" },
          (payload) => {
            setPresenceSnapshots((current) =>
              applyPresenceRealtimePayload(current, payload),
            );
          },
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setRealtimeStatus("connected");
            return;
          }

          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            setRealtimeStatus("disconnected");
          }
        });
    } catch {
      queueMicrotask(() => setRealtimeStatus("disconnected"));
    }

    return () => {
      if (channel) {
        const supabase = createClient();
        void supabase.removeChannel(channel);
      }
    };
  }, [bootstrap.currentUserId]);

  const updateShowingRequests = useCallback((value: boolean) => {
    setShowingRequests(value);
    if (value) {
      setMobileComposeMode(false);
    }
  }, []);

  const beginMobileCompose = useCallback(() => {
    setShowingRequests(false);
    setMobileQuery("");
    setMobileComposeMode(true);
    setMobileComposeNonce((current) => current + 1);
  }, []);

  const sendMessage = useCallback(
    async (conversationId: string, body: string) => {
      setPendingConversationId(conversationId);
      setSendErrorById((current) => {
        const next = { ...current };
        delete next[conversationId];
        return next;
      });
      const result = await sendChatMessageAction(conversationId, body);
      setPendingConversationId(null);

      if (result.status === "error" || !result.data) {
        setSendErrorById((current) => ({
          ...current,
          [conversationId]: result.message,
        }));
        return false;
      }

      setThreads((current) => {
        const existing = current[conversationId];
        if (!existing) {
          return current;
        }

        return {
          ...current,
          [conversationId]: {
            ...existing,
            messages: mergeRealtimeMessage(existing.messages, result.data!),
          },
        };
      });
      setChats((current) =>
        applyMessageToSummaries(current, result.data!, {
          currentUserId: bootstrap.currentUserId,
          isOpenAndVisible: true,
        }),
      );
      return true;
    },
    [bootstrap.currentUserId],
  );

  const acceptRequest = useCallback((conversationId: string) => {
    setPendingRequestAction({ conversationId, action: "accept" });
    void acceptChatRequestAction(conversationId).then(async (result) => {
      setPendingRequestAction(null);
      if (result.status === "error") {
        setRequestErrorById((current) => ({
          ...current,
          [conversationId]: result.message,
        }));
        return;
      }

      const thread = await ensureThread(conversationId);
      setRequests((current) =>
        current.filter((request) => request.id !== conversationId),
      );
      if (thread) {
        setChats((current) => {
          if (current.some((chat) => chat.id === conversationId)) {
            return current;
          }

          return [
            {
              id: thread.id,
              subject: thread.subject,
              status: thread.status,
              initiatedBy: thread.initiatedBy,
              updatedAt: new Date().toISOString(),
              otherParticipant: thread.otherParticipant,
              lastMessagePreview:
                thread.messages[thread.messages.length - 1]?.body ??
                "Inga meddelanden än",
              lastMessageAt:
                thread.messages[thread.messages.length - 1]?.createdAt ?? null,
              hasUnread: false,
            },
            ...current,
          ];
        });
      }
    });
  }, [ensureThread]);

  const ignoreRequest = useCallback((conversationId: string) => {
    setPendingRequestAction({ conversationId, action: "ignore" });
    void ignoreChatRequestAction(conversationId).then((result) => {
      setPendingRequestAction(null);
      if (result.status === "error") {
        setRequestErrorById((current) => ({
          ...current,
          [conversationId]: result.message,
        }));
        return;
      }

      setRequests((current) =>
        current.filter((request) => request.id !== conversationId),
      );
      setWindows((current) =>
        current.filter((windowState) => windowState.conversationId !== conversationId),
      );
      if (mobileConversationId === conversationId) {
        setMobileLayer("inbox");
        setMobileConversationId(null);
      }
    });
  }, [mobileConversationId]);

  const declineRequest = useCallback((conversationId: string) => {
    setPendingRequestAction({ conversationId, action: "decline" });
    void declineChatRequestAction(conversationId).then((result) => {
      setPendingRequestAction(null);
      if (result.status === "error") {
        setRequestErrorById((current) => ({
          ...current,
          [conversationId]: result.message,
        }));
        return;
      }

      setRequests((current) =>
        current.filter((request) => request.id !== conversationId),
      );
      setWindows((current) =>
        current.filter((windowState) => windowState.conversationId !== conversationId),
      );
      if (mobileConversationId === conversationId) {
        setMobileLayer("inbox");
        setMobileConversationId(null);
      }
    });
  }, [mobileConversationId]);

  const value = useMemo<ChatContextValue>(
    () => ({
      currentUserId: bootstrap.currentUserId,
      unreadCount,
      contacts,
      chats,
      requests,
      presenceByUserId,
      realtimeStatus,
      windows: dockWindows,
      threads,
      isWideDesktop,
      isDesktop,
      desktopDrawerOpen,
      mobileLayer,
      mobileConversationId,
      mobileQuery,
      showingRequests,
      mobileComposeMode,
      mobileComposeNonce,
      unreadByConversationId,
      pendingConversationId,
      sendErrorById,
      requestErrorById,
      pendingRequestAction,
      openLauncher,
      closeDesktopDrawer,
      openContact,
      openConversation: openConversationInPlace,
      closeWindow: (conversationId) =>
        setWindows((current) =>
          current.filter((windowState) => windowState.conversationId !== conversationId),
        ),
      minimizeWindow: (conversationId) =>
        setWindows((current) =>
          current.map((windowState) =>
            windowState.conversationId === conversationId
              ? { ...windowState, minimized: true }
              : windowState,
          ),
        ),
      restoreWindow: (conversationId) =>
        setWindows((current) =>
          openDesktopWindow(current, conversationId, maxOpenWindows),
        ),
      mobileBack,
      setMobileQuery,
      setShowingRequests: updateShowingRequests,
      beginMobileCompose,
      sendMessage,
      acceptRequest,
      ignoreRequest,
      declineRequest,
    }),
    [
      acceptRequest,
      beginMobileCompose,
      bootstrap.currentUserId,
      chats,
      closeDesktopDrawer,
      contacts,
      declineRequest,
      desktopDrawerOpen,
      dockWindows,
      ignoreRequest,
      isDesktop,
      isWideDesktop,
      maxOpenWindows,
      mobileBack,
      mobileConversationId,
      mobileLayer,
      mobileQuery,
      mobileComposeMode,
      mobileComposeNonce,
      openContact,
      openConversationInPlace,
      openLauncher,
      pendingConversationId,
      pendingRequestAction,
      presenceByUserId,
      realtimeStatus,
      requestErrorById,
      requests,
      sendErrorById,
      sendMessage,
      showingRequests,
      threads,
      unreadByConversationId,
      unreadCount,
      updateShowingRequests,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export { persistedStateContainsTranscript, reduceMobileChatLayer };
