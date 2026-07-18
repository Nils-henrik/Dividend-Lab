/**
 * Shared DivBrain guardrail vocabulary (Ticket 1A-3a).
 *
 * Safe for server and client: decisions, reason codes, constraints,
 * public-message catalog, and assessment shapes.
 *
 * Detection logic and eval fixtures live under `server/` and must never be
 * imported by client components.
 *
 * Limitations: deterministic keyword/pattern filtering is necessary but not
 * complete semantic safety. Provider-side policy and later eval expansion
 * remain required.
 */

/** Guardrail policy version embedded on every assessment. */
export const DIVBRAIN_GUARDRAIL_POLICY_VERSION = 1 as const;

export const DIVBRAIN_GUARDRAIL_DECISIONS = [
  "allow",
  "allow_with_constraints",
  "block",
] as const;

export type DivBrainGuardrailDecision =
  (typeof DIVBRAIN_GUARDRAIL_DECISIONS)[number];

/**
 * Canonical reason codes in descending severity / message-priority order.
 * Assessments emit a deduped subset sorted in this order.
 */
export const DIVBRAIN_GUARDRAIL_REASON_CODES = [
  "unauthorized_account_or_admin_action",
  "credential_or_secret_request",
  "system_prompt_or_policy_extraction",
  "instruction_override_attempt",
  "other_user_private_data_request",
  "market_manipulation",
  "insider_or_confidential_trading",
  "guaranteed_or_risk_free_return",
  "personal_financial_advice",
  "legal_or_tax_personalization",
  "live_or_current_data_required",
  "source_grounding_required",
] as const;

export type DivBrainGuardrailReasonCode =
  (typeof DIVBRAIN_GUARDRAIL_REASON_CODES)[number];

/**
 * Canonical enforceable response constraints in stable order.
 * Later prompt/context layers must be able to enforce these deterministically.
 */
export const DIVBRAIN_GUARDRAIL_CONSTRAINTS = [
  "educational_only",
  "no_personal_recommendation",
  "include_risk_and_uncertainty",
  "require_current_data",
  "require_grounded_sources",
  "require_citations",
  "legal_or_tax_information_only",
  "do_not_expose_system_policy",
  "do_not_request_or_echo_secrets",
  "do_not_access_other_user_data",
  "no_account_or_admin_action",
] as const;

export type DivBrainGuardrailConstraint =
  (typeof DIVBRAIN_GUARDRAIL_CONSTRAINTS)[number];

/**
 * Catalog keys for calm Swedish public messages.
 * Assessments may only resolve messages through this catalog.
 */
export const DIVBRAIN_GUARDRAIL_PUBLIC_MESSAGE_KEYS = [
  "allow_education",
  "constrained_general",
  "constrained_personal_advice",
  "constrained_live_data",
  "constrained_sources",
  "constrained_legal_tax",
  "blocked_generic",
  "blocked_guaranteed_return",
  "blocked_market_abuse",
  "blocked_secrets",
  "blocked_system_or_override",
  "blocked_privacy",
  "blocked_admin",
] as const;

export type DivBrainGuardrailPublicMessageKey =
  (typeof DIVBRAIN_GUARDRAIL_PUBLIC_MESSAGE_KEYS)[number];

export const DIVBRAIN_GUARDRAIL_PUBLIC_MESSAGES_SV: Record<
  DivBrainGuardrailPublicMessageKey,
  string
> = {
  allow_education:
    "Jag kan hjälpa till med allmän utbildning om investeringar.",
  constrained_general:
    "Jag kan svara allmänt med tydliga begränsningar — inte som personlig rådgivning.",
  constrained_personal_advice:
    "Jag kan förklara allmänt och belysa risk, men ger inte personliga köp-, sälj- eller allokeringsråd.",
  constrained_live_data:
    "Den typen av fråga kräver aktuell data och källor. Jag kan förklara begrepp utan att påstå livevärden.",
  constrained_sources:
    "Svaret bör grunda sig i tydliga källor och citeringar.",
  constrained_legal_tax:
    "Jag kan ge allmän information om juridik och skatt, men inte personlig rådgivning för din situation.",
  blocked_generic: "Kan inte hjälpa med den typen av begäran.",
  blocked_guaranteed_return:
    "Jag kan inte hjälpa till med löften om garanterad eller riskfri investeringsavkastning.",
  blocked_market_abuse:
    "Jag kan inte hjälpa till med marknadsmanipulation eller liknande begäran.",
  blocked_secrets:
    "Jag kan inte lämna ut nycklar, lösenord, tokens eller andra hemligheter.",
  blocked_system_or_override:
    "Jag kan inte avslöja interna instruktioner eller kringgå säkerhetsregler.",
  blocked_privacy:
    "Jag kan inte visa eller använda en annan användares privata data.",
  blocked_admin:
    "Jag kan inte utföra administratörs- eller behörighetsåtgärder för konton.",
};

/**
 * Shared assessment — JSON-safe, no user text, no rule/regex details.
 */
export type DivBrainGuardrailAssessment = {
  decision: DivBrainGuardrailDecision;
  reasonCodes: DivBrainGuardrailReasonCode[];
  constraints: DivBrainGuardrailConstraint[];
  policyVersion: typeof DIVBRAIN_GUARDRAIL_POLICY_VERSION;
  publicMessageKey: DivBrainGuardrailPublicMessageKey;
  publicMessage: string;
};

export type BuildDivBrainGuardrailAssessmentInput = {
  decision: DivBrainGuardrailDecision;
  reasonCodes: readonly DivBrainGuardrailReasonCode[];
  constraints: readonly DivBrainGuardrailConstraint[];
  publicMessageKey: DivBrainGuardrailPublicMessageKey;
};

const REASON_RANK = new Map<DivBrainGuardrailReasonCode, number>(
  DIVBRAIN_GUARDRAIL_REASON_CODES.map((code, index) => [code, index]),
);

const CONSTRAINT_RANK = new Map<DivBrainGuardrailConstraint, number>(
  DIVBRAIN_GUARDRAIL_CONSTRAINTS.map((code, index) => [code, index]),
);

export function isDivBrainGuardrailDecision(
  value: unknown,
): value is DivBrainGuardrailDecision {
  return (
    typeof value === "string" &&
    (DIVBRAIN_GUARDRAIL_DECISIONS as readonly string[]).includes(value)
  );
}

export function isDivBrainGuardrailReasonCode(
  value: unknown,
): value is DivBrainGuardrailReasonCode {
  return (
    typeof value === "string" &&
    (DIVBRAIN_GUARDRAIL_REASON_CODES as readonly string[]).includes(value)
  );
}

export function isDivBrainGuardrailConstraint(
  value: unknown,
): value is DivBrainGuardrailConstraint {
  return (
    typeof value === "string" &&
    (DIVBRAIN_GUARDRAIL_CONSTRAINTS as readonly string[]).includes(value)
  );
}

export function isDivBrainGuardrailPublicMessageKey(
  value: unknown,
): value is DivBrainGuardrailPublicMessageKey {
  return (
    typeof value === "string" &&
    (DIVBRAIN_GUARDRAIL_PUBLIC_MESSAGE_KEYS as readonly string[]).includes(
      value,
    )
  );
}

/** Deduplicate and sort reason codes in canonical priority order. */
export function normalizeDivBrainGuardrailReasonCodes(
  codes: readonly DivBrainGuardrailReasonCode[],
): DivBrainGuardrailReasonCode[] {
  const unique = new Set<DivBrainGuardrailReasonCode>();
  for (const code of codes) {
    if (isDivBrainGuardrailReasonCode(code)) {
      unique.add(code);
    }
  }

  return [...unique].sort(
    (a, b) => (REASON_RANK.get(a) ?? 999) - (REASON_RANK.get(b) ?? 999),
  );
}

/** Deduplicate and sort constraints in canonical order. */
export function normalizeDivBrainGuardrailConstraints(
  constraints: readonly DivBrainGuardrailConstraint[],
): DivBrainGuardrailConstraint[] {
  const unique = new Set<DivBrainGuardrailConstraint>();
  for (const constraint of constraints) {
    if (isDivBrainGuardrailConstraint(constraint)) {
      unique.add(constraint);
    }
  }

  return [...unique].sort(
    (a, b) =>
      (CONSTRAINT_RANK.get(a) ?? 999) - (CONSTRAINT_RANK.get(b) ?? 999),
  );
}

/**
 * Derive decision from findings:
 * block > allow_with_constraints > allow.
 */
export function deriveDivBrainGuardrailDecision(input: {
  hasBlockFinding: boolean;
  reasonCodes: readonly DivBrainGuardrailReasonCode[];
  constraints: readonly DivBrainGuardrailConstraint[];
}): DivBrainGuardrailDecision {
  if (input.hasBlockFinding) {
    return "block";
  }

  if (input.reasonCodes.length > 0 || input.constraints.length > 0) {
    return "allow_with_constraints";
  }

  return "allow";
}

export function resolveDivBrainGuardrailPublicMessage(
  key: DivBrainGuardrailPublicMessageKey,
): string {
  return DIVBRAIN_GUARDRAIL_PUBLIC_MESSAGES_SV[key];
}

/**
 * Build an assessment from catalog-backed fields only.
 * Public message text is always resolved from the static catalog.
 */
export function buildDivBrainGuardrailAssessment(
  input: BuildDivBrainGuardrailAssessmentInput,
): DivBrainGuardrailAssessment {
  const reasonCodes = normalizeDivBrainGuardrailReasonCodes(input.reasonCodes);
  const constraints = normalizeDivBrainGuardrailConstraints(input.constraints);

  return {
    decision: input.decision,
    reasonCodes,
    constraints,
    policyVersion: DIVBRAIN_GUARDRAIL_POLICY_VERSION,
    publicMessageKey: input.publicMessageKey,
    publicMessage: resolveDivBrainGuardrailPublicMessage(input.publicMessageKey),
  };
}

export function isDivBrainGuardrailAssessment(
  value: unknown,
): value is DivBrainGuardrailAssessment {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<DivBrainGuardrailAssessment>;

  if (
    !isDivBrainGuardrailDecision(candidate.decision) ||
    !Array.isArray(candidate.reasonCodes) ||
    !Array.isArray(candidate.constraints) ||
    candidate.policyVersion !== DIVBRAIN_GUARDRAIL_POLICY_VERSION ||
    !isDivBrainGuardrailPublicMessageKey(candidate.publicMessageKey) ||
    typeof candidate.publicMessage !== "string"
  ) {
    return false;
  }

  if (
    candidate.publicMessage !==
    resolveDivBrainGuardrailPublicMessage(candidate.publicMessageKey)
  ) {
    return false;
  }

  const normalizedReasons = normalizeDivBrainGuardrailReasonCodes(
    candidate.reasonCodes as DivBrainGuardrailReasonCode[],
  );
  const normalizedConstraints = normalizeDivBrainGuardrailConstraints(
    candidate.constraints as DivBrainGuardrailConstraint[],
  );

  if (
    candidate.reasonCodes.length !== normalizedReasons.length ||
    candidate.constraints.length !== normalizedConstraints.length
  ) {
    return false;
  }

  for (let i = 0; i < normalizedReasons.length; i += 1) {
    if (candidate.reasonCodes[i] !== normalizedReasons[i]) {
      return false;
    }
  }

  for (let i = 0; i < normalizedConstraints.length; i += 1) {
    if (candidate.constraints[i] !== normalizedConstraints[i]) {
      return false;
    }
  }

  return true;
}

export function isDivBrainGuardrailPolicyBlock(
  assessment: DivBrainGuardrailAssessment,
): boolean {
  return assessment.decision === "block";
}

/**
 * Select a single catalog message key from the highest-priority reason.
 * Never concatenates messages.
 */
export function selectDivBrainGuardrailPublicMessageKey(input: {
  decision: DivBrainGuardrailDecision;
  reasonCodes: readonly DivBrainGuardrailReasonCode[];
}): DivBrainGuardrailPublicMessageKey {
  if (input.decision === "allow" && input.reasonCodes.length === 0) {
    return "allow_education";
  }

  const primary = input.reasonCodes[0];

  if (input.decision === "block") {
    switch (primary) {
      case "guaranteed_or_risk_free_return":
        return "blocked_guaranteed_return";
      case "market_manipulation":
      case "insider_or_confidential_trading":
        return "blocked_market_abuse";
      case "credential_or_secret_request":
        return "blocked_secrets";
      case "system_prompt_or_policy_extraction":
      case "instruction_override_attempt":
        return "blocked_system_or_override";
      case "other_user_private_data_request":
        return "blocked_privacy";
      case "unauthorized_account_or_admin_action":
        return "blocked_admin";
      default:
        return "blocked_generic";
    }
  }

  switch (primary) {
    case "personal_financial_advice":
      return "constrained_personal_advice";
    case "legal_or_tax_personalization":
      return "constrained_legal_tax";
    case "live_or_current_data_required":
      return "constrained_live_data";
    case "source_grounding_required":
      return "constrained_sources";
    default:
      return "constrained_general";
  }
}
