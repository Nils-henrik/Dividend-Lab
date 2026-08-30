import type { AnalysisEvidence } from "./evidence";
import type { AnalysisFxConversion } from "./fx";
import type { FundamentalSnapshot } from "./fundamental-analysis";
import type { AnalysisSource } from "./quality-gate";
import { extractBankReportMetrics, type DivLabBankReportMetrics } from "./bank-analysis";
import { buildBankCapitalContext, type DivLabBankCapitalContext } from "./bank-capital";
import { extractBankFundingContext, type DivLabBankFundingContext } from "./bank-funding";
import { buildBankValuation, type DivLabBankValuation } from "./bank-valuation";

export const DIVLAB_BANK_RESEARCH_VERSION = "bank-research-v1" as const;

export type DivLabBankResearch = {
  version: typeof DIVLAB_BANK_RESEARCH_VERSION;
  status: "insufficient" | "partial" | "research_ready";
  analystReady: false;
  blockers: string[];
  analystBlockers: string[];
  warnings: string[];
  reportMetrics: DivLabBankReportMetrics;
  capital: DivLabBankCapitalContext;
  funding: DivLabBankFundingContext;
  valuation: DivLabBankValuation;
};

function hasConfirmedOperatingBankContext(metrics: DivLabBankReportMetrics): boolean {
  return (
    metrics.metrics.netInterestMargin.status === "confirmed" ||
    metrics.metrics.costIncomeRatio.status === "confirmed"
  );
}

/**
 * Assemble the deterministic bank-specific research foundation.
 *
 * `research_ready` means the facts are broad enough for a future bank analyst;
 * it does NOT enable the current generic analyst-v2. Bank analyst support will
 * require a separately versioned schema that can reason explicitly about P/B,
 * capital headroom and bank-specific risk metrics.
 */
export function buildBankResearch(input: {
  evidence: readonly AnalysisEvidence[];
  fundamentals: Pick<FundamentalSnapshot, "equity" | "sharesOutstanding">;
  currentPrice: number;
  marketCurrency: string;
  reportingCurrency: string | null;
  fxConversion?: AnalysisFxConversion | null;
  sources: readonly AnalysisSource[];
}): DivLabBankResearch {
  const reportMetrics = extractBankReportMetrics(input.evidence);
  const capital = buildBankCapitalContext({ evidence: input.evidence, reportMetrics });
  const funding = extractBankFundingContext(input.evidence);
  const valuation = buildBankValuation({
    currentPrice: input.currentPrice,
    marketCurrency: input.marketCurrency,
    equity: input.fundamentals.equity,
    sharesOutstanding: input.fundamentals.sharesOutstanding,
    reportingCurrency: input.reportingCurrency,
    fxConversion: input.fxConversion,
    sources: input.sources,
  });

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (reportMetrics.metrics.cet1Ratio.status !== "confirmed") {
    blockers.push("bank_cet1_not_confirmed");
  }
  if (reportMetrics.metrics.returnOnEquity.status !== "confirmed") {
    blockers.push("bank_roe_not_confirmed");
  }
  if (reportMetrics.metrics.creditLossRatio.status !== "confirmed") {
    blockers.push("bank_credit_loss_not_confirmed");
  }
  if (!hasConfirmedOperatingBankContext(reportMetrics)) {
    blockers.push("bank_margin_efficiency_context_missing");
  }
  if (capital.status !== "evidence_ready") {
    blockers.push("bank_capital_reference_missing");
  }
  if (funding.status !== "evidence_ready") {
    blockers.push("bank_funding_context_insufficient");
  }
  if (valuation.status !== "traceable") {
    blockers.push("bank_price_to_book_not_traceable");
  }

  if (reportMetrics.metrics.netInterestMargin.status !== "confirmed") {
    warnings.push("bank_nim_not_confirmed");
  }
  if (reportMetrics.metrics.costIncomeRatio.status !== "confirmed") {
    warnings.push("bank_cost_income_not_confirmed");
  }
  if (capital.regulatoryCet1Requirement.status !== "confirmed") {
    warnings.push("bank_regulatory_cet1_requirement_not_confirmed");
  }
  if (funding.metrics.liquidityCoverageRatio.status !== "confirmed") {
    warnings.push("bank_lcr_not_confirmed");
  }
  if (funding.metrics.netStableFundingRatio.status !== "confirmed") {
    warnings.push("bank_nsfr_not_confirmed");
  }

  const status =
    blockers.length === 0
      ? "research_ready"
      : blockers.length >= 4
        ? "insufficient"
        : "partial";

  return {
    version: DIVLAB_BANK_RESEARCH_VERSION,
    status,
    analystReady: false,
    blockers,
    analystBlockers: [
      "bank_analyst_schema_v3_required",
      "bank_valuation_interpretation_requires_price_to_book",
    ],
    warnings,
    reportMetrics,
    capital,
    funding,
    valuation,
  };
}
