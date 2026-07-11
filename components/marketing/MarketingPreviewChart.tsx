"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

const CHART_BLUE = "#0A84FF";
const GRID_STROKE = "rgba(255, 255, 255, 0.06)";
const AXIS_TICK = "#71717A";

export const marketingPreviewChartData = [
  { month: "Jan", value: 100 },
  { month: "Feb", value: 103 },
  { month: "Mar", value: 101 },
  { month: "Apr", value: 108 },
  { month: "Maj", value: 111 },
  { month: "Jun", value: 117 },
  { month: "Jul", value: 121 },
] as const;

type Props = {
  className?: string;
};

export default function MarketingPreviewChart({ className = "mt-3 h-28" }: Props) {
  return (
    <div className={`w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={marketingPreviewChartData}
          margin={{ top: 4, right: 12, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id="marketingPreviewChartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_BLUE} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CHART_BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke={GRID_STROKE}
            strokeDasharray="3 3"
            vertical={false}
          />

          <XAxis
            dataKey="month"
            tick={{ fill: AXIS_TICK, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={0}
            padding={{ left: 8, right: 8 }}
          />

          <YAxis
            domain={[98, 124]}
            tick={false}
            axisLine={false}
            tickLine={false}
            width={0}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={CHART_BLUE}
            strokeWidth={2}
            fill="url(#marketingPreviewChartFill)"
            isAnimationActive={false}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
