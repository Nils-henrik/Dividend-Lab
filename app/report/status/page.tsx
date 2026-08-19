import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { createModerationAdminClient } from "@/lib/moderation/admin";
import { MODERATION_ACTION_LABELS } from "@/lib/moderation/config";
import type { ModerationActionType } from "@/lib/moderation/types";

export const metadata: Metadata = {
  title: { absolute: "Status för anmälan | DivLab" },
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ ref?: string }>;
};

const statusLabels: Record<string, string> = {
  new: "Mottagen",
  under_review: "Under granskning",
  actioned: "Beslut fattat",
  no_action: "Beslut fattat",
  escalated: "Eskalerad för vidare hantering",
};

export default async function ReportStatusPage({ searchParams }: Props) {
  const { ref } = await searchParams;
  const referenceCode = ref?.trim().toUpperCase() ?? "";
  const admin = createModerationAdminClient();

  const { data: report } = admin && referenceCode
    ? await admin
        .from("content_reports")
        .select("id,reference_code,status,created_at,target_label")
        .eq("reference_code", referenceCode)
        .maybeSingle()
    : { data: null };

  const { data: action } = admin && report?.id
    ? await admin
        .from("moderation_actions")
        .select("action_type,scope_description,created_at")
        .eq("report_id", report.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <AppShell allowGuest>
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="divlab-hero p-6 sm:p-8">
          <p className="divlab-section-label">Rapporteringsärende</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-divlab-text">
            Status för anmälan
          </h1>
        </section>

        {!report ? (
          <section className="divlab-card p-6">
            <p className="text-sm font-medium text-divlab-text">Ärendet kunde inte hittas</p>
            <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
              Kontrollera referensen i mottagningsbekräftelsen. Av integritetsskäl visas inga fler detaljer när referensen inte matchar ett ärende.
            </p>
          </section>
        ) : (
          <section className="divlab-card space-y-4 p-6">
            <div>
              <p className="text-xs font-medium text-divlab-text-muted">Referens</p>
              <p className="mt-1 font-mono text-sm text-divlab-text">{report.reference_code}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-divlab-text-muted">Status</p>
              <p className="mt-1 text-sm font-medium text-divlab-text">
                {statusLabels[report.status] ?? report.status}
              </p>
            </div>
            {report.target_label ? (
              <div>
                <p className="text-xs font-medium text-divlab-text-muted">Anmäld plats</p>
                <p className="mt-1 text-sm text-divlab-text-secondary">{report.target_label}</p>
              </div>
            ) : null}
            {action ? (
              <div className="rounded-xl border divlab-border-neutral divlab-inset p-4">
                <p className="text-xs font-medium text-divlab-text-muted">Senaste beslut</p>
                <p className="mt-1 text-sm font-medium text-divlab-text">
                  {MODERATION_ACTION_LABELS[action.action_type as ModerationActionType] ?? action.action_type}
                </p>
                <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                  {action.scope_description}
                </p>
              </div>
            ) : null}
          </section>
        )}

        <Link href="/report" className="divlab-btn-ghost inline-flex px-4 py-2 text-sm">
          Ny anmälan
        </Link>
      </div>
    </AppShell>
  );
}
