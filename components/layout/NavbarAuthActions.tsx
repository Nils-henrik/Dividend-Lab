"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AuthenticatedUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/client";

type Props = {
  user: AuthenticatedUser | null;
};

export default function NavbarAuthActions({ user }: Props) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-xl border border-[#D4AF37]/70 px-6 py-3 text-[#D4AF37] transition duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
        >
          Start
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-xl border border-white/10 px-6 py-3 text-gray-300 transition duration-300 hover:border-white/20 hover:text-white"
        >
          {isLoggingOut ? "Loggar ut..." : "Logga ut"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="rounded-xl border border-[#D4AF37]/70 px-6 py-3 text-[#D4AF37] transition duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
      >
        Logga in
      </Link>
      <Link
        href="/register"
        className="rounded-xl border border-white/10 px-6 py-3 text-gray-300 transition duration-300 hover:border-white/20 hover:text-white"
      >
        Skapa konto
      </Link>
    </div>
  );
}
