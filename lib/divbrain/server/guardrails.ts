/**
 * Server-controlled DivBrain deterministic guardrail evaluation.
 *
 * Multi-finding aggregation: collect all matching reasons/constraints,
 * dedupe/sort canonically, derive decision (block > allow_with_constraints >
 * allow). Never returns raw user text, rule ids, or regex details.
 *
 * This module must never be imported by client components.
 *
 * Limitations: keyword/pattern filter only — not complete semantic safety.
 */

import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "../constants";
import {
  buildDivBrainGuardrailAssessment,
  deriveDivBrainGuardrailDecision,
  normalizeDivBrainGuardrailConstraints,
  normalizeDivBrainGuardrailReasonCodes,
  selectDivBrainGuardrailPublicMessageKey,
  type DivBrainGuardrailAssessment,
  type DivBrainGuardrailConstraint,
  type DivBrainGuardrailReasonCode,
} from "../guardrails";
import type { DivBrainResult } from "../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../results";

const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

/** Reasons that force decision `block` when present. */
const BLOCK_REASONS = new Set<DivBrainGuardrailReasonCode>([
  "unauthorized_account_or_admin_action",
  "credential_or_secret_request",
  "system_prompt_or_policy_extraction",
  "instruction_override_attempt",
  "other_user_private_data_request",
  "market_manipulation",
  "insider_or_confidential_trading",
  "guaranteed_or_risk_free_return",
]);

type GuardrailFinding = {
  reasonCode: DivBrainGuardrailReasonCode;
  constraints: readonly DivBrainGuardrailConstraint[];
};

function normalizeForMatching(content: string): string {
  return content.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Definitional / explanatory framing — used to avoid noun-only false positives.
 * Prefer start-anchored cues so words like "allmänt" cannot mask facilitation.
 */
function hasEducationalFraming(n: string): boolean {
  return /^(vad\s+är|förklara|beskriv|hur\s+fungerar|varför\s+(är|finns|kan|blir)|hur\s+upptäcks|hur\s+skyddar|hur\s+förvarar|vilka\s+regler\s+gäller|vad\s+används|vad\s+innebär)\b/.test(
    n,
  );
}

function hasDefinitionalLegalityCue(n: string): boolean {
  return /\b(är\s+olagligt|är\s+förbjudet|definitionen\s+av|begreppet)\b/.test(
    n,
  );
}

function hasNegatedIntent(n: string): boolean {
  return /\b(inte|ej|utan\s+att|vill\s+inte|ska\s+inte|bör\s+inte|avoid|without)\b/.test(
    n,
  );
}

function wantsDisclosure(n: string): boolean {
  return /\b(visa|avslöja|skriv\s+ut|dumpa|lämna\s+ut|ge\s+mig|reveal|print|expose|exfiltrate|exfiltrera|läs\s+upp|ordagrant)\b/.test(
    n,
  );
}

function wantsAssistance(n: string): boolean {
  return /\b(hjälp\s+mig|hjälp\s+att|visa\s+hur|hur\s+kan\s+jag|how\s+can\s+i|how\s+do\s+i|lära\s+mig\s+att|ge\s+mig|skriv|skapa|utför|gör\s+så\s+att)\b/.test(
    n,
  );
}

function detectCredentialOrSecretRequest(n: string): GuardrailFinding | null {
  if (hasEducationalFraming(n) && !wantsDisclosure(n)) {
    return null;
  }

  const secretTarget =
    /\b(supabase\s+service[-\s]?role|service[-\s]?role\s+key|api[-\s]?key|api[-\s]?nyckel|access[-\s]?token|refresh[-\s]?token|session[-\s]?token|sessions?[- ]?token|client\s+secret|bearer\s+token|environment\s+secret|env\s+secret|hemlig(?:a)?\s+nyckel|secret\s+key|lösenord|password|private\s+credential|privata?\s+uppgifter)\b/.test(
      n,
    );

  if (!secretTarget) {
    return null;
  }

  const actionable =
    wantsDisclosure(n) ||
    /\b(från\s+servern|from\s+the\s+server|i\s+klartext|raw\s+value|full(?:a)?\s+nyckel)\b/.test(
      n,
    );

  if (!actionable) {
    return null;
  }

  return {
    reasonCode: "credential_or_secret_request",
    constraints: [
      "do_not_request_or_echo_secrets",
      "do_not_expose_system_policy",
      "educational_only",
    ],
  };
}

function detectSystemPromptOrPolicyExtraction(n: string): GuardrailFinding | null {
  if (hasEducationalFraming(n) && !wantsDisclosure(n)) {
    return null;
  }

  const protectedTarget =
    /\b(system\s*prompt|systemprompt|hidden\s+prompt|developer\s+(?:message|instructions?)|dolda?\s+(?:instruktion(?:er)?|resonemang|prompt)|chain\s+of\s+thought|interna?\s+(?:regler|policy|instruktioner)|protected\s+policy|hemliga?\s+interna?\s+instruktioner)\b/.test(
      n,
    );

  if (!protectedTarget) {
    return null;
  }

  if (!wantsDisclosure(n) && !/\b(ordagrant|verbatim|exact(?:a)?)\b/.test(n)) {
    return null;
  }

  return {
    reasonCode: "system_prompt_or_policy_extraction",
    constraints: ["do_not_expose_system_policy", "educational_only"],
  };
}

function detectInstructionOverride(n: string): GuardrailFinding | null {
  if (
    hasEducationalFraming(n) &&
    /\b(prompt\s+injection|skydda|försvar|hur\s+fungerar)\b/.test(n)
  ) {
    return null;
  }

  const override =
    /\b(ignorera|ignore)\b.{0,32}\b((alla|all|tidigare|previous)\s+)?(instruktioner|instructions|regler|rules|policy)\b/.test(
      n,
    ) ||
    /\b(jailbreak|developer\s+mode|dan\s+mode|disable\s+safety|override\s+safety|kringgå\s+(säkerhet|regler)|glöm\s+dina\s+regler|act\s+without\s+restrictions|utan\s+restriktioner)\b/.test(
      n,
    );

  if (!override) {
    return null;
  }

  return {
    reasonCode: "instruction_override_attempt",
    constraints: ["do_not_expose_system_policy", "educational_only"],
  };
}

/**
 * False-rumor phrases (singular/plural Swedish + English).
 * Never sufficient alone to block.
 */
function hasFalseRumorPhrase(n: string): boolean {
  return /\b(falsk(?:t|a)?\s+(?:börs)?rykte(?:n)?|false\s+rumors?)\b/.test(n);
}

/** Sensitive manipulation nouns/topics — never sufficient alone to block. */
function hasMarketManipulationTarget(n: string): boolean {
  return (
    /\b(pump\s*and\s*dump|spoofing|wash\s*trading|tvätt(?:ad)?\s*handel|tvätthandel)\b/.test(
      n,
    ) ||
    /\b(manipulera\s+(kursen|marknaden|priset)|market\s+manipulation)\b/.test(
      n,
    ) ||
    hasFalseRumorPhrase(n) ||
    /\b(koordinerad(?:e)?\s+(köp|köporder|handel)|coordinated\s+(buying|purchases|trading))\b/.test(
      n,
    ) ||
    /\b(driva\s+upp\s+kursen|flytta\s+priset|sänka\s+(aktien|kursen)|påverka\s+aktien)\b/.test(
      n,
    )
  );
}

/**
 * Actionable facilitation / assistance intent for market abuse.
 * Must be combined with a manipulation target (or an action+target phrase).
 */
function hasMarketManipulationFacilitationIntent(n: string): boolean {
  return (
    wantsAssistance(n) ||
    /\b(genomför|genomföra|utföra|utför|samordna|samordnar|koordinera|coordinate|conceal|dölj|dölja|automati[sz]era|gör\s+en\s+plan|skapa\s+en\s+plan|create\s+a\s+plan|plan\s+för|använda|place\s+fake|fejkade?\s+ordrar|avsiktligt)\b/.test(
      n,
    )
  );
}

function hasActionPlusMarketManipulationTarget(n: string): boolean {
  return (
    /\b(pumpa|dumpa)\b.{0,40}\b(aktie|kurs|pris|ticker)\b/.test(n) ||
    (/\b(sprida|sprider|skriv)\b/.test(n) && hasFalseRumorPhrase(n)) ||
    /\b(dölja|conceal|dölj)\b.{0,48}\b(koordinerad|coordinated|samordnad)\b/.test(
      n,
    ) ||
    /\b(samordna|samordnar|koordinera)\b.{0,48}\b(köp|handel|kurs|pris)\b/.test(
      n,
    )
  );
}

function hasNegatedMarketManipulationTopic(n: string): boolean {
  return (
    /\b(manipulera|manipulation|pump\s*and\s*dump|spoofing|wash\s*trading|tvätthandel)\b/.test(
      n,
    ) || hasFalseRumorPhrase(n)
  );
}

function detectMarketManipulation(n: string): GuardrailFinding | null {
  if (
    hasEducationalFraming(n) ||
    hasDefinitionalLegalityCue(n) ||
    (hasNegatedIntent(n) && hasNegatedMarketManipulationTopic(n))
  ) {
    return null;
  }

  const facilitation =
    hasActionPlusMarketManipulationTarget(n) ||
    (hasMarketManipulationFacilitationIntent(n) &&
      hasMarketManipulationTarget(n));

  if (!facilitation) {
    return null;
  }

  return {
    reasonCode: "market_manipulation",
    constraints: ["educational_only", "do_not_expose_system_policy"],
  };
}

function detectInsiderOrConfidentialTrading(n: string): GuardrailFinding | null {
  if (
    hasEducationalFraming(n) ||
    hasDefinitionalLegalityCue(n) ||
    (hasNegatedIntent(n) && /\b(insiderhandel|insiderinformation)\b/.test(n))
  ) {
    return null;
  }

  const facilitation =
    /\b(handla|köp|sälj|tjäna|profit|trade|trading)\b.{0,48}\b(insiderinformation|insider\s*info|hemlig\s+information|konfidentiell\s+information|opublicerad\s+information|material\s+non[-\s]?public|mnpi)\b/.test(
      n,
    ) ||
    /\b(insiderinformation|insider\s*info|konfidentiell|opublicerad)\b.{0,48}\b(handla|köp|sälj|trade|trading|tjäna)\b/.test(
      n,
    ) ||
    /\b(köp|sälj|handla)\b.{0,40}\b(innan\s+offentliggörande|före\s+rapporten|ahead\s+of\s+earnings)\b/.test(
      n,
    );

  if (!facilitation) {
    return null;
  }

  return {
    reasonCode: "insider_or_confidential_trading",
    constraints: ["educational_only", "legal_or_tax_information_only"],
  };
}

function detectGuaranteedOrRiskFreeReturn(n: string): GuardrailFinding | null {
  if (
    hasEducationalFraming(n) ||
    /\b(insättningsgaranti|kapitalgaranti|deposit\s+guarantee|riskfri\s+ränta|risk[-\s]?free\s+rate)\b/.test(
      n,
    ) ||
    (hasNegatedIntent(n) &&
      /\b(garanterad\s+avkastning|garanti|riskfri\s+avkastning|säker\s+vinst)\b/.test(
        n,
      ))
  ) {
    return null;
  }

  const request =
    /\b(ge\s+mig|hitta|visa|lova|promise|garanti(?:era)?|garanterad)\b.{0,40}\b(avkastning|vinst|return)\b/.test(
      n,
    ) ||
    /\b(garanterad|garanti)\b.{0,24}\b(avkastning|vinst|return)\b/.test(n) ||
    /\b(guaranteed\s+return|riskfri\s+vinst|säker\s+vinst)\b/.test(n) ||
    /\b(utan\s+risk)\b.{0,24}\b(avkastning|vinst|return|på\s+börsen)\b/.test(
      n,
    ) ||
    /\b(hur\s+får\s+jag)\b.{0,32}\b(säker\s+vinst|riskfri\s+vinst|garanterad\s+avkastning)\b/.test(
      n,
    );

  if (!request) {
    return null;
  }

  return {
    reasonCode: "guaranteed_or_risk_free_return",
    constraints: [
      "educational_only",
      "include_risk_and_uncertainty",
      "no_personal_recommendation",
    ],
  };
}

function detectPersonalFinancialAdvice(n: string): GuardrailFinding | null {
  const personalAsk =
    /\b(ska\s+jag|bör\s+jag)\s+(köpa|sälja|investera|allokera|behålla|placera)\b/.test(
      n,
    ) ||
    /\b(vilken\s+(aktie|fond|etf)\s+ska\s+jag|vilken\s+fond\s+passar|köp\s+åt\s+mig|sälj\s+åt\s+mig|allokera\s+min\s+portfölj|hur\s+ska\s+jag\s+(investera|placera)|hur\s+mycket\s+ska\s+jag\s+investera|är\s+\w+(?:\s+\w+)?\s+rätt\s+investering\s+för\s+mig|passar\s+bäst\s+till\s+mitt)\b/.test(
      n,
    ) ||
    /\b(rekommendera|recommend)\b.{0,40}\b(aktie|fond|etf|köp|sälj)\b/.test(
      n,
    ) ||
    /\b(mina?\s+\d[\d\s]*\s*kronor|mitt\s+barns\s+sparande|min\s+portfölj)\b/.test(
      n,
    ) ||
    /\b(buy|sell)\s+(me\s+)?(this\s+)?(stock|share|fund)\b/.test(n);

  if (!personalAsk) {
    return null;
  }

  if (
    hasEducationalFraming(n) &&
    !/\b(ska\s+jag|bör\s+jag|för\s+mig|åt\s+mig|min\s+portfölj|mina?\s+\d)\b/.test(
      n,
    )
  ) {
    return null;
  }

  return {
    reasonCode: "personal_financial_advice",
    constraints: [
      "educational_only",
      "no_personal_recommendation",
      "include_risk_and_uncertainty",
    ],
  };
}

function detectOtherUserPrivateData(n: string): GuardrailFinding | null {
  if (hasEducationalFraming(n) && !wantsDisclosure(n)) {
    return null;
  }

  const target =
    /\b(annan\s+användares|other\s+user'?s|andra\s+användares|någon\s+annans\s+konto)\b.{0,48}\b(portfölj|meddelanden|chatt|data|email|e-post|privata?\s+data)\b/.test(
      n,
    ) ||
    /\b(visa|dumpa|exfiltrate|exfiltrera|access)\b.{0,40}\b(användardata|user\s+data|alla\s+konton)\b/.test(
      n,
    );

  if (!target) {
    return null;
  }

  return {
    reasonCode: "other_user_private_data_request",
    constraints: ["do_not_access_other_user_data", "educational_only"],
  };
}

function detectUnauthorizedAdminAction(n: string): GuardrailFinding | null {
  if (
    hasEducationalFraming(n) &&
    /\b(vad\s+är|hur\s+fungerar|roll|behörighet|account\s+security|kontosäkerhet)\b/.test(
      n,
    )
  ) {
    return null;
  }

  const action =
    /\b(agera\s+som\s+administratör|act\s+as\s+admin|bypass\s+(auth|authorization|behörighet)|kringgå\s+behörighet|ge\s+mig\s+admin|elevate\s+privileges|ändra\s+en\s+annan\s+användares|alter\s+another\s+user'?s|ta\s+över\s+kontot|override\s+authorization)\b/.test(
      n,
    );

  if (!action) {
    return null;
  }

  return {
    reasonCode: "unauthorized_account_or_admin_action",
    constraints: ["no_account_or_admin_action", "educational_only"],
  };
}

function detectLegalOrTaxPersonalization(n: string): GuardrailFinding | null {
  if (
    hasEducationalFraming(n) &&
    !/\b(min\s+|mitt\s+|mina\s+|för\s+mig|specifik(?:a)?)\b/.test(n)
  ) {
    return null;
  }

  const personalized =
    /\b(skatteplanera\s+för\s+mig|min\s+deklaration|mitt\s+skatteärende|min\s+specifika|hur\s+ska\s+jag\s+deklarera|juridisk\s+rådgivning\s+för\s+mig|skatteråd\s+för\s+min|legal\s+advice\s+for\s+my|optionsaffär)\b/.test(
      n,
    ) ||
    /\b(hur\s+undviker\s+jag\s+skatt|tax\s+evasion|skatteflykt)\b/.test(n);

  if (!personalized) {
    return null;
  }

  return {
    reasonCode: "legal_or_tax_personalization",
    constraints: [
      "legal_or_tax_information_only",
      "educational_only",
      "no_personal_recommendation",
    ],
  };
}

function detectLiveOrCurrentData(n: string): GuardrailFinding | null {
  const liveAsk =
    /\b(aktuellt\s+pris|dagens\s+kurs|live\s*pris|realtids(?:pris|data)|current\s+price|latest\s+(price|report)|senaste\s+(priset|kursen|rapporten)|nuvarande\s+(pris|ränta)|current\s+interest\s+rate|what'?s\s+the\s+price\s+now)\b/.test(
      n,
    ) ||
    /\b(pris|kurs|ränta)\b.{0,24}\b(just\s+nu|i\s+dag|idag|nu|today|latest)\b/.test(
      n,
    ) ||
    /\b(latest|today|now|current|live)\b.{0,24}\b(price|report|rate|pris|kurs|ränta|rapport)\b/.test(
      n,
    );

  if (!liveAsk) {
    return null;
  }

  return {
    reasonCode: "live_or_current_data_required",
    constraints: [
      "require_current_data",
      "require_grounded_sources",
      "require_citations",
      "educational_only",
      "include_risk_and_uncertainty",
    ],
  };
}

function detectSourceGroundingRequired(n: string): GuardrailFinding | null {
  const explicit =
    /\b(med\s+källor|ange\s+källor|citera\s+källor|belägg\s+med\s+källor|cite\s+(your\s+)?sources|with\s+citations|nummererade\s+källor|nummererade\s+citeringar)\b/.test(
      n,
    );

  const companyFacts =
    /\b(vad\s+var|hur\s+hög\s+var|ange\s+siffror|rapportens\s+siffror|senaste\s+årsredovisning|utdelningshistorik\s+för)\b.{0,48}\b([a-zåäö]{2,}(?:\s+[a-z]\b)?)\b/.test(
      n,
    ) &&
    /\b(bolag|aktie|rapport|utdelning|vinst|omsättning|volvo|investor|ericsson|hm|h&m)\b/.test(
      n,
    );

  if (!explicit && !companyFacts) {
    return null;
  }

  // Pure concept questions should not require grounding.
  if (
    /\b(vad\s+är\s+(ett\s+)?p\/e|vad\s+är\s+direktavkastning|förklara\s+diversifiering)\b/.test(
      n,
    )
  ) {
    return null;
  }

  return {
    reasonCode: "source_grounding_required",
    constraints: [
      "require_grounded_sources",
      "require_citations",
      "educational_only",
    ],
  };
}

const FINDING_DETECTORS: ReadonlyArray<(n: string) => GuardrailFinding | null> =
  [
    detectUnauthorizedAdminAction,
    detectCredentialOrSecretRequest,
    detectSystemPromptOrPolicyExtraction,
    detectInstructionOverride,
    detectOtherUserPrivateData,
    detectMarketManipulation,
    detectInsiderOrConfidentialTrading,
    detectGuaranteedOrRiskFreeReturn,
    detectPersonalFinancialAdvice,
    detectLegalOrTaxPersonalization,
    detectLiveOrCurrentData,
    detectSourceGroundingRequired,
  ];

/**
 * Evaluate user message content against deterministic guardrail rules.
 *
 * Structural invalid input → technical `invalid_request`.
 * Policy outcomes → catalog-backed assessment without prompt text.
 */
export function evaluateDivBrainGuardrails(
  content: unknown,
): DivBrainResult<DivBrainGuardrailAssessment> {
  if (typeof content !== "string") {
    return divBrainFailureFromCode("invalid_request");
  }

  const trimmed = content.normalize("NFC").trim();

  if (!trimmed || trimmed.length > DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH) {
    return divBrainFailureFromCode("invalid_request");
  }

  if (CONTROL_CHARS_PATTERN.test(trimmed)) {
    return divBrainFailureFromCode("invalid_request");
  }

  const normalized = normalizeForMatching(trimmed);
  const findings: GuardrailFinding[] = [];

  for (const detect of FINDING_DETECTORS) {
    const finding = detect(normalized);
    if (finding) {
      findings.push(finding);
    }
  }

  const reasonCodes = normalizeDivBrainGuardrailReasonCodes(
    findings.map((finding) => finding.reasonCode),
  );
  const constraints = normalizeDivBrainGuardrailConstraints(
    findings.flatMap((finding) => finding.constraints),
  );
  const hasBlockFinding = reasonCodes.some((code) => BLOCK_REASONS.has(code));
  const decision = deriveDivBrainGuardrailDecision({
    hasBlockFinding,
    reasonCodes,
    constraints,
  });
  const publicMessageKey = selectDivBrainGuardrailPublicMessageKey({
    decision,
    reasonCodes,
  });

  return divBrainSuccess(
    buildDivBrainGuardrailAssessment({
      decision,
      reasonCodes,
      constraints,
      publicMessageKey,
    }),
  );
}
