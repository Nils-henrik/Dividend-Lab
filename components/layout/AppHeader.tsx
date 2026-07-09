"use client";

import { usePathname } from "next/navigation";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import { pageTitles } from "@/lib/constants/navigation";
import NotificationBell from "./NotificationBell";
import ProfileDropdown from "./ProfileDropdown";
import SearchBar from "./SearchBar";

type Props = {
  user: UserDisplayIdentity;
  onLogout: () => void;
  isLoggingOut: boolean;
  isSidebarCollapsed: boolean;
  unreadMessageCount: number;
  isGuest?: boolean;
};

export default function AppHeader({
  user,
  onLogout,
  isLoggingOut,
  isSidebarCollapsed,
  unreadMessageCount,
  isGuest = false,
}: Props) {
  const pathname = usePathname();
  const pageTitle =
    pageTitles[pathname] ??
    Object.entries(pageTitles).find(
      ([path]) => path !== "/dashboard" && pathname.startsWith(`${path}/`),
    )?.[1] ??
    "Start";

  return (
    <header
      className={`fixed right-0 top-0 z-30 hidden h-20 divlab-shell-header transition-[left] duration-[225ms] ease-in-out lg:block ${
        isSidebarCollapsed ? "left-20" : "left-64"
      }`}
    >
      <div className="flex h-full items-center justify-between px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-divlab-text-muted">
            Dividend Lab
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar />
          <NotificationBell unreadMessageCount={unreadMessageCount} />
          <ProfileDropdown
            user={user}
            onLogout={onLogout}
            isLoggingOut={isLoggingOut}
            isGuest={isGuest}
          />
        </div>
      </div>
    </header>
  );
}
