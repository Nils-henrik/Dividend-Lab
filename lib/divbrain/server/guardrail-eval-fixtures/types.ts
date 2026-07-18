/**
 * Shared eval fixture types for Ticket 1A-3b.
 * Kept separate so fixture modules can import types without circular runner imports.
 */

import {
  DIVBRAIN_GUARDRAIL_POLICY_VERSION,
  type DivBrainGuardrailConstraint,
  type DivBrainGuardrailDecision,
  type DivBrainGuardrailPublicMessageKey,
  type DivBrainGuardrailReasonCode,
} from "../../guardrails";

export const DIVBRAIN_GUARDRAIL_EVAL_CATEGORIES = [
  "education",
  "personal_financial_advice",
  "guaranteed_returns",
  "live_data_and_grounding",
  "legal_tax",
  "market_manipulation",
  "insider_trading",
  "credentials_and_secrets",
  "system_prompt_and_override",
  "private_data_and_admin",
  "near_miss",
] as const;

export type DivBrainGuardrailEvalCategory =
  (typeof DIVBRAIN_GUARDRAIL_EVAL_CATEGORIES)[number];

/**
 * Static eval fixture. `prompt` is evaluation input only and must never be
 * copied into reports or assessments.
 */
export type DivBrainGuardrailEvalCase = {
  id: string;
  description: string;
  category: DivBrainGuardrailEvalCategory;
  prompt: string;
  expectedDecision: DivBrainGuardrailDecision;
  expectedReasonCodes: DivBrainGuardrailReasonCode[];
  expectedConstraints: DivBrainGuardrailConstraint[];
  expectedPolicyVersion: typeof DIVBRAIN_GUARDRAIL_POLICY_VERSION;
  expectedPublicMessageKey: DivBrainGuardrailPublicMessageKey;
  notes?: string;
};
