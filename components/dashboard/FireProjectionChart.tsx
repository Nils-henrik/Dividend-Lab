"use client";

import {
  Area,
  AreaChart,
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
  exceedsHorizon: boolean;
};

type TooltipProps = {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
};

function ProjectionTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-divlab-blue/35 bg-divlab-elevated px-3 py-2 shadow-sm">
      <p className="text-[11px] text-divlab-text-muted">År {label}</p>
      <p className="text-sm font-semibold text-divlab-text tabular-nums">
        {formatSek(payload[0].value)}
      </p>
    </div>
  );
}

export default function FireProjectionChart({
  data,
  targetCapital,
  targetReachYear,
  exceedsHorizon,
}: Props) {
  const goalPoint = data.find((point) => point.isGoalReached);

  return (
    <div className="rounded-xl border divlab-border-neutral divlab-inset p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Kapitalutveckling
          </p>
          <p className="mt-1 text-xs leading-5 text-divlab-text-muted">
            Uppskattad utveckling baserad på dina antaganden.
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

      <div className="mt-4 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="freedomProjectionBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--divlab-blue)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--divlab-blue)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fill: "var(--divlab-chart-axis)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "År",
                position: "insideBottomRight",
                offset: -4,
                fill: "var(--divlab-chart-axis)",
                fontSize: 11,
              }}
            />
            <YAxis
              tick={{ fill: "var(--divlab-chart-axis)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) =>
                `${Math.round(value / 1000).toLocaleString("sv-SE")}k`
              }
            />
            <Tooltip content={<ProjectionTooltip />} />
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
              strokeWidth={2}
              fill="url(#freedomProjectionBlue)"
              dot={false}
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
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {targetReachYear !== null && targetReachYear > 0 && !exceedsHorizon && (
        <p className="mt-3 text-xs text-divlab-text-muted">
          Uppskattat kapitalmål nås runt år {targetReachYear}.
        </p>
      )}
    </div>
  );
}
