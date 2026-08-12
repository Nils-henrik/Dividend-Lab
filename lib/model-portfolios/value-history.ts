import type { PortfolioValuePoint } from "./transparency";

export const MODEL_PORTFOLIO_CHART_RANGES = ["1D", "1M", "3M", "YTD", "1Y", "ALL"] as const;
export type ModelPortfolioChartRange = (typeof MODEL_PORTFOLIO_CHART_RANGES)[number];

function rangeCutoff(range: ModelPortfolioChartRange, latestTimestamp: string): number | null {
  if (range === "ALL") return null;

  const latest = new Date(latestTimestamp);
  const cutoff = new Date(latest);

  if (range === "1D") {
    cutoff.setTime(latest.getTime() - 24 * 60 * 60 * 1000);
  } else if (range === "1M") {
    cutoff.setMonth(cutoff.getMonth() - 1);
  } else if (range === "3M") {
    cutoff.setMonth(cutoff.getMonth() - 3);
  } else if (range === "1Y") {
    cutoff.setFullYear(cutoff.getFullYear() - 1);
  } else if (range === "YTD") {
    cutoff.setMonth(0, 1);
    cutoff.setHours(0, 0, 0, 0);
  }

  return cutoff.getTime();
}

/**
 * Filter persisted portfolio valuations without synthesizing/interpolating data.
 * If a range contains only one saved point, include the immediately preceding
 * point so the chart can still show the move into the selected period.
 */
export function filterPortfolioValueHistory(
  points: readonly PortfolioValuePoint[],
  range: ModelPortfolioChartRange,
): PortfolioValuePoint[] {
  if (range === "ALL" || points.length <= 1) return [...points];

  const latest = points.at(-1);
  if (!latest) return [];

  const cutoff = rangeCutoff(range, latest.snapshotAt);
  if (cutoff === null) return [...points];

  const filtered = points.filter((point) => Date.parse(point.snapshotAt) >= cutoff);
  if (filtered.length >= 2 || filtered.length === points.length) return filtered;

  const firstIncluded = filtered[0];
  const firstIndex = firstIncluded
    ? points.findIndex((point) => point.snapshotAt === firstIncluded.snapshotAt)
    : points.length;
  const previous = points[Math.max(0, firstIndex - 1)];

  return previous ? [previous, ...filtered] : filtered;
}
