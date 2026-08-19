import "server-only";

import type {
  ContentReportRecord,
  ModerationActionRecord,
} from "./types";
import { MODERATION_ACTION_LABELS, REPORT_CATEGORY_LABELS } from "./config";

type ModerationEmailResult =
  | { status: "sent"; providerMessageId: string | null }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://divlab.se").replace(/\/$/, "");

function emailConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.DIVLAB_EMAIL_FROM?.trim();
  return apiKey && from ? { apiKey, from } : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey: string;
  tag: string;
}): Promise<ModerationEmailResult> {
  const config = emailConfig();

  if (!config) {
    return { status: "skipped", reason: "email_provider_unconfigured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": input.idempotencyKey,
      },
      body: JSON.stringify({
        from: config.from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
        tags: [{ name: "category", value: input.tag }],
      }),
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => ({}))) as {
      id?: string;
      message?: string;
      name?: string;
    };

    if (!response.ok) {
      return {
        status: "failed",
        reason: `resend_${response.status}:${String(payload.name ?? payload.message ?? "unknown").slice(0, 160)}`,
      };
    }

    return { status: "sent", providerMessageId: payload.id ?? null };
  } catch (error) {
    return {
      status: "failed",
      reason: `resend_network:${error instanceof Error ? error.message.slice(0, 160) : "unknown"}`,
    };
  }
}

export async function sendReportReceiptEmail(input: {
  to: string;
  report: Pick<
    ContentReportRecord,
    "id" | "reference_code" | "category" | "target_url" | "created_at"
  >;
}): Promise<ModerationEmailResult> {
  const categoryLabel = REPORT_CATEGORY_LABELS[input.report.category];
  const subject = `DivLab har tagit emot din anmälan ${input.report.reference_code}`;
  const reportUrl = `${SITE_URL}/report/status?ref=${encodeURIComponent(input.report.reference_code)}`;
  const text = [
    "Vi har tagit emot din anmälan.",
    `Referens: ${input.report.reference_code}`,
    `Kategori: ${categoryLabel}`,
    `Innehåll: ${input.report.target_url}`,
    "",
    "DivLab kommer att granska anmälan och informera dig om beslutet via de kontaktuppgifter du lämnat.",
    `Status: ${reportUrl}`,
  ].join("\n");

  const html = `
    <p>Vi har tagit emot din anmälan.</p>
    <p><strong>Referens:</strong> ${escapeHtml(input.report.reference_code)}<br/>
    <strong>Kategori:</strong> ${escapeHtml(categoryLabel)}<br/>
    <strong>Innehåll:</strong> <a href="${escapeHtml(input.report.target_url)}">${escapeHtml(input.report.target_url)}</a></p>
    <p>DivLab kommer att granska anmälan och informera dig om beslutet via de kontaktuppgifter du lämnat.</p>
    <p><a href="${escapeHtml(reportUrl)}">Följ ärendets status</a></p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    text,
    html,
    idempotencyKey: `moderation-report-receipt/${input.report.id}`,
    tag: "moderation_receipt",
  });
}

export async function sendReporterDecisionEmail(input: {
  to: string;
  report: Pick<
    ContentReportRecord,
    "id" | "reference_code" | "category" | "target_url"
  >;
  action: Pick<
    ModerationActionRecord,
    "id" | "action_type" | "factual_reason" | "scope_description"
  >;
}): Promise<ModerationEmailResult> {
  const actionLabel = MODERATION_ACTION_LABELS[input.action.action_type];
  const subject = `Beslut i din DivLab-anmälan ${input.report.reference_code}`;
  const text = [
    `DivLab har fattat beslut i ärende ${input.report.reference_code}.`,
    `Beslut: ${actionLabel}`,
    `Resultat: ${input.action.scope_description}`,
    `Skäl: ${input.action.factual_reason}`,
    `Innehåll: ${input.report.target_url}`,
  ].join("\n");

  const html = `
    <p>DivLab har fattat beslut i ärende <strong>${escapeHtml(input.report.reference_code)}</strong>.</p>
    <p><strong>Beslut:</strong> ${escapeHtml(actionLabel)}<br/>
    <strong>Resultat:</strong> ${escapeHtml(input.action.scope_description)}</p>
    <p><strong>Skäl:</strong><br/>${escapeHtml(input.action.factual_reason).replaceAll("\n", "<br/>")}</p>
    <p><a href="${escapeHtml(input.report.target_url)}">Öppna den anmälda platsen</a></p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    text,
    html,
    idempotencyKey: `moderation-reporter-decision/${input.action.id}`,
    tag: "moderation_reporter_decision",
  });
}

export async function sendAffectedUserDecisionEmail(input: {
  to: string;
  report: Pick<ContentReportRecord, "reference_code" | "target_url">;
  action: ModerationActionRecord;
}): Promise<ModerationEmailResult> {
  const actionLabel = MODERATION_ACTION_LABELS[input.action.action_type];
  const appealUrl = `${SITE_URL}/moderation/appeal/${encodeURIComponent(input.action.id)}`;
  const basisParts = [
    input.action.legal_basis ? `Rättslig grund: ${input.action.legal_basis}` : null,
    input.action.terms_basis ? `DivLab-regel: ${input.action.terms_basis}` : null,
  ].filter(Boolean);
  const automationText = input.action.automated
    ? `Automatisering användes: ja. ${input.action.automation_details ?? ""}`.trim()
    : "Automatisering användes: nej.";

  const subject = "Moderationsbeslut från DivLab";
  const text = [
    "DivLab har fattat ett modereringsbeslut som berör ditt innehåll eller din profil.",
    `Beslut: ${actionLabel}`,
    `Omfattning: ${input.action.scope_description}`,
    `Faktiska skäl: ${input.action.factual_reason}`,
    ...basisParts,
    automationText,
    input.action.effective_until
      ? `Begränsningen gäller till: ${input.action.effective_until}`
      : "Begränsningen har ingen angiven sluttid.",
    `Berörd plats: ${input.report.target_url}`,
    `Begär omprövning: ${appealUrl}`,
  ].join("\n");

  const htmlBasis = basisParts.length
    ? `<p>${basisParts.map((part) => escapeHtml(String(part))).join("<br/>")}</p>`
    : "";

  const html = `
    <p>DivLab har fattat ett modereringsbeslut som berör ditt innehåll eller din profil.</p>
    <p><strong>Beslut:</strong> ${escapeHtml(actionLabel)}<br/>
    <strong>Omfattning:</strong> ${escapeHtml(input.action.scope_description)}</p>
    <p><strong>Faktiska skäl:</strong><br/>${escapeHtml(input.action.factual_reason).replaceAll("\n", "<br/>")}</p>
    ${htmlBasis}
    <p>${escapeHtml(automationText)}</p>
    <p>${input.action.effective_until ? `Begränsningen gäller till ${escapeHtml(input.action.effective_until)}.` : "Begränsningen har ingen angiven sluttid."}</p>
    <p><a href="${escapeHtml(input.report.target_url)}">Berörd plats</a></p>
    <p><a href="${escapeHtml(appealUrl)}">Begär omprövning av beslutet</a></p>
  `;

  return sendEmail({
    to: input.to,
    subject,
    text,
    html,
    idempotencyKey: `moderation-affected-decision/${input.action.id}`,
    tag: "moderation_statement_of_reasons",
  });
}
