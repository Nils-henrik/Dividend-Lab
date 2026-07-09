"use client";

import type { PortfolioFilterMode } from "@/types/calendar";

type Props = {
  mode: PortfolioFilterMode;
  onChange: (mode: PortfolioFilterMode) => void;
};

const options: { mode: PortfolioFilterMode; label: string }[] = [
  { mode: "portfolio", label: "Bara min portfölj" },
  { mode: "market", label: "Hela marknaden" },
];

export default function PortfolioFilter({ mode, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const isActive = mode === option.mode;

        return (
          <button
            key={option.mode}
            type="button"
            onClick={() => onChange(option.mode)}
            className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-300 ${
              isActive
                ? "divlab-selected"
                : "border-transparent bg-divlab-surface text-divlab-text-muted hover:text-divlab-text-secondary"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
