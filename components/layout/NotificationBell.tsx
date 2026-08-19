"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/notifications/actions";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import {
  formatNotificationRelativeTime,
  formatUnreadBadgeLabel,
} from "@/lib/notifications/format";
import type { NotificationFeedItem } from "@/lib/notifications/types";
import { createClient } from "@/lib/supabase/client";
import AppIcon from "./AppIcon";

const FINE_POINTER_HOVER_QUERY = "(hover: hover) and (pointer: fine)";

type Props = {
  unreadCount: number;
  items: NotificationFeedItem[];
  userId?: string | null;
};

function getTypeIconName(type: NotificationFeedItem["type"]) {
  switch (type) {
    case "contact_request":
      return "contacts" as const;
    case "forum_reply":
      return "forum" as const;
    case "moderation_decision":
      return "bell" as const;
    case "message_summary":
    default:
      return "messages" as const;
  }
}

export default function NotificationBell({
  unreadCount,
  items,
  userId = null,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [supportsHoverLeave, setSupportsHoverLeave] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const safeItems = Array.isArray(items) ? items : [];
  const safeUnreadCount =
    typeof unreadCount === "number" && Number.isFinite(unreadCount)
      ? Math.max(0, unreadCount)
      : 0;
  const hasUnread = safeUnreadCount > 0;
  const hasItems = safeItems.length > 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia(FINE_POINTER_HOVER_QUERY);

    function updateHoverLeaveSupport() {
      setSupportsHoverLeave(mediaQuery.matches);
    }

    updateHoverLeaveSupport();
    mediaQuery.addEventListener("change", updateHoverLeaveSupport);

    return () => {
      mediaQuery.removeEventListener("change", updateHoverLeaveSupport);
    };
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isOpen && event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    try {
      const supabase = createClient();
      const channel = supabase
        .channel(`user-notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_notifications",
            filter: `recipient_id=eq.${userId}`,
          },
          () => {
            router.refresh();
          },
        )
        .subscribe();

      return () => {
        void supabase.removeChannel(channel);
      };
    } catch {
      return undefined;
    }
  }, [router, userId]);

  function handleMouseLeave() {
    if (supportsHoverLeave && isOpen) {
      setIsOpen(false);
    }
  }

  function handleItemClick(item: NotificationFeedItem) {
    setIsOpen(false);

    if (item.type === "message_summary" || !item.isUnread) {
      return;
    }

    startTransition(() => {
      void markNotificationReadAction(item.id).then(() => {
        router.refresh();
      });
    });
  }

  function handleMarkAllRead() {
    startTransition(() => {
      void markAllNotificationsReadAction().then(() => {
        router.refresh();
      });
    });
  }

  const triggerLabel = hasUnread
    ? `Notifikationer, ${formatUnreadBadgeLabel(safeUnreadCount)}`
    : "Notifikationer";

  return (
    <div
      ref={menuRef}
      className="relative"
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        aria-label={triggerLabel}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        className="relative flex h-11 w-11 items-center justify-center divlab-input text-divlab-text-muted transition hover:border-divlab-blue/40 hover:text-divlab-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      >
        <AppIcon name="bell" />
        {hasUnread ? (
          <span className="absolute right-2 top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full border border-divlab-bg bg-divlab-blue px-1 text-[10px] font-semibold leading-none text-white">
            {safeUnreadCount > 9 ? "9+" : safeUnreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 w-80 max-w-[calc(100vw-2rem)] pt-2">
          <div
            id={menuId}
            role="region"
            aria-label="Notifikationer"
            className="divlab-dropdown"
          >
            <div className="flex items-center justify-between gap-3 border-b divlab-border-neutral px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
                Notifikationer
              </p>
              {hasUnread ? (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-[11px] font-medium text-divlab-blue-muted transition hover:text-divlab-blue disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Markera alla som lästa
                </button>
              ) : null}
            </div>

            {hasItems ? (
              <div className="max-h-[min(24rem,70vh)] overflow-y-auto py-2">
                {safeItems.map((item) => {
                  const relativeTime = formatNotificationRelativeTime(
                    item.createdAt,
                  );

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => handleItemClick(item)}
                      aria-label={`${item.categoryLabel}. ${item.body}${
                        relativeTime ? ` ${relativeTime}.` : "."
                      }${item.isUnread ? " Oläst." : ""}`}
                      className={`flex gap-3 rounded-xl px-4 py-3 transition hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                        item.isUnread ? "bg-divlab-blue/[0.04]" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border divlab-border-neutral bg-divlab-surface text-divlab-text-muted">
                        {item.actorAvatarUrl || item.actorUsername ? (
                          <ProfileAvatar
                            avatarUrl={item.actorAvatarUrl}
                            initials={item.actorInitials}
                            sizeClassName="h-9 w-9"
                            textClassName="text-[10px]"
                            imageAlt=""
                          />
                        ) : (
                          <AppIcon name={getTypeIconName(item.type)} />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
                            {item.categoryLabel}
                          </p>
                          {item.isUnread ? (
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 shrink-0 rounded-full bg-divlab-blue"
                            />
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-divlab-text-secondary">
                          {item.body}
                        </p>
                        {relativeTime ? (
                          <p className="mt-1 text-[11px] text-divlab-text-muted">
                            {relativeTime}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="px-4 py-5">
                <p className="text-sm leading-6 text-divlab-text-secondary">
                  Du har inga nya notifikationer.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
