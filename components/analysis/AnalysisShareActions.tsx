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
    <div className="flex flex-wrap items-center gap-2" aria-label="Dela analys">
      <button
        type="button"
        onClick={shareOnX}
        className="rounded-lg border border-white/15 bg-white/[0.035] px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
      >
        Dela på X
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="rounded-lg border border-white/10 px-3.5 py-2 text-xs font-semibold text-slate-400 transition hover:border-white/20 hover:text-slate-200"
      >
        {copied ? "Länk kopierad" : "Kopiera länk"}
      </button>
      <span className="text-[11px] text-slate-600">X använder analysens 1200×630-kort automatiskt.</span>
    </div>
  );
}
