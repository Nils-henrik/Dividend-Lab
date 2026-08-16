import type { DivLabCompanyClassification, DivLabCompanyType } from "./company-classification";
import type { AnalysisSource } from "./quality-gate";

export type Omxs30SpecialMethodologyTarget = {
  yahooSymbol: string;
  companyType: Extract<DivLabCompanyType, "bank" | "investment_company" | "asset_manager">;
  companyName: string;
  publisher: string;
  officialUrl: string;
};

/**
 * Current OMXS30 special-methodology constituents that must not be routed
 * through the generic operating-company methodology. The list is deliberately
 * narrow and symbol-exact; ordinary operating companies remain provider-driven.
 *
 * Nasdaq confirmed no OMXS30 component changes for Dec-2025 and Jun-2026.
 */
export const OMXS30_SPECIAL_METHODOLOGY_TARGETS: readonly Omxs30SpecialMethodologyTarget[] = [
  {
    yahooSymbol: "NDA-SE.ST",
    companyType: "bank",
    companyName: "Nordea Bank Abp",
    publisher: "Nordea",
    officialUrl: "https://www.nordea.com/en/about-us",
  },
  {
    yahooSymbol: "SHB-A.ST",
    companyType: "bank",
    companyName: "Svenska Handelsbanken AB",
    publisher: "Handelsbanken",
    officialUrl: "https://www.handelsbanken.com/en/about-the-group",
  },
  {
    yahooSymbol: "SEB-A.ST",
    companyType: "bank",
    companyName: "Skandinaviska Enskilda Banken AB",
    publisher: "SEB",
    officialUrl: "https://sebgroup.com/about-us",
  },
  {
    yahooSymbol: "SWED-A.ST",
    companyType: "bank",
    companyName: "Swedbank AB",
    publisher: "Swedbank",
    officialUrl: "https://www.swedbank.com/about-swedbank.html",
  },
  {
    yahooSymbol: "INVE-B.ST",
    companyType: "investment_company",
    companyName: "Investor AB",
    publisher: "Investor AB",
    officialUrl: "https://www.investorab.com/about-investor",
  },
  {
    yahooSymbol: "INDU-C.ST",
    companyType: "investment_company",
    companyName: "Industrivärden AB",
    publisher: "Industrivärden",
    officialUrl: "https://www.industrivarden.se/verksamheten/industrivarden-i-korthet/",
  },
  {
    yahooSymbol: "EQT.ST",
    companyType: "asset_manager",
    companyName: "EQT AB",
    publisher: "EQT",
    officialUrl: "https://eqtgroup.com/about",
  },
] as const;

const BY_SYMBOL = new Map(
  OMXS30_SPECIAL_METHODOLOGY_TARGETS.map((target) => [target.yahooSymbol, target]),
);

export function getOmxs30SpecialMethodologyTarget(
  yahooSymbol: string,
): Omxs30SpecialMethodologyTarget | null {
  return BY_SYMBOL.get(yahooSymbol.trim().toUpperCase()) ?? null;
}

export function applyOmxs30SpecialClassification(input: {
  yahooSymbol: string;
  classification: DivLabCompanyClassification;
  sourceId?: string;
}): DivLabCompanyClassification {
  const target = getOmxs30SpecialMethodologyTarget(input.yahooSymbol);
  if (!target) return input.classification;

  const sourceIds = new Set(input.classification.sourceIds);
  if (input.sourceId) sourceIds.add(input.sourceId);

  return {
    ...input.classification,
    type: target.companyType,
    confidence: "high",
    basis: [
      ...input.classification.basis,
      `omxs30_special_methodology_registry=${target.yahooSymbol}:${target.companyType}`,
    ],
    sourceIds: [...sourceIds].sort(),
  };
}

export function omxs30SpecialClassificationSource(input: {
  yahooSymbol: string;
  verifiedAt: string;
}): AnalysisSource | null {
  const target = getOmxs30SpecialMethodologyTarget(input.yahooSymbol);
  if (!target) return null;
  const sourceId = `fundamental:omxs30-methodology:${target.yahooSymbol}:${input.verifiedAt.slice(0, 10)}`;
  return {
    id: sourceId,
    kind: "fundamental_data",
    publisher: target.publisher,
    url: target.officialUrl,
    publishedAt: input.verifiedAt,
    verifiedAt: input.verifiedAt,
    primary: true,
  };
}
