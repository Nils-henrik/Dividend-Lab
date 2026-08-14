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
    freshPrimarySource: boolean;
    sourceTraceability: boolean;
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
}): AnalysisQualityGate {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const fundamentalCoverage =
    input.fundamental.scorecard.coverage >= 0.6 &&
    input.fundamental.unknowns.length <= 4;
  if (!fundamentalCoverage) {
    blockers.push("Fundamental täckning är för låg för en publicerbar DivLab Analys.");
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

  const scenarioNames = new Set(input.valuation.scenarios.map((scenario) => scenario.name));
  const base = input.valuation.scenarios.find((scenario) => scenario.name === "base");
  const valuationScenarioCoverage =
    scenarioNames.has("bear") &&
    scenarioNames.has("base") &&
    scenarioNames.has("bull") &&
    base?.valuePerShare !== null &&
    Boolean(base?.assumptions.length);
  if (!valuationScenarioCoverage) {
    blockers.push("Bear/Base/Bull-värderingen är inte komplett eller saknar explicita antaganden.");
  }

  const technicalHistoryCoverage = input.technicalSessions >= 120;
  if (!technicalHistoryCoverage) {
    blockers.push("Teknisk historik är för kort för en publicerbar analys av trend, stöd och motstånd.");
  }

  const technicalLevelCoverage =
    input.levels.supports.length > 0 && input.levels.resistances.length > 0;
  if (!technicalLevelCoverage) {
    blockers.push("Både ett robust stödområde och ett robust motståndsområde krävs för publicering.");
  }

  if (input.fundamental.unknowns.length > 0) {
    warnings.push(
      `${input.fundamental.unknowns.length} fundamentala datapunkter är uttryckligen markerade som okända.`,
    );
  }

  const checks = {
    fundamentalCoverage,
    freshPrimarySource,
    sourceTraceability,
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
