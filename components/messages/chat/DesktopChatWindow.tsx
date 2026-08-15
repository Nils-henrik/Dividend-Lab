"use client";

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
  minimized: boolean;
  hasUnread: boolean;
  offset: number;
  pending?: boolean;
  sendError?: string | null;
  requestError?: string | null;
  pendingRequestAction?: "accept" | "ignore" | "decline" | null;
  onMinimize: () => void;
  onRestore: () => void;
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
  minimized,
  hasUnread,
  offset,
  pending,
  sendError,
  requestError,
  pendingRequestAction,
  onMinimize,
  onRestore,
  onClose,
  onSend,
  onAcceptRequest,
  onIgnoreRequest,
  onDeclineRequest,
}: Props) {
  const name =
    conversation?.otherParticipant?.name ?? DIVLAB_MEMBER_LABEL;
  const initials = conversation?.otherParticipant?.initials ?? "DL";
  const avatarUrl = conversation?.otherParticipant?.avatarUrl ?? null;

  if (minimized) {
    return (
      <div
        className="fixed z-30"
        style={{ right: offset, bottom: 0 }}
      >
        <button
          type="button"
          onClick={onRestore}
          aria-label={`Återställ chatt med ${name}`}
          className="mb-0 flex h-12 items-center gap-2 rounded-t-xl border border-b-0 divlab-border-neutral bg-divlab-elevated px-3 text-left shadow-[var(--divlab-shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        >
          <span className="relative">
            <ProfileAvatar
              avatarUrl={avatarUrl}
              initials={initials}
              sizeClassName="h-7 w-7"
              textClassName="text-[9px]"
            />
            {presence?.kind === "online" ? (
              <span
                aria-hidden="true"
                className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-divlab-elevated bg-divlab-green"
              />
            ) : null}
          </span>
          <span className="max-w-[9rem] truncate text-xs font-medium text-divlab-text">
            {name}
          </span>
          {hasUnread ? (
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-divlab-blue"
            />
          ) : null}
        </button>
      </div>
    );
  }

  return (
    <section
      aria-label={`Chatt med ${name}`}
      className="fixed z-30 flex h-[28rem] w-[328px] flex-col overflow-hidden rounded-t-2xl border border-b-0 divlab-border-neutral bg-divlab-card shadow-[var(--divlab-shadow-panel)]"
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
          <p className="truncate text-sm font-semibold text-divlab-text">{name}</p>
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