import type { AnalysisSource } from "@/lib/analysis/quality-gate";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import {
  DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH,
  type DivBrainSource,
  type DivBrainSourceCategory,
  type DivBrainSourceFreshnessState,
  type DivBrainSourceVerificationState,
  validateDivBrainSource,
} from "../../sources";
import type { DivBrainApprovedAnalysisRecord } from "./types";

const MAX_UNDERLYING_SOURCES = 6;

function iso(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function freshness(value: string | null | undefined, now: Date): DivBrainSourceFreshnessState {
  const date = value ? new Date(value) : null;
  if (!date || !Number.isFinite(date.getTime())) return "unknown";
  const ageHours = Math.max(0, (now.getTime() - date.getTime()) / 3_600_000);
  if (ageHours <= 72) return "current";
  if (ageHours <= 24 * 14) return "dated";
  return "stale";
}

function viewSv(view: DivBrainApprovedAnalysisRecord["analystDraft"]["view"]): string {
  if (view === "positive") return "Positiv";
  if (view === "negative") return "Negativ";
  return "Neutral";
}

function riskSv(risk: DivBrainApprovedAnalysisRecord["analystDraft"]["riskLevel"]): string {
  if (risk === "low") return "Låg";
  if (risk === "high") return "Hög";
  return "Medel";
}

function boundedExcerpt(parts: readonly string[]): string {
  const text = parts.map((part) => part.trim()).filter(Boolean).join("\n");
  if (text.length <= DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH) return text;
  const limit = DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH - 1;
  const slice = text.slice(0, limit);
  const boundary = slice.lastIndexOf(" ");
  return `${slice.slice(0, boundary > limit * 0.75 ? boundary : limit).trimEnd()}…`;
}

function zoneText(
  label: string,
  zone: { lower: number; upper: number } | null,
  currency: string,
): string | null {
  if (!zone) return null;
  return `${label}: ${zone.lower.toLocaleString("sv-SE")}–${zone.upper.toLocaleString("sv-SE")} ${currency}.`;
}

function buildAnalysisExcerpt(record: DivBrainApprovedAnalysisRecord): string {
  const draft = record.analystDraft;
  const base = record.researchSummary.baseScenarioValue;
  const basePct = record.researchSummary.baseScenarioUpsideDownsidePct;
  const support = zoneText("Närmaste stöd", record.researchSummary.nearestSupport, record.currency);
  const resistance = zoneText(
    "Närmaste motstånd",
    record.researchSummary.nearestResistance,
    record.currency,
  );
  const scenarios =
    base !== null
      ? `Basscenario: ${base.toLocaleString("sv-SE")} ${record.currency}${
          basePct !== null ? ` (${basePct >= 0 ? "+" : ""}${basePct.toFixed(1)} % mot analyskursen)` : ""
        }.`
      : "";
  const catalysts = draft.catalysts.slice(0, 2).map((item) => item.text).join("; ");
  const risks = draft.risks.slice(0, 3).map((item) => item.text).join("; ");
  const thesisBreakers = draft.thesisBreakers.slice(0, 2).map((item) => item.text).join("; ");

  return boundedExcerpt([
    `DivLab-syn: ${viewSv(draft.view)}. Risk: ${riskSv(draft.riskLevel)}. Confidence: ${draft.confidence}. Tidshorisont: ${draft.horizonMonths.min}–${draft.horizonMonths.max} månader.`,
    draft.executiveSummary,
    scenarios,
    support ?? "",
    resistance ??
      (record.researchSummary.resistanceState === "no_validated_resistance_above"
        ? "Inget verifierat historiskt motstånd ovanför aktuell kurszon."
        : ""),
    catalysts ? `Katalysatorer: ${catalysts}` : "",
    risks ? `Risker: ${risks}` : "",
    thesisBreakers ? `Tesbrott: ${thesisBreakers}` : "",
  ]);
}

function sourceCategory(source: AnalysisSource): DivBrainSourceCategory {
  if (source.kind === "quarterly_report" || source.kind === "annual_report") {
    return "official_company_report";
  }
  if (source.kind === "company_release") return "exchange";
  if (
    source.kind === "market_data" ||
    source.kind === "fundamental_data" ||
    source.kind === "fx_data"
  ) {
    return "market_data_provider";
  }
  return "external_unverified";
}

function sourceVerification(source: AnalysisSource): DivBrainSourceVerificationState {
  if (source.primary) return "verified";
  if (
    source.kind === "market_data" ||
    source.kind === "fundamental_data" ||
    source.kind === "fx_data"
  ) {
    return "internally_curated";
  }
  return "unverified";
}

function sourcePriority(source: AnalysisSource): number {
  if (source.primary) return 0;
  if (source.kind === "market_data") return 1;
  if (source.kind === "fundamental_data") return 2;
  if (source.kind === "fx_data") return 3;
  if (source.kind === "company_release") return 4;
  if (source.kind === "news") return 5;
  return 6;
}

function underlyingToDivBrainSource(
  source: AnalysisSource,
  now: Date,
): DivBrainResult<DivBrainSource> {
  return validateDivBrainSource({
    id: `analysis-src:${source.id}`,
    title: `${source.publisher}: ${source.kind.replaceAll("_", " ")}`,
    category: sourceCategory(source),
    verificationState: sourceVerification(source),
    freshnessState: freshness(source.publishedAt, now),
    publisher: source.publisher,
    canonicalUrl: source.url,
    publishedAt: iso(source.publishedAt),
    retrievedAt: now.toISOString(),
    dataAsOf: iso(source.verifiedAt),
    attribution: `Underlag till DivLab Analys ${source.id}`,
    recordRef: source.id.length <= 120 && !source.id.includes(":") ? source.id : undefined,
  });
}

export function buildDivBrainSourcesFromApprovedAnalysis(input: {
  record: DivBrainApprovedAnalysisRecord;
  now?: Date;
}): DivBrainResult<DivBrainSource[]> {
  const now = input.now ?? new Date();
  if (!Number.isFinite(now.getTime())) return divBrainFailureFromCode("invalid_request");
  const record = input.record;
  const mainResult = validateDivBrainSource({
    id: `divlab-analysis:${record.analysisVersionId}`,
    title: `DivLab Analys: ${record.name} (${record.symbol})`,
    category: "internal_structured_data",
    verificationState: "internally_curated",
    freshnessState: freshness(record.dataAsOf, now),
    publisher: "DivLab",
    publishedAt: record.publishedAt ? iso(record.publishedAt) : undefined,
    retrievedAt: now.toISOString(),
    dataAsOf: iso(record.dataAsOf),
    attribution: `DivLab Analys v${record.versionNumber} · ${record.engineVersion}`,
    excerpt: buildAnalysisExcerpt(record),
    recordRef: record.analysisVersionId,
  });
  if (!mainResult.ok) return mainResult;

  const selectedSources = [...record.sources]
    .sort(
      (a, b) =>
        sourcePriority(a) - sourcePriority(b) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, MAX_UNDERLYING_SOURCES);
  const sources: DivBrainSource[] = [mainResult.data];
  for (const source of selectedSources) {
    const mapped = underlyingToDivBrainSource(source, now);
    if (!mapped.ok) return mapped;
    sources.push(mapped.data);
  }
  return divBrainSuccess(sources);
}
