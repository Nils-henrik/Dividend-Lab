"use client";

import { useEffect, useRef, useState } from "react";
import AppIcon from "@/components/layout/AppIcon";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type {
  ChatContact,
  ConversationSummary,
  ConversationThread,
  PresenceView,
} from "@/lib/messages/types";
import ConversationPane from "./ConversationPane";
import MobileChatInbox from "./MobileChatInbox";
import PresenceIndicator from "./PresenceIndicator";

type Props = {
  layer: "inbox" | "conversation";
  conversationId: string | null;
  currentUserId: string;
  contacts: ChatContact[];
  chats: ConversationSummary[];
  requests: ConversationSummary[];
  threads: Record<string, ConversationThread>;
  presenceByUserId: Record<string, PresenceView>;
  query: string;
  onQueryChange: (value: string) => void;
  showingRequests: boolean;
  onShowRequests: () => void;
  pending?: boolean;
  sendError?: string | null;
  requestError?: string | null;
  pendingRequestAction?: "accept" | "ignore" | "decline" | null;
  onBack: () => void;
  onOpenContact: (userId: string) => void;
  onOpenConversation: (conversationId: string) => void;
  onCompose: () => void;
  composeMode: boolean;
  composeNonce: number;
  onSend: (conversationId: string, body: string) => Promise<boolean>;
  onAcceptRequest: (conversationId: string) => void;
  onIgnoreRequest: (conversationId: string) => void;
  onDeclineRequest: (conversationId: string) => void;
};

export default function MobileChatLayer({
  layer,
  conversationId,
  currentUserId,
  contacts,
  chats,
  requests,
  threads,
  presenceByUserId,
  query,
  onQueryChange,
  showingRequests,
  onShowRequests,
  pending,
  sendError,
  requestError,
  pendingRequestAction,
  onBack,
  onOpenContact,
  onOpenConversation,
  onCompose,
  composeMode,
  composeNonce,
  onSend,
  onAcceptRequest,
  onIgnoreRequest,
  onDeclineRequest,
}: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const backButtonRef = useRef<HTMLButtonElement | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const conversation = conversationId ? threads[conversationId] : undefined;
  const other = conversation?.otherParticipant;
  const presence = other ? presenceByUserId[other.id] : null;

  useEffect(() => {
    backButtonRef.current?.focus();
  }, [layer, conversationId]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) {
      return;
    }

    const activeViewport = viewport;

    function updateOffset() {
      const next =
        window.innerHeight - activeViewport.height - activeViewport.offsetTop;
      setKeyboardOffset(Math.max(0, next));
    }

    updateOffset();
    activeViewport.addEventListener("resize", updateOffset);
    activeViewport.addEventListener("scroll", updateOffset);
    return () => {
      activeViewport.removeEventListener("resize", updateOffset);
      activeViewport.removeEventListener("scroll", updateOffset);
    };
  }, []);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={layer === "inbox" ? "Chattar" : "Konversation"}
      className="fixed inset-0 z-[60] flex flex-col bg-divlab-bg lg:hidden"
      style={{
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: `calc(env(safe-area-inset-bottom) + ${keyboardOffset}px)`,
      }}
    >
      <header className="flex h-14 shrink-0 items-center gap-2 border-b divlab-border-neutral px-3">
        <button
          ref={backButtonRef}
          type="button"
          onClick={onBack}
          aria-label={layer === "conversation" ? "Tillbaka till chattar" : "Stäng chattar"}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-divlab-text-secondary transition hover:bg-white/[0.05] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          <AppIcon name="chevronLeft" className="h-5 w-5" />
        </button>

        {layer === "conversation" ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <ProfileAvatar
              avatarUrl={other?.avatarUrl ?? null}
              initials={other?.initials ?? "DL"}
              sizeClassName="h-8 w-8"
              textClassName="text-[10px]"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-divlab-text">
                {other?.name ?? DIVLAB_MEMBER_LABEL}
              </p>
              <PresenceIndicator presence={presence} showLabel />
            </div>
          </div>
        ) : (
          <>
            <h2 className="flex-1 text-lg font-semibold tracking-[-0.03em] text-divlab-text">
              Chattar
            </h2>
            <button
              type="button"
              onClick={onCompose}
              aria-label="Nytt meddelande"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-divlab-text-secondary transition hover:bg-white/[0.05] hover:text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
            >
              <AppIcon name="compose" />
            </button>
          </>
        )}
      </header>

      {layer === "conversation" ? (
        conversation ? (
          <ConversationPane
            conversation={conversation}
            currentUserId={currentUserId}
            presence={presence}
            hideHeader
            compact
            pending={pending}
            sendError={sendError}
            requestError={requestError}
            pendingRequestAction={pendingRequestAction}
            onSend={onSend}
            onAcceptRequest={onAcceptRequest}
            onIgnoreRequest={onIgnoreRequest}
            onDeclineRequest={onDeclineRequest}
          />
        ) : (
          <div className="flex flex-1 items-center px-4">
            <p className="text-sm text-divlab-text-secondary">
              Laddar konversation...
            </p>
          </div>
        )
      ) : (
        <MobileChatInbox
          query={query}
          onQueryChange={onQueryChange}
          contacts={contacts}
          chats={chats}
          requests={requests}
          presenceByUserId={presenceByUserId}
          onOpenContact={onOpenContact}
          onOpenConversation={onOpenConversation}
          onShowRequests={onShowRequests}
          showingRequests={showingRequests}
          composeMode={composeMode}
          composeNonce={composeNonce}
        />
      )}
    </div>
  );
}