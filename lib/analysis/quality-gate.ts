import type { AnalysisEvidence } from "./evidence";
import type { FundamentalAnalysis } from "./fundamental-analysis";
import type { SupportResistanceAnalysis } from "./support-resistance";
import type { ValuationAnalysis } from "./valuation";

export type AnalysisSource = {
  id: string;
  kind:
    | "quarterly_report"
    | "annual_report"
    | "company_release"
    | "market_data"
    | "fundamental_data"
    | "news"
    | "other";
  publisher: string;
  url: string;
  publishedAt: string;
  verifiedAt: string;
  primary: boolean;
};

export type AnalysisQualityGate = {
  publishable: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  checks: {
    fundamentalCoverage: boolean;
    multiYearFundamentalCoverage: boolean;
    freshPrimarySource: boolean;
    sourceTraceability: boolean;
    primaryEvidenceCoverage: boolean;
    valuationScenarioCoverage: boolean;
    technicalHistoryCoverage: boolean;
    technicalLevelCoverage: boolean;
  };
};

function validDate(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function daysBetween(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / 86_400_000;
}

export function evaluateAnalysisQuality(input: {
  now: Date;
  fundamental: FundamentalAnalysis;
  valuation: ValuationAnalysis;
  technicalSessions: number;
  levels: SupportResistanceAnalysis;
  sources: readonly AnalysisSource[];
  evidence: readonly AnalysisEvidence[];
}): AnalysisQualityGate {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const fundamentalCoverage =
    input.fundamental.scorecard.coverage >= 0.6 &&
    input.fundamental.unknowns.filter((item) => !item.startsWith("flerårig fundamental trend")).length <= 4;
  if (!fundamentalCoverage) {
    blockers.push("Fundamental täckning är för låg för en publicerbar DivLab Analys.");
  }

  const multiYearFundamentalCoverage =
    input.fundamental.trends.periodsAnalyzed >= 3 &&
    (input.fundamental.trends.yearsCovered ?? 0) >= 1.5 &&
    input.fundamental.trends.revenueCagr !== null;
  if (!multiYearFundamentalCoverage) {
    blockers.push("Minst tre jämförbara årsperioder krävs för publicerbar flerårig fundamental trendanalys.");
  }

  const traceableSources = input.sources.filter(
    (source) =>
      source.id.trim() &&
      source.publisher.trim() &&
      source.url.trim() &&
      validDate(source.publishedAt) &&
      validDate(source.verifiedAt),
  );
  const sourceTraceability =
    traceableSources.length >= 2 && traceableSources.length === input.sources.length;
  if (!sourceTraceability) {
    blockers.push("Analysen saknar tillräckligt många fullt spårbara källor.");
  }

  const primarySources = traceableSources.filter((source) => source.primary);
  const freshPrimarySource = primarySources.some((source) => {
    const publishedAt = validDate(source.publishedAt);
    if (!publishedAt) return false;
    const ageDays = daysBetween(input.now, publishedAt);
    return ageDays >= -1 && ageDays <= 160;
  });
  if (!freshPrimarySource) {
    blockers.push("Ingen tillräckligt färsk primärkälla finns i analysunderlaget.");
  }

  const primarySourceIds = new Set(primarySources.map((source) => source.id));
  const primaryEvidenceCoverage = input.evidence.some(
    (item) =>
      item.kind === "official_report_excerpt" &&
      item.primary &&
      item.documentRetrieved &&
      primarySourceIds.has(item.sourceId) &&
      item.content.trim().length >= 200 &&
      Boolean(validDate(item.publishedAt)),
  );
  if (!primaryEvidenceCoverage) {
    blockers.push(
      "Analysen saknar ett verifierat rapportutdrag som kan härledas direkt till en primärkälla.",
    );
  }

  const requiredScenarioNames = ["bear", "base", "bull"] as const;
  const requiredScenarios = requiredScenarioNames.map((name) =>
    input.valuation.scenarios.find((scenario) => scenario.name === name),
  );
  const valuationScenarioCoverage = requiredScenarios.every(
    (scenario) =>
      Boolean(scenario) &&
      scenario!.valuePerShare !== null &&
      scenario!.assumptions.length > 0 &&
      scenario!.currencyCompatible &&
      !scenario!.currencyAssumed,
  );
  if (!valuationScenarioCoverage) {
    blockers.push(
      "Bear/Base/Bull-värderingen måste vara komplett med explicita antaganden och verifierad valuta som matchar börskursen.",
    );
  }

  const technicalHistoryCoverage = input.technicalSessions >= 120;
  if (!technicalHistoryCoverage) {
    blockers.push("Teknisk historik är för kort för en publicerbar analys av trend, stöd och motstånd.");
  }

  const resolvedResistance =
    input.levels.resistances.length > 0 ||
    input.levels.resistanceState === "no_validated_resistance_above";
  const technicalLevelCoverage =
    input.levels.supports.length > 0 && resolvedResistance;
  if (!technicalLevelCoverage) {
    blockers.push(
      "Ett robust stödområde och antingen verifierat motstånd eller verifierat avsaknad av historiskt motstånd ovanför kurszonen krävs för publicering.",
    );
  }

  if (input.fundamental.unknowns.length > 0) {
    warnings.push(
      `${input.fundamental.unknowns.length} fundamentala datapunkter är uttryckligen markerade som okända.`,
    );
  }
  if (!input.valuation.trailing.freeCashFlowCurrencyCompatible) {
    warnings.push(
      "Trailing P/FCF och FCF-yield har utelämnats eftersom kassaflödesvalutan inte är verifierat kompatibel med börskursens valuta.",
    );
  }
  if (input.levels.resistanceState === "no_validated_resistance_above") {
    warnings.push(
      "Inget verifierat historiskt motstånd finns ovanför aktuell kurszon i det analyserade prisfönstret; någon syntetisk motståndsnivå har inte skapats.",
    );
  }

  const checks = {
    fundamentalCoverage,
    multiYearFundamentalCoverage,
    freshPrimarySource,
    sourceTraceability,
    primaryEvidenceCoverage,
    valuationScenarioCoverage,
    technicalHistoryCoverage,
    technicalLevelCoverage,
  };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);

  return {
    publishable: blockers.length === 0,
    score,
    blockers,
    warnings,
    checks,
  };
}
