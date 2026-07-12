"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import AppIcon from "./AppIcon";

const FINE_POINTER_HOVER_QUERY = "(hover: hover) and (pointer: fine)";

type Props = {
  unreadMessageCount: number;
};

function formatUnreadMessageNotificationLabel(count: number) {
  if (count === 1) {
    return "Du har 1 oläst meddelande";
  }

  return `Du har ${count} olästa meddelanden`;
}

function formatUnreadBadgeLabel(count: number) {
  const displayCount = count > 9 ? "9+" : String(count);
  return count === 1
    ? "1 oläst meddelande"
    : `${displayCount} olästa meddelanden`;
}

export default function NotificationBell({ unreadMessageCount }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [supportsHoverLeave, setSupportsHoverLeave] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const hasUnreadMessages = unreadMessageCount > 0;

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

  function handleMouseLeave() {
    if (supportsHoverLeave && isOpen) {
      setIsOpen(false);
    }
  }

  const triggerLabel = hasUnreadMessages
    ? `Notifikationer, ${formatUnreadBadgeLabel(unreadMessageCount)}`
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
        {hasUnreadMessages ? (
          <span className="absolute right-2 top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full border border-divlab-bg bg-divlab-blue px-1 text-[10px] font-semibold leading-none text-white">
            {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 w-72 max-w-[calc(100vw-2rem)] pt-2">
          <div
            id={menuId}
            role="region"
            aria-label="Notifikationer"
            className="divlab-dropdown"
          >
            <div className="border-b divlab-border-neutral px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
                Notifikationer
              </p>
            </div>

            {hasUnreadMessages ? (
              <div className="py-2">
                <Link
                  href="/messages"
                  onClick={() => setIsOpen(false)}
                  aria-label={`${formatUnreadMessageNotificationLabel(unreadMessageCount)}. Gå till meddelanden.`}
                  className="block rounded-xl px-4 py-3 text-sm leading-6 text-divlab-text-secondary transition hover:bg-white/[0.03] hover:text-divlab-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                >
                  {formatUnreadMessageNotificationLabel(unreadMessageCount)}
                </Link>
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
