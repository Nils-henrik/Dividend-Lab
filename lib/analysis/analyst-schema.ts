import { z } from "zod";

export const DIVLAB_ANALYST_SCHEMA_VERSION = "analyst-v2" as const;

const shortText = z.string().trim().min(1).max(900);
const sourceIds = z.array(z.string().trim().min(1).max(240)).min(1).max(6);

export const divLabAnalystClaimSchema = z.object({
  text: shortText,
  sourceIds,
});

export const divLabAnalystValuationClaimSchema = z.object({
  measure: z.enum([
    "pe",
    "priceToFcf",
    "fcfYield",
    "enterpriseValue",
    "evToEbit",
    "evToEbitda",
  ]),
  text: shortText,
  sourceIds,
});

export const divLabAnalystFactorSchema = z
  .object({
    assessment: z.enum(["strong", "neutral", "weak", "unknown"]),
    rationale: shortText,
    sourceIds: z.array(z.string().trim().min(1).max(240)).max(6),
  })
  .superRefine((factor, ctx) => {
    if (factor.assessment !== "unknown" && factor.sourceIds.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceIds"],
        message: "non_unknown_factor_requires_source",
      });
    }
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
    valuationInterpretation: z.array(divLabAnalystValuationClaimSchema).min(1).max(6),
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
    const valuationMeasures = draft.valuationInterpretation.map((claim) => claim.measure);
    if (new Set(valuationMeasures).size !== valuationMeasures.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valuationInterpretation"],
        message: "valuation_interpretation_measure_must_be_unique",
      });
    }
  });

/**
 * Provider-facing schema for structured generation.
 *
 * Keep this deliberately structural. DivLab's richer min/max/refinement and
 * provenance rules are applied after generation with divLabAnalystDraftSchema
 * and validateAnalystDraftAgainstPacket. This prevents provider JSON-schema
 * limitations or a single semantic refinement from collapsing into the opaque
 * AI SDK "No object generated" error before our own validation can run.
 */
const generationClaimSchema = z.object({
  text: z.string(),
  sourceIds: z.array(z.string()),
});

const generationValuationClaimSchema = z.object({
  measure: z.enum([
    "pe",
    "priceToFcf",
    "fcfYield",
    "enterpriseValue",
    "evToEbit",
    "evToEbitda",
  ]),
  text: z.string(),
  sourceIds: z.array(z.string()),
});

const generationFactorSchema = z.object({
  assessment: z.enum(["strong", "neutral", "weak", "unknown"]),
  rationale: z.string(),
  sourceIds: z.array(z.string()),
});

const generationScenarioSchema = z.object({
  name: z.enum(["bear", "base", "bull"]),
  label: z.string(),
  currency: z.string(),
  eps: z.number().nullable(),
  peMultiple: z.number().nullable(),
  freeCashFlowPerShare: z.number().nullable(),
  pFcfMultiple: z.number().nullable(),
  explicitValuePerShare: z.number().nullable(),
  assumptions: z.array(z.string()),
  sourceIds: z.array(z.string()),
});

export const divLabAnalystGenerationSchema = z.object({
  view: z.enum(["positive", "neutral", "negative"]),
  riskLevel: z.enum(["low", "medium", "high"]),
  confidence: z.enum(["low", "medium", "high"]),
  horizonMonths: z.object({
    min: z.number(),
    max: z.number(),
  }),
  executiveSummary: z.string(),
  investmentCase: z.array(generationClaimSchema),
  latestReport: z.array(generationClaimSchema),
  fundamentalInterpretation: z.array(generationClaimSchema),
  valuationInterpretation: z.array(generationValuationClaimSchema),
  qualityFactors: z.object({
    competitiveAdvantage: generationFactorSchema,
    pricingPower: generationFactorSchema,
    marketPosition: generationFactorSchema,
    managementAndCapitalAllocation: generationFactorSchema,
    reinvestmentRunway: generationFactorSchema,
    cyclicality: generationFactorSchema,
    customerConcentration: generationFactorSchema,
    regulatoryRisk: generationFactorSchema,
    currencyRisk: generationFactorSchema,
    acquisitionRisk: generationFactorSchema,
    disruptionRisk: generationFactorSchema,
  }),
  catalysts: z.array(generationClaimSchema),
  risks: z.array(generationClaimSchema),
  contradictions: z.array(generationClaimSchema),
  thesisBreakers: z.array(generationClaimSchema),
  technicalInterpretation: z.array(generationClaimSchema),
  valuationScenarios: z.array(generationScenarioSchema),
});

export type DivLabAnalystClaim = z.infer<typeof divLabAnalystClaimSchema>;
export type DivLabAnalystValuationClaim = z.infer<typeof divLabAnalystValuationClaimSchema>;
export type DivLabAnalystDraft = z.infer<typeof divLabAnalystDraftSchema>;
