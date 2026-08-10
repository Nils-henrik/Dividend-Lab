"use client";

import { useEffect, useState } from "react";
import {
  resolveMarketLiveStatus,
  type MarketLiveStatus,
} from "@/lib/model-portfolios/engine/market-status";

const REFRESH_MS = 45_000;

export default function MarketLiveBadge({
  initialStatus,
  className = "",
}: {
  initialStatus: MarketLiveStatus;
  className?: string;
}) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const tick = () => setStatus(resolveMarketLiveStatus(new Date()));
    tick();
    const id = window.setInterval(tick, REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  const toneClass =
    status.tone === "live"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
      : status.tone === "waiting"
        ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
        : "border-white/15 bg-white/[0.04] text-divlab-text-muted";

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${toneClass} ${className}`}
      title={status.detail}
      aria-label={`Marknadsstatus: ${status.label}. ${status.detail}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-sm ${
          status.tone === "live"
            ? "bg-emerald-400"
            : status.tone === "waiting"
              ? "bg-rose-400"
              : "bg-divlab-text-muted"
        }`}
        aria-hidden="true"
      />
      {status.label}
    </span>
  );
}
