"use client";

import { useSyncExternalStore } from "react";
import {
  getStoredThemePreference,
  saveThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme/client";

const OPTIONS: Array<{
  value: ThemePreference;
  label: string;
  description: string;
}> = [
  {
    value: "light",
    label: "Ljust",
    description: "Ljus bakgrund med mörk text och DivLabs marknadsfärger.",
  },
  {
    value: "dark",
    label: "Mörkt",
    description: "DivLabs mörka marknadsläge med hög kontrast.",
  },
  {
    value: "system",
    label: "System",
    description: "Följer automatiskt inställningen på din mobil eller dator.",
  },
];

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
  return "system";
}

export default function AppearanceSetting() {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    getStoredThemePreference,
    getServerThemePreference,
  );

  function handleChange(nextPreference: ThemePreference) {
    saveThemePreference(nextPreference);
  }

  return (
    <section className="divlab-card rounded-3xl p-6 sm:p-8">
      <div className="mb-6">
        <p className="mb-2 divlab-section-label">Utseende</p>
        <h3 className="text-lg font-semibold text-divlab-text">Tema</h3>
        <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
          Välj hur DivLab ska se ut. Valet sparas på den här enheten och gäller
          hela DivLab.
        </p>
      </div>

      <div
        role="group"
        aria-label="Välj tema"
        className="grid gap-3 md:grid-cols-3"
      >
        {OPTIONS.map((option) => {
          const isSelected = preference === option.value;

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleChange(option.value)}
              className={`min-h-32 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/40 ${
                isSelected
                  ? "divlab-selected"
                  : "divlab-border-neutral bg-divlab-inset hover:border-divlab-blue/30"
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-divlab-text">
                  {option.label}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    isSelected
                      ? "border-divlab-blue bg-divlab-blue"
                      : "divlab-border-strong bg-divlab-surface"
                  }`}
                >
                  {isSelected ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  ) : null}
                </span>
              </span>
              <span className="mt-3 block text-xs leading-5 text-divlab-text-secondary">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
