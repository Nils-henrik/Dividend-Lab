"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { ANALYSIS_PREVIEW_TESTCENTER_URL } from "@/lib/analysis/preview-links";
import { appNavigation } from "@/lib/constants/navigation";
import {
  areNavigationGroupChildrenVisible,
  getNavigationGroupAriaExpanded,
  getNavigationItemKey,
  isNavigationChildActive,
  isNavigationItemActive,
  resolveNavigationGroupActivation,
  shouldNavigationGroupStartExpanded,
} from "@/lib/navigation/app-navigation-state";
import type { NavigationChildItem, NavigationItem } from "@/types/navigation";
import AppIcon from "./AppIcon";

type Props = {
  isCollapsed?: boolean;
  unreadMessageCount: number;
  onNavigate?: () => void;
  onExpandSidebar?: () => void;
  className?: string;
  navigationSurface?: "desktop" | "mobile";
  isOwner?: boolean;
};

function getNavigationItems(navigationSurface: "desktop" | "mobile") {
  return appNavigation.filter((item) => {
    if (item.visibility === "mobile-only") {
      return navigationSurface === "mobile";
    }

    return true;
  });
}

function NavigationLink({
  item,
  isActive,
  isCollapsed,
  unreadMessageCount,
  onNavigate,
}: {
  item: NavigationItem & { href: string };
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

function OwnerAnalysisPreviewLink({
  isCollapsed,
  onNavigate,
}: {
  isCollapsed: boolean;
  onNavigate?: () => void;
}) {
  const label = "Analys-testcenter";

  return (
    <a
      href={ANALYSIS_PREVIEW_TESTCENTER_URL}
      onClick={onNavigate}
      title={isCollapsed ? label : undefined}
      aria-label={isCollapsed ? label : undefined}
      className={`relative flex items-center rounded-xl text-sm font-medium transition divlab-nav-idle ${
        isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
      }`}
    >
      <AppIcon name="brain" />
      <span
        className={
          isCollapsed
            ? "sr-only"
            : "flex min-w-0 flex-1 items-center justify-between gap-2"
        }
      >
        <span className="truncate">{label}</span>
        <span className="shrink-0 text-[10px] font-normal leading-none text-divlab-text-muted">
          Preview
        </span>
      </span>
    </a>
  );
}

function NavigationChildLink({
  child,
  isActive,
  onNavigate,
}: {
  child: NavigationChildItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={child.href}
      onClick={onNavigate}
      className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${
        isActive ? "divlab-nav-active" : "divlab-nav-idle"
      }`}
    >
      <span className="truncate">{child.label}</span>
    </Link>
  );
}

function NavigationGroup({
  item,
  pathname,
  isCollapsed,
  onNavigate,
  onExpandSidebar,
}: {
  item: NavigationItem & { children: NavigationChildItem[] };
  pathname: string;
  isCollapsed: boolean;
  onNavigate?: () => void;
  onExpandSidebar?: () => void;
}) {
  const panelId = useId();
  const routeRequiresExpanded = shouldNavigationGroupStartExpanded(
    pathname,
    item,
  );
  const [isExpanded, setIsExpanded] = useState(routeRequiresExpanded);
  const isSectionActive = isNavigationItemActive(pathname, item);
  const showChildren = areNavigationGroupChildrenVisible(
    isExpanded,
    isCollapsed,
  );
  const ariaExpanded = getNavigationGroupAriaExpanded(isExpanded, isCollapsed);

  function handleDisclosureClick() {
    const activation = resolveNavigationGroupActivation({
      isSidebarCollapsed: isCollapsed,
      isGroupExpanded: isExpanded,
    });

    if (activation.shouldRequestSidebarExpand) {
      onExpandSidebar?.();
    }

    setIsExpanded(activation.nextGroupExpanded);
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={ariaExpanded}
        aria-controls={panelId}
        title={isCollapsed ? item.label : undefined}
        aria-label={item.label}
        onClick={handleDisclosureClick}
        className={`relative flex w-full items-center rounded-xl text-sm font-medium transition ${
          isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
        } ${isSectionActive ? "divlab-nav-active" : "divlab-nav-idle"}`}
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
          <AppIcon
            name="chevronDown"
            className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
              showChildren ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      <div
        id={panelId}
        role="group"
        aria-label={item.label}
        hidden={!showChildren}
        className={
          showChildren
            ? "mt-1 space-y-1 border-l divlab-border-neutral ml-5 pl-2"
            : undefined
        }
      >
        {showChildren
          ? item.children.map((child) => (
              <NavigationChildLink
                key={child.href}
                child={child}
                isActive={isNavigationChildActive(pathname, child)}
                onNavigate={onNavigate}
              />
            ))
          : null}
      </div>
    </div>
  );
}

function NavigationEntry({
  item,
  pathname,
  isCollapsed,
  unreadMessageCount,
  onNavigate,
  onExpandSidebar,
}: {
  item: NavigationItem;
  pathname: string;
  isCollapsed: boolean;
  unreadMessageCount: number;
  onNavigate?: () => void;
  onExpandSidebar?: () => void;
}) {
  if (item.children && item.children.length > 0) {
    return (
      <NavigationGroup
        key={`${getNavigationItemKey(item)}:${pathname}`}
        item={{ ...item, children: item.children }}
        pathname={pathname}
        isCollapsed={isCollapsed}
        onNavigate={onNavigate}
        onExpandSidebar={onExpandSidebar}
      />
    );
  }

  if (!item.href) {
    return null;
  }

  return (
    <NavigationLink
      item={{ ...item, href: item.href }}
      isActive={isNavigationItemActive(pathname, item)}
      isCollapsed={isCollapsed}
      unreadMessageCount={unreadMessageCount}
      onNavigate={onNavigate}
    />
  );
}

export default function AppNavigationLinks({
  isCollapsed = false,
  unreadMessageCount,
  onNavigate,
  onExpandSidebar,
  className = "",
  navigationSurface = "desktop",
  isOwner = false,
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
          <NavigationEntry
            key={getNavigationItemKey(item)}
            item={item}
            pathname={pathname}
            isCollapsed={isCollapsed}
            unreadMessageCount={unreadMessageCount}
            onNavigate={onNavigate}
            onExpandSidebar={onExpandSidebar}
          />
        ))}
        {isOwner ? (
          <OwnerAnalysisPreviewLink
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ) : null}
      </div>

      {accountItems.length > 0 ? (
        <div className="mt-auto space-y-1 border-t divlab-border-neutral pt-3">
          {accountItems.map((item) => (
            <NavigationEntry
              key={getNavigationItemKey(item)}
              item={item}
              pathname={pathname}
              isCollapsed={isCollapsed}
              unreadMessageCount={unreadMessageCount}
              onNavigate={onNavigate}
              onExpandSidebar={onExpandSidebar}
            />
          ))}
        </div>
      ) : null}
    </nav>
  );
}
