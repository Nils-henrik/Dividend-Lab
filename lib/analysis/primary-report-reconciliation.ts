import type { AnalysisEvidence } from "./evidence";
import type { CurrencyAwareFundamentalSnapshot } from "./financial-statement-normalizer";
import type { FundamentalPeriod, FundamentalSnapshot } from "./fundamental-analysis";

export const DIVLAB_PRIMARY_REPORT_RECONCILIATION_VERSION =
  "primary-report-reconciliation-v1" as const;

export type ReconciliationMetricName =
  | "revenue"
  | "operatingIncome"
  | "netIncome"
  | "eps";

export type ReconciliationMetricResult = {
  metric: ReconciliationMetricName;
  providerValue: number | null;
  reportValue: number | null;
  relativeDifference: number | null;
  status: "confirmed" | "not_confirmirmed" | "provider_missing" | "not_confirmed";
  rawToken: string | null;
  context: string | null;
};

export type PrimaryReportReconciliation = {
  version: typeof DIVLAB_PRIMARY_REPORT_RECONCILIATION_VERSION;
  status: "not_applicable" | "not_confirmed" | "partial" | "confirmed";
  sourceId: string | null;
  reportPeriod: string | null;
  reportYear: number | null;
  reportingCurrency: string | null;
  providerBasis: "quarter" | "ytd_2q" | "ytd_3q" | "fy" | null;
  providerPeriods: string[];
  amountScale: number | null;
  confirmedMetrics: number;
  eligibleMetrics: number;
  metrics: ReconciliationMetricResult[];
  notes: string[];
};

type ProviderBasis = Exclude<PrimaryReportReconciliation["providerBasis"], null>;

type MetricSpec = {
  metric: ReconciliationMetricName;
  labels: readonly RegExp[];
  tolerance: number;
  perShare: boolean;
};

const METRICS: readonly MetricSpec[] = [
  {
    metric: "revenue",
    labels: [
      /\bnet\s+sales\b/iu,
      /\brevenue\b/iu,
      /\bnettooms[aä]ttning\b/iu,
      /\boms[aä]ttning\b/iu,
    ],
    tolerance: 0.005,
    perShare: false,
  },
  {
    metric: "operatingIncome",
    labels: [
      /\boperating\s+profit\b/iu,
      /\boperating\s+income\b/iu,
      /\br[oö]relseresultat\b/iu,
    ],
    tolerance: 0.008,
    perShare: false,
  },
  {
    metric: "netIncome",
    labels: [
      /\bnet\s+income\b/iu,
      /\bprofit\s+for\s+the\s+(?:period|year)\b/iu,
      /\bperiodens\s+resultat\b/iu,
      /\b[aå]rets\s+resultat\b/iu,
      /\bresultat\s+efter\s+skatt\b/iu,
    ],
    tolerance: 0.01,
    perShare: false,
  },
  {
    metric: "eps",
    labels: [
      /\bearnings\s+per\s+share\b/iu,
      /\bresultat\s+per\s+aktie\b/iu,
    ],
    tolerance: 0.01,
    perShare: true,
  },
] as const;

function normalizedCurrency(value: string | null | undefined): string | null {
  const normalized = value?.trim().toUpperCase() ?? "";
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function detectedAmountScale(text: string, currency: string): number | null {
  const escaped = escapeRegex(currency);
  const patterns: Array<[number, RegExp]> = [
    [
      1_000_000_000,
      new RegExp(
        `(?:\\bB${escaped}\\b|\\b${escaped}\\s*(?:bn|billion(?:s)?)\\b|\\b(?:bn|billion(?:s)?)\\s+(?:of\\s+)?${escaped}\\b)`,
        "iu",
      ),
    ],
    [
      1_000_000,
      new RegExp(
        `(?:\\bM${escaped}\\b|\\b${escaped}\\s*(?:m|mn|million(?:s)?)\\b|\\b(?:m|mn|million(?:s)?)\\s+(?:of\\s+)?${escaped}\\b)`,
        "iu",
      ),
    ],
    [
      1_000,
      new RegExp(
        `(?:\\b(?:K|T)${escaped}\\b|\\b${escaped}\\s*(?:k|thousand(?:s)?)\\b|\\bthousand(?:s)?\\s+(?:of\\s+)?${escaped}\\b)`,
        "iu",
      ),
    ],
  ];
  const matches = patterns.filter(([, pattern]) => pattern.test(text)).map(([scale]) => scale);
  const unique = [...new Set(matches)];
  return unique.length === 1 ? unique[0]! : null;
}

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function periodYear(period: FundamentalPeriod): number | null {
  const match = period.period.match(/^(20\d{2})-/);
  return match ? Number(match[1]) : null;
}

function sortedPeriods(periods: readonly FundamentalPeriod[] | undefined): FundamentalPeriod[] {
  return [...(periods ?? [])]
    .filter((period) => /^20\d{2}-\d{2}-\d{2}$/.test(period.period))
    .sort((a, b) => b.period.localeCompare(a.period));
}

function reportBasis(period: string | null): { basis: ProviderBasis; quarters: number | null } | null {
  if (period === "Q1") return { basis: "quarter", quarters: 1 };
  if (period === "Q2" || period === "H1") return { basis: "ytd_2q", quarters: 2 };
  if (period === "Q3") return { basis: "ytd_3q", quarters: 3 };
  if (period === "Q4" || period === "FY") return { basis: "fy", quarters: null };
  return null;
}

function selectProviderPeriods(input: {
  snapshot: CurrencyAwareFundamentalSnapshot;
  reportPeriod: string | null;
  reportYear: number | null;
}): { basis: ProviderBasis; periods: FundamentalPeriod[] } | null {
  if (!input.reportYear) return null;
  const basis = reportBasis(input.reportPeriod);
  if (!basis) return null;

  if (basis.basis === "fy") {
    const annual = sortedPeriods(input.snapshot.historicalPeriods).find(
      (period) => periodYear(period) === input.reportYear,
    );
    return annual ? { basis: basis.basis, periods: [annual] } : null;
  }

  const sameYear = sortedPeriods(input.snapshot.quarterlyPeriods).filter(
    (period) => periodYear(period) === input.reportYear,
  );
  const required = basis.quarters ?? 0;
  if (sameYear.length < required) return null;
  return { basis: basis.basis, periods: sameYear.slice(0, required) };
}

function metricValue(period: FundamentalPeriod, metric: ReconciliationMetricName): number | null {
  const value = period[metric];
  return finite(value) ? value : null;
}

function aggregateProviderMetric(
  periods: readonly FundamentalPeriod[],
  metric: ReconciliationMetricName,
): number | null {
  const values = periods.map((period) => metricValue(period, metric));
  if (values.some((value) => value === null)) return null;
  return (values as number[]).reduce((sum, value) => sum + value, 0);
}

function numericTokens(value: string): string[] {
  // Deliberately exclude ordinary ASCII spaces from a token. In flattened PDF
  // tables they usually separate columns and must not be guessed as thousands
  // separators. NBSP/narrow-NBSP remain eligible because they are explicit
  // typographic grouping characters.
  return value.match(/\(?-?\d[\d\u00a0\u202f.,]*\d\)?|\(?-?\d\)?/g)?.slice(0, 8) ?? [];
}

function numericCandidates(rawToken: string): number[] {
  let token = rawToken.trim().replace(/[\u00a0\u202f]/g, "");
  let negative = false;
  if (token.startsWith("(") && token.endsWith(")")) {
    negative = true;
    token = token.slice(1, -1);
  }
  if (token.startsWith("-")) {
    negative = true;
    token = token.slice(1);
  }
  if (!token || !/[0-9]/.test(token)) return [];

  const candidates = new Set<number>();
  const add = (normalized: string) => {
    if (!/^\d+(?:\.\d+)?$/.test(normalized)) return;
    const parsed = Number(normalized);
    if (!Number.isFinite(parsed)) return;
    candidates.add(negative ? -parsed : parsed);
  };

  const hasComma = token.includes(",");
  const hasDot = token.includes(".");
  if (hasComma && hasDot) {
    add(token.replace(/,/g, ""));
    add(token.replace(/\./g, "").replace(/,/g, "."));
  } else if (hasComma) {
    add(token.replace(/,/g, "."));
    add(token.replace(/,/g, ""));
  } else if (hasDot) {
    add(token);
    add(token.replace(/\./g, ""));
  } else {
    add(token);
  }
  return [...candidates];
}

function relativeDifference(a: number, b: number): number {
  const denominator = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  return Math.abs(a - b) / denominator;
}

function cleanContext(line: string): string {
  return line.replace(/\s+/g, " ").trim().slice(0, 260);
}

function findReportMatch(input: {
  excerpt: string;
  reportingCurrency: string;
  amountScale: number | null;
  spec: MetricSpec;
  providerValue: number;
}): Pick<ReconciliationMetricResult, "reportValue" | "relativeDifference" | "rawToken" | "context"> | null {
  const lines = input.excerpt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const currencyPattern = new RegExp(`\\b${escapeRegex(input.reportingCurrency)}\\b`, "iu");
  const matches: Array<{
    reportValue: number;
    relativeDifference: number;
    rawToken: string;
    context: string;
  }> = [];

  for (const line of lines) {
    const label = input.spec.labels.find((pattern) => pattern.test(line));
    if (!label) continue;
    const labelMatch = line.match(label);
    if (!labelMatch || labelMatch.index === undefined) continue;
    const afterLabel = line.slice(labelMatch.index + labelMatch[0].length);

    if (input.spec.perShare && !currencyPattern.test(line)) {
      // EPS is only reconciled when the row itself explicitly declares the
      // reporting currency; a document-level "amounts in millions" note is not
      // enough to infer a per-share currency.
      continue;
    }
    if (!input.spec.perShare && input.amountScale === null) continue;

    for (const rawToken of numericTokens(afterLabel)) {
      for (const candidate of numericCandidates(rawToken)) {
        const reportValue = input.spec.perShare
          ? candidate
          : candidate * input.amountScale!;
        const difference = relativeDifference(reportValue, input.providerValue);
        if (difference <= input.spec.tolerance) {
          matches.push({
            reportValue,
            relativeDifference: difference,
            rawToken,
            context: cleanContext(line),
          });
        }
      }
    }
  }

  const unique = new Map<string, (typeof matches)[number]>();
  for (const match of matches) {
    const key = `${match.reportValue.toPrecision(12)}:${match.context}`;
    unique.set(key, match);
  }
  const values = [...unique.values()];
  if (values.length !== 1) return null;
  return values[0]!;
}

function emptyResult(input?: {
  sourceId?: string | null;
  reportPeriod?: string | null;
  reportYear?: number | null;
  reportingCurrency?: string | null;
  notes?: string[];
}): PrimaryReportReconciliation {
  return {
    version: DIVLAB_PRIMARY_REPORT_RECONCILIATION_VERSION,
    status: "not_applicable",
    sourceId: input?.sourceId ?? null,
    reportPeriod: input?.reportPeriod ?? null,
    reportYear: input?.reportYear ?? null,
    reportingCurrency: input?.reportingCurrency ?? null,
    providerBasis: null,
    providerPeriods: [],
    amountScale: null,
    confirmedMetrics: 0,
    eligibleMetrics: 0,
    metrics: [],
    notes: input?.notes ?? [],
  };
}

/**
 * Conservative accounting-number cross-check between a bounded official report
 * excerpt and provider-normalized statement periods.
 *
 * This function is deliberately confirmation-only. A failed string/number match
 * is never treated as an accounting conflict because PDF table order, locale,
 * adjusted metrics and period presentation can be ambiguous. It never mutates
 * provider data and is not a publication blocker in v1.
 */
export function reconcilePrimaryReport(input: {
  fundamentals: FundamentalSnapshot;
  evidence: readonly AnalysisEvidence[];
}): PrimaryReportReconciliation {
  const snapshot = input.fundamentals as CurrencyAwareFundamentalSnapshot;
  const reportingCurrency = normalizedCurrency(snapshot.reportingCurrency);
  const report = input.evidence.find(
    (item) =>
      item.primary &&
      item.documentRetrieved &&
      item.kind === "official_report_excerpt" &&
      Boolean(item.documentExcerpt?.trim()),
  );

  if (!report) {
    return emptyResult({
      reportingCurrency,
      notes: ["Ingen ren, hämtad primärrapporttext finns tillgänglig för deterministisk avstämning."],
    });
  }
  if (!reportingCurrency) {
    return emptyResult({
      sourceId: report.sourceId,
      reportPeriod: report.reportPeriod,
      reportYear: report.reportYear,
      notes: ["Redovisningsvalutan är okänd; rapportvärden kan därför inte avstämmas säkert."],
    });
  }

  const provider = selectProviderPeriods({
    snapshot,
    reportPeriod: report.reportPeriod,
    reportYear: report.reportYear,
  });
  if (!provider) {
    return emptyResult({
      sourceId: report.sourceId,
      reportPeriod: report.reportPeriod,
      reportYear: report.reportYear,
      reportingCurrency,
      notes: [
        "Rapportperioden kan inte kopplas entydigt till tillgängliga providerperioder; ingen sifferavstämning görs.",
      ],
    });
  }

  const excerpt = report.documentExcerpt!.trim();
  const amountScale = detectedAmountScale(excerpt, reportingCurrency);
  const metrics: ReconciliationMetricResult[] = METRICS.map((spec) => {
    const providerValue = aggregateProviderMetric(provider.periods, spec.metric);
    if (!finite(providerValue)) {
      return {
        metric: spec.metric,
        providerValue: null,
        reportValue: null,
        relativeDifference: null,
        status: "provider_missing" as const,
        rawToken: null,
        context: null,
      };
    }

    const match = findReportMatch({
      excerpt,
      reportingCurrency,
      amountScale,
      spec,
      providerValue,
    });
    return match
      ? {
          metric: spec.metric,
          providerValue,
          reportValue: match.reportValue,
          relativeDifference: match.relativeDifference,
          status: "confirmed" as const,
          rawToken: match.rawToken,
          context: match.context,
        }
      : {
          metric: spec.metric,
          providerValue,
          reportValue: null,
          relativeDifference: null,
          status: "not_confirmed" as const,
          rawToken: null,
          context: null,
        };
  });

  const eligibleMetrics = metrics.filter((metric) => metric.providerValue !== null).length;
  const confirmedMetrics = metrics.filter((metric) => metric.status === "confirmed").length;
  const status: PrimaryReportReconciliation["status"] =
    eligibleMetrics === 0
      ? "not_applicable"
      : confirmedMetrics === 0
        ? "not_confirmed"
        : confirmedMetrics === eligibleMetrics
          ? "confirmed"
          : "partial";

  const notes: string[] = [];
  if (amountScale === null) {
    notes.push(
      "Ingen unik explicit valuta/enhet för rapportens beloppskolumner kunde verifieras; beloppsmått lämnas obekräftade.",
    );
  }
  if (confirmedMetrics > 0) {
    notes.push(
      `${confirmedMetrics} av ${eligibleMetrics} providerbaserade nyckeltal kunde bekräftas direkt i den bounded primärrapporttexten.`,
    );
  }

  return {
    version: DIVLAB_PRIMARY_REPORT_RECONCILIATION_VERSION,
    status,
    sourceId: report.sourceId,
    reportPeriod: report.reportPeriod,
    reportYear: report.reportYear,
    reportingCurrency,
    providerBasis: provider.basis,
    providerPeriods: provider.periods.map((period) => period.period),
    amountScale,
    confirmedMetrics,
    eligibleMetrics,
    metrics,
    notes,
  };
}
