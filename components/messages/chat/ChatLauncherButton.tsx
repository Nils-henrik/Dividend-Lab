"use client";

import AppIcon from "@/components/layout/AppIcon";
import { formatUnreadChatBadgeLabel } from "@/lib/messages/chat-state";

type Props = {
  unreadCount: number;
  onClick: () => void;
  pressed?: boolean;
};

export default function ChatLauncherButton({
  unreadCount,
  onClick,
  pressed = false,
}: Props) {
  const hasUnread = unreadCount > 0;

  return (
    <button
      type="button"
      aria-label={formatUnreadChatBadgeLabel(unreadCount)}
      aria-pressed={pressed}
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center divlab-input text-divlab-text-muted transition hover:border-divlab-blue/40 hover:text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
    >
      <AppIcon name="messages" />
      {hasUnread ? (
        <span className="absolute right-2 top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full border border-divlab-bg bg-divlab-blue px-1 text-[10px] font-semibold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </button>
  );
}