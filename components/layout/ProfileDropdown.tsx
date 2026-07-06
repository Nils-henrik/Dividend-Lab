"use client";

import Link from "next/link";
import { useState } from "react";
import type { MockUser } from "@/lib/auth/mockAuth";

type Props = {
  user: MockUser;
  onLogout: () => void;
};

export default function ProfileDropdown({ user, onLogout }: Props) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsProfileOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37]"
      >
        {initials}
      </button>

      {isProfileOpen && (
        <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-[#111111] p-2 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
          <div className="border-b border-white/10 px-3 py-3">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="mt-1 text-xs text-gray-500">@{user.username}</p>
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
              Account Overview
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
            className="w-full rounded-xl border-t border-white/10 px-3 py-2 text-left text-sm text-gray-400 transition hover:bg-white/[0.03] hover:text-white"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
