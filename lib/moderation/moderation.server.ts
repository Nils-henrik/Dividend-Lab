import "server-only";

import { revalidatePath } from "next/cache";
import { createModerationAdminClient } from "./admin";
import { requireModeratorUser } from "./access.server";
import {
  getModerationScopeDescription,
  isActionAllowedForTarget,
  isModerationActionType,
  isModerationBasisType,
  MODERATION_REASON_MAX_LENGTH,
  MODERATION_REASON_MIN_LENGTH,
  MODERATION_SCOPE_MAX_LENGTH,
} from "./config";
import {
  sendAffectedUserDecisionEmail,
  sendReporterDecisionEmail,
} from "./email";
import type {
  ContentReportRecord,
  ModerationActionRecord,
  ModerationDecisionActionState,
} from "./types";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateModeratedTarget(report: ContentReportRecord) {
  revalidatePath("/moderation");
  revalidatePath("/forum");
  revalidatePath("/learning");

  try {
    const url = new URL(report.target_url);
    revalidatePath(`${url.pathname}${url.search}`);
  } catch {
    // The canonical target URL is validated at report creation. Ignore malformed legacy rows.
  }
}

export async function getModerationQueue(limit = 100) {
  await requireModeratorUser();
  const admin = createModerationAdminClient();
  if (!admin) throw new Error("Moderationsdatabasen är inte konfigurerad.");

  const { data, error } = await admin
    .from("content_reports")
    .select(
      "id,reference_code,report_kind,category,target_type,target_label,target_url,status,created_at,reporter_name,reporter_email,identity_exception_claimed",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getModerationCase(reportId: string) {
  await requireModeratorUser();
  const admin = createModerationAdminClient();
  if (!admin) throw new Error("Moderationsdatabasen är inte konfigurerad.");

  const [{ data: report, error: reportError }, { data: actions, error: actionsError }] =
    await Promise.all([
      admin
        .from("content_reports")
        .select("*")
        .eq("id", reportId)
        .maybeSingle(),
      admin
        .from("moderation_actions")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at", { ascending: false }),
    ]);

  if (reportError) throw new Error(reportError.message);
  if (actionsError) throw new Error(actionsError.message);

  return {
    report: (report as ContentReportRecord | null) ?? null,
    actions: (actions as ModerationActionRecord[] | null) ?? [],
  };
}

async function updateDecisionDelivery(input: {
  admin: NonNullable<ReturnType<typeof createModerationAdminClient>>;
  reportId: string;
  result:
    | { status: "sent"; providerMessageId: string | null }
    | { status: "skipped"; reason: string }
    | { status: "failed"; reason: string };
}) {
  await input.admin
    .from("content_reports")
    .update({
      decision_email_status: input.result.status,
      decision_email_error:
        input.result.status === "sent" ? null : input.result.reason.slice(0, 500),
      decision_notified_at:
        input.result.status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", input.reportId);
}

export async function decideModerationReport(
  formData: FormData,
): Promise<ModerationDecisionActionState> {
  const moderator = await requireModeratorUser();
  const reportId = getFormString(formData, "reportId");
  const actionTypeRaw = getFormString(formData, "actionType");
  const basisTypeRaw = getFormString(formData, "basisType");
  const legalBasis = getFormString(formData, "legalBasis");
  const termsBasis = getFormString(formData, "termsBasis");
  const factualReason = getFormString(formData, "factualReason");
  const automationDetails = getFormString(formData, "automationDetails");
  const effectiveUntilRaw = getFormString(formData, "effectiveUntil");
  const automated = formData.get("automated") === "on";

  if (!reportId) {
    return { status: "error", message: "Rapport-ID saknas." };
  }

  if (!isModerationActionType(actionTypeRaw)) {
    return { status: "error", message: "Välj en giltig modereringsåtgärd." };
  }

  if (!isModerationBasisType(basisTypeRaw)) {
    return { status: "error", message: "Välj vilken grund beslutet bygger på." };
  }

  if (
    factualReason.length < MODERATION_REASON_MIN_LENGTH ||
    factualReason.length > MODERATION_REASON_MAX_LENGTH
  ) {
    return {
      status: "error",
      message: `Motiveringen måste vara ${MODERATION_REASON_MIN_LENGTH}–${MODERATION_REASON_MAX_LENGTH} tecken.`,
    };
  }

  if ((basisTypeRaw === "law" || basisTypeRaw === "both") && !legalBasis) {
    return { status: "error", message: "Ange rättslig grund när beslutet bygger på lag." };
  }

  if ((basisTypeRaw === "terms" || basisTypeRaw === "both") && !termsBasis) {
    return { status: "error", message: "Ange vilken DivLab-regel beslutet bygger på." };
  }

  if (automated && !automationDetails) {
    return { status: "error", message: "Beskriv hur automatisering användes i beslutet." };
  }

  let effectiveUntil: string | null = null;
  if (effectiveUntilRaw) {
    const parsed = new Date(effectiveUntilRaw);
    if (Number.isNaN(parsed.getTime())) {
      return { status: "error", message: "Sluttiden för begränsningen är ogiltig." };
    }
    effectiveUntil = parsed.toISOString();
  }

  const admin = createModerationAdminClient();
  if (!admin) {
    return { status: "error", message: "Moderationsdatabasen är inte konfigurerad." };
  }

  const { data: reportData, error: reportError } = await admin
    .from("content_reports")
    .select("*")
    .eq("id", reportId)
    .maybeSingle();

  if (reportError || !reportData) {
    return { status: "error", message: "Anmälan kunde inte hittas." };
  }

  const report = reportData as ContentReportRecord;
  if (["actioned", "no_action", "escalated"].includes(report.status)) {
    return { status: "error", message: "Ärendet har redan ett registrerat beslut." };
  }

  if (!isActionAllowedForTarget(actionTypeRaw, report.target_type)) {
    return {
      status: "error",
      message: "Den valda åtgärden kan inte användas för den här typen av innehåll.",
    };
  }

  const scopeDescription = getModerationScopeDescription(
    actionTypeRaw,
    report.target_type,
  ).slice(0, MODERATION_SCOPE_MAX_LENGTH);

  const { data: actionData, error: actionError } = await admin.rpc(
    "apply_moderation_decision",
    {
      p_report_id: report.id,
      p_moderator_user_id: moderator.id,
      p_action_type: actionTypeRaw,
      p_basis_type: basisTypeRaw,
      p_legal_basis: legalBasis || null,
      p_terms_basis: termsBasis || null,
      p_factual_reason: factualReason,
      p_scope_description: scopeDescription,
      p_automated: automated,
      p_automation_details: automationDetails || null,
      p_effective_until: effectiveUntil,
    },
  );

  if (actionError || !actionData) {
    console.error("[moderation] apply decision failed", {
      code: actionError?.code,
      message: actionError?.message,
    });
    return {
      status: "error",
      message: "Beslutet kunde inte genomföras atomiskt. Ingen åtgärd har registrerats.",
    };
  }

  const action = (Array.isArray(actionData) ? actionData[0] : actionData) as
    | ModerationActionRecord
    | undefined;

  if (!action) {
    return { status: "error", message: "Beslutet genomfördes men revisionsposten kunde inte läsas." };
  }

  if (report.reporter_email) {
    const reporterResult = await sendReporterDecisionEmail({
      to: report.reporter_email,
      report,
      action,
    });
    await updateDecisionDelivery({ admin, reportId: report.id, result: reporterResult });
  } else {
    await updateDecisionDelivery({
      admin,
      reportId: report.id,
      result: { status: "skipped", reason: "reporter_email_not_provided" },
    });
  }

  const shouldNotifyAffectedUser =
    Boolean(action.affected_user_id) && action.action_type !== "no_action";

  if (shouldNotifyAffectedUser && action.affected_user_id) {
    const { data: affectedAuth } = await admin.auth.admin.getUserById(action.affected_user_id);
    const affectedEmail = affectedAuth.user?.email?.trim();

    if (affectedEmail) {
      const affectedResult = await sendAffectedUserDecisionEmail({
        to: affectedEmail,
        report,
        action,
      });

      if (affectedResult.status !== "sent") {
        console.error("[moderation] affected user statement email not sent", {
          reportId: report.id,
          status: affectedResult.status,
          reason: affectedResult.reason,
        });
      }
    }
  }

  revalidateModeratedTarget(report);

  return {
    status: "success",
    message: "Beslutet är genomfört och revisionsloggen har sparats.",
  };
}
