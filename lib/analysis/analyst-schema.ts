import { z } from "zod";

export const DIVLAB_ANALYST_SCHEMA_VERSION = "analyst-v1" as const;

const shortText = z.string().trim().min(1).max(900);
const sourceIds = z.array(z.string().trim().min(1).max(240)).min(1).max(6);

export const divLabAnalystClaimSchema = z.object({
  text: shortText,
  sourceIds,
});

export const divLabAnalystFactorSchema = z.object({
  assessment: z.enum(["strong", "neutral", "weak", "unknown"]),
  rationale: shortText,
  sourceIds: z.array(z.string().trim().min(1).max(240)).max(6),
});

export const divLabAnalystScenarioSchema = z
  .object({
    name: z.enum(["bear", "base", "bull"]),
    label: z.string().trim().min(1).max(80),
    currency: z.string().trim().regex(/^[A-Z]{3}$/),
    eps: z.number().finite().positive().nullable(),
    peMultiple: z.number().finite().positive().max(100).nullable(),
    freeCashFlowPerShare: z.number().finite().positive().nullable(),
    pFcfMultiple: z.number().finite().positive().max(100).nullable(),
    explicitValuePerShare: z.number().finite().positive().nullable(),
    assumptions: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
    sourceIds: z.array(z.string().trim().min(1).max(240)).min(1).max(6),
  })
  .superRefine((scenario, ctx) => {
    const hasPe = scenario.eps !== null && scenario.peMultiple !== null;
    const hasFcf =
      scenario.freeCashFlowPerShare !== null && scenario.pFcfMultiple !== null;
    const hasExplicit = scenario.explicitValuePerShare !== null;
    if (!hasPe && !hasFcf && !hasExplicit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "scenario_requires_at_least_one_valuation_method",
      });
    }
    if ((scenario.eps === null) !== (scenario.peMultiple === null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "eps_and_pe_multiple_must_be_paired",
      });
    }
    if (
      (scenario.freeCashFlowPerShare === null) !==
      (scenario.pFcfMultiple === null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fcf_per_share_and_multiple_must_be_paired",
      });
    }
  });

export const divLabAnalystDraftSchema = z
  .object({
    view: z.enum(["positive", "neutral", "negative"]),
    riskLevel: z.enum(["low", "medium", "high"]),
    confidence: z.enum(["low", "medium", "high"]),
    horizonMonths: z.object({
      min: z.number().int().min(1).max(120),
      max: z.number().int().min(1).max(120),
    }),
    executiveSummary: z.string().trim().min(20).max(1400),
    investmentCase: z.array(divLabAnalystClaimSchema).min(2).max(6),
    latestReport: z.array(divLabAnalystClaimSchema).min(1).max(6),
    fundamentalInterpretation: z.array(divLabAnalystClaimSchema).min(2).max(8),
    qualityFactors: z.object({
      competitiveAdvantage: divLabAnalystFactorSchema,
      pricingPower: divLabAnalystFactorSchema,
      marketPosition: divLabAnalystFactorSchema,
      managementAndCapitalAllocation: divLabAnalystFactorSchema,
      reinvestmentRunway: divLabAnalystFactorSchema,
      cyclicality: divLabAnalystFactorSchema,
      customerConcentration: divLabAnalystFactorSchema,
      regulatoryRisk: divLabAnalystFactorSchema,
      currencyRisk: divLabAnalystFactorSchema,
      acquisitionRisk: divLabAnalystFactorSchema,
      disruptionRisk: divLabAnalystFactorSchema,
    }),
    catalysts: z.array(divLabAnalystClaimSchema).min(1).max(6),
    risks: z.array(divLabAnalystClaimSchema).min(2).max(8),
    contradictions: z.array(divLabAnalystClaimSchema).min(1).max(6),
    thesisBreakers: z.array(divLabAnalystClaimSchema).min(1).max(6),
    technicalInterpretation: z.array(divLabAnalystClaimSchema).min(1).max(5),
    valuationScenarios: z.array(divLabAnalystScenarioSchema).length(3),
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
        message: "valuation_scenarios_must_include_unique_bear_base_bull",
      });
    }
  });

export type DivLabAnalystClaim = z.infer<typeof divLabAnalystClaimSchema>;
export type DivLabAnalystDraft = z.infer<typeof divLabAnalystDraftSchema>;
