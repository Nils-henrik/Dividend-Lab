import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import ModerationAppealForm from "@/components/moderation/ModerationAppealForm";
import { getAppealableModerationAction } from "@/lib/moderation/appeals.server";
import { MODERATION_ACTION_LABELS } from "@/lib/moderation/config";

export const metadata: Metadata = {
  title: { absolute: "Begär omprövning | DivLab" },
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ actionId: string }>;
};

export default async function ModerationAppealPage({ params }: Props) {
  const { actionId } = await params;
  const { user, action, appeal } = await getAppealableModerationAction(actionId);

  if (!action) notFound();

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="divlab-hero p-6 sm:p-8">
          <p className="divlab-section-label">Moderering</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-divlab-text">
            Begär omprövning
          </h1>
          <p className="mt-3 text-sm leading-7 text-divlab-text-secondary">
            Du kan här förklara varför du anser att modereringsbeslutet bör granskas på nytt. Den ursprungliga beslutshistoriken bevaras oförändrad.
          </p>
        </section>

        <section className="divlab-card p-5 sm:p-6">
          <p className="divlab-section-label">Beslutet</p>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs text-divlab-text-muted">Åtgärd</dt>
              <dd className="mt-1 text-sm font-medium text-divlab-text">
                {MODERATION_ACTION_LABELS[action.action_type]}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-divlab-text-muted">Omfattning</dt>
              <dd className="mt-1 text-sm leading-6 text-divlab-text-secondary">
                {action.scope_description}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-divlab-text-muted">Faktiska skäl</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-divlab-text-secondary">
                {action.factual_reason}
              </dd>
            </div>
          </dl>
        </section>

        <section className="divlab-card p-5 sm:p-6">
          {appeal ? (
            <div>
              <p className="text-sm font-semibold text-divlab-text">Omprövning registrerad</p>
              <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
                Status: {appeal.status === "open" ? "Väntar på granskning" : appeal.status}
              </p>
              <p className="mt-4 whitespace-pre-wrap rounded-xl border divlab-border-neutral divlab-inset p-4 text-sm leading-6 text-divlab-text-secondary">
                {appeal.statement}
              </p>
              {appeal.outcome_reason ? (
                <p className="mt-4 text-sm leading-6 text-divlab-text-secondary">
                  <span className="font-medium text-divlab-text">Resultat:</span>{" "}
                  {appeal.outcome_reason}
                </p>
              ) : null}
            </div>
          ) : (
            <ModerationAppealForm actionId={action.id} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
