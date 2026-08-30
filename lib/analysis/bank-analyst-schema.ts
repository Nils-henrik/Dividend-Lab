import { z } from "zod";

export const DIVLAB_BANK_ANALYST_SCHEMA_VERSION = "analyst-v3-bank" as const;

const shortText = z.string().trim().min(1).max(900);
const sourceIds = z.array(z.string().trim().min(1).max(240)).min(1).max(8);

export const divLabBankAnalystClaimSchema = z.object({
  text: shortText,
  sourceIds,
});

export const divLabBankAnalystFactorSchema = z
  .object({
    assessment: z.enum(["strong", "neutral", "weak", "unknown"]),
    rationale: shortText,
    sourceIds: z.array(z.string().trim().min(1).max(240)).max(8),
  })
  .superRefine((factor, ctx) => {
    if (factor.assessment !== "unknown" && factor.sourceIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceIds"],
        message: "non_unknown_bank_factor_requires_source",
      });
    }
  });

export const divLabBankValuationClaimSchema = z.object({
  measure: z.enum(["pe", "priceToBook"]),
  text: shortText,
  sourceIds,
});

export const divLabBankScenarioSchema = z
  .object({
    name: z.enum(["bear", "base", "bull"]),
    label: z.string().trim().min(1).max(80),
    currency: z.string().trim().regex(/^[A-Z]{3}$/),
    forecastYears: z.number().int().min(1).max(5),
    epsGrowthPct: z.number().finite().min(-0.8).max(1.5).nullable(),
    peMultiple: z.number().finite().positive().max(80).nullable(),
    bookValueGrowthPct: z.number().finite().min(-0.5).max(0.8).nullable(),
    priceToBookMultiple: z.number().finite().positive().max(8).nullable(),
    assumptions: z.array(z.string().trim().min(1).max(320)).min(2).max(8),
    sourceIds,
  })
  .superRefine((scenario, ctx) => {
    const pePaired = (scenario.epsGrowthPct === null) === (scenario.peMultiple === null);
    const pbPaired =
      (scenario.bookValueGrowthPct === null) ===
      (scenario.priceToBookMultiple === null);
    if (!pePaired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bank_eps_growth_and_pe_multiple_must_be_paired",
      });
    }
    if (!pbPaired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bank_book_growth_and_pb_multiple_must_be_paired",
      });
    }
    if (scenario.peMultiple === null && scenario.priceToBookMultiple === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "bank_scenario_requires_pe_or_price_to_book_method",
      });
    }
  });

export const divLabBankAnalystDraftSchema = z
  .object({
    view: z.enum(["positive", "neutral", "negative"]),
    riskLevel: z.enum(["low", "medium", "high"]),
    confidence: z.enum(["low", "medium", "high"]),
    horizonMonths: z.object({
      min: z.number().int().min(1).max(120),
      max: z.number().int().min(1).max(120),
    }),
    executiveSummary: z.string().trim().min(20).max(1_400),
    investmentCase: z.array(divLabBankAnalystClaimSchema).min(2).max(6),
    latestReport: z.array(divLabBankAnalystClaimSchema).min(2).max(7),
    bankFundamentalInterpretation: z.array(divLabBankAnalystClaimSchema).min(3).max(10),
    valuationInterpretation: z.array(divLabBankValuationClaimSchema).min(1).max(2),
    bankFactors: z.object({
      franchiseAndDepositBase: divLabBankAnalystFactorSchema,
      profitability: divLabBankAnalystFactorSchema,
      capitalStrength: divLabBankAnalystFactorSchema,
      creditQuality: divLabBankAnalystFactorSchema,
      fundingAndLiquidity: divLabBankAnalystFactorSchema,
      efficiency: divLabBankAnalystFactorSchema,
      rateSensitivity: divLabBankAnalystFactorSchema,
      feeIncomeDiversification: divLabBankAnalystFactorSchema,
      regulatoryRisk: divLabBankAnalystFactorSchema,
      capitalDistribution: divLabBankAnalystFactorSchema,
    }),
    catalysts: z.array(divLabBankAnalystClaimSchema).min(1).max(6),
    risks: z.array(divLabBankAnalystClaimSchema).min(3).max(9),
    contradictions: z.array(divLabBankAnalystClaimSchema).min(1).max(6),
    thesisBreakers: z.array(divLabBankAnalystClaimSchema).min(1).max(6),
    technicalInterpretation: z.array(divLabBankAnalystClaimSchema).min(1).max(5),
    valuationScenarios: z.array(divLabBankScenarioSchema).length(3),
  })
  .superRefine((draft, ctx) => {
    if (draft.horizonMonths.min > draft.horizonMonths.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["horizonMonths"],
        message: "horizon_min_must_not_exceed_max",
      });
    }

    const names = new Set(draft.valuationScenarios.map((scenario) => scenario.name));
    if (names.size !== 3 || !names.has("bear") || !names.has("base") || !names.has("bull")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valuationScenarios"],
        message: "bank_valuation_scenarios_must_include_unique_bear_base_bull",
      });
    }

    const forecastYears = new Set(
      draft.valuationScenarios.map((scenario) => scenario.forecastYears),
    );
    if (forecastYears.size !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valuationScenarios"],
        message: "bank_scenarios_must_use_same_forecast_horizon",
      });
    }

    const measures = draft.valuationInterpretation.map((claim) => claim.measure);
    if (new Set(measures).size !== measures.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valuationInterpretation"],
        message: "bank_valuation_interpretation_measure_must_be_unique",
      });
    }
  });

export type DivLabBankAnalystClaim = z.infer<typeof divLabBankAnalystClaimSchema>;
export type DivLabBankAnalystFactor = z.infer<typeof divLabBankAnalystFactorSchema>;
export type DivLabBankAnalystScenario = z.infer<typeof divLabBankScenarioSchema>;
export type DivLabBankAnalystDraft = z.infer<typeof divLabBankAnalystDraftSchema>;
