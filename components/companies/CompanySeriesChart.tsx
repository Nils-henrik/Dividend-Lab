"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "@/lib/companies/series";

type Props = {
  points: readonly SeriesPoint[];
  label: string;
  unit: string;
};

export default function CompanySeriesChart({ points, label, unit }: Props) {
  if (points.length < 2) return null;
  const data = points.map((point) => ({ label: point.label, value: point.value }));

  return (
    <div className="mt-4 h-48 w-full min-w-0" role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--divlab-divider)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--divlab-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "var(--divlab-elevated)" }}
            content={({ active, payload, label: year }) => {
              if (!active || !payload?.length) return null;
              const value = Number(payload[0]?.value);
              if (!Number.isFinite(value)) return null;
              const formatted = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(value);
              return (
                <div className="rounded-lg border divlab-border-neutral bg-divlab-card px-3 py-2 text-xs text-divlab-text">
                  <p className="font-semibold">{year}</p>
                  <p className="mt-1 text-divlab-text-secondary">{label}: {formatted} {unit}</p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" fill="var(--divlab-chart-series-blue)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
