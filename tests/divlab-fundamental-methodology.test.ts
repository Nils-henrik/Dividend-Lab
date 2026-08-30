import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DivLabCompanyClassification, DivLabCompanyType } from "../lib/analysis/company-classification";
import {
  analyzeFundamentalsForCompany,
  fundamentalMethodologyFor,
} from "../lib/analysis/fundamental-methodology";
import type { FundamentalSnapshot } from "../lib/analysis/fundamental-analysis";

function classification(type: DivLabCompanyType): DivLabCompanyClassification {
  return {
    version: "company-classification-v1",
    type,
    confidence: type === "unknown" ? "low" : "high",
    sector: type === "operating_company" ? "Industrials" : "Financial Services",
    industry: type,
    quoteType: "EQUITY",
    basis: [`test:${type}`],
    sourceIds: ["fundamental:test"],
  };
}

function snapshot(): FundamentalSnapshot {
  return {
    asOf: "2026-06-30",
    currency: "SEK",
    marketCap: 10_000,
    revenueTtm: 1_000,
    revenueGrowthYoy: 0.1,
    operatingMarginTtm: 0.2,
    profitMarginTtm: 0.14,
    ebitTtm: 200,
    ebitdaTtm: 240,
    netIncomeTtm: 140,
    epsTtm: 7,
    operatingCashFlowTtm: 190,
    freeCashFlowTtm: 160,
    capexTtm: 30,
    cash: 100,
    totalDebt: 300,
    netDebt: 200,
    equity: 800,
    sharesOutstanding: 20,
    sharesOutstandingGrowthYoy: 0.01,
    returnOnEquity: 0.18,
    returnOnAssets: 0.08,
    returnOnInvestedCapital: 0.15,
    payoutRatio: 0.45,
    historicalPeriods: [
      { period: "2023-12-31", revenue: 750, eps: 4.5, freeCashFlow: 100, sharesOutstanding: 20 },
      { period: "2024-12-31", revenue: 840, eps: 5.3, freeCashFlow: 120, sharesOutstanding: 20 },
      { period: "2025-12-31", revenue: 930, eps: 6.2, freeCashFlow: 145, sharesOutstanding: 20 },
    ],
  };
}

describe("DivLab company-aware fundamental methodology", () => {
  it("keeps the generic corporate scorecard for operating companies", () => {
    const analysis = analyzeFundamentalsForCompany({
      snapshot: snapshot(),
      classification: classification("operating_company"),
    });

    assert.equal(analysis.methodology.status, "supported");
    assert.equal(analysis.methodology.genericCorporateScorecardApplicable, true);
    assert.ok((analysis.scorecard.coverage ?? 0) > 0);
    assert.ok(analysis.metrics.netDebtToEbitda !== null);
    assert.ok(analysis.metrics.freeCashFlowPerShare !== null);
  });

  it("blocks generic cash/debt scoring for banks while preserving safe raw context", () => {
    const analysis = analyzeFundamentalsForCompany({
      snapshot: snapshot(),
      classification: classification("bank"),
    });

    assert.equal(analysis.methodology.status, "specialized_required");
    assert.equal(analysis.methodology.framework, "bank_specialized");
    assert.equal(analysis.scorecard.overall, null);
    assert.equal(analysis.scorecard.coverage, 0);
    assert.equal(analysis.metrics.netDebtToEbitda, null);
    assert.equal(analysis.metrics.netDebtToFcf, null);
    assert.equal(analysis.metrics.freeCashFlowPerShare, null);
    assert.equal(analysis.metrics.operatingMarginTtm, null);
    assert.equal(analysis.metrics.epsTtm, 7);
    assert.equal(analysis.metrics.returnOnEquity, 0.18);
    assert.equal(analysis.methodology.valuationSupport.pe, true);
    assert.equal(analysis.methodology.valuationSupport.enterpriseMultiples, false);
    assert.ok(analysis.methodology.requiredSpecializedMetrics.some((metric) => metric.includes("CET1")));
  });

  it("requires specialized real-estate metrics instead of corporate FCF score", () => {
    const analysis = analyzeFundamentalsForCompany({
      snapshot: snapshot(),
      classification: classification("real_estate"),
    });
    assert.equal(analysis.methodology.status, "specialized_required");
    assert.ok(analysis.methodology.requiredSpecializedMetrics.some((metric) => metric.includes("LTV")));
    assert.ok(analysis.methodology.requiredSpecializedMetrics.some((metric) => metric.includes("NAV")));
    assert.equal(analysis.metrics.freeCashFlowMargin, null);
  });

  it("treats fund/ETF company scorecards as unsupported", () => {
    const policy = fundamentalMethodologyFor(classification("fund_or_etf"));
    assert.equal(policy.status, "unsupported_instrument");
    assert.equal(policy.valuationSupport.pe, false);
    assert.equal(policy.valuationSupport.priceToFcf, false);
    assert.equal(policy.valuationSupport.enterpriseMultiples, false);
  });

  it("fails to a classification-required methodology when company type is unknown", () => {
    const analysis = analyzeFundamentalsForCompany({
      snapshot: snapshot(),
      classification: classification("unknown"),
    });
    assert.equal(analysis.methodology.status, "classification_required");
    assert.equal(analysis.scorecard.coverage, 0);
    assert.ok(analysis.unknowns.some((item) => item.includes("verifierad bolagstyp")));
  });
});
