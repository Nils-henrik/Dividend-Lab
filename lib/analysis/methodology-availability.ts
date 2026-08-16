import type { DivLabAnalysisEngine } from "./analysis-engine-dispatch";
import type { DivLabCompanyType } from "./company-classification";
import type { FundamentalMethodologyStatus } from "./fundamental-methodology";

export type DivLabMethodologyAvailability = {
  status: FundamentalMethodologyStatus;
  companyType: DivLabCompanyType;
  analysisEngine?: DivLabAnalysisEngine | null;
};

function engineReadyMessage(engine: DivLabAnalysisEngine): string {
  if (engine === "bank") {
    return "Bankmetodiken är verifierad. Analysen använder CET1, kreditkvalitet, funding, ROE och P/B i stället för vanlig bolags-FCF.";
  }
  if (engine === "financial_specialist") {
    return "Specialistmetodiken är verifierad. Investmentbolag analyseras mot substansvärde/NAV och kapitalförvaltare mot AUM, fee-generating AUM och relevant värderingsbas.";
  }
  return "Bolagsmetodiken är verifierad. Deep Research kan startas.";
}

function specializedMessage(companyType: DivLabCompanyType): string {
  switch (companyType) {
    case "insurance":
      return "Bolaget är ett försäkringsbolag och kräver en separat solvens- och försäkringsmetodik innan analysen kan publiceras.";
    case "real_estate":
      return "Bolaget är ett fastighetsbolag och kräver en separat fastighetsmetodik med bland annat LTV, räntetäckning och NAV innan analysen kan publiceras.";
    case "financial_other":
      return "Finansbolagets exakta metodik kan inte verifieras säkert ännu. DivLab startar ingen analys förrän rätt specialistmotor har identifierats.";
    case "bank":
    case "investment_company":
    case "asset_manager":
      return "Specialistmotorn är inte tillgänglig i den här körningen.";
    default:
      return "Bolagstypen kräver en separat fundamental metodik innan analysen kan publiceras.";
  }
}

export function methodologyAvailabilityMessage(input: DivLabMethodologyAvailability): string {
  if (input.analysisEngine) return engineReadyMessage(input.analysisEngine);
  switch (input.status) {
    case "supported":
      return "Bolagsmetodiken är verifierad. Deep Research kan startas.";
    case "specialized_required":
      return specializedMessage(input.companyType);
    case "unsupported_instrument":
      return "Instrumenttypen stöds inte av DivLabs nuvarande bolagsanalysmetodik.";
    case "classification_required":
      return "Bolagstypen kunde inte verifieras tillräckligt säkert för att välja rätt fundamental metodik. Ingen analys startas förrän klassificeringen är verifierad.";
  }
}
