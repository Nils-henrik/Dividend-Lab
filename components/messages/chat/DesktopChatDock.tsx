"use client";

import {
  getDesktopChatDockLayout,
  selectVisibleMinimizedWindows,
  type DesktopChatWindowState,
} from "@/lib/messages/chat-state";
import type { ConversationThread, PresenceView } from "@/lib/messages/types";
import DesktopChatWindow from "./DesktopChatWindow";
import DesktopMinimizedChatBubble from "./DesktopMinimizedChatBubble";

type Props = {
  windows: DesktopChatWindowState[];
  threads: Record<string, ConversationThread>;
  currentUserId: string;
  presenceByUserId: Record<string, PresenceView>;
  unreadByConversationId: Record<string, boolean>;
  railVisible: boolean;
  drawerOpen?: boolean;
  visibleMinimizedCount: number;
  pendingConversationId?: string | null;
  sendErrorById?: Record<string, string>;
  requestErrorById?: Record<string, string>;
  pendingRequestAction?: {
    conversationId: string;
    action: "accept" | "ignore" | "decline";
  } | null;
  onMinimize: (conversationId: string) => void;
  onRestore: (conversationId: string) => void;
  onClose: (conversationId: string) => void;
  onSend: (conversationId: string, body: string) => Promise<boolean>;
  onAcceptRequest: (conversationId: string) => void;
  onIgnoreRequest: (conversationId: string) => void;
  onDeclineRequest: (conversationId: string) => void;
};

export default function DesktopChatDock({
  windows,
  threads,
  currentUserId,
  presenceByUserId,
  unreadByConversationId,
  railVisible,
  drawerOpen = false,
  visibleMinimizedCount,
  pendingConversationId,
  sendErrorById = {},
  requestErrorById = {},
  pendingRequestAction,
  onMinimize,
  onRestore,
  onClose,
  onSend,
  onAcceptRequest,
  onIgnoreRequest,
  onDeclineRequest,
}: Props) {
  const openWindows = windows.filter((windowState) => !windowState.minimized);
  const minimizedWindows = selectVisibleMinimizedWindows(
    windows,
    visibleMinimizedCount,
  );
  const layout = getDesktopChatDockLayout({
    railVisible,
    drawerOpen,
    openWindowCount: openWindows.length,
    minimizedCount: minimizedWindows.length,
  });

  return (
    <>
      {openWindows.map((windowState, index) => {
        const thread = threads[windowState.conversationId];
        const otherId = thread?.otherParticipant?.id;

        return (
          <DesktopChatWindow
            key={windowState.conversationId}
            conversation={thread}
            currentUserId={currentUserId}
            presence={otherId ? presenceByUserId[otherId] : null}
            offset={layout.openWindowRights[index] ?? layout.drawerRight}
            pending={pendingConversationId === windowState.conversationId}
            sendError={sendErrorById[windowState.conversationId] ?? null}
            requestError={requestErrorById[windowState.conversationId] ?? null}
            pendingRequestAction={
              pendingRequestAction?.conversationId === windowState.conversationId
                ? pendingRequestAction.action
                : null
            }
            onMinimize={() => onMinimize(windowState.conversationId)}
            onClose={() => onClose(windowState.conversationId)}
            onSend={onSend}
            onAcceptRequest={onAcceptRequest}
            onIgnoreRequest={onIgnoreRequest}
            onDeclineRequest={onDeclineRequest}
          />
        );
      })}
      {minimizedWindows.map((windowState, index) => {
        const thread = threads[windowState.conversationId];
        const other = thread?.otherParticipant;
        const otherId = other?.id;

        return (
          <DesktopMinimizedChatBubble
            key={`min-${windowState.conversationId}`}
            name={other?.name}
            initials={other?.initials}
            avatarUrl={other?.avatarUrl ?? null}
            presence={otherId ? presenceByUserId[otherId] : null}
            hasUnread={Boolean(unreadByConversationId[windowState.conversationId])}
            offset={layout.minimizedRights[index] ?? layout.drawerRight}
            onRestore={() => onRestore(windowState.conversationId)}
          />
        );
      })}
    </>
  );
}
