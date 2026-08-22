import type { AnalysisEvidence } from "./evidence";

export const DIVLAB_BANK_ANALYSIS_VERSION = "bank-analysis-v1" as const;

export type DivLabBankMetricName =
  | "cet1Ratio"
  | "returnOnEquity"
  | "netInterestMargin"
  | "creditLossRatio"
  | "costIncomeRatio";

export type DivLabBankMetric = {
  name: DivLabBankMetricName;
  status: "confirmed" | "not_found" | "ambiguous";
  valuePct: number | null;
  rawToken: string | null;
  context: string | null;
  sourceId: string | null;
};

export type DivLabBankReportMetrics = {
  version: typeof DIVLAB_BANK_ANALYSIS_VERSION;
  status: "not_applicable" | "insufficient" | "partial" | "evidence_ready";
  sourceId: string | null;
  reportPeriod: string | null;
  reportYear: number | null;
  confirmedMetrics: number;
  requiredCoreConfirmed: boolean;
  coverage: number;
  metrics: Record<DivLabBankMetricName, DivLabBankMetric>;
  notes: string[];
};

type MetricSpec = {
  name: DivLabBankMetricName;
  labels: readonly RegExp[];
  minPct: number;
  maxPct: number;
  allowBasisPoints?: boolean;
};

type MetricCandidate = {
  valuePct: number;
  rawToken: string;
  context: string;
};

const METRICS: readonly MetricSpec[] = [
  {
    name: "cet1Ratio",
    labels: [
      /\bCET1\s+(?:capital\s+)?ratio\b/iu,
      /\bcommon\s+equity\s+tier\s*1\s*(?:\(CET1\)\s*)?(?:capital\s+)?ratio\b/iu,
      /\bk[aä]rnprim[aä]rkapitalrelation\b/iu,
    ],
    minPct: 0,
    maxPct: 60,
  },
  {
    name: "returnOnEquity",
    labels: [
      /\breturn\s+on\s+(?:average\s+)?equity\b/iu,
      /\bROE\b/u,
      /\bavkastning\s+p[aå]\s+eget\s+kapital\b/iu,
    ],
    minPct: -100,
    maxPct: 150,
  },
  {
    name: "netInterestMargin",
    labels: [
      /\bnet\s+interest\s+margin\b/iu,
      /\bNIM\b/u,
      /\br[aä]ntenettomarginal\b/iu,
    ],
    minPct: -10,
    maxPct: 30,
  },
  {
    name: "creditLossRatio",
    labels: [
      /\bcredit\s+loss\s+ratio\b/iu,
      /\bcredit\s+impairment\s+ratio\b/iu,
      /\bloan\s+loss\s+ratio\b/iu,
      /\bimpairment\s+(?:loss\s+)?ratio\b/iu,
      /\bnet\s+ECL\s+level\b/iu,
      /\bkreditf[oö]rlustniv[aå](?=$|[^\p{L}\p{N}_])/iu,
      /\bnetto\s+(?:ECL|kreditf[oö]rlust)[-\s]?niv[aå]\b/iu,
      /\bkreditf[oö]rlustrelation\b/iu,
    ],
    minPct: -10,
    maxPct: 30,
    allowBasisPoints: true,
  },
  {
    name: "costIncomeRatio",
    labels: [
      /\bcost[\s/-]*income\s+ratio\b/iu,
      /\bcost\s+to\s+income\s+ratio\b/iu,
      /\bC\/I\s+ratio\b/iu,
      /\bK\/I[-\s]?tal\b/iu,
      /\bkostnads[\s/-]*int[aä]ktsrelation\b/iu,
    ],
    minPct: 0,
    maxPct: 150,
  },
] as const;

function cleanContext(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 280);
}

function numericCandidates(raw: string): number[] {
  const normalized = raw.trim().replace(/[\u00a0\u202f]/g, "");
  const candidates = new Set<number>();
  const add = (value: string) => {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) candidates.add(parsed);
  };

  if (/^-?\d+(?:\.\d+)?$/.test(normalized)) add(normalized);
  if (/^-?\d+,\d+$/.test(normalized)) add(normalized.replace(",", "."));
  return [...candidates];
}

function plainNumericTokens(value: string): string[] {
  return value.match(/-?\d+(?:[.,]\d+)?/g)?.slice(0, 8) ?? [];
}

function percentTokens(value: string): Array<{ raw: string; scale: number }> {
  const tokens: Array<{ raw: string; scale: number }> = [];
  const percentPattern =
    /(-?\d+(?:[.,]\d+)?)\s*(?:%|percent\b|per\s+cent\b|procent\b)/giu;
  for (const match of value.matchAll(percentPattern)) {
    if (match[1]) tokens.push({ raw: match[1], scale: 1 });
  }
  const bpPattern =
    /(-?\d+(?:[.,]\d+)?)\s*(?:bp|bps|basis\s+points?|baspunkter?)\b/giu;
  for (const match of value.matchAll(bpPattern)) {
    if (match[1]) tokens.push({ raw: match[1], scale: 0.01 });
  }

  // Flattened financial tables often declare the unit before the period values,
  // e.g. `CET1 capital ratio, % 17.4 18.3`. In that format every number after
  // the explicit unit is retained. More than one distinct value therefore
  // becomes `ambiguous` later instead of assuming the first column is current.
  const percentPrefix =
    /^\s*[,;:]?\s*(?:%|percent\b|per\s+cent\b|procent\b)\s+(.+)$/iu.exec(value);
  if (percentPrefix?.[1]) {
    for (const raw of plainNumericTokens(percentPrefix[1])) {
      tokens.push({ raw, scale: 1 });
    }
  }
  const bpPrefix =
    /^\s*[,;:]?\s*(?:bp|bps|basis\s+points?|baspunkter?)\b\s+(.+)$/iu.exec(value);
  if (bpPrefix?.[1]) {
    for (const raw of plainNumericTokens(bpPrefix[1])) {
      tokens.push({ raw, scale: 0.01 });
    }
  }

  return tokens;
}

/**
 * Narrative release sentences can mention several different ratios on one
 * physical line after HTML flattening. A metric only owns its immediate clause.
 * Explicit unit-first table rows are the exception: all period columns remain
 * visible so multi-period rows still fail ambiguous rather than guessing a
 * current column.
 */
function metricValueScope(afterLabel: string): string {
  const unitFirstTable =
    /^\s*[,;:]?\s*(?:%|percent\b|per\s+cent\b|procent\b|bp\b|bps\b|basis\s+points?\b|baspunkter?\b)/iu;
  if (unitFirstTable.test(afterLabel)) return afterLabel;

  const clauseBoundary = afterLabel.search(/[,;](?=\s|$)|\.(?=\s|$)/u);
  return clauseBoundary >= 0 ? afterLabel.slice(0, clauseBoundary) : afterLabel;
}

function metricFromExcerpt(input: {
  excerpt: string;
  sourceId: string;
  spec: MetricSpec;
}): DivLabBankMetric {
  const matches = new Map<string, MetricCandidate>();
  let ambiguousLineSeen = false;
  const lines = input.excerpt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const label = input.spec.labels.find((pattern) => pattern.test(line));
    if (!label) continue;
    const labelMatch = line.match(label);
    if (!labelMatch || labelMatch.index === undefined) continue;
    const afterLabel = line.slice(labelMatch.index + labelMatch[0].length);
    const valueScope = metricValueScope(afterLabel);
    const lineMatches = new Map<string, MetricCandidate>();

    for (const token of percentTokens(valueScope)) {
      if (token.scale === 0.01 && !input.spec.allowBasisPoints) continue;
      for (const candidate of numericCandidates(token.raw)) {
        const valuePct = candidate * token.scale;
        if (valuePct < input.spec.minPct || valuePct > input.spec.maxPct) continue;
        const key = valuePct.toFixed(6);
        lineMatches.set(key, {
          valuePct,
          rawToken: `${token.raw}${token.scale === 0.01 ? " bp" : "%"}`,
          context: cleanContext(line),
        });
      }
    }

    const lineValues = [...lineMatches.values()];
    if (lineValues.length === 1) {
      const value = lineValues[0]!;
      matches.set(value.valuePct.toFixed(6), value);
    } else if (lineValues.length > 1) {
      // A multi-period table row remains ambiguous on its own. If the same
      // official release also contains a separate one-value narrative clause,
      // that explicit clause may confirm the metric without guessing a table
      // column. Different one-value clauses still conflict below.
      ambiguousLineSeen = true;
    }
  }

  const values = [...matches.values()];
  if (values.length === 0) {
    return {
      name: input.spec.name,
      status: ambiguousLineSeen ? "ambiguous" : "not_found",
      valuePct: null,
      rawToken: null,
      context: null,
      sourceId: input.sourceId,
    };
  }
  if (values.length !== 1) {
    return {
      name: input.spec.name,
      status: "ambiguous",
      valuePct: null,
      rawToken: null,
      context: null,
      sourceId: input.sourceId,
    };
  }

  const match = values[0]!;
  return {
    name: input.spec.name,
    status: "confirmed",
    valuePct: Math.round(match.valuePct * 10_000) / 10_000,
    rawToken: match.rawToken,
    context: match.context,
    sourceId: input.sourceId,
  };
}

function emptyMetric(name: DivLabBankMetricName): DivLabBankMetric {
  return {
    name,
    status: "not_found",
    valuePct: null,
    rawToken: null,
    context: null,
    sourceId: null,
  };
}

function emptyResult(note: string): DivLabBankReportMetrics {
  return {
    version: DIVLAB_BANK_ANALYSIS_VERSION,
    status: "not_applicable",
    sourceId: null,
    reportPeriod: null,
    reportYear: null,
    confirmedMetrics: 0,
    requiredCoreConfirmed: false,
    coverage: 0,
    metrics: {
      cet1Ratio: emptyMetric("cet1Ratio"),
      returnOnEquity: emptyMetric("returnOnEquity"),
      netInterestMargin: emptyMetric("netInterestMargin"),
      creditLossRatio: emptyMetric("creditLossRatio"),
      costIncomeRatio: emptyMetric("costIncomeRatio"),
    },
    notes: [note],
  };
}

function usableReports(evidence: readonly AnalysisEvidence[]): AnalysisEvidence[] {
  return [...evidence]
    .filter(
      (item) =>
        item.primary &&
        item.documentRetrieved &&
        item.kind === "official_report_excerpt" &&
        Boolean(item.documentExcerpt?.trim()),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/**
 * Search each verified primary report independently for one metric. A newer
 * report that explicitly contains an ambiguous row blocks fallback to an older
 * value; only true `not_found` may continue to the next verified document.
 */
function metricAcrossReports(input: {
  reports: readonly AnalysisEvidence[];
  spec: MetricSpec;
}): DivLabBankMetric {
  for (const report of input.reports) {
    const excerpt = report.documentExcerpt?.trim();
    if (!excerpt) continue;
    const result = metricFromExcerpt({
      excerpt,
      sourceId: report.sourceId,
      spec: input.spec,
    });
    if (result.status !== "not_found") return result;
  }
  return emptyMetric(input.spec.name);
}

/**
 * Confirmation-only extraction of bank-specific ratios from bounded official
 * report excerpts. Metrics may come from different verified documents (for
 * example an interim report plus a Fact Book), while every metric retains its
 * own sourceId and an ambiguous newer row never silently falls back to stale
 * evidence. This is not a bank scorecard and does not infer regulatory
 * headroom, quality or valuation from generic thresholds.
 */
export function extractBankReportMetrics(
  evidence: readonly AnalysisEvidence[],
): DivLabBankReportMetrics {
  const reports = usableReports(evidence);
  const anchorReport = reports[0] ?? null;
  if (!anchorReport) {
    return emptyResult(
      "Ingen ren, hämtad primärrapporttext finns för bankspecialiserad analys.",
    );
  }

  const extracted = METRICS.map((spec) =>
    metricAcrossReports({ reports, spec }),
  );
  const metrics = Object.fromEntries(
    extracted.map((metric) => [metric.name, metric]),
  ) as Record<DivLabBankMetricName, DivLabBankMetric>;
  const confirmedMetrics = extracted.filter(
    (metric) => metric.status === "confirmed",
  ).length;
  const requiredCoreConfirmed =
    metrics.cet1Ratio.status === "confirmed" &&
    metrics.returnOnEquity.status === "confirmed";
  const hasRiskOrMarginContext =
    metrics.creditLossRatio.status === "confirmed" ||
    metrics.netInterestMargin.status === "confirmed" ||
    metrics.costIncomeRatio.status === "confirmed";
  const coverage = confirmedMetrics / METRICS.length;
  const evidenceReady =
    requiredCoreConfirmed && hasRiskOrMarginContext && confirmedMetrics >= 3;

  return {
    version: DIVLAB_BANK_ANALYSIS_VERSION,
    status: evidenceReady
      ? "evidence_ready"
      : confirmedMetrics >= 2
        ? "partial"
        : "insufficient",
    sourceId: anchorReport.sourceId,
    reportPeriod: anchorReport.reportPeriod,
    reportYear: anchorReport.reportYear,
    confirmedMetrics,
    requiredCoreConfirmed,
    coverage: Math.round(coverage * 10_000) / 10_000,
    metrics,
    notes: [
      "Värdena är confirmation-only rapportfakta och kan komma från flera verifierade primärrapporter; varje mått behåller sitt eget sourceId. Regulatoriskt kapitalkrav, kapitalbuffert och bankvärdering måste analyseras separat innan metodiken kan klassas som komplett.",
    ],
  };
}
