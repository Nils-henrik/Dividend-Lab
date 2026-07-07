"use client";

import Link from "next/link";
import { useState } from "react";
import type { AuthenticatedUser } from "@/lib/auth/user";

type Props = {
  user: AuthenticatedUser;
  onLogout: () => void;
  isLoggingOut: boolean;
};

export default function ProfileDropdown({
  user,
  onLogout,
  isLoggingOut,
}: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsProfileOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37]"
      >
        {user.initials}
      </button>

      {isProfileOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-[#111111] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="border-b border-white/10 px-3 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
          </div>

          <div className="py-2">
            <Link
              href="/account"
              className="block rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] hover:text-white"
            >
              Profile
            </Link>
            <Link
              href="/account"
              className="block rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] hover:text-white"
            >
              Investor Identity
            </Link>
            <Link
              href="/account"
              className="block rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] hover:text-white"
            >
              Subscription
            </Link>
            <Link
              href="/settings"
              className="block rounded-xl px-3 py-2 text-sm text-gray-300 transition hover:bg-white/[0.03] hover:text-white"
            >
              Settings
            </Link>
          </div>

          <button
            type="button"
            onClick={onLogout}
            disabled={isLoggingOut}
            className="w-full rounded-xl border-t border-white/10 px-3 py-2 text-left text-sm text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
