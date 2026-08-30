import type { DivLabResearchPacket } from "./deep-research";
import type { DivLabBankResearch } from "./bank-research";
import {
  evaluateBankResearchQuality,
  type DivLabBankResearchQualityGate,
} from "./bank-research-quality-gate";
import type { DivLabBankScenarioSet } from "./bank-scenarios";

export const DIVLAB_BANK_DEEP_RESEARCH_VERSION = "deep-research-v3-bank" as const;

export type DivLabBankResearchPacket = Omit<
  DivLabResearchPacket,
  "version" | "qualityGate"
> & {
  version: typeof DIVLAB_BANK_DEEP_RESEARCH_VERSION;
  /** The generic v2 gate is retained for audit; its specialized-methodology blockers are not rewritten. */
  baseResearchQualityGate: DivLabResearchPacket["qualityGate"];
  bankResearch: DivLabBankResearch;
  bankScenarios: DivLabBankScenarioSet;
  qualityGate: DivLabBankResearchQualityGate;
};

/**
 * Promote an immutable v2 facts packet into a separately versioned bank packet.
 * Generic v2 quality history is preserved verbatim and never rewritten to make
 * the bank look publishable. Bank publication is decided by the independent
 * bank-research-quality-v1 gate.
 */
export function buildDivLabBankResearchPacket(input: {
  now: Date;
  basePacket: DivLabResearchPacket;
  bankResearch: DivLabBankResearch;
  bankScenarios: DivLabBankScenarioSet;
}): DivLabBankResearchPacket {
  if (input.basePacket.companyClassification.type !== "bank") {
    throw new Error("bank_research_packet_requires_bank_classification");
  }
  if (!Number.isFinite(input.now.getTime())) {
    throw new Error("bank_research_packet_now_invalid");
  }
  if (input.bankScenarios.currency !== input.basePacket.instrument.currency) {
    throw new Error("bank_research_packet_scenario_currency_mismatch");
  }

  const qualityGate = evaluateBankResearchQuality({
    now: input.now,
    basePacket: input.basePacket,
    bankResearch: input.bankResearch,
    bankScenarios: input.bankScenarios,
  });

  return {
    ...input.basePacket,
    version: DIVLAB_BANK_DEEP_RESEARCH_VERSION,
    baseResearchQualityGate: {
      ...input.basePacket.qualityGate,
      blockers: [...input.basePacket.qualityGate.blockers],
      warnings: [...input.basePacket.qualityGate.warnings],
      checks: { ...input.basePacket.qualityGate.checks },
    },
    bankResearch: input.bankResearch,
    bankScenarios: input.bankScenarios,
    qualityGate,
  };
}
