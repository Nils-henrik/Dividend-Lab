"use client";

import { useEffect, useState } from "react";
import {
  resolveCombinedMarketStatus,
  type CombinedMarketStatus,
} from "@/lib/model-portfolios/engine/market-hours";

type Props = {
  initialStatus: CombinedMarketStatus;
  compact?: boolean;
  className?: string;
};

function toneClasses(tone: CombinedMarketStatus["tone"]): string {
  if (tone === "live") return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
  if (tone === "closing") return "border-amber-500/35 bg-amber-500/10 text-amber-200";
  return "border-white/10 bg-white/[0.03] text-divlab-text-muted";
}

function PulseDot({ active }: { active: boolean }) {
  if (!active) {
    return <span className="inline-block h-1.5 w-1.5 rounded-full bg-current/50" aria-hidden="true" />;
  }
  return (
    <span className="relative inline-flex h-1.5 w-1.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
    </span>
  );
}

/**
 * Compact live market status. Server-rendered initial state; lightweight client
 * refresh so an open page crosses session boundaries truthfully.
 */
export default function LiveMarketStatus({ initialStatus, compact = false, className = "" }: Props) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const tick = () => setStatus(resolveCombinedMarketStatus(new Date()));
    const id = window.setInterval(tick, 30_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div
      className={`inline-flex max-w-full items-center gap-2 border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${toneClasses(status.tone)} ${className}`}
      title={`Marknadsstatus per ${new Date(status.asOf).toLocaleString("sv-SE")} (Stockholm/USA reguljära sessioner)`}
      role="status"
      aria-live="polite"
    >
      <PulseDot active={status.showPulse} />
      <span className={compact ? "truncate" : "truncate sm:whitespace-normal"}>{status.label}</span>
    </div>
  );
}
