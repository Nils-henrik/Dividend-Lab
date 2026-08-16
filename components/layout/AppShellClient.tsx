"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import ChatExperience from "@/components/messages/chat/ChatExperience";
import ChatProvider, {
  useOptionalChat,
} from "@/components/messages/chat/ChatProvider";
import type { GlobalChatBootstrap } from "@/lib/messages/types";
import type { NotificationFeedItem } from "@/lib/notifications/types";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import { createClient } from "@/lib/supabase/client";
import AppHeader from "./AppHeader";
import AppLegalFooter from "./AppLegalFooter";
import AppSidebar from "./AppSidebar";
import MobileAppHeader from "./MobileAppHeader";
import MobileNavDrawer from "./MobileNavDrawer";

const SIDEBAR_CLOSE_DELAY_MS = 250;

type Props = {
  children: React.ReactNode;
  user: UserDisplayIdentity;
  unreadMessageCount: number;
  unreadNotificationCount: number;
  notificationItems: NotificationFeedItem[];
  notificationUserId?: string | null;
  isGuest?: boolean;
  chatBootstrap?: GlobalChatBootstrap | null;
};

export default function AppShellClient({
  children,
  user,
  unreadMessageCount,
  unreadNotificationCount,
  notificationItems,
  notificationUserId = null,
  isGuest = false,
  chatBootstrap = null,
}: Props) {
  const frame = (
    <AppShellFrame
      user={user}
      unreadMessageCount={unreadMessageCount}
      unreadNotificationCount={unreadNotificationCount}
      notificationItems={notificationItems}
      notificationUserId={notificationUserId}
      isGuest={isGuest}
    >
      {children}
    </AppShellFrame>
  );

  if (isGuest || !chatBootstrap?.currentUserId) {
    return frame;
  }

  return <ChatProvider bootstrap={chatBootstrap}>{frame}</ChatProvider>;
}

function AppShellFrame({
  children,
  user,
  unreadMessageCount,
  unreadNotificationCount,
  notificationItems,
  notificationUserId = null,
  isGuest = false,
}: Omit<Props, "chatBootstrap">) {
  const router = useRouter();
  const chat = useOptionalChat();
  const liveUnreadMessageCount = chat?.unreadCount ?? unreadMessageCount;
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerInSidebarRef = useRef(false);
  const isPointerInTriggerRef = useRef(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
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
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Failed to sign out", {
        message: error.message,
        status: error.status,
      });
      setIsLoggingOut(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-divlab-bg text-divlab-text">
      <div
        aria-hidden="true"
        onMouseEnter={handleTriggerEnter}
        onMouseLeave={handleTriggerLeave}
        className="fixed inset-y-0 left-0 z-50 hidden w-3 lg:block"
      />
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        onExpandSidebar={openSidebar}
        unreadMessageCount={liveUnreadMessageCount}
      />
      <MobileAppHeader
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        onOpenMenu={() => setIsMobileNavOpen(true)}
        isMenuOpen={isMobileNavOpen}
        isGuest={isGuest}
        unreadNotificationCount={unreadNotificationCount}
        unreadMessageCount={liveUnreadMessageCount}
        notificationItems={notificationItems}
        notificationUserId={notificationUserId}
      />
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        unreadMessageCount={liveUnreadMessageCount}
      />
      <AppHeader
        user={user}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        isSidebarCollapsed={isSidebarCollapsed}
        unreadNotificationCount={unreadNotificationCount}
        unreadMessageCount={liveUnreadMessageCount}
        notificationItems={notificationItems}
        notificationUserId={notificationUserId}
        isGuest={isGuest}
      />
      {chat ? <ChatExperience /> : null}
      <div
        className={`flex min-h-screen flex-col pt-16 transition-[padding] duration-[225ms] ease-in-out lg:pt-20 ${
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
        } ${chat?.isWideDesktop ? "xl:pr-72" : ""}`}
      >
        <div className="flex flex-1 flex-col px-4 py-4 lg:px-8 lg:py-8">
          <div className="min-w-0 flex-1">{children}</div>
          <AppLegalFooter />
        </div>
      </div>
    </main>
  );
}
