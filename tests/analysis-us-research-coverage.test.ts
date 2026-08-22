import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabResearchPacket } from "../lib/analysis/deep-research";
import type { GlobalEvidenceQualityGate } from "../lib/analysis/global-evidence-contract";
import { evaluateUsResearchCoverage } from "../lib/analysis/us-research-coverage";

function evidenceGate(ready = true): GlobalEvidenceQualityGate {
  return {
    version: "global-evidence-extraction-v1",
    ready,
    score: ready ? 100 : 80,
    blockers: ready ? [] : ["missing interim filing"],
    checks: {
      sourceTraceability: true,
      annualDocumentCoverage: true,
      interimDocumentCoverage: ready,
      boundedDocumentText: true,
      distinctDocumentCoverage: true,
    },
  };
}

function packet(overrides: {
  exchange?: string;
  companyType?: string;
  reportingCurrency?: string | null;
  epsCurrency?: string | null;
  failedChecks?: string[];
} = {}): DivLabResearchPacket {
  const failed = new Set(overrides.failedChecks ?? ["valuationScenarioCoverage"]);
  const checks = {
    companyClassificationCoverage: !failed.has("companyClassificationCoverage"),
    fundamentalMethodologyCoverage: !failed.has("fundamentalMethodologyCoverage"),
    fundamentalCoverage: !failed.has("fundamentalCoverage"),
    multiYearFundamentalCoverage: !failed.has("multiYearFundamentalCoverage"),
    freshPrimarySource: !failed.has("freshPrimarySource"),
    sourceTraceability: !failed.has("sourceTraceability"),
    primaryEvidenceCoverage: !failed.has("primaryEvidenceCoverage"),
    valuationTraceability: !failed.has("valuationTraceability"),
    valuationScenarioCoverage: !failed.has("valuationScenarioCoverage"),
    technicalHistoryCoverage: !failed.has("technicalHistoryCoverage"),
    technicalLevelCoverage: !failed.has("technicalLevelCoverage"),
  };

  return {
    instrument: {
      symbol: "MSFT",
      exchange: overrides.exchange ?? "US",
      name: "Microsoft Corporation",
      currency: "USD",
      currentPrice: 500,
    },
    companyClassification: {
      type: overrides.companyType ?? "operating_company",
    },
    currencyContext: {
      marketCurrency: "USD",
      reportingCurrency: overrides.reportingCurrency === undefined ? "USD" : overrides.reportingCurrency,
      epsTtmCurrency: overrides.epsCurrency === undefined ? "USD" : overrides.epsCurrency,
    },
    fxConversion: null,
    qualityGate: {
      score: Math.round((Object.values(checks).filter(Boolean).length / Object.values(checks).length) * 100),
      publishable: Object.values(checks).every(Boolean),
      blockers: [],
      warnings: [],
      checks,
    },
  } as unknown as DivLabResearchPacket;
}

describe("US Research Coverage v1", () => {
  it("reaches 100/100 input readiness while the downstream valuation-scenario check stays deferred", () => {
    const result = evaluateUsResearchCoverage({
      packet: packet(),
      evidenceQualityGate: evidenceGate(),
    });

    assert.equal(result.ready, true);
    assert.equal(result.score, 100);
    assert.equal(result.blockers.length, 0);
    assert.equal(result.factsResearchQuality.publishable, false);
    assert.equal(result.factsResearchQuality.valuationScenarioCoverageDeferred, true);
    assert.deepEqual(result.factsResearchQuality.failedChecks, ["valuationScenarioCoverage"]);
  });

  it("fails closed when SEC evidence is not 100/100", () => {
    const result = evaluateUsResearchCoverage({
      packet: packet(),
      evidenceQualityGate: evidenceGate(false),
    });

    assert.equal(result.ready, false);
    assert.equal(result.checks.freshPrimaryEvidenceCoverage, false);
    assert.match(result.blockers.join(" "), /SEC-evidens/i);
  });

  it("fails closed on unsupported company type, missing currencies or ordinary Research blockers", () => {
    const result = evaluateUsResearchCoverage({
      packet: packet({
        companyType: "bank",
        reportingCurrency: null,
        failedChecks: ["fundamentalMethodologyCoverage", "multiYearFundamentalCoverage", "valuationTraceability", "valuationScenarioCoverage"],
      }),
      evidenceQualityGate: evidenceGate(),
    });

    assert.equal(result.ready, false);
    assert.equal(result.checks.usOperatingCompanyTarget, false);
    assert.equal(result.checks.methodologyCoverage, false);
    assert.equal(result.checks.multiYearFinancialCoverage, false);
    assert.equal(result.checks.currencyCoverage, false);
    assert.equal(result.checks.valuationInputProvenance, false);
  });

  it("fails closed for non-US targets even when every other input check is green", () => {
    const result = evaluateUsResearchCoverage({
      packet: packet({ exchange: "ST" }),
      evidenceQualityGate: evidenceGate(),
    });

    assert.equal(result.ready, false);
    assert.equal(result.checks.usOperatingCompanyTarget, false);
  });
});
