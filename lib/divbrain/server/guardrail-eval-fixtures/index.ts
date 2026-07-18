/**
 * Aggregated DivBrain guardrail eval fixtures (Ticket 1A-3b).
 *
 * Ordering invariant: the approved 1A-3a baseline (28 cases) remains first
 * and in original order; 1A-3b expansions append after it.
 *
 * Server-eval area only — do not import from client components.
 */

import { DIVBRAIN_GUARDRAIL_EVAL_BASELINE_1A3A } from "./baseline-1a3a";
import { DIVBRAIN_GUARDRAIL_EVAL_CURRENT_LEGAL } from "./current-legal";
import { DIVBRAIN_GUARDRAIL_EVAL_EDUCATION_FINANCE } from "./education-finance";
import { DIVBRAIN_GUARDRAIL_EVAL_MARKET_CONDUCT } from "./market-conduct";
import { DIVBRAIN_GUARDRAIL_EVAL_PRIVACY_ADMIN } from "./privacy-admin";
import { DIVBRAIN_GUARDRAIL_EVAL_SECRETS_SYSTEM } from "./secrets-system";
import type { DivBrainGuardrailEvalCase } from "./types";

export type {
  DivBrainGuardrailEvalCase,
  DivBrainGuardrailEvalCategory,
} from "./types";
export { DIVBRAIN_GUARDRAIL_EVAL_CATEGORIES } from "./types";

export const DIVBRAIN_GUARDRAIL_EVAL_CASES: readonly DivBrainGuardrailEvalCase[] =
  [
    ...DIVBRAIN_GUARDRAIL_EVAL_BASELINE_1A3A,
    ...DIVBRAIN_GUARDRAIL_EVAL_EDUCATION_FINANCE,
    ...DIVBRAIN_GUARDRAIL_EVAL_CURRENT_LEGAL,
    ...DIVBRAIN_GUARDRAIL_EVAL_MARKET_CONDUCT,
    ...DIVBRAIN_GUARDRAIL_EVAL_SECRETS_SYSTEM,
    ...DIVBRAIN_GUARDRAIL_EVAL_PRIVACY_ADMIN,
  ];
