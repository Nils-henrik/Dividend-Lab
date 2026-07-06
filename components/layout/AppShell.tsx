"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  clearMockUser,
  getMockUser,
  subscribeMockAuth,
} from "@/lib/auth/mockAuth";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const SIDEBAR_CLOSE_DELAY_MS = 250;

type Props = {
  children: React.ReactNode;
};

export default function AppShell({ children }: Props) {
  const router = useRouter();
  const user = useSyncExternalStore(subscribeMockAuth, getMockUser, () => null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerInSidebarRef = useRef(false);
  const isPointerInTriggerRef = useRef(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const isSidebarCollapsed = !isSidebarExpanded;

  useEffect(() => {
    if (!user) {
      router.replace("/");
    }
  }, [router, user]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  function openSidebar() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setIsSidebarExpanded(true);
  }

  function closeSidebarIfInactive() {
    if (isPointerInSidebarRef.current || isPointerInTriggerRef.current) {
      return;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = setTimeout(() => {
      if (isPointerInSidebarRef.current || isPointerInTriggerRef.current) {
        closeTimeoutRef.current = null;
        return;
      }

      setIsSidebarExpanded(false);
      closeTimeoutRef.current = null;
    }, SIDEBAR_CLOSE_DELAY_MS);
  }

  function handleTriggerEnter() {
    isPointerInTriggerRef.current = true;
    openSidebar();
  }

  function handleTriggerLeave() {
    isPointerInTriggerRef.current = false;
    closeSidebarIfInactive();
  }

  function handleSidebarEnter() {
    isPointerInSidebarRef.current = true;
    openSidebar();
  }

  function handleSidebarLeave() {
    isPointerInSidebarRef.current = false;
    closeSidebarIfInactive();
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
      <div
        aria-hidden="true"
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={handleTriggerLeave}
        className="fixed inset-y-0 left-0 z-50 w-3"
      />
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      />
      <AppHeader
        user={user}
        onLogout={handleLogout}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      <div
        className={`min-h-screen pt-20 transition-[padding] duration-[225ms] ease-in-out ${
          isSidebarCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        <div className="px-8 py-8">{children}</div>
      </div>
    </main>
  );
}
