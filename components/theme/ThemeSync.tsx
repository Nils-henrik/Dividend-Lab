"use client";

import { useEffect } from "react";
import {
  applyThemePreference,
  getStoredThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme/client";

const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";

export default function ThemeSync() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(SYSTEM_THEME_QUERY);

    function syncTheme() {
      applyThemePreference(getStoredThemePreference());
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === THEME_STORAGE_KEY) {
        syncTheme();
      }
    }

    function handleThemeChange(event: Event) {
      const customEvent = event as CustomEvent<{
        preference?: ThemePreference;
      }>;
      const preference = customEvent.detail?.preference;

      if (preference) {
        applyThemePreference(preference);
        return;
      }

      syncTheme();
    }

    function handleSystemThemeChange() {
      if (getStoredThemePreference() === "system") {
        syncTheme();
      }
    }

    syncTheme();
    mediaQuery.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("divlab-theme-change", handleThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("divlab-theme-change", handleThemeChange);
    };
  }, []);

  return null;
}
