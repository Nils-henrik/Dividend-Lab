"use client";

import ProfileAvatar from "@/components/account/ProfileAvatar";
import { DESKTOP_MINIMIZED_BUBBLE_SIZE } from "@/lib/messages/chat-state";
import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type { PresenceView } from "@/lib/messages/types";

type Props = {
  name?: string | null;
  initials?: string | null;
  avatarUrl: string | null;
  presence?: PresenceView | null;
  hasUnread: boolean;
  offset: number;
  onRestore: () => void;
};

export default function DesktopMinimizedChatBubble({
  name,
  initials,
  avatarUrl,
  presence,
  hasUnread,
  offset,
  onRestore,
}: Props) {
  const displayName = name ?? DIVLAB_MEMBER_LABEL;
  const unreadSuffix = hasUnread ? ", oläst konversation" : "";
  const presenceSuffix =
    presence?.kind === "online" ? ", aktiv nu" : "";

  return (
    <div className="fixed z-30 hidden lg:block" style={{ right: offset, bottom: 16 }}>
      <button
        type="button"
        onClick={onRestore}
        aria-label={`Återställ chatt med ${displayName}${unreadSuffix}${presenceSuffix}`}
        className="relative flex items-center justify-center rounded-full border divlab-border-neutral bg-divlab-elevated shadow-[var(--divlab-shadow-soft)] transition hover:border-divlab-blue/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40"
        style={{
          width: DESKTOP_MINIMIZED_BUBBLE_SIZE,
          height: DESKTOP_MINIMIZED_BUBBLE_SIZE,
        }}
      >
        <ProfileAvatar
          avatarUrl={avatarUrl}
          initials={initials ?? "DL"}
          sizeClassName="h-11 w-11"
          textClassName="text-[11px]"
        />
        {presence?.kind === "online" ? (
          <span
            aria-hidden="true"
            className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-divlab-elevated bg-divlab-green"
          />
        ) : null}
        {hasUnread ? (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full border-2 border-divlab-elevated bg-divlab-blue"
          />
        ) : null}
      </button>
    </div>
  );
}
