import type { DivLabCompanyType } from "./company-classification";

export type DivLabAnalysisEngine =
  | "operating_company"
  | "bank"
  | "financial_specialist";

export function analysisEngineForCompanyType(
  companyType: DivLabCompanyType,
): DivLabAnalysisEngine | null {
  switch (companyType) {
    case "operating_company":
      return "operating_company";
    case "bank":
      return "bank";
    case "investment_company":
    case "asset_manager":
      return "financial_specialist";
    default:
      return null;
  }
}

export function analysisEngineLabel(engine: DivLabAnalysisEngine): string {
  if (engine === "bank") return "Bankmetodik";
  if (engine === "financial_specialist") return "Finansiell specialistmetodik";
  return "Bolagsmetodik";
}
