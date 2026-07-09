"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CapitalProjectionPoint } from "@/lib/dashboard/fire-calculator";
import { formatSek } from "@/lib/dashboard/fire-calculator";

type Props = {
  data: CapitalProjectionPoint[];
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

export default function FireProjectionChart({ data }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
        Uppskattad kapitalutveckling
      </p>
      <p className="mt-1 text-xs leading-5 text-gray-500">
        Förenklad prognos baserad på dina antaganden. Endast utbildande.
      </p>
      <div className="mt-4 h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fireProjectionGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tick={{ fill: "#777", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
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
            <Area
              type="monotone"
              dataKey="capital"
              stroke="#D4AF37"
              strokeWidth={2}
              fill="url(#fireProjectionGold)"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
