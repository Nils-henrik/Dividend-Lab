"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation } from "@/lib/constants/navigation";
import AppIcon from "./AppIcon";

type Props = {
  isCollapsed?: boolean;
  unreadMessageCount: number;
  onNavigate?: () => void;
  className?: string;
};

export default function AppNavigationLinks({
  isCollapsed = false,
  unreadMessageCount,
  onNavigate,
  className = "",
}: Props) {
  const pathname = usePathname();

  return (
    <nav className={`space-y-1 ${className}`}>
      {appNavigation.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
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
