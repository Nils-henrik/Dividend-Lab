import type { AnalysisEvidence } from "./evidence";

export const DIVLAB_BANK_FUNDING_VERSION = "bank-funding-v1" as const;

export type DivLabBankFundingMetricName =
  | "liquidityCoverageRatio"
  | "netStableFundingRatio"
  | "lendingGrowthReported"
  | "depositGrowthReported";

export type DivLabBankFundingMetric = {
  name: DivLabBankFundingMetricName;
  status: "confirmed" | "not_found" | "ambiguous";
  valuePct: number | null;
  context: string | null;
  sourceId: string | null;
};

export type DivLabBankFundingContext = {
  version: typeof DIVLAB_BANK_FUNDING_VERSION;
  status: "not_applicable" | "insufficient" | "partial" | "evidence_ready";
  sourceId: string | null;
  confirmedMetrics: number;
  metrics: Record<DivLabBankFundingMetricName, DivLabBankFundingMetric>;
  notes: string[];
};

type MetricSpec = {
  name: DivLabBankFundingMetricName;
  labels: readonly RegExp[];
  minPct: number;
  maxPct: number;
};

const SPECS: readonly MetricSpec[] = [
  {
    name: "liquidityCoverageRatio",
    labels: [
      /\bliquidity\s+coverage\s+ratio\b/iu,
      /\bLCR\b/u,
      /\blikviditetst[aä]ckningsgrad\b/iu,
    ],
    minPct: 0,
    maxPct: 1_000,
  },
  {
    name: "netStableFundingRatio",
    labels: [
      /\bnet\s+stable\s+funding\s+ratio\b/iu,
      /\bNSFR\b/u,
      /\bstabil\s+nettofinansieringskvot\b/iu,
    ],
    minPct: 0,
    maxPct: 1_000,
  },
  {
    name: "lendingGrowthReported",
    labels: [
      /\blending\s+growth\b/iu,
      /\bloan\s+growth\b/iu,
      /\butl[aå]ningstillv[aä]xt\b/iu,
    ],
    minPct: -100,
    maxPct: 300,
  },
  {
    name: "depositGrowthReported",
    labels: [
      /\bdeposit\s+growth\b/iu,
      /\binl[aå]ningstillv[aä]xt\b/iu,
    ],
    minPct: -100,
    maxPct: 300,
  },
] as const;

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 300);
}

function parseNumber(raw: string): number | null {
  const normalized = raw.replace(/[\u00a0\u202f]/g, "").replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function valueTokens(afterLabel: string): string[] {
  const tokens = new Set<string>();
  const valueFirst =
    /(-?\d+(?:[.,]\d+)?)\s*(?:%|percent\b|per\s+cent\b|procent\b)/giu;
  for (const match of afterLabel.matchAll(valueFirst)) {
    if (match[1]) tokens.add(match[1]);
  }
  const unitFirst =
    /^\s*[,;:]?\s*(?:%|percent\b|per\s+cent\b|procent\b)\s+(.+)$/iu.exec(afterLabel);
  if (unitFirst?.[1]) {
    for (const raw of unitFirst[1].match(/-?\d+(?:[.,]\d+)?/g) ?? []) {
      tokens.add(raw);
    }
  }
  return [...tokens].slice(0, 8);
}

function extractMetric(input: {
  excerpt: string;
  sourceId: string;
  spec: MetricSpec;
}): DivLabBankFundingMetric {
  const candidates = new Map<string, { value: number; context: string }>();
  const lines = input.excerpt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  for (const line of lines) {
    const label = input.spec.labels.find((pattern) => pattern.test(line));
    if (!label) continue;
    const labelMatch = line.match(label);
    if (!labelMatch || labelMatch.index === undefined) continue;
    const after = line
      .slice(labelMatch.index + labelMatch[0].length)
      .replace(/^\s*\((?:LCR|NSFR)\)\s*/iu, "");
    for (const raw of valueTokens(after)) {
      const value = parseNumber(raw);
      if (value === null || value < input.spec.minPct || value > input.spec.maxPct) continue;
      candidates.set(value.toFixed(6), { value, context: clean(line) });
    }
  }

  const values = [...candidates.values()];
  if (values.length === 0) {
    return {
      name: input.spec.name,
      status: "not_found",
      valuePct: null,
      context: null,
      sourceId: input.sourceId,
    };
  }
  if (values.length !== 1) {
    return {
      name: input.spec.name,
      status: "ambiguous",
      valuePct: null,
      context: null,
      sourceId: input.sourceId,
    };
  }
  return {
    name: input.spec.name,
    status: "confirmed",
    valuePct: Math.round(values[0]!.value * 10_000) / 10_000,
    context: values[0]!.context,
    sourceId: input.sourceId,
  };
}

function emptyMetric(name: DivLabBankFundingMetricName): DivLabBankFundingMetric {
  return { name, status: "not_found", valuePct: null, context: null, sourceId: null };
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
 * Search newest verified evidence first for one funding metric. An explicitly
 * ambiguous newer row blocks fallback to an older value; only a true miss may
 * continue to another verified report or Fact Book.
 */
function metricAcrossReports(input: {
  reports: readonly AnalysisEvidence[];
  spec: MetricSpec;
}): DivLabBankFundingMetric {
  for (const report of input.reports) {
    const excerpt = report.documentExcerpt?.trim();
    if (!excerpt) continue;
    const result = extractMetric({
      excerpt,
      sourceId: report.sourceId,
      spec: input.spec,
    });
    if (result.status !== "not_found") return result;
  }
  return emptyMetric(input.spec.name);
}

export function extractBankFundingContext(
  evidence: readonly AnalysisEvidence[],
): DivLabBankFundingContext {
  const reports = usableReports(evidence);
  const anchorReport = reports[0] ?? null;
  if (!anchorReport) {
    return {
      version: DIVLAB_BANK_FUNDING_VERSION,
      status: "not_applicable",
      sourceId: null,
      confirmedMetrics: 0,
      metrics: {
        liquidityCoverageRatio: emptyMetric("liquidityCoverageRatio"),
        netStableFundingRatio: emptyMetric("netStableFundingRatio"),
        lendingGrowthReported: emptyMetric("lendingGrowthReported"),
        depositGrowthReported: emptyMetric("depositGrowthReported"),
      },
      notes: ["Ingen ren primärrapporttext finns för bankens finansierings-/likviditetsanalys."],
    };
  }

  const extracted = SPECS.map((spec) =>
    metricAcrossReports({ reports, spec }),
  );
  const metrics = Object.fromEntries(
    extracted.map((metric) => [metric.name, metric]),
  ) as Record<DivLabBankFundingMetricName, DivLabBankFundingMetric>;
  const confirmedMetrics = extracted.filter((metric) => metric.status === "confirmed").length;
  const hasRegulatoryLiquidity =
    metrics.liquidityCoverageRatio.status === "confirmed" ||
    metrics.netStableFundingRatio.status === "confirmed";
  const hasBalancedGrowthContext =
    metrics.lendingGrowthReported.status === "confirmed" &&
    metrics.depositGrowthReported.status === "confirmed";

  return {
    version: DIVLAB_BANK_FUNDING_VERSION,
    status:
      hasRegulatoryLiquidity || hasBalancedGrowthContext
        ? "evidence_ready"
        : confirmedMetrics > 0
          ? "partial"
          : "insufficient",
    sourceId: anchorReport.sourceId,
    confirmedMetrics,
    metrics,
    notes: [
      "LCR/NSFR och rapporterade tillväxttal är source-bound kontextfakta och kan komma från flera verifierade primärrapporter; varje mått behåller sitt eget sourceId. Ett tillväxttal saknar automatisk tidsperiodstolkning om rapporttexten inte uttryckligen anger den.",
    ],
  };
}
