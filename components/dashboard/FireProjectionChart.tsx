"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CapitalProjectionPoint } from "@/lib/dashboard/fire-calculator";
import { formatSek } from "@/lib/dashboard/fire-calculator";

type Props = {
  data: CapitalProjectionPoint[];
  targetCapital: number;
  targetReachYear: number | null;
  targetReachAge: number | null;
  currentAge: number;
  exceedsHorizon: boolean;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string | number;
  currentAge: number;
  targetCapital: number;
};

function formatAxisValue(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("sv-SE", {
      maximumFractionDigits: 1,
    })} mn`;
  }

  return `${Math.round(value / 1_000).toLocaleString("sv-SE")}k`;
}

function ProjectionTooltip({
  active,
  payload,
  label,
  currentAge,
  targetCapital,
}: TooltipProps) {
  const capital = payload?.[0]?.value;

  if (!active || typeof capital !== "number") {
    return null;
  }

  const age = Math.round(currentAge + Number(label ?? 0));
  const progress =
    targetCapital > 0 ? Math.min(100, (capital / targetCapital) * 100) : null;

  return (
    <div className="rounded-lg border border-divlab-blue/35 bg-divlab-elevated px-3 py-2 shadow-sm">
      <p className="text-[11px] text-divlab-text-muted">Ålder {age} år</p>
      <p className="text-sm font-semibold text-divlab-text tabular-nums">
        {formatSek(capital)}
      </p>
      {progress !== null && (
        <p className="mt-1 text-[11px] text-divlab-text-muted tabular-nums">
          {Math.round(progress)}% av kapitalmålet
        </p>
      )}
    </div>
  );
}

export default function FireProjectionChart({
  data,
  targetCapital,
  targetReachYear,
  targetReachAge,
  currentAge,
  exceedsHorizon,
}: Props) {
  const goalPoint = data.find((point) => point.isGoalReached);

  return (
    <div className="rounded-xl border divlab-border-neutral divlab-inset p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Kapitalutveckling
          </p>
          <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
            Se hur kapitalet utvecklas och vid vilken ålder målet kan nås.
          </p>
        </div>
        {targetCapital > 0 && (
          <p className="text-xs text-divlab-text-muted">
            Kapitalmål:{" "}
            <span className="font-medium text-divlab-blue tabular-nums">
              {formatSek(targetCapital)}
            </span>
          </p>
        )}
      </div>

      {exceedsHorizon && (
        <p className="mt-3 rounded-lg border divlab-border-neutral bg-divlab-surface px-3 py-2 text-xs leading-5 text-divlab-text-secondary">
          Målet nås inte inom den valda prognosperioden. Höj sparandet, justera
          målet eller ändra antagandena för att se en tydligare tidslinje.
        </p>
      )}

      <div className="mt-4 h-[280px] w-full sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 16, right: 12, bottom: 8, left: 0 }}
          >
            <defs>
              <linearGradient
                id="freedomProjectionBlue"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor="var(--divlab-blue)"
                  stopOpacity={0.38}
                />
                <stop
                  offset="100%"
                  stopColor="var(--divlab-blue)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="var(--divlab-chart-axis)"
              strokeOpacity={0.1}
            />
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--divlab-chart-axis)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: string | number) =>
                `${Math.round(currentAge + Number(value))}`
              }
              label={{
                value: "Ålder",
                position: "insideBottomRight",
                offset: -4,
                fill: "var(--divlab-chart-axis)",
                fontSize: 11,
              }}
            />
            <YAxis
              width={48}
              tick={{ fill: "var(--divlab-chart-axis)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatAxisValue}
            />
            <Tooltip
              cursor={{
                stroke: "var(--divlab-chart-axis)",
                strokeDasharray: "3 3",
                strokeOpacity: 0.2,
              }}
              content={
                <ProjectionTooltip
                  currentAge={currentAge}
                  targetCapital={targetCapital}
                />
              }
            />
            {targetCapital > 0 && (
              <ReferenceLine
                y={targetCapital}
                stroke="var(--divlab-blue)"
                strokeDasharray="5 5"
                strokeOpacity={0.55}
                label={{
                  value: "Kapitalmål",
                  position: "insideTopRight",
                  fill: "var(--divlab-chart-axis)",
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="capital"
              stroke="var(--divlab-blue)"
              strokeWidth={2.25}
              fill="url(#freedomProjectionBlue)"
              dot={false}
              isAnimationActive={false}
              activeDot={{
                r: 4,
                fill: "var(--divlab-blue)",
                stroke: "var(--divlab-surface)",
                strokeWidth: 2,
              }}
            />
            {goalPoint && targetReachYear !== null && (
              <ReferenceDot
                x={goalPoint.year}
                y={goalPoint.capital}
                r={5}
                fill="var(--divlab-blue)"
                stroke="var(--divlab-surface)"
                strokeWidth={2}
                label={
                  targetReachAge !== null
                    ? {
                        value: `Mål · ca ${targetReachAge} år`,
                        position: "top",
                        fill: "var(--divlab-chart-axis)",
                        fontSize: 10,
                      }
                    : undefined
                }
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {targetReachAge !== null && targetReachYear !== null && !exceedsHorizon && (
        <p className="mt-3 text-xs text-divlab-text-muted">
          Kapitalmålet passeras ungefär vid {targetReachAge} års ålder.
        </p>
      )}
    </div>
  );
}
