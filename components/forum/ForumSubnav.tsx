"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  forumNavigationItems,
  isForumNavItemActive,
} from "@/lib/constants/forum-navigation";

export default function ForumSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Forum"
      className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex min-w-max items-center gap-1">
        {forumNavigationItems.map((item) => {
          const isActive = isForumNavItemActive(pathname, item);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/[0.06] text-divlab-text"
                    : "text-divlab-text-muted hover:bg-white/[0.03] hover:text-divlab-text-secondary"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li
          aria-hidden="true"
          className="ml-1 h-5 w-px shrink-0 bg-white/10"
        />
        <li className="shrink-0 px-2 py-2 text-[11px] text-divlab-text-subtle">
          {/* Reserved for future online indicator */}
        </li>
      </ul>
    </nav>
  );
}
