"use client";

import DesktopChatDock from "./DesktopChatDock";
import DesktopChatDrawer from "./DesktopChatDrawer";
import DesktopContactRail from "./DesktopContactRail";
import MobileChatLayer from "./MobileChatLayer";
import { useChat } from "./ChatProvider";

export default function ChatExperience() {
  const chat = useChat();

  return (
    <>
      {chat.isWideDesktop ? (
        <DesktopContactRail
          contacts={chat.contacts}
          presenceByUserId={chat.presenceByUserId}
          onOpenContact={chat.openContact}
        />
      ) : null}

      {chat.isDesktop ? (
        <>
          <DesktopChatDrawer
            open={chat.desktopDrawerOpen}
            contacts={chat.contacts}
            chats={chat.chats}
            requests={chat.requests}
            presenceByUserId={chat.presenceByUserId}
            onClose={chat.closeDesktopDrawer}
            onOpenContact={chat.openContact}
            onOpenConversation={chat.openConversation}
          />
          <DesktopChatDock
            windows={chat.windows}
            threads={chat.threads}
            currentUserId={chat.currentUserId}
            presenceByUserId={chat.presenceByUserId}
            unreadByConversationId={chat.unreadByConversationId}
            railVisible={chat.isWideDesktop}
            pendingConversationId={chat.pendingConversationId}
            sendErrorById={chat.sendErrorById}
            requestErrorById={chat.requestErrorById}
            pendingRequestAction={chat.pendingRequestAction}
            onMinimize={chat.minimizeWindow}
            onRestore={chat.restoreWindow}
            onClose={chat.closeWindow}
            onSend={chat.sendMessage}
            onAcceptRequest={chat.acceptRequest}
            onIgnoreRequest={chat.ignoreRequest}
            onDeclineRequest={chat.declineRequest}
          />
        </>
      ) : null}

      {!chat.isDesktop && chat.mobileLayer !== "closed" ? (
        <MobileChatLayer
          layer={chat.mobileLayer}
          conversationId={chat.mobileConversationId}
          currentUserId={chat.currentUserId}
          contacts={chat.contacts}
          chats={chat.chats}
          requests={chat.requests}
          threads={chat.threads}
          presenceByUserId={chat.presenceByUserId}
          query={chat.mobileQuery}
          onQueryChange={chat.setMobileQuery}
          showingRequests={chat.showingRequests}
          onShowRequests={() =>
            chat.setShowingRequests(!chat.showingRequests)
          }
          pending={
            chat.pendingConversationId === chat.mobileConversationId
          }
          sendError={
            chat.mobileConversationId
              ? chat.sendErrorById[chat.mobileConversationId] ?? null
              : null
          }
          requestError={
            chat.mobileConversationId
              ? chat.requestErrorById[chat.mobileConversationId] ?? null
              : null
          }
          pendingRequestAction={
            chat.pendingRequestAction?.conversationId ===
            chat.mobileConversationId
              ? chat.pendingRequestAction.action
              : null
          }
          onBack={chat.mobileBack}
          onOpenContact={chat.openContact}
          onOpenConversation={chat.openConversation}
          onCompose={chat.beginMobileCompose}
          composeMode={chat.mobileComposeMode}
          composeNonce={chat.mobileComposeNonce}
          onSend={chat.sendMessage}
          onAcceptRequest={chat.acceptRequest}
          onIgnoreRequest={chat.ignoreRequest}
          onDeclineRequest={chat.declineRequest}
        />
      ) : null}
    </>
  );
}