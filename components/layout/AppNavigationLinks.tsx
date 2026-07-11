"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation } from "@/lib/constants/navigation";
import type { NavigationItem } from "@/types/navigation";
import AppIcon from "./AppIcon";

type Props = {
  isCollapsed?: boolean;
  unreadMessageCount: number;
  onNavigate?: () => void;
  className?: string;
  navigationSurface?: "desktop" | "mobile";
};

function getNavigationItems(navigationSurface: "desktop" | "mobile") {
  return appNavigation.filter((item) => {
    if (item.visibility === "mobile-only") {
      return navigationSurface === "mobile";
    }

    return true;
  });
}

function isNavigationItemActive(pathname: string, item: NavigationItem) {
  if (item.href === "/dashboard") {
    return pathname === item.href;
  }

  return pathname.startsWith(item.href);
}

export default function AppNavigationLinks({
  isCollapsed = false,
  unreadMessageCount,
  onNavigate,
  className = "",
  navigationSurface = "desktop",
}: Props) {
  const pathname = usePathname();
  const navigationItems = getNavigationItems(navigationSurface);

  return (
    <nav className={`space-y-1 ${className}`}>
      {navigationItems.map((item) => {
        const isActive = isNavigationItemActive(pathname, item);
        const showUnreadIndicator =
          item.href === "/messages" && unreadMessageCount > 0;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={isCollapsed ? item.label : undefined}
            aria-label={isCollapsed ? item.label : undefined}
            className={`relative flex items-center rounded-xl text-sm font-medium transition ${
              isCollapsed
                ? "justify-center px-2 py-2.5"
                : "gap-3 px-3 py-2.5"
            } ${isActive ? "divlab-nav-active" : "divlab-nav-idle"}`}
          >
            <AppIcon name={item.icon} />
            <span className={isCollapsed ? "sr-only" : "block"}>
              {item.label}
            </span>
            {showUnreadIndicator && (
              <span
                className={`rounded-full bg-divlab-blue ${
                  isCollapsed
                    ? "absolute right-4 top-2 h-2 w-2"
                    : "ml-auto min-w-5 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-black"
                }`}
              >
                {isCollapsed
                  ? ""
                  : unreadMessageCount > 9
                    ? "9+"
                    : unreadMessageCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
