"use client";
import { useState } from "react";
import TimeFilter from "@/components/marketing/TimeFilter";
import type { Period } from "@/components/marketing/TimeFilter";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = {
  chartHeightClassName?: string;
  className?: string;
};

const data = [
  { month: "Jan", value: 42000 },
  { month: "Feb", value: 44500 },
  { month: "Mar", value: 47000 },
  { month: "Apr", value: 52000 },
  { month: "Maj", value: 61000 },
  { month: "Jun", value: 68420 },
  { month: "Jul", value: 72100 },
];
const chartData = {
  "1M": [
    { month: "Vecka 1", value: 69000 },
    { month: "Vecka 2", value: 70100 },
    { month: "Vecka 3", value: 71400 },
    { month: "Vecka 4", value: 72100 },
  ],

  "6M": data,

  "1Å": [
    { month: "Aug", value: 30000 },
    { month: "Okt", value: 36000 },
    { month: "Dec", value: 43000 },
    { month: "Feb", value: 51000 },
    { month: "Apr", value: 61000 },
    { month: "Jun", value: 72100 },
  ],

  "5Å": [
    { month: "2021", value: 12000 },
    { month: "2022", value: 21000 },
    { month: "2023", value: 34000 },
    { month: "2024", value: 51000 },
    { month: "2025", value: 64000 },
    { month: "2026", value: 72100 },
  ],

  "ALL": [
    { month: "2018", value: 3000 },
    { month: "2019", value: 9000 },
    { month: "2020", value: 16000 },
    { month: "2021", value: 28000 },
    { month: "2022", value: 39000 },
    { month: "2023", value: 51000 },
    { month: "2024", value: 62000 },
    { month: "2025", value: 68000 },
    { month: "2026", value: 72100 },
  ],
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value: number;
  }>;
};

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-[#D4AF37] bg-[#111111]/95 px-3 py-2 backdrop-blur-md shadow-[0_0_16px_rgba(212,175,55,0.12)]">
      <p className="text-base font-semibold text-white">
        {payload[0].value.toLocaleString("sv-SE")} kr
      </p>
    </div>
  );
};

export default function DividendChart({
  chartHeightClassName = "h-[260px]",
  className = "mt-6",
}: Props) {
  const [period, setPeriod] = useState<Period>("6M");

  return (
    <div
      className={`${className} rounded-2xl border border-white/10 bg-[#161616] p-6`}
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Portföljutveckling
        </h3>

        <TimeFilter period={period} setPeriod={setPeriod} />
      </div>

      <div className={`${chartHeightClassName} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData[period]}>
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D4AF37" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>

            <XAxis
              dataKey="month"
              tick={{ fill: "#777", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fill: "#777", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={<CustomTooltip />}
              offset={20}
              cursor={{
                stroke: "#D4AF37",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="value"
              stroke="#D4AF37"
              strokeWidth={3}
              fill="url(#gold)"
              animationDuration={1800}
              dot={false}
              activeDot={{
                r: 5,
                fill: "#D4AF37",
                stroke: "#111111",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
