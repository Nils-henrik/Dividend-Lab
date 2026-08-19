export const CONTENT_REPORT_TARGET_TYPES = [
  "forum_thread",
  "forum_reply",
  "learning_comment",
  "profile",
  "profile_avatar",
  "other",
] as const;

export type ContentReportTargetType = (typeof CONTENT_REPORT_TARGET_TYPES)[number];

export const CONTENT_REPORT_KINDS = ["illegal_content", "terms_violation"] as const;
export type ContentReportKind = (typeof CONTENT_REPORT_KINDS)[number];

export const CONTENT_REPORT_CATEGORIES = [
  "child_safety",
  "threats_or_violence",
  "hate_or_illegal_discrimination",
  "harassment_or_defamation",
  "privacy_or_personal_data",
  "fraud_or_market_manipulation",
  "copyright_or_ip",
  "other_illegal",
  "spam_or_marketing",
  "impersonation",
  "other_terms_violation",
] as const;

export type ContentReportCategory = (typeof CONTENT_REPORT_CATEGORIES)[number];

export const MODERATION_ACTION_TYPES = [
  "no_action",
  "hide_content",
  "remove_content",
  "clear_profile_bio",
  "remove_profile_avatar",
  "warn_user",
  "escalate_authorities",
] as const;

export type ModerationActionType = (typeof MODERATION_ACTION_TYPES)[number];

export const MODERATION_BASIS_TYPES = ["law", "terms", "both", "none"] as const;
export type ModerationBasisType = (typeof MODERATION_BASIS_TYPES)[number];

export type ContentReportActionState = {
  status: "idle" | "error" | "success";
  message: string;
  referenceCode?: string;
  emailStatus?: "sent" | "skipped" | "failed";
};

export type ModerationDecisionActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type ModerationAppealActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type ContentReportRecord = {
  id: string;
  reference_code: string;
  reporter_user_id: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  report_kind: ContentReportKind;
  category: ContentReportCategory;
  target_type: ContentReportTargetType;
  target_id: string | null;
  target_url: string;
  target_label: string | null;
  target_owner_user_id: string | null;
  target_snapshot: Record<string, unknown>;
  explanation: string;
  legal_basis: string | null;
  good_faith_confirmed: boolean;
  identity_exception_claimed: boolean;
  status: "new" | "under_review" | "actioned" | "no_action" | "escalated";
  acknowledged_at: string;
  receipt_email_status: "pending" | "sent" | "skipped" | "failed";
  receipt_email_error: string | null;
  receipt_sent_at: string | null;
  decision_email_status: "pending" | "sent" | "skipped" | "failed";
  decision_email_error: string | null;
  decision_notified_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ModerationActionRecord = {
  id: string;
  report_id: string;
  moderator_user_id: string;
  affected_user_id: string | null;
  action_type: ModerationActionType;
  basis_type: ModerationBasisType;
  legal_basis: string | null;
  terms_basis: string | null;
  factual_reason: string;
  scope_description: string;
  automated: boolean;
  automation_details: string | null;
  effective_until: string | null;
  created_at: string;
};

export type ModerationAppealRecord = {
  id: string;
  moderation_action_id: string;
  appellant_user_id: string;
  statement: string;
  status: "open" | "upheld" | "changed" | "reversed";
  reviewer_user_id: string | null;
  outcome_reason: string | null;
  created_at: string;
  decided_at: string | null;
};
