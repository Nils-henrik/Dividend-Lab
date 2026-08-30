import type { DivLabResearchPacket } from "./deep-research";
import type { DivLabFinancialSpecialistResearch } from "./financial-specialist-research";
import type { DivLabFinancialSpecialistScenarioSet } from "./financial-specialist-scenarios";

export const DIVLAB_FINANCIAL_SPECIALIST_RESEARCH_QUALITY_GATE_VERSION =
  "financial-specialist-research-quality-v1" as const;

export type DivLabFinancialSpecialistResearchQualityGate = {
  version: typeof DIVLAB_FINANCIAL_SPECIALIST_RESEARCH_QUALITY_GATE_VERSION;
  publishable: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  checks: {
    specialistClassification: boolean;
    specialistResearchReady: boolean;
    primaryEvidenceCoverage: boolean;
    sourceTraceability: boolean;
    valuationBasisCoverage: boolean;
    technicalHistoryCoverage: boolean;
    technicalLevelCoverage: boolean;
    scenarioCoverage: boolean;
    scenarioSourceCoverage: boolean;
  };
};

export function evaluateFinancialSpecialistResearchQuality(input: {
  basePacket: DivLabResearchPacket;
  research: DivLabFinancialSpecialistResearch;
  scenarios: DivLabFinancialSpecialistScenarioSet;
}): DivLabFinancialSpecialistResearchQualityGate {
  const blockers: string[] = [];
  const warnings: string[] = [...input.research.warnings];
  const knownSources = new Set(input.basePacket.sources.map((source) => source.id));

  const specialistClassification =
    input.basePacket.companyClassification.type === input.research.specialistType &&
    input.basePacket.companyClassification.confidence === "high" &&
    input.basePacket.companyClassification.sourceIds.length > 0 &&
    input.basePacket.companyClassification.sourceIds.every((id) => knownSources.has(id));
  if (!specialistClassification) blockers.push("Specialistbolagets klassificering är inte fullt verifierad.");

  const specialistResearchReady = input.research.status === "research_ready";
  if (!specialistResearchReady) {
    blockers.push(
      input.research.specialistType === "investment_company"
        ? "Substansvärde och substansrabatt/premie måste kunna verifieras från primärkälla."
        : "AUM, fee-generating AUM och spårbar värderingsbas måste kunna verifieras för kapitalförvaltaren.",
    );
  }

  const primaryEvidenceCoverage = input.basePacket.evidence.some(
    (item) =>
      item.primary &&
      item.documentRetrieved &&
      item.kind === "official_report_excerpt" &&
      item.content.trim().length >= 200 &&
      knownSources.has(item.sourceId),
  );
  if (!primaryEvidenceCoverage) blockers.push("Verifierat primärt rapportunderlag saknas för specialistanalysen.");

  const sourceTraceability =
    input.basePacket.sources.length >= 2 &&
    input.basePacket.sources.every(
      (source) => source.id.trim() && source.publisher.trim() && source.url.trim(),
    );
  if (!sourceTraceability) blockers.push("Specialistanalysen saknar full källspårbarhet.");

  const valuationBasisCoverage = input.research.specialistType === "investment_company"
    ? input.research.metrics.navPerShare.status === "confirmed" &&
      input.research.metrics.discountToNavPct.status === "confirmed"
    : input.research.metrics.totalAumEurBn.status === "confirmed" &&
      input.research.metrics.feeGeneratingAumEurBn.status === "confirmed" &&
      input.research.metrics.trailingPe.status === "confirmed";
  if (!valuationBasisCoverage) blockers.push("Specialistvärderingens deterministiska bas är ofullständig.");

  const technicalHistoryCoverage = input.basePacket.technical.snapshot.sessions >= 120;
  if (!technicalHistoryCoverage) blockers.push("Teknisk historik är för kort för specialistanalysen.");

  const levels = input.basePacket.technical.levels;
  const technicalLevelCoverage =
    levels.supports.length > 0 &&
    (levels.resistances.length > 0 || levels.resistanceState === "no_validated_resistance_above");
  if (!technicalLevelCoverage) blockers.push("Verifierade stöd- och motståndsområden saknas.");

  const scenarioCoverage =
    input.scenarios.scenarios.length === 3 &&
    input.scenarios.scenarios.every((scenario) =>
      typeof scenario.valuePerShare === "number" &&
      Number.isFinite(scenario.valuePerShare) &&
      scenario.valuePerShare > 0 &&
      scenario.assumptions.length >= 2,
    ) &&
    input.scenarios.scenarios[0]!.valuePerShare! <= input.scenarios.scenarios[1]!.valuePerShare! &&
    input.scenarios.scenarios[1]!.valuePerShare! <= input.scenarios.scenarios[2]!.valuePerShare!;
  if (!scenarioCoverage) blockers.push("Bear/Base/Bull-scenarierna är inte kompletta och logiskt ordnade.");

  const scenarioSourceCoverage = input.scenarios.scenarios.every(
    (scenario) => scenario.sourceIds.length > 0 && scenario.sourceIds.every((id) => knownSources.has(id)),
  );
  if (!scenarioSourceCoverage) blockers.push("Ett eller flera specialistscenarier saknar spårbara källor.");

  const checks = {
    specialistClassification,
    specialistResearchReady,
    primaryEvidenceCoverage,
    sourceTraceability,
    valuationBasisCoverage,
    technicalHistoryCoverage,
    technicalLevelCoverage,
    scenarioCoverage,
    scenarioSourceCoverage,
  };
  const values = Object.values(checks);
  const score = Math.round((values.filter(Boolean).length / values.length) * 100);
  return {
    version: DIVLAB_FINANCIAL_SPECIALIST_RESEARCH_QUALITY_GATE_VERSION,
    publishable: blockers.length === 0 && score === 100,
    score,
    blockers,
    warnings,
    checks,
  };
}
