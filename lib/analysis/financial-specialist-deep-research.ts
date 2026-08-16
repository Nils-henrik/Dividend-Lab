import type { DivLabResearchPacket } from "./deep-research";
import type { DivLabFinancialSpecialistResearch } from "./financial-specialist-research";
import {
  evaluateFinancialSpecialistResearchQuality,
  type DivLabFinancialSpecialistResearchQualityGate,
} from "./financial-specialist-research-quality-gate";
import type { DivLabFinancialSpecialistScenarioSet } from "./financial-specialist-scenarios";

export const DIVLAB_FINANCIAL_SPECIALIST_DEEP_RESEARCH_VERSION =
  "deep-research-v3-financial-specialist" as const;

export type DivLabFinancialSpecialistResearchPacket = Omit<
  DivLabResearchPacket,
  "version" | "qualityGate" | "valuation"
> & {
  version: typeof DIVLAB_FINANCIAL_SPECIALIST_DEEP_RESEARCH_VERSION;
  baseResearchQualityGate: DivLabResearchPacket["qualityGate"];
  specialistResearch: DivLabFinancialSpecialistResearch;
  specialistScenarios: DivLabFinancialSpecialistScenarioSet;
  /** Generic corporate valuation is retained only as audit context. */
  valuation: DivLabResearchPacket["valuation"];
  qualityGate: DivLabFinancialSpecialistResearchQualityGate;
};

export function buildDivLabFinancialSpecialistResearchPacket(input: {
  basePacket: DivLabResearchPacket;
  research: DivLabFinancialSpecialistResearch;
  scenarios: DivLabFinancialSpecialistScenarioSet;
}): DivLabFinancialSpecialistResearchPacket {
  if (
    input.basePacket.companyClassification.type !== "investment_company" &&
    input.basePacket.companyClassification.type !== "asset_manager"
  ) {
    throw new Error("financial_specialist_packet_requires_supported_classification");
  }
  if (input.basePacket.companyClassification.type !== input.research.specialistType) {
    throw new Error("financial_specialist_packet_type_mismatch");
  }
  const qualityGate = evaluateFinancialSpecialistResearchQuality({
    basePacket: input.basePacket,
    research: input.research,
    scenarios: input.scenarios,
  });
  return {
    ...input.basePacket,
    version: DIVLAB_FINANCIAL_SPECIALIST_DEEP_RESEARCH_VERSION,
    baseResearchQualityGate: {
      ...input.basePacket.qualityGate,
      blockers: [...input.basePacket.qualityGate.blockers],
      warnings: [...input.basePacket.qualityGate.warnings],
      checks: { ...input.basePacket.qualityGate.checks },
    },
    specialistResearch: input.research,
    specialistScenarios: input.scenarios,
    qualityGate,
  };
}
