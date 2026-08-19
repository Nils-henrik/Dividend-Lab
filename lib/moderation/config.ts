import {
  CONTENT_REPORT_CATEGORIES,
  CONTENT_REPORT_KINDS,
  CONTENT_REPORT_TARGET_TYPES,
  MODERATION_ACTION_TYPES,
  MODERATION_BASIS_TYPES,
  type ContentReportCategory,
  type ContentReportKind,
  type ContentReportTargetType,
  type ModerationActionType,
  type ModerationBasisType,
} from "./types";

export const CONTENT_REPORT_EXPLANATION_MIN_LENGTH = 20;
export const CONTENT_REPORT_EXPLANATION_MAX_LENGTH = 5000;
export const CONTENT_REPORT_LEGAL_BASIS_MAX_LENGTH = 1000;
export const MODERATION_REASON_MIN_LENGTH = 20;
export const MODERATION_REASON_MAX_LENGTH = 5000;
export const MODERATION_SCOPE_MAX_LENGTH = 1000;
export const MODERATION_APPEAL_MAX_LENGTH = 5000;

export const REPORT_CATEGORY_LABELS: Record<ContentReportCategory, string> = {
  child_safety: "Sexuella övergrepp mot barn eller exploatering",
  threats_or_violence: "Hot, våld eller fara för liv och säkerhet",
  hate_or_illegal_discrimination: "Hat eller olaglig diskriminering",
  harassment_or_defamation: "Trakasserier eller förtal",
  privacy_or_personal_data: "Integritet eller olovlig publicering av personuppgifter",
  fraud_or_market_manipulation: "Bedrägeri, marknadsmanipulation eller vilseledande uppgifter",
  copyright_or_ip: "Upphovsrätt eller annan immaterialrätt",
  other_illegal: "Annat misstänkt olagligt innehåll",
  spam_or_marketing: "Spam eller otillbörlig marknadsföring",
  impersonation: "Identitetsförfalskning",
  other_terms_violation: "Annat brott mot DivLabs regler",
};

export const MODERATION_ACTION_LABELS: Record<ModerationActionType, string> = {
  no_action: "Ingen begränsning",
  hide_content: "Dölj innehåll",
  remove_content: "Ta bort innehåll",
  clear_profile_bio: "Ta bort profilens bio",
  remove_profile_avatar: "Ta bort profilbild",
  warn_user: "Varning utan innehållsbegränsning",
  escalate_authorities: "Eskalera till behörig myndighet",
};

export function isContentReportTargetType(value: string): value is ContentReportTargetType {
  return CONTENT_REPORT_TARGET_TYPES.includes(value as ContentReportTargetType);
}

export function isContentReportKind(value: string): value is ContentReportKind {
  return CONTENT_REPORT_KINDS.includes(value as ContentReportKind);
}

export function isContentReportCategory(value: string): value is ContentReportCategory {
  return CONTENT_REPORT_CATEGORIES.includes(value as ContentReportCategory);
}

export function isModerationActionType(value: string): value is ModerationActionType {
  return MODERATION_ACTION_TYPES.includes(value as ModerationActionType);
}

export function isModerationBasisType(value: string): value is ModerationBasisType {
  return MODERATION_BASIS_TYPES.includes(value as ModerationBasisType);
}

export function isIllegalReportCategory(category: ContentReportCategory) {
  return !["spam_or_marketing", "impersonation", "other_terms_violation"].includes(category);
}

export function isIdentityExceptionCategory(category: ContentReportCategory) {
  return category === "child_safety";
}

export function isActionAllowedForTarget(
  action: ModerationActionType,
  targetType: ContentReportTargetType,
) {
  if (["no_action", "warn_user", "escalate_authorities"].includes(action)) {
    return true;
  }

  if (["forum_thread", "forum_reply", "learning_comment"].includes(targetType)) {
    return action === "hide_content" || action === "remove_content";
  }

  if (targetType === "profile") {
    return action === "clear_profile_bio" || action === "remove_profile_avatar";
  }

  if (targetType === "profile_avatar") {
    return action === "remove_profile_avatar";
  }

  return false;
}

export function getModerationScopeDescription(
  action: ModerationActionType,
  targetType: ContentReportTargetType,
) {
  switch (action) {
    case "hide_content":
      return "Det anmälda innehållet har dolts från DivLabs publika ytor.";
    case "remove_content":
      return "Det anmälda innehållet har tagits bort från DivLabs publika ytor.";
    case "clear_profile_bio":
      return "Den anmälda profiltexten har tagits bort från den publika profilen.";
    case "remove_profile_avatar":
      return "Den anmälda profilbilden har tagits bort från den publika profilen.";
    case "warn_user":
      return "Ingen teknisk begränsning har lagts på innehållet; användaren har fått en modereringsvarning.";
    case "escalate_authorities":
      return "Ärendet har markerats för skyndsam intern eskalering till behörig myndighet när tillämpligt.";
    case "no_action":
    default:
      return targetType === "other"
        ? "Ingen begränsning har vidtagits efter granskningen."
        : "Det anmälda innehållet har lämnats oförändrat efter granskningen.";
  }
}
