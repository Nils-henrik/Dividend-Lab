"use client";

import { useState } from "react";
import { dividendBrainGoal, dividendBrainInsights } from "@/data/brain";

export default function DividendBrainPanel() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section
      className={`divlab-card p-6 transition-all duration-300 ${
        isExpanded ? "min-h-[430px]" : "min-h-[320px]"
      }`}
    >
      <div className="mb-6 flex items-start justify-between gap-6">
        <div>
          <p className="mb-3 divlab-section-label">Dividend Brain</p>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
            Dagens insikter
          </h2>
          <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
            Utbildande observationer baserade på din mock-portfölj. Ingen
            finansiell rådgivning.
          </p>
        </div>

        <div className="rounded-full border border-divlab-green/20 bg-divlab-green/10 px-3 py-1 text-xs font-medium text-divlab-green">
          Aktiv
        </div>
      </div>

      <div className="space-y-3">
        {dividendBrainInsights.map((insight) => (
          <div
            key={insight}
            className="rounded-xl border divlab-inset p-4 text-sm leading-6 text-divlab-text-secondary"
          >
            {insight}
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border divlab-border-neutral divlab-inset p-4">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-divlab-text">Framsteg mot årsmål</span>
          <span className="text-divlab-blue tabular-nums">{dividendBrainGoal.progress}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-2 w-[72%] rounded-full bg-divlab-blue" />
        </div>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
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
          className="w-full resize-none divlab-input px-4 py-3 text-sm leading-6 text-divlab-text placeholder:text-divlab-text-subtle transition-all duration-300"
        />
      </label>
    </section>
  );
}
