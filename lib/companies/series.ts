import type { PaidDividend } from "@/lib/companies/dividend-view";
import type { AnnualFinancialPoint } from "@/lib/companies/financial-history";

export type SeriesPoint = {
  label: string;
  value: number;
};

export function revenueSeries(points: readonly AnnualFinancialPoint[]): SeriesPoint[] {
  return points.flatMap((point) => {
    if (point.revenue === null || !Number.isFinite(point.revenue)) return [];
    return [{ label: String(point.fiscalYear), value: point.revenue }];
  });
}

/** Completed calendar-year cash sums. Mixed currencies are not combined. */
export function dividendYearSeries(history: readonly PaidDividend[]): SeriesPoint[] {
  const currencies = new Set(history.map((row) => row.currency));
  if (currencies.size !== 1) return [];
  const totals = new Map<string, number>();
  for (const row of history) {
    if (!Number.isFinite(row.amount) || !/^\d{4}-\d{2}-\d{2}$/.test(row.exDate)) continue;
    const year = row.exDate.slice(0, 4);
    totals.set(year, (totals.get(year) ?? 0) + row.amount);
  }
  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value }));
}
