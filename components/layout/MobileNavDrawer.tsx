"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import AppNavigationLinks from "./AppNavigationLinks";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  unreadMessageCount: number;
};

export default function MobileNavDrawer({
  isOpen,
  onClose,
  unreadMessageCount,
}: Props) {
  const drawerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 transition-opacity duration-200 ease-out"
      />

      <aside
        id="mobile-nav-drawer"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Main navigation"
        className="relative flex h-full w-[min(18rem,85vw)] flex-col border-r divlab-border-neutral bg-divlab-bg shadow-[0_0_60px_rgba(0,0,0,0.45)] transition-transform duration-200 ease-out"
      >
        <div className="flex h-16 items-center justify-between border-b divlab-border-neutral px-4">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 transition hover:opacity-90"
            aria-label="DivLab Start"
          >
            <span className="text-2xl font-bold text-divlab-gold">DL</span>
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-divlab-text">
                DIVIDEND
              </p>
              <p className="text-[11px] font-semibold tracking-[0.32em] text-divlab-gold">
                LAB
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg border divlab-border-neutral px-2.5 py-1.5 text-xs font-medium text-divlab-text-muted transition hover:border-divlab-border-strong hover:text-divlab-text"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <AppNavigationLinks
            unreadMessageCount={unreadMessageCount}
            onNavigate={onClose}
          />
        </div>
      </aside>
    </div>
  );
}
