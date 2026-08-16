export const THEME_STORAGE_KEY = "divlab-theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function isThemePreference(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === "light" || preference === "dark") {
    return preference;
  }

  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  const resolved = resolveTheme(preference);
  const root = document.documentElement;

  root.dataset.theme = resolved;
  root.dataset.themePreference = preference;
  root.style.colorScheme = resolved;
}

export function saveThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyThemePreference(preference);
  window.dispatchEvent(
    new CustomEvent("divlab-theme-change", { detail: { preference } }),
  );
}
