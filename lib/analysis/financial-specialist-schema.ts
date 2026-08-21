import { z } from "zod";

export const DIVLAB_FINANCIAL_SPECIALIST_ANALYST_SCHEMA_VERSION =
  "analyst-v1-financial-specialist" as const;

const shortText = z.string().trim().min(1).max(900);
const sourceIds = z.array(z.string().trim().min(1).max(240)).min(1).max(8);

export const divLabFinancialSpecialistClaimSchema = z.object({
  text: shortText,
  sourceIds,
});

export const divLabFinancialSpecialistFactorSchema = z
  .object({
    label: z.string().trim().min(2).max(90),
    assessment: z.enum(["strong", "neutral", "weak", "unknown"]),
    rationale: shortText,
    sourceIds: z.array(z.string().trim().min(1).max(240)).max(8),
  })
  .superRefine((factor, ctx) => {
    if (factor.assessment !== "unknown" && factor.sourceIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceIds"],
        message: "non_unknown_financial_specialist_factor_requires_source",
      });
    }
  });

export const divLabFinancialSpecialistScenarioSchema = z.object({
  name: z.enum(["bear", "base", "bull"]),
  label: z.string().trim().min(1).max(80),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  forecastYears: z.number().int().min(1).max(5),
  navGrowthPct: z.number().finite().min(-0.5).max(1.0).nullable(),
  discountPct: z.number().finite().min(-0.5).max(0.8).nullable(),
  epsGrowthPct: z.number().finite().min(-0.8).max(1.5).nullable(),
  peMultiple: z.number().finite().positive().max(100).nullable(),
  assumptions: z.array(z.string().trim().min(1).max(320)).min(2).max(8),
  sourceIds,
});

export const divLabFinancialSpecialistAnalystDraftSchema = z
  .object({
    specialistType: z.enum(["investment_company", "asset_manager"]),
    view: z.enum(["positive", "neutral", "negative"]),
    riskLevel: z.enum(["low", "medium", "high"]),
    confidence: z.enum(["low", "medium", "high"]),
    horizonMonths: z.object({
      min: z.number().int().min(1).max(120),
      max: z.number().int().min(1).max(120),
    }),
    executiveSummary: z.string().trim().min(20).max(1_400),
    investmentCase: z.array(divLabFinancialSpecialistClaimSchema).min(2).max(7),
    latestReport: z.array(divLabFinancialSpecialistClaimSchema).min(2).max(7),
    specialistInterpretation: z.array(divLabFinancialSpecialistClaimSchema).min(3).max(10),
    valuationInterpretation: z.array(divLabFinancialSpecialistClaimSchema).min(1).max(4),
    qualityFactors: z.array(divLabFinancialSpecialistFactorSchema).min(6).max(10),
    catalysts: z.array(divLabFinancialSpecialistClaimSchema).min(1).max(6),
    risks: z.array(divLabFinancialSpecialistClaimSchema).min(3).max(9),
    contradictions: z.array(divLabFinancialSpecialistClaimSchema).min(1).max(6),
    thesisBreakers: z.array(divLabFinancialSpecialistClaimSchema).min(1).max(6),
    technicalInterpretation: z.array(divLabFinancialSpecialistClaimSchema).min(1).max(5),
    valuationScenarios: z.array(divLabFinancialSpecialistScenarioSchema).length(3),
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
        message: "financial_specialist_scenarios_require_bear_base_bull",
      });
    }
    const horizons = new Set(draft.valuationScenarios.map((scenario) => scenario.forecastYears));
    if (horizons.size !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valuationScenarios"],
        message: "financial_specialist_scenarios_require_same_horizon",
      });
    }
  });

export type DivLabFinancialSpecialistClaim = z.infer<typeof divLabFinancialSpecialistClaimSchema>;
export type DivLabFinancialSpecialistFactor = z.infer<typeof divLabFinancialSpecialistFactorSchema>;
export type DivLabFinancialSpecialistScenario = z.infer<typeof divLabFinancialSpecialistScenarioSchema>;
export type DivLabFinancialSpecialistAnalystDraft = z.infer<typeof divLabFinancialSpecialistAnalystDraftSchema>;
