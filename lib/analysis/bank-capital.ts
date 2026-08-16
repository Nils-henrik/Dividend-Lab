import type { AnalysisEvidence } from "./evidence";
import type { DivLabBankReportMetrics } from "./bank-analysis";

export const DIVLAB_BANK_CAPITAL_VERSION = "bank-capital-v1" as const;

export type DivLabBankCapitalFact = {
  status: "confirmed" | "not_found" | "ambiguous";
  valuePctPoints: number | null;
  rawToken: string | null;
  context: string | null;
  sourceId: string | null;
};

export type DivLabBankCapitalContext = {
  version: typeof DIVLAB_BANK_CAPITAL_VERSION;
  status: "not_applicable" | "insufficient" | "partial" | "evidence_ready";
  sourceId: string | null;
  actualCet1Pct: number | null;
  regulatoryCet1Requirement: DivLabBankCapitalFact;
  reportedCapitalBuffer: DivLabBankCapitalFact;
  derivedHeadroomPctPoints: number | null;
  notes: string[];
};

type Candidate = {
  valuePctPoints: number;
  rawToken: string;
  context: string;
};

function cleanContext(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 320);
}

function numberValue(raw: string): number | null {
  const normalized = raw.trim().replace(/[\u00a0\u202f]/g, "").replace(",", ".");
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function tokensWithUnits(value: string): Array<{ raw: string; scale: number }> {
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
  return tokens;
}

function factFromCandidates(input: {
  candidates: readonly Candidate[];
  sourceId: string;
}): DivLabBankCapitalFact {
  const unique = new Map<string, Candidate>();
  for (const candidate of input.candidates) {
    unique.set(candidate.valuePctPoints.toFixed(6), candidate);
  }
  const values = [...unique.values()];
  if (values.length === 0) {
    return {
      status: "not_found",
      valuePctPoints: null,
      rawToken: null,
      context: null,
      sourceId: input.sourceId,
    };
  }
  if (values.length !== 1) {
    return {
      status: "ambiguous",
      valuePctPoints: null,
      rawToken: null,
      context: null,
      sourceId: input.sourceId,
    };
  }
  const value = values[0]!;
  return {
    status: "confirmed",
    valuePctPoints: Math.round(value.valuePctPoints * 10_000) / 10_000,
    rawToken: value.rawToken,
    context: value.context,
    sourceId: input.sourceId,
  };
}

function valuesAfterLabel(input: {
  line: string;
  label: RegExp;
  allowBasisPoints: boolean;
  min: number;
  max: number;
}): Candidate[] {
  const match = input.line.match(input.label);
  if (!match || match.index === undefined) return [];
  const after = input.line.slice(match.index + match[0].length);
  const values: Candidate[] = [];
  for (const token of tokensWithUnits(after)) {
    if (token.scale === 0.01 && !input.allowBasisPoints) continue;
    const rawValue = numberValue(token.raw);
    if (rawValue === null) continue;
    const valuePctPoints = rawValue * token.scale;
    if (valuePctPoints < input.min || valuePctPoints > input.max) continue;
    values.push({
      valuePctPoints,
      rawToken: `${token.raw}${token.scale === 0.01 ? " bp" : "%"}`,
      context: cleanContext(input.line),
    });
  }
  return values;
}

const REQUIREMENT_LABELS = [
  /\bregulatory\s+CET1\s+(?:capital\s+)?requirement\b/iu,
  /\bCET1\s+(?:capital\s+)?requirement\b/iu,
  /\bcommon\s+equity\s+tier\s*1\s+(?:capital\s+)?requirement\b/iu,
  /\bk[aä]rnprim[aä]rkapitalkrav\b/iu,
] as const;

const CAPITAL_BUFFER_LABELS = [
  /\bcapital\s+(?:management\s+)?buffer\b/iu,
  /\bCET1\s+(?:capital\s+)?buffer\b/iu,
  /\bkapitalbuffert\b/iu,
] as const;

function extractFact(input: {
  excerpt: string;
  sourceId: string;
  labels: readonly RegExp[];
  allowBasisPoints: boolean;
  min: number;
  max: number;
}): DivLabBankCapitalFact {
  const candidates: Candidate[] = [];
  const lines = input.excerpt.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    for (const label of input.labels) {
      if (!label.test(line)) continue;
      candidates.push(
        ...valuesAfterLabel({
          line,
          label,
          allowBasisPoints: input.allowBasisPoints,
          min: input.min,
          max: input.max,
        }),
      );
      break;
    }
  }
  return factFromCandidates({ candidates, sourceId: input.sourceId });
}

function regulatoryRequirementFromContext(input: {
  excerpt: string;
  sourceId: string;
}): DivLabBankCapitalFact {
  const direct = extractFact({
    excerpt: input.excerpt,
    sourceId: input.sourceId,
    labels: REQUIREMENT_LABELS,
    allowBasisPoints: false,
    min: 0,
    max: 40,
  });
  if (direct.status !== "not_found") return direct;

  // Some issuer prose first names the CET1 ratio and later in the same sentence
  // says `the regulatory requirement was X%`. Accept that only when CET1 and
  // regulatory requirement are both explicit on the same line. A management
  // target or generic Pillar 2 requirement is deliberately not treated as the
  // total CET1 regulatory requirement.
  const candidates: Candidate[] = [];
  const cet1Context = /\b(?:CET\s*1|common\s+equity\s+tier\s*1)\b/iu;
  const genericRequirement = /\bregulatory\s+requirement\b/iu;
  for (const line of input.excerpt.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)) {
    if (!cet1Context.test(line) || !genericRequirement.test(line)) continue;
    candidates.push(
      ...valuesAfterLabel({
        line,
        label: genericRequirement,
        allowBasisPoints: false,
        min: 0,
        max: 40,
      }),
    );
  }
  return factFromCandidates({ candidates, sourceId: input.sourceId });
}

/**
 * Build source-bound bank capital context without scoring adequacy.
 *
 * `regulatoryCet1Requirement` only accepts explicit regulatory-requirement
 * language. Management CET1 targets are intentionally excluded. A reported
 * capital buffer is retained separately from a mathematically derived headroom
 * so differently defined issuer metrics are never silently merged.
 */
export function buildBankCapitalContext(input: {
  evidence: readonly AnalysisEvidence[];
  reportMetrics: DivLabBankReportMetrics;
}): DivLabBankCapitalContext {
  const report = input.evidence.find(
    (item) =>
      item.primary &&
      item.documentRetrieved &&
      item.kind === "official_report_excerpt" &&
      Boolean(item.documentExcerpt?.trim()),
  );
  if (!report?.documentExcerpt?.trim()) {
    const empty: DivLabBankCapitalFact = {
      status: "not_found",
      valuePctPoints: null,
      rawToken: null,
      context: null,
      sourceId: null,
    };
    return {
      version: DIVLAB_BANK_CAPITAL_VERSION,
      status: "not_applicable",
      sourceId: null,
      actualCet1Pct: null,
      regulatoryCet1Requirement: empty,
      reportedCapitalBuffer: { ...empty },
      derivedHeadroomPctPoints: null,
      notes: ["Ingen ren primärrapporttext finns för bankens kapitalanalys."],
    };
  }

  const actualCet1Pct =
    input.reportMetrics.metrics.cet1Ratio.status === "confirmed"
      ? input.reportMetrics.metrics.cet1Ratio.valuePct
      : null;
  const regulatoryCet1Requirement = regulatoryRequirementFromContext({
    excerpt: report.documentExcerpt,
    sourceId: report.sourceId,
  });
  const reportedCapitalBuffer = extractFact({
    excerpt: report.documentExcerpt,
    sourceId: report.sourceId,
    labels: CAPITAL_BUFFER_LABELS,
    allowBasisPoints: true,
    min: -20,
    max: 30,
  });

  const requirement = regulatoryCet1Requirement.valuePctPoints;
  const derivedHeadroomPctPoints =
    actualCet1Pct !== null &&
    requirement !== null &&
    Number.isFinite(actualCet1Pct) &&
    Number.isFinite(requirement)
      ? Math.round((actualCet1Pct - requirement) * 10_000) / 10_000
      : null;
  const hasCapitalReference =
    regulatoryCet1Requirement.status === "confirmed" ||
    reportedCapitalBuffer.status === "confirmed";
  const ambiguous =
    regulatoryCet1Requirement.status === "ambiguous" ||
    reportedCapitalBuffer.status === "ambiguous";

  return {
    version: DIVLAB_BANK_CAPITAL_VERSION,
    status:
      actualCet1Pct !== null && hasCapitalReference
        ? "evidence_ready"
        : actualCet1Pct !== null || hasCapitalReference || ambiguous
          ? "partial"
          : "insufficient",
    sourceId: report.sourceId,
    actualCet1Pct,
    regulatoryCet1Requirement,
    reportedCapitalBuffer,
    derivedHeadroomPctPoints,
    notes: [
      "Kapitalmåtten är rapportfakta och aritmetik, inte en adequacy-score. Managementmål, regulatoriskt krav och rapporterad kapitalbuffert hålls separata.",
    ],
  };
}
