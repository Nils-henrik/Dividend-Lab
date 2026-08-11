"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PortfolioValuePoint } from "@/lib/model-portfolios/transparency";

const colorBySlug: Record<string, string> = {
  forsiktig: "#60a5fa",
  medelrisk: "#22d3ee",
  "hog-risk": "#fb923c",
  utdelning: "#c084fc",
};

function formatSekMinor(minor: number): string {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function formatAxisSek(value: number): string {
  return new Intl.NumberFormat("sv-SE", {
    notation: value >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatChartDate(value: string, expanded: boolean): string {
  return new Intl.DateTimeFormat("sv-SE", expanded
    ? { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }
    : { day: "2-digit", month: "short" }).format(new Date(value));
}

function formatFullDate(value: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PortfolioValueChart({
  slug,
  portfolioName,
  points,
}: {
  slug: string;
  portfolioName: string;
  points: PortfolioValuePoint[];
}) {
  const [expanded, setExpanded] = useState(false);
  const color = colorBySlug[slug] ?? colorBySlug.forsiktig;
  const chartData = useMemo(
    () => points.map((point) => ({
      ...point,
      valueSek: point.totalValueMinor / 100,
    })),
    [points],
  );
  const latest = points.at(-1) ?? null;
  const returnPct = latest && latest.contributedCapitalMinor > 0
    ? (latest.totalValueMinor / latest.contributedCapitalMinor - 1) * 100
    : null;

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  return (
    <>
      <section className="border divlab-border-neutral bg-divlab-surface/45 px-5 py-5 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">Portföljvärde</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text">
                {latest ? formatSekMinor(latest.totalValueMinor) : "Ingen värdering ännu"}
              </h2>
              {returnPct !== null ? (
                <span className={returnPct >= 0 ? "text-sm font-semibold text-emerald-400" : "text-sm font-semibold text-red-400"}>
                  {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
              Mark-to-market i SEK. Kurvan uppdateras med portföljens senaste marknadsvärde även när AI:n inte gör någon affär.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="border divlab-border-neutral px-3 py-2 text-xs font-semibold text-divlab-text-secondary transition hover:border-divlab-blue/50 hover:text-divlab-text"
            aria-label={`Förstora värdegrafen för ${portfolioName}`}
          >
            Förstora graf ↗
          </button>
        </div>

        <div className="mt-5 h-[280px] w-full">
          <ChartBody data={chartData} color={color} expanded={false} slug={slug} />
        </div>
        {latest?.marketDataAsOf ? (
          <p className="mt-2 text-[11px] text-divlab-text-muted">Senaste marknadsdata: {formatFullDate(latest.marketDataAsOf)}</p>
        ) : null}
      </section>

      {expanded ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`Förstorad värdegraf för ${portfolioName}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setExpanded(false);
          }}
        >
          <div className="flex h-[min(820px,92vh)] w-full max-w-[1500px] flex-col border divlab-border-neutral bg-divlab-surface px-4 py-4 shadow-2xl sm:px-7 sm:py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-divlab-text-muted">Portföljvärde · mark-to-market</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-divlab-text">{portfolioName}</h2>
                {latest ? <p className="mt-1 text-sm text-divlab-text-secondary">{formatSekMinor(latest.totalValueMinor)}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="border divlab-border-neutral px-3 py-2 text-xs font-semibold text-divlab-text-secondary hover:text-divlab-text"
                aria-label="Stäng förstorad graf"
              >
                Stäng ×
              </button>
            </div>
            <div className="mt-5 min-h-0 flex-1">
              <ChartBody data={chartData} color={color} expanded slug={slug} />
            </div>
            <p className="mt-3 text-xs text-divlab-text-muted">
              Datum och tid visas längs axeln. Värdet består av kassa plus marknadsvärdet på alla innehav till senast tillgängliga kurs och valutakurs.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ChartBody({
  data,
  color,
  expanded,
  slug,
}: {
  data: Array<PortfolioValuePoint & { valueSek: number }>;
  color: string;
  expanded: boolean;
  slug: string;
}) {
  if (!data.length) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed divlab-border-neutral text-sm text-divlab-text-muted">
        Värdehistorik skapas vid nästa portföljkörning.
      </div>
    );
  }

  const gradientId = `portfolio-value-${slug}-${expanded ? "large" : "small"}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 12, right: expanded ? 28 : 8, left: expanded ? 8 : -12, bottom: expanded ? 18 : 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.30} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
        <XAxis
          dataKey="snapshotAt"
          tickFormatter={(value) => formatChartDate(String(value), expanded)}
          tick={{ fill: "#94a3b8", fontSize: expanded ? 12 : 10 }}
          axisLine={{ stroke: "rgba(148,163,184,0.18)" }}
          tickLine={false}
          minTickGap={expanded ? 34 : 50}
        />
        <YAxis
          tickFormatter={(value) => `${formatAxisSek(Number(value))} kr`}
          tick={{ fill: "#94a3b8", fontSize: expanded ? 12 : 10 }}
          axisLine={false}
          tickLine={false}
          width={expanded ? 84 : 70}
          domain={["auto", "auto"]}
        />
        <Tooltip
          cursor={{ stroke: color, strokeOpacity: 0.35 }}
          labelFormatter={(label) => formatFullDate(String(label))}
          formatter={(value) => [formatSekMinor(Math.round(Number(value) * 100)), "Portföljvärde"]}
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(148,163,184,0.25)",
            borderRadius: 0,
            color: "#e2e8f0",
          }}
          labelStyle={{ color: "#94a3b8" }}
        />
        <Area
          type="monotone"
          dataKey="valueSek"
          stroke={color}
          strokeWidth={expanded ? 2.5 : 2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: expanded ? 5 : 4, fill: color, stroke: "#0f172a", strokeWidth: 2 }}
          dot={data.length <= 2 ? { r: 3, fill: color, strokeWidth: 0 } : false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
