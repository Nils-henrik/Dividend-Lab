import type { ReportSnapshotMetric } from "@/lib/companies/report-snapshot";
import { formatSvNumber } from "@/lib/companies/valuation";

export type ReportFactChange = {
  id: string;
  label: string;
  direction: "up" | "down";
  text: string;
};

function amountText(value: number) {
  const digits = Number.isInteger(value) ? 0 : 2;
  return formatSvNumber(value, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/**
 * Factual movement only. A row is included when both numeric amounts exist
 * and they differ. No investment conclusion is added.
 */
export function reportFactChanges(metrics: readonly ReportSnapshotMetric[]): ReportFactChange[] {
  const changes: ReportFactChange[] = [];
  for (const metric of metrics) {
    if (metric.comparisonAmount === null || !metric.comparisonLabel) continue;
    if (metric.amount === metric.comparisonAmount) continue;
    const direction = metric.amount > metric.comparisonAmount ? "up" : "down";
    const verb = direction === "up" ? "högre" : "lägre";
    changes.push({
      id: metric.id,
      label: metric.label,
      direction,
      text: `${metric.label} är ${verb} än jämförelseperioden: ${amountText(metric.amount)} mot ${amountText(metric.comparisonAmount)} (${metric.comparisonLabel}).`,
    });
  }
  return changes;
}
