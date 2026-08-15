"use client";

import {
  DESKTOP_CHAT_WINDOW_GAP,
  DESKTOP_CHAT_WINDOW_WIDTH,
  DESKTOP_RAIL_WIDTH,
  type DesktopChatWindowState,
} from "@/lib/messages/chat-state";
import type { ConversationThread, PresenceView } from "@/lib/messages/types";
import DesktopChatWindow from "./DesktopChatWindow";

type Props = {
  windows: DesktopChatWindowState[];
  threads: Record<string, ConversationThread>;
  currentUserId: string;
  presenceByUserId: Record<string, PresenceView>;
  unreadByConversationId: Record<string, boolean>;
  railVisible: boolean;
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
  const baseRight = (railVisible ? DESKTOP_RAIL_WIDTH : 16) + 16;
  const openWindows = windows.filter((windowState) => !windowState.minimized);
  const minimizedWindows = windows.filter((windowState) => windowState.minimized);

  return (
    <>
      {openWindows.map((windowState, index) => {
        const thread = threads[windowState.conversationId];
        const otherId = thread?.otherParticipant?.id;
        const offset =
          baseRight +
          index * (DESKTOP_CHAT_WINDOW_WIDTH + DESKTOP_CHAT_WINDOW_GAP);

        return (
          <DesktopChatWindow
            key={windowState.conversationId}
            conversation={thread}
            currentUserId={currentUserId}
            presence={otherId ? presenceByUserId[otherId] : null}
            minimized={false}
            hasUnread={Boolean(unreadByConversationId[windowState.conversationId])}
            offset={offset}
            pending={pendingConversationId === windowState.conversationId}
            sendError={sendErrorById[windowState.conversationId] ?? null}
            requestError={requestErrorById[windowState.conversationId] ?? null}
            pendingRequestAction={
              pendingRequestAction?.conversationId === windowState.conversationId
                ? pendingRequestAction.action
                : null
            }
            onMinimize={() => onMinimize(windowState.conversationId)}
            onRestore={() => onRestore(windowState.conversationId)}
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
        const otherId = thread?.otherParticipant?.id;
        const offset = 16 + index * 188;

        return (
          <DesktopChatWindow
            key={`min-${windowState.conversationId}`}
            conversation={thread}
            currentUserId={currentUserId}
            presence={otherId ? presenceByUserId[otherId] : null}
            minimized
            hasUnread={Boolean(unreadByConversationId[windowState.conversationId])}
            offset={offset}
            onMinimize={() => onMinimize(windowState.conversationId)}
            onRestore={() => onRestore(windowState.conversationId)}
            onClose={() => onClose(windowState.conversationId)}
            onSend={onSend}
            onAcceptRequest={onAcceptRequest}
            onIgnoreRequest={onIgnoreRequest}
            onDeclineRequest={onDeclineRequest}
          />
        );
      })}
    </>
  );
}