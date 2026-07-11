"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import GlobalSearch from "@/components/search/GlobalSearch";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import { getPageTitle } from "@/lib/constants/navigation";
import ProfileDropdown from "./ProfileDropdown";

type Props = {
  user: UserDisplayIdentity;
  onLogout: () => void;
  isLoggingOut: boolean;
  onOpenMenu: () => void;
  isMenuOpen?: boolean;
  isGuest?: boolean;
};

export default function MobileAppHeader({
  user,
  onLogout,
  isLoggingOut,
  onOpenMenu,
  isMenuOpen = false,
  isGuest = false,
}: Props) {
  const pathname = usePathname();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-40 divlab-shell-header lg:hidden">
      <div className="flex h-16 items-center gap-2 px-4">
        {!isSearchExpanded && (
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav-drawer"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border divlab-border-neutral text-divlab-text-secondary transition hover:border-divlab-blue/40 hover:text-divlab-blue"
          >
            <span className="flex flex-col gap-1" aria-hidden="true">
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
              <span className="block h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>
        )}

        {!isSearchExpanded && (
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center gap-2 transition hover:opacity-90"
            aria-label="DivLab Start"
          >
            <span className="divlab-brand-logo text-xl">DL</span>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold tracking-[0.22em] text-divlab-text">
                DIVLAB
              </p>
              <p className="truncate text-[10px] text-divlab-text-muted">{pageTitle}</p>
            </div>
          </Link>
        )}

        <GlobalSearch
          variant="mobile"
          onExpandedChange={setIsSearchExpanded}
        />

        {!isSearchExpanded && (
          <ProfileDropdown
            user={user}
            onLogout={onLogout}
            isLoggingOut={isLoggingOut}
            isGuest={isGuest}
          />
        )}
      </div>
    </header>
  );
}
