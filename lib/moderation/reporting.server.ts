import "server-only";

import { getAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createModerationAdminClient } from "./admin";
import {
  CONTENT_REPORT_EXPLANATION_MAX_LENGTH,
  CONTENT_REPORT_EXPLANATION_MIN_LENGTH,
  CONTENT_REPORT_LEGAL_BASIS_MAX_LENGTH,
  isContentReportCategory,
  isContentReportKind,
  isContentReportTargetType,
  isIdentityExceptionCategory,
  isIllegalReportCategory,
} from "./config";
import { sendReportReceiptEmail } from "./email";
import type {
  ContentReportActionState,
  ContentReportCategory,
  ContentReportTargetType,
} from "./types";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://divlab.se").replace(/\/$/, "");

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeDivLabUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed, SITE_URL);
    const allowedHosts = new Set([
      new URL(SITE_URL).hostname,
      "divlab.se",
      "www.divlab.se",
    ]);

    if (!allowedHosts.has(url.hostname)) {
      return null;
    }

    url.hash = url.hash;
    return url.toString();
  } catch {
    return null;
  }
}

type ResolvedTarget = {
  targetId: string | null;
  targetUrl: string;
  targetLabel: string | null;
  targetOwnerUserId: string | null;
  targetSnapshot: Record<string, unknown>;
};

async function resolveTarget(
  targetType: ContentReportTargetType,
  rawTargetId: string,
  rawTargetUrl: string,
): Promise<ResolvedTarget | null> {
  const supabase = await createClient();

  if (targetType === "forum_thread") {
    if (!rawTargetId) return null;
    const { data, error } = await supabase
      .from("forum_threads")
      .select("id,slug,author_id,category_slug,title,body,created_at,updated_at")
      .eq("id", rawTargetId)
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
      },
    };
  }

  if (targetType === "forum_reply") {
    if (!rawTargetId) return null;
    const { data, error } = await supabase
      .from("forum_replies")
      .select("id,thread_id,author_id,body,created_at,updated_at")
      .eq("id", rawTargetId)
      .maybeSingle();

    if (error || !data) return null;

    const { data: thread, error: threadError } = await supabase
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
      },
    };
  }

  if (targetType === "learning_comment") {
    if (!rawTargetId) return null;
    const { data, error } = await supabase
      .from("learning_article_comments")
      .select("id,article_slug,user_id,body,created_at,updated_at")
      .eq("id", rawTargetId)
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
      },
    };
  }

  if (targetType === "profile" || targetType === "profile_avatar") {
    if (!rawTargetId) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id,username,display_name,bio,avatar_path,updated_at")
      .eq("id", rawTargetId)
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

  const normalizedUrl = normalizeDivLabUrl(rawTargetUrl);
  if (!normalizedUrl) return null;

  return {
    targetId: null,
    targetUrl: normalizedUrl,
    targetLabel: "Annan plats på DivLab",
    targetOwnerUserId: null,
    targetSnapshot: {
      submittedUrl: normalizedUrl,
    },
  };
}

async function updateReceiptDelivery(
  reportId: string,
  result:
    | { status: "sent"; providerMessageId: string | null }
    | { status: "skipped"; reason: string }
    | { status: "failed"; reason: string },
) {
  const admin = createModerationAdminClient();
  if (!admin) return;

  await admin
    .from("content_reports")
    .update({
      receipt_email_status: result.status,
      receipt_email_error:
        result.status === "sent" ? null : result.reason.slice(0, 500),
      receipt_sent_at:
        result.status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", reportId);
}

export async function submitContentReport(
  formData: FormData,
): Promise<ContentReportActionState> {
  const user = await getAuthenticatedUser();
  const targetTypeRaw = getFormString(formData, "targetType");
  const targetId = getFormString(formData, "targetId");
  const targetUrl = getFormString(formData, "targetUrl");
  const reportKindRaw = getFormString(formData, "reportKind");
  const categoryRaw = getFormString(formData, "category");
  const reporterName = getFormString(formData, "reporterName");
  const reporterEmail = getFormString(formData, "reporterEmail").toLowerCase();
  const explanation = getFormString(formData, "explanation");
  const legalBasis = getFormString(formData, "legalBasis");
  const goodFaithConfirmed = formData.get("goodFaithConfirmed") === "on";

  if (!isContentReportTargetType(targetTypeRaw)) {
    return { status: "error", message: "Välj vilket innehåll anmälan gäller." };
  }

  if (!isContentReportKind(reportKindRaw)) {
    return { status: "error", message: "Välj om anmälan gäller misstänkt olagligt innehåll eller DivLabs regler." };
  }

  if (!isContentReportCategory(categoryRaw)) {
    return { status: "error", message: "Välj en giltig kategori." };
  }

  const category = categoryRaw as ContentReportCategory;
  if (reportKindRaw === "illegal_content" && !isIllegalReportCategory(category)) {
    return { status: "error", message: "Välj en kategori för misstänkt olagligt innehåll." };
  }

  if (reportKindRaw === "terms_violation" && isIllegalReportCategory(category)) {
    return { status: "error", message: "Välj en kategori som gäller DivLabs regler." };
  }

  const identityException = isIdentityExceptionCategory(category);

  if (!identityException) {
    if (reporterName.length < 2 || reporterName.length > 200) {
      return { status: "error", message: "Ange ditt namn eller organisationens namn." };
    }

    if (!isValidEmail(reporterEmail) || reporterEmail.length > 320) {
      return { status: "error", message: "Ange en giltig e-postadress." };
    }
  } else if (reporterEmail && !isValidEmail(reporterEmail)) {
    return { status: "error", message: "E-postadressen är inte giltig." };
  }

  if (
    explanation.length < CONTENT_REPORT_EXPLANATION_MIN_LENGTH ||
    explanation.length > CONTENT_REPORT_EXPLANATION_MAX_LENGTH
  ) {
    return {
      status: "error",
      message: `Beskriv varför innehållet bör granskas med ${CONTENT_REPORT_EXPLANATION_MIN_LENGTH}–${CONTENT_REPORT_EXPLANATION_MAX_LENGTH} tecken.`,
    };
  }

  if (legalBasis.length > CONTENT_REPORT_LEGAL_BASIS_MAX_LENGTH) {
    return { status: "error", message: "Fältet för rättslig grund är för långt." };
  }

  if (!goodFaithConfirmed) {
    return {
      status: "error",
      message: "Du måste bekräfta att uppgifterna lämnas i god tro och efter bästa förmåga är korrekta.",
    };
  }

  const target = await resolveTarget(targetTypeRaw, targetId, targetUrl);
  if (!target) {
    return {
      status: "error",
      message: "Det anmälda innehållet kunde inte lokaliseras. Kontrollera länken och försök igen.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("content_reports")
    .insert({
      reporter_user_id: user?.id ?? null,
      reporter_name: reporterName || null,
      reporter_email: reporterEmail || null,
      report_kind: reportKindRaw,
      category,
      target_type: targetTypeRaw,
      target_id: target.targetId,
      target_url: target.targetUrl,
      target_label: target.targetLabel,
      target_owner_user_id: target.targetOwnerUserId,
      target_snapshot: target.targetSnapshot,
      explanation,
      legal_basis: legalBasis || null,
      good_faith_confirmed: true,
      identity_exception_claimed: identityException && (!reporterName || !reporterEmail),
    })
    .select("id,reference_code,category,target_url,created_at")
    .single();

  if (error || !data) {
    console.error("[moderation] content report insert failed", {
      code: error?.code,
      message: error?.message,
    });
    return {
      status: "error",
      message: "Anmälan kunde inte registreras. Försök igen eller kontakta DivLab via kontaktsidan.",
    };
  }

  let emailStatus: "sent" | "skipped" | "failed" = "skipped";

  if (reporterEmail) {
    const emailResult = await sendReportReceiptEmail({
      to: reporterEmail,
      report: data,
    });
    emailStatus = emailResult.status;
    await updateReceiptDelivery(data.id, emailResult);
  } else {
    await updateReceiptDelivery(data.id, {
      status: "skipped",
      reason: "identity_exception_no_email",
    });
  }

  return {
    status: "success",
    message:
      emailStatus === "sent"
        ? "Anmälan är registrerad och en mottagningsbekräftelse har skickats till din e-post."
        : "Anmälan är registrerad. Referensen nedan är din elektroniska mottagningsbekräftelse.",
    referenceCode: data.reference_code,
    emailStatus,
  };
}
