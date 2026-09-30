"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { CompanyNavItem } from "@/lib/companies/page-nav";

type TabsContextValue = {
  activeTab: string;
};

const CompanyTabsContext = createContext<TabsContextValue | null>(null);

function resolveTab(
  tabs: readonly CompanyNavItem[],
  candidate: string | null | undefined,
  fallback: string,
) {
  return candidate && tabs.some((tab) => tab.id === candidate) ? candidate : fallback;
}

export default function CompanyPageTabs({
  tabs,
  initialTab,
  children,
}: {
  tabs: readonly CompanyNavItem[];
  initialTab?: string | null;
  children: ReactNode;
}) {
  const fallbackTab = tabs.find((tab) => tab.id === "oversikt")?.id ?? tabs[0]?.id ?? "oversikt";
  const validTabIds = useMemo(() => new Set(tabs.map((tab) => tab.id)), [tabs]);
  const [activeTab, setActiveTab] = useState(() => resolveTab(tabs, initialTab, fallbackTab));
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const syncFromUrl = () => {
      const url = new URL(window.location.href);
      const queryTab = url.searchParams.get("tab");
      const hashTab = url.hash ? decodeURIComponent(url.hash.slice(1)) : null;
      const next = queryTab && validTabIds.has(queryTab)
        ? queryTab
        : hashTab && validTabIds.has(hashTab)
          ? hashTab
          : resolveTab(tabs, initialTab, fallbackTab);
      setActiveTab(next);
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, [fallbackTab, initialTab, tabs, validTabIds]);

  function selectTab(id: string) {
    if (!validTabIds.has(id)) return;
    setActiveTab(id);

    const url = new URL(window.location.href);
    if (id === fallbackTab) {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", id);
    }
    url.hash = "";
    const nextUrl = `${url.pathname}${url.search}`;
    window.history.pushState({}, "", nextUrl);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentIndex: number) {
    if (!tabs.length) return;
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const next = tabs[nextIndex];
    if (!next) return;
    selectTab(next.id);
    tabRefs.current.get(next.id)?.focus();
  }

  return (
    <CompanyTabsContext.Provider value={{ activeTab }}>
      <nav
        className="sticky top-0 z-30 mt-4 overflow-x-auto border-b divlab-border-neutral bg-[var(--divlab-bg)]/95 px-1 backdrop-blur"
        aria-label="Bolagsinformation"
      >
        <div className="flex min-w-max gap-1" role="tablist" aria-orientation="horizontal">
          {tabs.map((item, index) => {
            const active = item.id === activeTab;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  if (node) tabRefs.current.set(item.id, node);
                  else tabRefs.current.delete(item.id);
                }}
                id={`company-tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`company-panel-${item.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(item.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`relative shrink-0 px-3 py-2.5 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50 ${
                  active
                    ? "text-divlab-text after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-divlab-blue"
                    : "text-divlab-text-muted hover:text-divlab-text"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      {children}
    </CompanyTabsContext.Provider>
  );
}

export function CompanyTabPanel({
  id,
  children,
  className = "",
}: {
  id: string;
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(CompanyTabsContext);
  if (!context) {
    throw new Error("CompanyTabPanel must be rendered inside CompanyPageTabs");
  }
  if (context.activeTab !== id) return null;

  return (
    <div
      id={`company-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`company-tab-${id}`}
      className={className}
    >
      {children}
    </div>
  );
}
