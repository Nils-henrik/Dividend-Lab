import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import { requireModeratorUser } from "@/lib/moderation/access.server";
import { REPORT_CATEGORY_LABELS } from "@/lib/moderation/config";
import { getModerationQueue } from "@/lib/moderation/moderation.server";
import type { ContentReportCategory } from "@/lib/moderation/types";

export const metadata: Metadata = {
  title: { absolute: "Moderering | DivLab" },
  robots: { index: false, follow: false },
};

const statusLabels: Record<string, string> = {
  new: "Ny",
  under_review: "Under granskning",
  actioned: "Åtgärdad",
  no_action: "Ingen åtgärd",
  escalated: "Eskalerad",
};

export default async function ModerationQueuePage() {
  const user = await requireModeratorUser();
  const reports = await getModerationQueue();
  const openCount = reports.filter((report) =>
    ["new", "under_review"].includes(String(report.status)),
  ).length;

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="divlab-hero p-6 sm:p-8">
          <p className="divlab-section-label">Internt</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-3xl">
                Moderationskö
              </h1>
              <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                {openCount} öppna ärenden. Varje beslut sparas i revisionsloggen innan ärendet avslutas.
              </p>
            </div>
            <span className="rounded-full border divlab-border-neutral px-3 py-1 text-xs text-divlab-text-muted">
              {reports.length} senaste ärenden
            </span>
          </div>
        </section>

        <section className="divlab-card overflow-hidden">
          {reports.length === 0 ? (
            <p className="p-6 text-sm text-divlab-text-secondary">Inga rapporter har registrerats ännu.</p>
          ) : (
            <div className="divide-y divlab-border-neutral">
              {reports.map((report) => {
                const urgent = ["child_safety", "threats_or_violence"].includes(String(report.category));
                return (
                  <Link
                    key={report.id}
                    href={`/moderation/${encodeURIComponent(report.id)}`}
                    className="block px-4 py-4 transition hover:bg-white/[0.03] sm:px-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-divlab-text-muted">
                            {report.reference_code}
                          </span>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] ${urgent ? "border-red-500/35 bg-red-500/10 text-red-300" : "divlab-border-neutral text-divlab-text-muted"}`}>
                            {statusLabels[String(report.status)] ?? report.status}
                          </span>
                          {urgent ? (
                            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-red-300">
                              Prioriterad granskning
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 truncate text-sm font-medium text-divlab-text">
                          {report.target_label || report.target_url}
                        </p>
                        <p className="mt-1 text-xs text-divlab-text-muted">
                          {REPORT_CATEGORY_LABELS[report.category as ContentReportCategory] ?? report.category}
                        </p>
                      </div>
                      <div className="shrink-0 text-xs text-divlab-text-muted">
                        {new Intl.DateTimeFormat("sv-SE", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(report.created_at))}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
