"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavigation } from "@/lib/constants/navigation";
import AppIcon from "./AppIcon";

type Props = {
  isCollapsed: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

export default function AppSidebar({
  isCollapsed,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const pathname = usePathname();

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-hidden border-r border-white/10 bg-[#090909] transition-[width] duration-[225ms] ease-in-out ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div
        className={`flex h-20 items-center border-b border-white/10 ${
          isCollapsed ? "justify-center px-3" : "px-6"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-3xl font-bold text-[#D4AF37]">DL</span>
          <div className={isCollapsed ? "hidden" : "block"}>
            <p className="text-sm font-semibold tracking-[0.28em] text-white">
              DIVIDEND
            </p>
            <p className="text-xs font-semibold tracking-[0.32em] text-[#D4AF37]">
              LAB
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-5">
        {appNavigation.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              className={`flex items-center rounded-xl text-sm font-medium transition ${
                isCollapsed
                  ? "justify-center px-2 py-2.5"
                  : "gap-3 px-3 py-2.5"
              } ${
                isActive
                  ? "border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]"
                  : "text-gray-400 hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              <AppIcon name={item.icon} />
              <span className={isCollapsed ? "sr-only" : "block"}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="w-64 shrink-0 border-t border-white/10 p-4">
        <div
          className={`w-56 rounded-2xl border border-white/10 bg-[#161616] p-4 transition-[opacity,transform] duration-[225ms] ease-in-out ${
            isCollapsed
              ? "pointer-events-none -translate-x-4 opacity-0"
              : "translate-x-0 opacity-100"
          }`}
        >
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
            Focus
          </p>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            Build long-term income with data, discipline and calm decisions.
          </p>
        </div>
      </div>
    </aside>
  );
}
