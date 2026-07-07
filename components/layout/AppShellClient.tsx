"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import { createClient } from "@/lib/supabase/client";
import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

const SIDEBAR_CLOSE_DELAY_MS = 250;

type Props = {
  children: React.ReactNode;
  user: UserDisplayIdentity;
};

export default function AppShellClient({ children, user }: Props) {
  const router = useRouter();
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerInSidebarRef = useRef(false);
  const isPointerInTriggerRef = useRef(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isSidebarCollapsed = !isSidebarExpanded;

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

  async function handleLogout() {
    setIsLoggingOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.push("/login");
    router.refresh();
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
        isLoggingOut={isLoggingOut}
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
