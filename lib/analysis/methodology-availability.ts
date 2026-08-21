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
      return "Bolaget är ett försäkringsbolag och kräver en separat försäkringsmetodik med solvensmått innan analysen kan publiceras.";
    case "real_estate":
      return "Bolaget är ett fastighetsbolag och kräver en separat fastighetsmetodik med bland annat LTV, räntetäckning och NAV innan analysen kan publiceras.";
    case "financial_other":
      return "Finansbolag kan omfatta exempelvis investmentbolag där NAV/substansvärde är centralt. DivLab måste verifiera rätt specialistmetodik innan analysen kan publiceras och startar ingen analys genom en generisk bolagsmodell.";
    case "bank":
      return "Bolaget är en bank och kräver DivLabs verifierade bankmetodik med CET1, kreditkvalitet, funding, ROE och P/B innan analysen kan publiceras.";
    case "investment_company":
      return "Bolaget är ett investmentbolag och kräver specialistmetodik baserad på NAV/substansvärde, portfölj och rabatt/premie innan analysen kan publiceras.";
    case "asset_manager":
      return "Bolaget är en kapitalförvaltare och kräver specialistmetodik baserad på AUM, fee-generating AUM, avgiftsintjäning och relevant värderingsbas innan analysen kan publiceras.";
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
