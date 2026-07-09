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
};

export default function ProfileDropdown({
  user,
  onLogout,
  isLoggingOut,
  isGuest = false,
}: Props) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (isGuest) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(pathname)}`}
        className="rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
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
        <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-[#111111] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="flex items-center gap-3 border-b border-white/10 px-3 py-3">
            <ProfileAvatar
              avatarUrl={user.avatarUrl}
              initials={user.initials}
              sizeClassName="h-10 w-10"
              textClassName="text-xs"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {user.name}
              </p>
              <p className="mt-1 truncate text-xs text-gray-500">
                {user.username ? `@${user.username}` : user.email}
              </p>
            </div>
          </div>

          <div className="py-2">
            <Link
              href="/account"
              className="block rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] hover:text-white"
            >
              Profil
            </Link>
            <Link
              href="/account"
              className="block rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] hover:text-white"
            >
              Investeraridentitet
            </Link>
            <Link
              href="/account"
              className="block rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] hover:text-white"
            >
              Prenumeration
            </Link>
            <Link
              href="/settings"
              className="block rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] hover:text-white"
            >
              Inställningar
            </Link>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full rounded-xl border-t border-white/10 px-3 py-2 text-left text-sm text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
          >
            {isLoggingOut ? "Loggar ut..." : "Logga ut"}
          </button>
        </div>
      )}
    </div>
  );
}
