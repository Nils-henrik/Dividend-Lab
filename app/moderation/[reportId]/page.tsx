import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ModerationDecisionForm from "@/components/moderation/ModerationDecisionForm";
import { requireModeratorUser } from "@/lib/moderation/access.server";
import {
  MODERATION_ACTION_LABELS,
  REPORT_CATEGORY_LABELS,
} from "@/lib/moderation/config";
import { getModerationCase } from "@/lib/moderation/moderation.server";

export const metadata: Metadata = {
  title: { absolute: "Moderationsärende | DivLab" },
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ reportId: string }>;
};

function Snapshot({ value }: { value: Record<string, unknown> }) {
  const entries = Object.entries(value).filter(([, item]) => item !== null && item !== undefined && item !== "");

  return (
    <dl className="space-y-3">
      {entries.map(([key, item]) => (
        <div key={key}>
          <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-divlab-text-muted">{key}</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-divlab-text-secondary">
            {typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default async function ModerationCasePage({ params }: Props) {
  const user = await requireModeratorUser();
  const { reportId } = await params;
  const { report, actions } = await getModerationCase(reportId);

  if (!report) notFound();

  const final = ["actioned", "no_action", "escalated"].includes(report.status);
  const urgent = ["child_safety", "threats_or_violence"].includes(report.category);

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/moderation" className="divlab-btn-ghost inline-flex px-3 py-1.5 text-xs">
            ← Moderationskö
          </Link>
          <span className="font-mono text-xs text-divlab-text-muted">{report.reference_code}</span>
        </div>

        {urgent ? (
          <section className="rounded-xl border border-red-500/35 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-200">Prioriterad säkerhetsgranskning</p>
            <p className="mt-1 text-xs leading-5 text-red-200/80">
              Kategorin kan beröra barns säkerhet eller fara för liv och säkerhet. Bedöm om omedelbar intern eskalering och kontakt med behörig myndighet krävs.
            </p>
          </section>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
          <div className="space-y-6">
            <section className="divlab-card p-5 sm:p-6">
              <p className="divlab-section-label">Anmälan</p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-divlab-text-muted">Kategori</dt>
                  <dd className="mt-1 text-sm font-medium text-divlab-text">
                    {REPORT_CATEGORY_LABELS[report.category]}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-divlab-text-muted">Typ</dt>
                  <dd className="mt-1 text-sm text-divlab-text-secondary">{report.report_kind}</dd>
                </div>
                <div>
                  <dt className="text-xs text-divlab-text-muted">Status</dt>
                  <dd className="mt-1 text-sm text-divlab-text-secondary">{report.status}</dd>
                </div>
                <div>
                  <dt className="text-xs text-divlab-text-muted">Mottagen</dt>
                  <dd className="mt-1 text-sm text-divlab-text-secondary">
                    {new Intl.DateTimeFormat("sv-SE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.created_at))}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 border-t divlab-border-neutral pt-5">
                <p className="text-xs font-medium text-divlab-text-muted">Exakt plats</p>
                <a
                  href={report.target_url}
                  target="_blank"
                  rel="noreferrer"
                  className="divlab-link mt-1 block break-all text-sm font-medium"
                >
                  {report.target_label || report.target_url}
                </a>
              </div>

              <div className="mt-5 border-t divlab-border-neutral pt-5">
                <p className="text-xs font-medium text-divlab-text-muted">Anmälarens motivering</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-divlab-text-secondary">
                  {report.explanation}
                </p>
                {report.legal_basis ? (
                  <>
                    <p className="mt-4 text-xs font-medium text-divlab-text-muted">Uppgiven rättslig grund</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-divlab-text-secondary">{report.legal_basis}</p>
                  </>
                ) : null}
              </div>
            </section>

            <section className="divlab-card p-5 sm:p-6">
              <p className="divlab-section-label">Snapshot vid anmälningstillfället</p>
              <div className="mt-4 rounded-xl border divlab-border-neutral divlab-inset p-4">
                <Snapshot value={report.target_snapshot} />
              </div>
            </section>

            <section className="divlab-card p-5 sm:p-6">
              <p className="divlab-section-label">Revisionslogg</p>
              {actions.length === 0 ? (
                <p className="mt-4 text-sm text-divlab-text-secondary">Inget beslut har registrerats ännu.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {actions.map((action) => (
                    <article key={action.id} className="rounded-xl border divlab-border-neutral divlab-inset p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-divlab-text">
                          {MODERATION_ACTION_LABELS[action.action_type]}
                        </p>
                        <span className="text-xs text-divlab-text-muted">
                          {new Intl.DateTimeFormat("sv-SE", { dateStyle: "short", timeStyle: "short" }).format(new Date(action.created_at))}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">{action.scope_description}</p>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-divlab-text-secondary">
                        {action.factual_reason}
                      </p>
                      <div className="mt-3 text-xs leading-5 text-divlab-text-muted">
                        <p>Grund: {action.basis_type}</p>
                        <p>Automatisering: {action.automated ? "Ja" : "Nej"}</p>
                        <p>Moderator: {action.moderator_user_id}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="divlab-card p-5">
              <p className="divlab-section-label">Anmälare</p>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-divlab-text-muted">Namn</dt>
                  <dd className="mt-1 text-divlab-text-secondary">{report.reporter_name || "Utelämnat enligt identitetsundantag"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-divlab-text-muted">E-post</dt>
                  <dd className="mt-1 break-all text-divlab-text-secondary">{report.reporter_email || "Utelämnad"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-divlab-text-muted">Kvittensmejl</dt>
                  <dd className="mt-1 text-divlab-text-secondary">{report.receipt_email_status}</dd>
                </div>
              </dl>
            </section>

            {!final ? (
              <section className="divlab-card p-5">
                <p className="divlab-section-label">Fatta beslut</p>
                <p className="mt-2 text-xs leading-5 text-divlab-text-muted">
                  Beslutet och innehållsåtgärden genomförs i samma databastransaktion. Motiveringen kan skickas till både anmälare och berörd användare.
                </p>
                <div className="mt-5">
                  <ModerationDecisionForm reportId={report.id} targetType={report.target_type} />
                </div>
              </section>
            ) : (
              <section className="divlab-card p-5">
                <p className="text-sm font-semibold text-divlab-text">Ärendet har ett slutligt beslut</p>
                <p className="mt-2 text-xs leading-5 text-divlab-text-muted">
                  Eventuella omprövningar hanteras som separata, spårbara poster och skriver inte över revisionsloggen.
                </p>
              </section>
            )}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
