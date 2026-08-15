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

const METRICS: readonly MetricSpec[] = [
  {
    name: "cet1Ratio",
    labels: [
      /\bCET1\s+(?:capital\s+)?ratio\b/iu,
      /\bcommon\s+equity\s+tier\s*1\s+(?:capital\s+)?ratio\b/iu,
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
      /\bloan\s+loss\s+ratio\b/iu,
      /\bimpairment\s+(?:loss\s+)?ratio\b/iu,
      /\bkreditf[oö]rlustniv[aå]\b/iu,
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

function percentTokens(value: string): Array<{ raw: string; scale: number }> {
  const tokens: Array<{ raw: string; scale: number }> = [];
  const percentPattern = /(-?\d+(?:[.,]\d+)?)\s*(?:%|percent|per\s+cent|procent)\b?/giu;
  for (const match of value.matchAll(percentPattern)) {
    if (match[1]) tokens.push({ raw: match[1], scale: 1 });
  }
  const bpPattern = /(-?\d+(?:[.,]\d+)?)\s*(?:bp|bps|basis\s+points?|baspunkter?)\b/giu;
  for (const match of value.matchAll(bpPattern)) {
    if (match[1]) tokens.push({ raw: match[1], scale: 0.01 });
  }
  return tokens;
}

function metricFromExcerpt(input: {
  excerpt: string;
  sourceId: string;
  spec: MetricSpec;
}): DivLabBankMetric {
  const matches = new Map<string, { valuePct: number; rawToken: string; context: string }>();
  const lines = input.excerpt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const label = input.spec.labels.find((pattern) => pattern.test(line));
    if (!label) continue;
    const labelMatch = line.match(label);
    if (!labelMatch || labelMatch.index === undefined) continue;
    const afterLabel = line.slice(labelMatch.index + labelMatch[0].length);

    for (const token of percentTokens(afterLabel)) {
      if (token.scale === 0.01 && !input.spec.allowBasisPoints) continue;
      for (const candidate of numericCandidates(token.raw)) {
        const valuePct = candidate * token.scale;
        if (valuePct < input.spec.minPct || valuePct > input.spec.maxPct) continue;
        const key = valuePct.toFixed(6);
        matches.set(key, {
          valuePct,
          rawToken: `${token.raw}${token.scale === 0.01 ? " bp" : "%"}`,
          context: cleanContext(line),
        });
      }
    }
  }

  const values = [...matches.values()];
  if (values.length === 0) {
    return {
      name: input.spec.name,
      status: "not_found",
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

/**
 * Confirmation-only extraction of bank-specific ratios from a bounded official
 * report excerpt. This is not a bank scorecard and does not infer regulatory
 * headroom, quality or valuation from generic thresholds.
 */
export function extractBankReportMetrics(
  evidence: readonly AnalysisEvidence[],
): DivLabBankReportMetrics {
  const report = evidence.find(
    (item) =>
      item.primary &&
      item.documentRetrieved &&
      item.kind === "official_report_excerpt" &&
      Boolean(item.documentExcerpt?.trim()),
  );
  if (!report?.documentExcerpt?.trim()) {
    return emptyResult("Ingen ren, hämtad primärrapporttext finns för bankspecialiserad analys.");
  }

  const extracted = METRICS.map((spec) =>
    metricFromExcerpt({ excerpt: report.documentExcerpt!, sourceId: report.sourceId, spec }),
  );
  const metrics = Object.fromEntries(
    extracted.map((metric) => [metric.name, metric]),
  ) as Record<DivLabBankMetricName, DivLabBankMetric>;
  const confirmedMetrics = extracted.filter((metric) => metric.status === "confirmed").length;
  const requiredCoreConfirmed =
    metrics.cet1Ratio.status === "confirmed" &&
    metrics.returnOnEquity.status === "confirmed";
  const hasRiskOrMarginContext =
    metrics.creditLossRatio.status === "confirmed" ||
    metrics.netInterestMargin.status === "confirmed" ||
    metrics.costIncomeRatio.status === "confirmed";
  const coverage = confirmedMetrics / METRICS.length;
  const evidenceReady = requiredCoreConfirmed && hasRiskOrMarginContext && confirmedMetrics >= 3;

  return {
    version: DIVLAB_BANK_ANALYSIS_VERSION,
    status: evidenceReady ? "evidence_ready" : confirmedMetrics >= 2 ? "partial" : "insufficient",
    sourceId: report.sourceId,
    reportPeriod: report.reportPeriod,
    reportYear: report.reportYear,
    confirmedMetrics,
    requiredCoreConfirmed,
    coverage: Math.round(coverage * 10_000) / 10_000,
    metrics,
    notes: [
      "Värdena är confirmation-only rapportfakta. Regulatoriskt kapitalkrav, kapitalbuffert och bankvärdering måste analyseras separat innan metodiken kan klassas som komplett.",
    ],
  };
}
