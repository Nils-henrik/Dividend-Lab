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
};

export default function AppHeader({
  user,
  onLogout,
  isLoggingOut,
  isSidebarCollapsed,
}: Props) {
  const pathname = usePathname();
  const pageTitle =
    pageTitles[pathname] ??
    Object.entries(pageTitles).find(
      ([path]) => path !== "/dashboard" && pathname.startsWith(`${path}/`),
    )?.[1] ??
    "Dashboard";

  return (
    <header
      className={`fixed right-0 top-0 z-30 h-20 border-b border-white/10 bg-[#090909]/90 backdrop-blur-xl transition-[left] duration-[225ms] ease-in-out ${
        isSidebarCollapsed ? "left-20" : "left-64"
      }`}
    >
      <div className="flex h-full items-center justify-between px-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gray-500">
            Dividend Lab
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-white">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <SearchBar />
          <NotificationBell />
          <ProfileDropdown
            user={user}
            onLogout={onLogout}
            isLoggingOut={isLoggingOut}
          />
        </div>
      </div>
    </header>
  );
}
