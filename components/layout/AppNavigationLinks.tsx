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

function NavigationLink({
  item,
  isActive,
  isCollapsed,
  unreadMessageCount,
  onNavigate,
}: {
  item: NavigationItem;
  isActive: boolean;
  isCollapsed: boolean;
  unreadMessageCount: number;
  onNavigate?: () => void;
}) {
  const showUnreadIndicator =
    item.href === "/messages" && unreadMessageCount > 0;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={isCollapsed ? item.label : undefined}
      aria-label={isCollapsed ? item.label : undefined}
      className={`relative flex items-center rounded-xl text-sm font-medium transition ${
        isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
      } ${isActive ? "divlab-nav-active" : "divlab-nav-idle"}`}
    >
      <AppIcon name={item.icon} />
      <span
        className={
          isCollapsed
            ? "sr-only"
            : "flex min-w-0 flex-1 items-center justify-between gap-2"
        }
      >
        <span className="truncate">{item.label}</span>
        {item.statusLabel ? (
          <span className="shrink-0 text-[10px] font-normal leading-none text-divlab-text-muted">
            {item.statusLabel}
          </span>
        ) : null}
      </span>
      {showUnreadIndicator && (
        <span
          className={`rounded-full bg-divlab-blue ${
            isCollapsed
              ? "absolute right-4 top-2 h-2 w-2"
              : "shrink-0 min-w-5 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-black"
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
  const mainItems = navigationItems.filter((item) => item.section !== "account");
  const accountItems = navigationItems.filter(
    (item) => item.section === "account",
  );

  return (
    <nav className={`flex h-full flex-col ${className}`}>
      <div className="space-y-1">
        {mainItems.map((item) => (
          <NavigationLink
            key={item.href}
            item={item}
            isActive={isNavigationItemActive(pathname, item)}
            isCollapsed={isCollapsed}
            unreadMessageCount={unreadMessageCount}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      {accountItems.length > 0 ? (
        <div className="mt-auto space-y-1 border-t divlab-border-neutral pt-3">
          {accountItems.map((item) => (
            <NavigationLink
              key={item.href}
              item={item}
              isActive={isNavigationItemActive(pathname, item)}
              isCollapsed={isCollapsed}
              unreadMessageCount={unreadMessageCount}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </nav>
  );
}
