"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  clearMockUser,
  getMockUser,
  subscribeMockAuth,
} from "@/lib/auth/mockAuth";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const SIDEBAR_STATE_KEY = "dividend-lab:sidebar-collapsed";

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSyncExternalStore(subscribeMockAuth, getMockUser, () => null);
  const isForumRoute =
    pathname.startsWith("/forum") || pathname.startsWith("/dashboard/forum");
  const [sidebarPreference, setSidebarPreference] = useState<boolean | null>(
    () => {
      if (typeof window === "undefined") {
        return null;
      }

      const savedState = sessionStorage.getItem(SIDEBAR_STATE_KEY);

      if (!savedState) {
        return null;
      }

      return savedState === "collapsed";
    },
  );
  const isSidebarCollapsed = sidebarPreference ?? isForumRoute;

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [router, user]);

  function handleSidebarToggle() {
    setSidebarPreference((current) => {
      const nextState = !(current ?? isSidebarCollapsed);
      sessionStorage.setItem(
        SIDEBAR_STATE_KEY,
        nextState ? "collapsed" : "expanded",
      );
      return nextState;
    });
  }

  function handleLogout() {
    clearMockUser();
    router.push("/");
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#090909] text-white">
        <div className="rounded-3xl border border-white/10 bg-[#111111] px-8 py-6 text-sm text-gray-400">
          Laddar Dividend Lab...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={handleSidebarToggle}
      />
      <AppHeader
        user={user}
        onLogout={handleLogout}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <div
        className={`min-h-screen pt-20 transition-[padding] duration-300 ${
          isSidebarCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        <div className="px-8 py-8">{children}</div>
      </div>
    </main>
  );
}
