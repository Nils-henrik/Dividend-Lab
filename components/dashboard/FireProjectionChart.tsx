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
    <div className="rounded-lg border border-[#D4AF37]/40 bg-[#111111]/95 px-3 py-2">
      <p className="text-[11px] text-gray-500">År {label}</p>
      <p className="text-sm font-semibold text-white tabular-nums">
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Kapitalutveckling
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Uppskattad utveckling baserad på dina antaganden.
          </p>
        </div>
        {targetCapital > 0 && (
          <p className="text-xs text-gray-500">
            Kapitalmål:{" "}
            <span className="font-medium text-[#D4AF37] tabular-nums">
              {formatSek(targetCapital)}
            </span>
          </p>
        )}
      </div>

      {exceedsHorizon && (
        <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-xs leading-5 text-gray-400">
          Med nuvarande sparande och tillväxt når planen inte kapitalmålet inom
          50 år. Justera sparande, mål eller antaganden för att se en tydligare
          tidslinje.
        </p>
      )}

      <div className="mt-4 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="freedomProjectionGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fill: "#777", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "År",
                position: "insideBottomRight",
                offset: -4,
                fill: "#666",
                fontSize: 11,
              }}
            />
            <YAxis
              tick={{ fill: "#777", fontSize: 11 }}
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
                stroke="#D4AF37"
                strokeDasharray="5 5"
                strokeOpacity={0.55}
                label={{
                  value: "Kapitalmål",
                  position: "insideTopRight",
                  fill: "#9CA3AF",
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="capital"
              stroke="#D4AF37"
              strokeWidth={2}
              fill="url(#freedomProjectionGold)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#D4AF37",
                stroke: "#111111",
                strokeWidth: 2,
              }}
            />
            {goalPoint && targetReachYear !== null && (
              <ReferenceDot
                x={goalPoint.year}
                y={goalPoint.capital}
                r={5}
                fill="#D4AF37"
                stroke="#111111"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {targetReachYear !== null && targetReachYear > 0 && !exceedsHorizon && (
        <p className="mt-3 text-xs text-gray-500">
          Uppskattat kapitalmål nås runt år {targetReachYear}.
        </p>
      )}
    </div>
  );
}
