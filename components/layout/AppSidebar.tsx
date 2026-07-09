"use client";

import Link from "next/link";
import AppNavigationLinks from "./AppNavigationLinks";

type Props = {
  isCollapsed: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  unreadMessageCount: number;
};

export default function AppSidebar({
  isCollapsed,
  onMouseEnter,
  onMouseLeave,
  unreadMessageCount,
}: Props) {
  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r divlab-border-neutral bg-divlab-bg transition-[width] duration-[225ms] ease-in-out lg:flex ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex h-20 items-center border-b divlab-border-neutral ${
          isCollapsed ? "justify-center px-3" : "px-6"
        }`}
      >
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-3 transition hover:opacity-90"
          aria-label="DivLab Start"
        >
          <span className="text-3xl font-bold text-divlab-gold">DL</span>
          <div className={isCollapsed ? "hidden" : "block"}>
            <p className="text-sm font-semibold tracking-[0.28em] text-divlab-text">
              DIVIDEND
            </p>
            <p className="text-xs font-semibold tracking-[0.32em] text-divlab-gold">
              LAB
            </p>
          </div>
        </Link>
      </div>

      <AppNavigationLinks
        isCollapsed={isCollapsed}
        unreadMessageCount={unreadMessageCount}
        className="flex-1 px-3 py-5"
      />
    </aside>
  );
}
