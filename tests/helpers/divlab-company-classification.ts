import type { DivLabCompanyClassification } from "../../lib/analysis/company-classification";

export function operatingCompanyClassification(
  sourceId: string,
  overrides: Partial<DivLabCompanyClassification> = {},
): DivLabCompanyClassification {
  return {
    version: "company-classification-v1",
    type: "operating_company",
    confidence: "high",
    sector: "Industrials",
    industry: "Test Industrial Company",
    quoteType: "EQUITY",
    basis: ["test_fixture:explicit_operating_company"],
    sourceIds: [sourceId],
    ...overrides,
  };
}
