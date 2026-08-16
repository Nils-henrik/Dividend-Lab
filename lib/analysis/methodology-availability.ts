import type { DivLabCompanyType } from "./company-classification";
import type { FundamentalMethodologyStatus } from "./fundamental-methodology";

export type DivLabMethodologyAvailability = {
  status: FundamentalMethodologyStatus;
  companyType: DivLabCompanyType;
};

function specializedMessage(companyType: DivLabCompanyType): string {
  switch (companyType) {
    case "bank":
      return "Bolaget är en bank. DivLabs bankmetodik är specialiserad och är ännu inte kopplad till den här publiceringsmotorn.";
    case "insurance":
      return "Bolaget är ett försäkringsbolag och kräver en separat solvens- och försäkringsmetodik innan analysen kan publiceras.";
    case "real_estate":
      return "Bolaget är ett fastighetsbolag och kräver en separat fastighetsmetodik med bland annat LTV, räntetäckning och NAV innan analysen kan publiceras.";
    case "financial_other":
      return "Bolaget klassas som finans-/investmentbolag och kräver en separat substans-/NAV- och kapitalmetodik innan analysen kan publiceras.";
    default:
      return "Bolagstypen kräver en separat fundamental metodik innan analysen kan publiceras.";
  }
}

export function methodologyAvailabilityMessage(
  input: DivLabMethodologyAvailability,
): string {
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
