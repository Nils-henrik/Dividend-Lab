"use client";

import { useState } from "react";
import { dividendBrainGoal, dividendBrainInsights } from "@/data/brain";

export default function DividendBrainPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#161616] p-6 transition-all duration-300 ${
        isExpanded ? "min-h-[430px]" : "min-h-[320px]"
      }`}
    >
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
            Dividend Brain
          </p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">
            Dagens insikter
          </h2>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Utbildande observationer baserade på din mock-portfölj. Ingen
            finansiell rådgivning.
          </p>
        </div>

        <div className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-400">
          Aktiv
        </div>
      </div>

      <div className="space-y-3">
        {dividendBrainInsights.map((insight) => (
          <div
            key={insight}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-gray-300"
          >
            {insight}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-white">Framsteg mot årsmål</span>
          <span className="text-[#D4AF37] tabular-nums">
            {dividendBrainGoal.progress}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-2 w-[72%] rounded-full bg-[#D4AF37]" />
        </div>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          {dividendBrainGoal.observation}
        </p>
      </div>

      <label className="mt-5 block">
        <span className="sr-only">Fråga Dividend Brain</span>
        <textarea
          onFocus={() => setIsExpanded(true)}
          onBlur={(event) => {
            if (!event.currentTarget.value) setIsExpanded(false);
          }}
          placeholder="Fråga Dividend Brain..."
          rows={isExpanded ? 5 : 2}
          className="w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm leading-6 text-white outline-none transition-all duration-300 placeholder:text-gray-600 focus:border-[#D4AF37]/60"
        />
      </label>
    </section>
  );
}
