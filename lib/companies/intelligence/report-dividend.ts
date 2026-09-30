import type { PaidDividend } from "@/lib/companies/dividend-view";
import type { AnnualFinancialPoint } from "@/lib/companies/financial-history";
import type { ReportSnapshotMetric } from "@/lib/companies/report-snapshot";

export type DeterministicDelta = {
  latest: number;
  previous: number;
  absoluteChange: number;
  /** Null when the previous value is 0. A missing value is never replaced with 0. */
  percentChange: number | null;
};

export type AnnualDeltaMetric =
  | "revenue"
  | "operatingIncome"
  | "netIncome"
  | "eps"
  | "freeCashFlow";

export type AnnualMetricDelta = DeterministicDelta & {
  metric: AnnualDeltaMetric;
  fiscalYear: number;
  previousFiscalYear: number;
  currency: string | null;
};

export type ReportMetricDelta = DeterministicDelta & {
  label: string;
  scale: ReportSnapshotMetric["scale"];
  reportedChangePercent: number | null;
};

export type DividendYearDelta = DeterministicDelta & {
  year: number;
  previousYear: number;
  currency: string;
};

function finite(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

export function deterministicDelta(latest: number | null, previous: number | null): DeterministicDelta | null {
  if (!finite(latest) || !finite(previous)) return null;
  return {
    latest,
    previous,
    absoluteChange: latest - previous,
    percentChange: previous === 0 ? null : (latest - previous) / previous,
  };
}

/**
 * Change from the previous fiscal year to the latest year.
 * The two years must be consecutive and share a reporting currency.
 */
export function latestConsecutiveAnnualDelta(
  points: readonly AnnualFinancialPoint[],
  metric: AnnualDeltaMetric,
): AnnualMetricDelta | null {
  const years = new Set<number>();
  for (const point of points) {
    if (years.has(point.fiscalYear)) return null;
    years.add(point.fiscalYear);
  }
  const ordered = points.slice().sort((left, right) => left.fiscalYear - right.fiscalYear);
  const latest = ordered.at(-1);
  const previous = ordered.at(-2);
  if (!latest || !previous || latest.fiscalYear - previous.fiscalYear !== 1) return null;
  if (latest.currency !== previous.currency) return null;
  const delta = deterministicDelta(latest[metric], previous[metric]);
  if (!delta) return null;
  return {
    ...delta,
    metric,
    fiscalYear: latest.fiscalYear,
    previousFiscalYear: previous.fiscalYear,
    currency: latest.currency,
  };
}

/** Official comparison already stored on a report row. Missing comparison stays missing. */
export function reportMetricComparison(metric: ReportSnapshotMetric): ReportMetricDelta | null {
  const delta = deterministicDelta(metric.amount, metric.comparisonAmount);
  if (!delta || !metric.label) return null;
  return {
    ...delta,
    label: metric.label,
    scale: metric.scale,
    reportedChangePercent: metric.reportedChangePercent,
  };
}

function stockholmYear(now: Date): number {
  return Number(new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
  }).format(now));
}

/**
 * Cash-dividend change between the latest completed calendar year and the year before it.
 * A year without a payment is missing, not zero.
 */
export function completedDividendYearDelta(
  events: readonly PaidDividend[],
  now = new Date(),
): DividendYearDelta | null {
  if (events.length === 0) return null;
  const currencies = new Set(events.map((event) => event.currency));
  if (currencies.size !== 1) return null;
  const totals = new Map<number, number>();
  for (const event of events) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.exDate) || !(event.amount > 0) || !event.currency) return null;
    const year = Number(event.exDate.slice(0, 4));
    totals.set(year, (totals.get(year) ?? 0) + event.amount);
  }
  const year = stockholmYear(now) - 1;
  const previousYear = year - 1;
  const latest = totals.get(year);
  const previous = totals.get(previousYear);
  const delta = deterministicDelta(latest ?? null, previous ?? null);
  const currency = events[0]?.currency;
  if (!delta || !currency) return null;
  return { ...delta, year, previousYear, currency };
}
