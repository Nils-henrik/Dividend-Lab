import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  analysisEngineForCompanyType,
  type DivLabAnalysisEngine,
} from "../lib/analysis/analysis-engine-dispatch";
import type { DivLabCompanyType } from "../lib/analysis/company-classification";

describe("DivLab analysis engine dispatch", () => {
  it("routes only explicitly supported company families", () => {
    const supported: Array<[DivLabCompanyType, DivLabAnalysisEngine]> = [
      ["operating_company", "operating_company"],
      ["bank", "bank"],
      ["investment_company", "financial_specialist"],
      ["asset_manager", "financial_specialist"],
    ];

    for (const [companyType, engine] of supported) {
      assert.equal(analysisEngineForCompanyType(companyType), engine);
    }
  });

  it("keeps every unsupported family fail-closed instead of falling through to a specialist engine", () => {
    const unsupported: DivLabCompanyType[] = [
      "insurance",
      "real_estate",
      "financial_other",
      "fund_or_etf",
      "unknown",
    ];

    for (const companyType of unsupported) {
      assert.equal(
        analysisEngineForCompanyType(companyType),
        null,
        `${companyType} must remain unsupported`,
      );
    }
  });
});
