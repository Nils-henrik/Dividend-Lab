import "server-only";

import { revalidatePath } from "next/cache";
import { createModerationAdminClient } from "./admin";
import { requireModeratorUser } from "./access.server";
import {
  getModerationScopeDescription,
  isActionAllowedForTarget,
  isContentReportTargetType,
  isModerationActionType,
  MODERATION_REASON_MAX_LENGTH,
  MODERATION_REASON_MIN_LENGTH,
} from "./config";
import { sendAffectedUserDecisionEmail } from "./email";
import type {
  ContentReportRecord,
  ContentReportTargetType,
  ModerationActionRecord,
  ModerationDecisionActionState,
} from "./types";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://divlab.se").replace(/\/$/, "");
const INTERNAL_TERMS_BASIS = "DivLabs användarvillkor och communityregler";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

type DirectTarget = {
  targetId: string;
  targetUrl: string;
  targetLabel: string;
  targetOwnerUserId: string | null;
  targetSnapshot: Record<string, unknown>;
};

async function resolveDirectTarget(
  targetType: ContentReportTargetType,
  targetId: string,
): Promise<DirectTarget | null> {
  const admin = createModerationAdminClient();
  if (!admin || !targetId) return null;

  if (targetType === "forum_thread") {
    const { data, error } = await admin
      .from("forum_threads")
      .select("id,slug,author_id,category_slug,title,body,created_at,updated_at,moderation_status")
      .eq("id", targetId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      targetId: data.id,
      targetUrl: `${SITE_URL}/forum/${encodeURIComponent(data.slug)}`,
      targetLabel: data.title,
      targetOwnerUserId: data.author_id,
      targetSnapshot: {
        id: data.id,
        slug: data.slug,
        categorySlug: data.category_slug,
        title: data.title,
        body: data.body,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        moderationStatus: data.moderation_status,
      },
    };
  }

  if (targetType === "forum_reply") {
    const { data, error } = await admin
      .from("forum_replies")
      .select("id,thread_id,author_id,body,created_at,updated_at,moderation_status")
      .eq("id", targetId)
      .maybeSingle();

    if (error || !data) return null;

    const { data: thread, error: threadError } = await admin
      .from("forum_threads")
      .select("slug,title")
      .eq("id", data.thread_id)
      .maybeSingle();

    if (threadError || !thread) return null;

    return {
      targetId: data.id,
      targetUrl: `${SITE_URL}/forum/${encodeURIComponent(thread.slug)}#reply-${data.id}`,
      targetLabel: `Svar i ${thread.title}`,
      targetOwnerUserId: data.author_id,
      targetSnapshot: {
        id: data.id,
        threadId: data.thread_id,
        threadSlug: thread.slug,
        threadTitle: thread.title,
        body: data.body,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        moderationStatus: data.moderation_status,
      },
    };
  }

  if (targetType === "learning_comment") {
    const { data, error } = await admin
      .from("learning_article_comments")
      .select("id,article_slug,user_id,body,created_at,updated_at,moderation_status,is_hidden")
      .eq("id", targetId)
      .maybeSingle();

    if (error || !data) return null;

    return {
      targetId: data.id,
      targetUrl: `${SITE_URL}/learning/${encodeURIComponent(data.article_slug)}#comment-${data.id}`,
      targetLabel: `Kommentar på ${data.article_slug}`,
      targetOwnerUserId: data.user_id,
      targetSnapshot: {
        id: data.id,
        articleSlug: data.article_slug,
        body: data.body,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        moderationStatus: data.moderation_status,
        isHidden: data.is_hidden,
      },
    };
  }

  if (targetType === "profile" || targetType === "profile_avatar") {
    const { data, error } = await admin
      .from("profiles")
      .select("id,username,display_name,bio,avatar_path,updated_at")
      .eq("id", targetId)
      .maybeSingle();

    if (error || !data || !data.username) return null;

    return {
      targetId: data.id,
      targetUrl: `${SITE_URL}/profile/${encodeURIComponent(data.username)}`,
      targetLabel:
        targetType === "profile_avatar"
          ? `Profilbild för @${data.username}`
          : `Profil @${data.username}`,
      targetOwnerUserId: data.id,
      targetSnapshot: {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        bio: data.bio,
        avatarPath: data.avatar_path,
        updatedAt: data.updated_at,
      },
    };
  }

  return null;
}

export async function getDirectModerationTarget(
  targetTypeRaw: string,
  targetId: string,
) {
  await requireModeratorUser();

  if (!isContentReportTargetType(targetTypeRaw) || targetTypeRaw === "other") {
    return null;
  }

  return resolveDirectTarget(targetTypeRaw, targetId);
}

function revalidateDirectTarget(report: ContentReportRecord) {
  revalidatePath("/moderation");
  revalidatePath("/forum");
  revalidatePath("/learning");

  try {
    const url = new URL(report.target_url);
    revalidatePath(`${url.pathname}${url.search}`);
  } catch {
    // Ignore malformed legacy URLs.
  }
}

export async function moderateTargetDirectly(
  formData: FormData,
): Promise<ModerationDecisionActionState> {
  const moderator = await requireModeratorUser();
  const targetTypeRaw = getFormString(formData, "targetType");
  const targetId = getFormString(formData, "targetId");
  const actionTypeRaw = getFormString(formData, "actionType");
  const factualReason = getFormString(formData, "factualReason");

  if (!isContentReportTargetType(targetTypeRaw) || targetTypeRaw === "other") {
    return { status: "error", message: "Målet kan inte modereras direkt." };
  }

  if (!targetId) {
    return { status: "error", message: "Innehållets ID saknas." };
  }

  if (!isModerationActionType(actionTypeRaw) || actionTypeRaw === "no_action") {
    return { status: "error", message: "Välj en giltig modereringsåtgärd." };
  }

  if (!isActionAllowedForTarget(actionTypeRaw, targetTypeRaw)) {
    return { status: "error", message: "Åtgärden kan inte användas på den här typen av innehåll." };
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

  const admin = createModerationAdminClient();
  if (!admin) {
    return { status: "error", message: "Moderationsdatabasen är inte konfigurerad." };
  }

  const target = await resolveDirectTarget(targetTypeRaw, targetId);
  if (!target) {
    return { status: "error", message: "Innehållet kunde inte hittas." };
  }

  const { data: reportData, error: reportError } = await admin
    .from("content_reports")
    .insert({
      reporter_user_id: moderator.id,
      reporter_name: moderator.name || "DivLab moderator",
      reporter_email: moderator.email,
      report_kind: "terms_violation",
      category: "other_terms_violation",
      target_type: targetTypeRaw,
      target_id: target.targetId,
      target_url: target.targetUrl,
      target_label: target.targetLabel,
      target_owner_user_id: target.targetOwnerUserId,
      target_snapshot: {
        ...target.targetSnapshot,
        internalModeration: true,
      },
      explanation: factualReason,
      good_faith_confirmed: true,
      identity_exception_claimed: false,
      receipt_email_status: "skipped",
      receipt_email_error: "internal_staff_moderation",
      decision_email_status: "skipped",
      decision_email_error: "internal_staff_moderation",
    })
    .select("*")
    .single();

  if (reportError || !reportData) {
    console.error("[moderation] direct report insert failed", {
      code: reportError?.code,
      message: reportError?.message,
    });
    return { status: "error", message: "Moderationsärendet kunde inte skapas." };
  }

  const report = reportData as ContentReportRecord;
  const scopeDescription = getModerationScopeDescription(actionTypeRaw, targetTypeRaw);
  const { data: actionData, error: actionError } = await admin.rpc(
    "apply_moderation_decision",
    {
      p_report_id: report.id,
      p_moderator_user_id: moderator.id,
      p_action_type: actionTypeRaw,
      p_basis_type: "terms",
      p_legal_basis: null,
      p_terms_basis: INTERNAL_TERMS_BASIS,
      p_factual_reason: factualReason,
      p_scope_description: scopeDescription,
      p_automated: false,
      p_automation_details: null,
      p_effective_until: null,
    },
  );

  if (actionError || !actionData) {
    await admin.from("content_reports").delete().eq("id", report.id);
    console.error("[moderation] direct decision failed", {
      code: actionError?.code,
      message: actionError?.message,
    });
    return {
      status: "error",
      message: "Åtgärden kunde inte genomföras. Ingen modereringsåtgärd sparades.",
    };
  }

  const action = (Array.isArray(actionData) ? actionData[0] : actionData) as
    | ModerationActionRecord
    | undefined;

  if (!action) {
    return { status: "error", message: "Åtgärden genomfördes men revisionsposten kunde inte läsas." };
  }

  if (action.affected_user_id) {
    const { data: affectedAuth } = await admin.auth.admin.getUserById(action.affected_user_id);
    const affectedEmail = affectedAuth.user?.email?.trim();

    if (affectedEmail) {
      const affectedResult = await sendAffectedUserDecisionEmail({
        to: affectedEmail,
        report,
        action,
      });

      if (affectedResult.status !== "sent") {
        console.error("[moderation] direct affected-user email not sent", {
          reportId: report.id,
          status: affectedResult.status,
          reason: affectedResult.reason,
        });
      }
    }
  }

  revalidateDirectTarget(report);

  return {
    status: "success",
    message: "Åtgärden är genomförd. Beslut, skäl och revisionsspår har sparats.",
  };
}
