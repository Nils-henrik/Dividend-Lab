"use client";

import AppNavigationLinks from "./AppNavigationLinks";
import DivLabWordmark from "@/components/brand/DivLabWordmark";

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
      className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r divlab-border-neutral bg-divlab-shell transition-[width] duration-[225ms] ease-in-out lg:flex ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex h-20 items-center border-b divlab-border-neutral ${
          isCollapsed ? "justify-center px-3" : "px-6"
        }`}
      >
        <DivLabWordmark
          href="/dashboard"
          logoClassName="text-3xl"
          textClassName={isCollapsed ? "sr-only" : "text-sm"}
          aria-label="DivLab Översikt"
        />
      </div>

      <AppNavigationLinks
        isCollapsed={isCollapsed}
        unreadMessageCount={unreadMessageCount}
        className="flex-1 px-3 py-5"
      />
    </aside>
  );
}
