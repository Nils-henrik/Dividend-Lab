"use client";

import { useSyncExternalStore } from "react";
import {
  getStoredThemePreference,
  saveThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme/client";

function subscribeToThemePreference(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === THEME_STORAGE_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener("divlab-theme-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("divlab-theme-change", onStoreChange);
  };
}

function getServerThemePreference(): ThemePreference {
  return "light";
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" fill="currentColor" />
      <path
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.28 5.28 6.7 6.7M17.3 17.3l1.42 1.42M18.72 5.28 17.3 6.7M6.7 17.3l-1.42 1.42"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        d="M20.1 15.15A8.35 8.35 0 0 1 8.85 3.9 8.35 8.35 0 1 0 20.1 15.15Z"
        fill="currentColor"
      />
      <circle cx="17.2" cy="6.1" r="1" fill="currentColor" />
      <circle cx="19.4" cy="9.1" r="0.75" fill="currentColor" />
      <circle cx="14.9" cy="4.25" r="0.65" fill="currentColor" />
    </svg>
  );
}

export default function AppearanceSetting() {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    getStoredThemePreference,
    getServerThemePreference,
  );
  const isDark = preference === "dark";

  function toggleTheme() {
    saveThemePreference(isDark ? "light" : "dark");
  }

  return (
    <section className="divlab-card rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-xl">
          <p className="mb-2 divlab-section-label">Utseende</p>
          <h3 className="text-lg font-semibold text-divlab-text">Tema</h3>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Växla mellan ljust och mörkt läge. Ljust tema är standard och ditt
            val sparas på den här enheten.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className={`text-sm font-medium ${isDark ? "text-divlab-text-muted" : "text-divlab-text"}`}>
            Ljust
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={`Byt till ${isDark ? "ljust" : "mörkt"} tema`}
            onClick={toggleTheme}
            className={`relative h-12 w-[92px] rounded-full border p-1 transition-[background-color,border-color,box-shadow] duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/45 focus-visible:ring-offset-2 focus-visible:ring-offset-divlab-bg ${
              isDark
                ? "border-white/10 bg-[#24272c] shadow-inner"
                : "divlab-border-neutral bg-divlab-elevated shadow-inner"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-1/2 z-0 -translate-y-1/2 transition-all duration-300 ${
                isDark
                  ? "left-4 text-slate-300 opacity-100"
                  : "right-4 text-divlab-text-muted opacity-100"
              }`}
            >
              {isDark ? <MoonIcon /> : <SunIcon />}
            </span>
            <span
              aria-hidden="true"
              className={`absolute left-1 top-1 h-10 w-10 rounded-full border shadow-md transition-transform duration-300 ease-out ${
                isDark
                  ? "translate-x-10 border-white/10 bg-[#3a3d43]"
                  : "translate-x-0 divlab-border-neutral bg-white"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isDark ? "text-divlab-text" : "text-divlab-text-muted"}`}>
            Mörkt
          </span>
        </div>
      </div>
    </section>
  );
}
