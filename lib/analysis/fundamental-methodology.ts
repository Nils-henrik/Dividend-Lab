import type {
  DivLabCompanyClassification,
  DivLabCompanyType,
} from "./company-classification";
import {
  analyzeFundamentals,
  type FundamentalAnalysis,
  type FundamentalSnapshot,
} from "./fundamental-analysis";

export const DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION =
  "fundamental-methodology-v1" as const;

export type FundamentalMethodologyStatus =
  | "supported"
  | "specialized_required"
  | "unsupported_instrument"
  | "classification_required";

export type FundamentalMethodologyPolicy = {
  version: typeof DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION;
  companyType: DivLabCompanyType;
  status: FundamentalMethodologyStatus;
  framework:
    | "generic_operating_company"
    | "bank_specialized"
    | "insurance_specialized"
    | "real_estate_specialized"
    | "financial_specialized"
    | "fund_or_etf"
    | "unclassified";
  genericCorporateScorecardApplicable: boolean;
  valuationSupport: {
    pe: boolean;
    priceToFcf: boolean;
    enterpriseMultiples: boolean;
  };
  requiredSpecializedMetrics: string[];
};

export type DivLabFundamentalAnalysis = FundamentalAnalysis & {
  methodology: FundamentalMethodologyPolicy;
};

const SPECIALIZED_METRICS: Record<
  Exclude<DivLabCompanyType, "operating_company" | "fund_or_etf" | "unknown">,
  string[]
> = {
  bank: [
    "CET1-kapitalrelation",
    "net interest margin/räntenetto",
    "kreditförlustnivå",
    "utlånings- och inlåningstillväxt",
    "finansieringsmix",
    "ROE",
    "P/B eller relevant bokvärdesvärdering",
  ],
  insurance: [
    "solvensgrad",
    "combined ratio/skadekvot där relevant",
    "reservutveckling",
    "premietillväxt",
    "investeringsresultat",
    "ROE",
    "P/B eller relevant bokvärdesvärdering",
  ],
  real_estate: [
    "LTV/belåningsgrad",
    "räntetäckningsgrad",
    "FFO/EPRA-resultat",
    "uthyrningsgrad",
    "NAV/EPRA NRV",
    "skuldens löptid och refinansieringsprofil",
  ],
  financial_other: [
    "verksamhetsspecifik kapitalbas",
    "intäkts- och avgiftsmix",
    "relevant bokvärde/NAV",
    "kapitaltäckning eller finansieringsrisk där relevant",
    "verksamhetsspecifik avkastning på kapital",
  ],
};

export function fundamentalMethodologyFor(
  classification: DivLabCompanyClassification,
): FundamentalMethodologyPolicy {
  switch (classification.type) {
    case "operating_company":
      return {
        version: DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION,
        companyType: classification.type,
        status: "supported",
        framework: "generic_operating_company",
        genericCorporateScorecardApplicable: true,
        valuationSupport: {
          pe: true,
          priceToFcf: true,
          enterpriseMultiples: true,
        },
        requiredSpecializedMetrics: [],
      };
    case "bank":
      return {
        version: DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION,
        companyType: classification.type,
        status: "specialized_required",
        framework: "bank_specialized",
        genericCorporateScorecardApplicable: false,
        valuationSupport: { pe: true, priceToFcf: false, enterpriseMultiples: false },
        requiredSpecializedMetrics: [...SPECIALIZED_METRICS.bank],
      };
    case "insurance":
      return {
        version: DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION,
        companyType: classification.type,
        status: "specialized_required",
        framework: "insurance_specialized",
        genericCorporateScorecardApplicable: false,
        valuationSupport: { pe: true, priceToFcf: false, enterpriseMultiples: false },
        requiredSpecializedMetrics: [...SPECIALIZED_METRICS.insurance],
      };
    case "real_estate":
      return {
        version: DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION,
        companyType: classification.type,
        status: "specialized_required",
        framework: "real_estate_specialized",
        genericCorporateScorecardApplicable: false,
        valuationSupport: { pe: true, priceToFcf: false, enterpriseMultiples: false },
        requiredSpecializedMetrics: [...SPECIALIZED_METRICS.real_estate],
      };
    case "financial_other":
      return {
        version: DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION,
        companyType: classification.type,
        status: "specialized_required",
        framework: "financial_specialized",
        genericCorporateScorecardApplicable: false,
        valuationSupport: { pe: true, priceToFcf: false, enterpriseMultiples: false },
        requiredSpecializedMetrics: [...SPECIALIZED_METRICS.financial_other],
      };
    case "fund_or_etf":
      return {
        version: DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION,
        companyType: classification.type,
        status: "unsupported_instrument",
        framework: "fund_or_etf",
        genericCorporateScorecardApplicable: false,
        valuationSupport: { pe: false, priceToFcf: false, enterpriseMultiples: false },
        requiredSpecializedMetrics: [
          "fond-/ETF-specifik metodik för innehav, index, avgift, tracking och distributionspolicy",
        ],
      };
    case "unknown":
      return {
        version: DIVLAB_FUNDAMENTAL_METHODOLOGY_VERSION,
        companyType: classification.type,
        status: "classification_required",
        framework: "unclassified",
        genericCorporateScorecardApplicable: false,
        valuationSupport: { pe: false, priceToFcf: false, enterpriseMultiples: false },
        requiredSpecializedMetrics: ["verifierad bolagstyp/sektorklassificering"],
      };
  }
}

function specializedPlaceholder(
  snapshot: FundamentalSnapshot,
  policy: FundamentalMethodologyPolicy,
): DivLabFundamentalAnalysis {
  const generic = analyzeFundamentals(snapshot);
  const required = policy.requiredSpecializedMetrics.map(
    (metric) => `specialiserad fundamental datapunkt saknas: ${metric}`,
  );

  return {
    asOf: generic.asOf,
    currency: generic.currency,
    methodology: policy,
    scorecard: {
      growth: null,
      profitability: null,
      cashFlow: null,
      balanceSheet: null,
      capitalAllocation: null,
      overall: null,
      coverage: 0,
    },
    metrics: {
      // EPS/ROE/ROA/share count/payout can remain useful raw context for several
      // specialized financial/property frameworks. Generic cash/debt/margin
      // measures are deliberately nulled so the analyst cannot treat them as a
      // valid corporate scorecard for the wrong company type.
      revenueGrowthYoy: null,
      operatingMarginTtm: null,
      profitMarginTtm: null,
      freeCashFlowMargin: null,
      cashConversion: null,
      netDebtToEbitda: null,
      netDebtToFcf: null,
      returnOnEquity: generic.metrics.returnOnEquity,
      returnOnAssets: generic.metrics.returnOnAssets,
      returnOnInvestedCapital: null,
      sharesOutstandingGrowthYoy: generic.metrics.sharesOutstandingGrowthYoy,
      payoutRatio: generic.metrics.payoutRatio,
      freeCashFlowPerShare: null,
      epsTtm: generic.metrics.epsTtm,
    },
    trends: {
      periodsAnalyzed: generic.trends.periodsAnalyzed,
      yearsCovered: generic.trends.yearsCovered,
      revenueCagr: null,
      epsCagr: generic.trends.epsCagr,
      freeCashFlowPerShareCagr: null,
      sharesOutstandingCagr: generic.trends.sharesOutstandingCagr,
      operatingMarginChange: null,
    },
    strengths: [],
    concerns: [],
    unknowns: [
      `Generiskt rörelsedrivande scorecard är inte tillämpligt för companyType=${policy.companyType}.`,
      ...required,
    ],
  };
}

export function analyzeFundamentalsForCompany(input: {
  snapshot: FundamentalSnapshot;
  classification: DivLabCompanyClassification;
}): DivLabFundamentalAnalysis {
  const policy = fundamentalMethodologyFor(input.classification);
  if (policy.status !== "supported") {
    return specializedPlaceholder(input.snapshot, policy);
  }
  return {
    ...analyzeFundamentals(input.snapshot),
    methodology: policy,
  };
}
