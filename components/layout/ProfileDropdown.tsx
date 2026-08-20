"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";

type Props = {
  user: UserDisplayIdentity;
  onLogout: () => void;
  isLoggingOut: boolean;
  isGuest?: boolean;
  isModerator?: boolean;
};

export default function ProfileDropdown({
  user,
  onLogout,
  isLoggingOut,
  isGuest = false,
  isModerator = false,
}: Props) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const publicProfileHref = user.username
    ? `/profile/${encodeURIComponent(user.username.trim().toLowerCase())}`
    : "/account/edit";

  if (isGuest) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(pathname)}`}
        className="rounded-xl border divlab-border-neutral px-3 py-2 text-xs font-medium text-divlab-text-secondary transition hover:border-divlab-blue/40 hover:text-divlab-blue"
      >
        Logga in
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsProfileOpen((value) => !value)}
        className="rounded-full transition hover:opacity-90"
      >
        <ProfileAvatar avatarUrl={user.avatarUrl} initials={user.initials} />
      </button>

      {isProfileOpen && (
        <div className="absolute right-0 mt-3 w-64 divlab-dropdown">
          <div className="flex items-center gap-3 border-b divlab-border-neutral px-3 py-3">
            <ProfileAvatar
              avatarUrl={user.avatarUrl}
              initials={user.initials}
              sizeClassName="h-10 w-10"
              textClassName="text-xs"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-divlab-text">
                {user.name}
              </p>
              <p className="mt-1 truncate text-xs text-divlab-text-muted">
                {user.username ? `@${user.username}` : user.email}
              </p>
            </div>
          </div>

          {isModerator ? (
            <div className="border-b divlab-border-neutral p-2">
              <Link
                href="/moderation"
                onClick={() => setIsProfileOpen(false)}
                className="block rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-sm font-medium text-amber-200 transition hover:border-amber-400/40 hover:bg-amber-500/15"
              >
                Moderering
                <span className="mt-0.5 block text-[11px] font-normal text-amber-200/70">
                  Ägarverktyg för rapporter och innehåll
                </span>
              </Link>
            </div>
          ) : null}

          <div className="py-2">
            <Link
              href={publicProfileHref}
              className="block rounded-xl px-3 py-2 text-sm text-divlab-text-secondary transition hover:bg-white/[0.03] hover:text-divlab-text"
            >
              Profil
            </Link>
            <Link
              href="/account"
              className="block rounded-xl px-3 py-2 text-sm text-divlab-text-secondary transition hover:bg-white/[0.03] hover:text-divlab-text"
            >
              Investeraridentitet
            </Link>
            <Link
              href="/account"
              className="block rounded-xl px-3 py-2 text-sm text-divlab-text-secondary transition hover:bg-white/[0.03] hover:text-divlab-text"
            >
              Prenumeration
            </Link>
            <Link
              href="/settings"
              className="block rounded-xl px-3 py-2 text-sm text-divlab-text-secondary transition hover:bg-white/[0.03] hover:text-divlab-text"
            >
              Inställningar
            </Link>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full rounded-xl border-t divlab-border-neutral px-3 py-2 text-left text-sm text-divlab-text-muted transition hover:bg-white/[0.03] hover:text-divlab-text"
          >
            {isLoggingOut ? "Loggar ut..." : "Logga ut"}
          </button>
        </div>
      )}
    </div>
  );
}
