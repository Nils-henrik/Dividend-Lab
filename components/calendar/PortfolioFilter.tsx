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
                ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#F9D976]"
                : "border-white/10 bg-[#161616] text-gray-400 hover:border-white/20 hover:text-gray-300"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
