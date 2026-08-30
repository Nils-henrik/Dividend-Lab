"use client";

import { useState } from "react";

function viewLabel(view: "positive" | "neutral" | "negative"): string {
  return view === "positive" ? "positiv" : view === "negative" ? "negativ" : "neutral";
}

export default function AnalysisShareActions({
  companyName,
  symbol,
  view,
}: {
  companyName: string;
  symbol: string;
  view: "positive" | "neutral" | "negative";
}) {
  const [copied, setCopied] = useState(false);

  function currentUrl(): string {
    return typeof window === "undefined" ? "" : window.location.href;
  }

  function shareOnX() {
    const url = currentUrl();
    if (!url) return;
    const text = `Ny DivLab Analys: ${companyName} (${symbol}) – ${viewLabel(view)} syn. Fundamental analys, värdering och AI-markerade tekniska nivåer.`;
    const intent = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    const url = currentUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-0 border-y border-white/10" aria-label="Dela analys">
      <button
        type="button"
        onClick={shareOnX}
        className="border-r border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-300 transition hover:bg-white/[0.04] hover:text-white"
      >
        Dela på X
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="border-r border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500 transition hover:bg-white/[0.04] hover:text-slate-200"
      >
        {copied ? "Länk kopierad" : "Kopiera länk"}
      </button>
      <span className="hidden px-4 py-2.5 text-[10px] uppercase tracking-[0.11em] text-slate-700 sm:block">1200×630 X-kort</span>
    </div>
  );
}
