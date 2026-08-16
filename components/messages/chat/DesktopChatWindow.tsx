"use client";

import Link from "next/link";
import AppIcon from "@/components/layout/AppIcon";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type { ConversationThread, PresenceView } from "@/lib/messages/types";
import ConversationPane from "./ConversationPane";
import PresenceIndicator from "./PresenceIndicator";

type Props = {
  conversation: ConversationThread | undefined;
  currentUserId: string;
  presence?: PresenceView | null;
  offset: number;
  pending?: boolean;
  sendError?: string | null;
  requestError?: string | null;
  pendingRequestAction?: "accept" | "ignore" | "decline" | null;
  onMinimize: () => void;
  onClose: () => void;
  onSend: (conversationId: string, body: string) => Promise<boolean>;
  onAcceptRequest: (conversationId: string) => void;
  onIgnoreRequest: (conversationId: string) => void;
  onDeclineRequest: (conversationId: string) => void;
};

export default function DesktopChatWindow({
  conversation,
  currentUserId,
  presence,
  offset,
  pending,
  sendError,
  requestError,
  pendingRequestAction,
  onMinimize,
  onClose,
  onSend,
  onAcceptRequest,
  onIgnoreRequest,
  onDeclineRequest,
}: Props) {
  const name =
    conversation?.otherParticipant?.name ?? DIVLAB_MEMBER_LABEL;
  const username = conversation?.otherParticipant?.username ?? null;
  const initials = conversation?.otherParticipant?.initials ?? "DL";
  const avatarUrl = conversation?.otherParticipant?.avatarUrl ?? null;

  return (
    <section
      aria-label={`Chatt med ${name}`}
      className="fixed z-30 hidden h-[28rem] w-[328px] flex-col overflow-hidden rounded-t-2xl border border-b-0 divlab-border-neutral bg-divlab-card shadow-[var(--divlab-shadow-panel)] lg:flex"
      style={{ right: offset, bottom: 0 }}
    >
      <header className="flex items-center gap-2 border-b divlab-border-neutral bg-divlab-elevated px-3 py-2">
        <ProfileAvatar
          avatarUrl={avatarUrl}
          initials={initials}
          sizeClassName="h-8 w-8"
          textClassName="text-[10px]"
        />
        <div className="min-w-0 flex-1">
          {username ? (
            <Link
              href={`/profile/${username}`}
              className="block truncate rounded-sm text-sm font-semibold text-divlab-text transition hover:text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
            >
              {name}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-divlab-text">{name}</p>
          )}
          <PresenceIndicator presence={presence} showLabel />
        </div>
        <button
          type="button"
          onClick={onMinimize}
          aria-label={`Minimera chatt med ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-divlab-text-muted transition hover:bg-white/[0.06] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          <AppIcon name="minus" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Stäng chatt med ${name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-divlab-text-muted transition hover:bg-white/[0.06] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          <AppIcon name="close" />
        </button>
      </header>

      {conversation ? (
        <ConversationPane
          conversation={conversation}
          currentUserId={currentUserId}
          presence={presence}
          compact
          hideHeader
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
      )}
    </section>
  );
}
