import type { DivLabBankResearch } from "./bank-research";
import type { DivLabBankScenarioSet } from "./bank-scenarios";
import type { DivLabResearchPacket } from "./deep-research";

export const DIVLAB_BANK_RESEARCH_QUALITY_GATE_VERSION =
  "bank-research-quality-v1" as const;

export type DivLabBankResearchQualityGate = {
  version: typeof DIVLAB_BANK_RESEARCH_QUALITY_GATE_VERSION;
  publishable: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  checks: {
    bankClassificationCoverage: boolean;
    historicalAccountingCoverage: boolean;
    freshPrimarySource: boolean;
    sourceTraceability: boolean;
    primaryEvidenceCoverage: boolean;
    bankResearchReady: boolean;
    bankValuationTraceability: boolean;
    bankScenarioCoverage: boolean;
    technicalHistoryCoverage: boolean;
    technicalLevelCoverage: boolean;
  };
};

function validDate(value: string): Date | null {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function daysBetween(later: Date, earlier: Date): number {
  return (later.getTime() - earlier.getTime()) / 86_400_000;
}

function historicalAccountingCoverage(packet: DivLabResearchPacket): boolean {
  const periods = (packet.fundamentalSnapshot.historicalPeriods ?? [])
    .filter((period) => validDate(period.period))
    .sort((a, b) => validDate(a.period)!.getTime() - validDate(b.period)!.getTime());
  if (periods.length < 3) return false;
  const first = validDate(periods[0]!.period)!;
  const last = validDate(periods.at(-1)!.period)!;
  const years = (last.getTime() - first.getTime()) / (365.25 * 86_400_000);
  const periodsWithOwnerEconomics = periods.filter(
    (period) =>
      (typeof period.eps === "number" && Number.isFinite(period.eps)) ||
      (typeof period.netIncome === "number" && Number.isFinite(period.netIncome)),
  ).length;
  return years >= 1.5 && periodsWithOwnerEconomics >= 3;
}

export function evaluateBankResearchQuality(input: {
  now: Date;
  basePacket: DivLabResearchPacket;
  bankResearch: DivLabBankResearch;
  bankScenarios: DivLabBankScenarioSet;
}): DivLabBankResearchQualityGate {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const packet = input.basePacket;
  const knownSourceIds = new Set(packet.sources.map((source) => source.id));

  const bankClassificationCoverage =
    packet.companyClassification.type === "bank" &&
    packet.companyClassification.confidence !== "low" &&
    packet.companyClassification.sourceIds.length > 0 &&
    packet.companyClassification.sourceIds.every((sourceId) => knownSourceIds.has(sourceId));
  if (!bankClassificationCoverage) {
    blockers.push("Bankklassificeringen saknar tillräckligt verifierad och källspårbar grund.");
  }

  const multiYearAccountingCoverage = historicalAccountingCoverage(packet);
  if (!multiYearAccountingCoverage) {
    blockers.push(
      "Bankspecialiserad analys kräver minst tre jämförbara historiska redovisningsperioder med ägarekonomiska data över minst 1,5 år.",
    );
  }

  const traceableSources = packet.sources.filter(
    (source) =>
      source.id.trim() &&
      source.publisher.trim() &&
      source.url.trim() &&
      validDate(source.publishedAt) &&
      validDate(source.verifiedAt),
  );
  const sourceTraceability =
    traceableSources.length >= 3 && traceableSources.length === packet.sources.length;
  if (!sourceTraceability) {
    blockers.push("Bankanalysen saknar minst tre fullt spårbara källor.");
  }

  const primarySources = traceableSources.filter((source) => source.primary);
  const freshPrimarySource = primarySources.some((source) => {
    const publishedAt = validDate(source.publishedAt);
    if (!publishedAt) return false;
    const ageDays = daysBetween(input.now, publishedAt);
    return ageDays >= -1 && ageDays <= 160;
  });
  if (!freshPrimarySource) {
    blockers.push("Ingen tillräckligt färsk primär banksource finns i analysunderlaget.");
  }

  const primaryIds = new Set(primarySources.map((source) => source.id));
  const primaryEvidenceCoverage = packet.evidence.some(
    (item) =>
      item.kind === "official_report_excerpt" &&
      item.primary &&
      item.documentRetrieved &&
      primaryIds.has(item.sourceId) &&
      item.content.trim().length >= 200 &&
      Boolean(validDate(item.publishedAt)),
  );
  if (!primaryEvidenceCoverage) {
    blockers.push("Bankanalysen saknar ett verifierat rapportutdrag från en primärkälla.");
  }

  const bankResearchReady = input.bankResearch.status === "research_ready";
  if (!bankResearchReady) {
    blockers.push("Bankspecifik research har inte klarat research-readiness-grinden.");
  }

  const bankValuationTraceability =
    input.bankResearch.valuation.status === "traceable" &&
    input.bankResearch.valuation.provenance.traceable;
  if (!bankValuationTraceability) {
    blockers.push("Bankspecifik P/B-värdering saknar full marknads-, fundamental- eller FX-proveniens.");
  }

  const names = ["bear", "base", "bull"] as const;
  const scenarios = names.map((name) =>
    input.bankScenarios.scenarios.find((scenario) => scenario.name === name),
  );
  const [bear, base, bull] = scenarios;
  const bankScenarioCoverage =
    scenarios.every(
      (scenario) =>
        Boolean(scenario) &&
        scenario!.valuePerShare !== null &&
        scenario!.priceToBookValue !== null &&
        scenario!.methodsUsed.includes("P/B") &&
        scenario!.assumptions.length >= 2 &&
        scenario!.currency === packet.instrument.currency,
    ) &&
    bear!.valuePerShare! < base!.valuePerShare! &&
    base!.valuePerShare! < bull!.valuePerShare!;
  if (!bankScenarioCoverage) {
    blockers.push(
      "Bear/Base/Bull måste vara kompletta, använda P/B som ankare, matcha aktiens valuta och ge strikt ordnade värden.",
    );
  }

  const technicalHistoryCoverage = packet.qualityGate.checks.technicalHistoryCoverage;
  if (!technicalHistoryCoverage) {
    blockers.push("Teknisk historik är för kort för en publicerbar bankanalys.");
  }

  const technicalLevelCoverage = packet.qualityGate.checks.technicalLevelCoverage;
  if (!technicalLevelCoverage) {
    blockers.push(
      "Bankanalysen kräver verifierat stöd samt verifierat motstånd eller verifierad avsaknad av motstånd ovanför kursen.",
    );
  }

  if (input.bankResearch.capital.regulatoryCet1Requirement.status !== "confirmed") {
    warnings.push(
      "Regulatoriskt CET1-krav är inte uttryckligen verifierat; rapporterad buffert får inte tolkas som regulatoriskt headroom.",
    );
  }
  if (input.bankResearch.funding.metrics.liquidityCoverageRatio.status !== "confirmed") {
    warnings.push("LCR är inte uttryckligen verifierad i bankens researchunderlag.");
  }
  if (input.bankResearch.funding.metrics.netStableFundingRatio.status !== "confirmed") {
    warnings.push("NSFR är inte uttryckligen verifierad i bankens researchunderlag.");
  }

  const checks = {
    bankClassificationCoverage,
    historicalAccountingCoverage: multiYearAccountingCoverage,
    freshPrimarySource,
    sourceTraceability,
    primaryEvidenceCoverage,
    bankResearchReady,
    bankValuationTraceability,
    bankScenarioCoverage,
    technicalHistoryCoverage,
    technicalLevelCoverage,
  };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);

  return {
    version: DIVLAB_BANK_RESEARCH_QUALITY_GATE_VERSION,
    publishable: blockers.length === 0,
    score,
    blockers,
    warnings,
    checks,
  };
}
