import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import DirectModerationForm from "@/components/moderation/DirectModerationForm";
import { requireDivLabOwnerUser } from "@/lib/moderation/access.server";
import { getDirectModerationTarget } from "@/lib/moderation/direct.server";
import { isContentReportTargetType } from "@/lib/moderation/config";

export const metadata: Metadata = {
  title: { absolute: "Direktmoderering | DivLab" },
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{
    targetType?: string;
    targetId?: string;
  }>;
};

export default async function DirectModerationPage({ searchParams }: Props) {
  const user = await requireDivLabOwnerUser();
  const params = await searchParams;
  const targetType = params.targetType?.trim() ?? "";
  const targetId = params.targetId?.trim() ?? "";

  const validTargetType =
    isContentReportTargetType(targetType) && targetType !== "other"
      ? targetType
      : null;
  const target = validTargetType
    ? await getDirectModerationTarget(validTargetType, targetId)
    : null;

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <Link
            href="/moderation"
            className="text-xs font-medium text-divlab-blue-muted hover:text-divlab-blue"
          >
            ← Moderationskö
          </Link>
        </div>

        <section className="divlab-hero p-6 sm:p-8">
          <p className="divlab-section-label">Ägarverktyg</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-3xl">
            Moderera innehåll direkt
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            Den här vyn är exklusiv för DivLabs ägarkonto @divlab. Alla åtgärder skapar ett internt modereringsärende och ett revisionsspår.
          </p>
        </section>

        {target && validTargetType ? (
          <DirectModerationForm
            targetType={validTargetType}
            targetId={target.targetId}
            targetLabel={target.targetLabel}
            targetUrl={target.targetUrl}
          />
        ) : (
          <section className="divlab-card p-5 sm:p-6">
            <p className="text-sm font-medium text-divlab-text">
              Innehållet kunde inte hittas
            </p>
            <p className="mt-2 text-sm leading-6 text-divlab-text-muted">
              Öppna innehållet på DivLab och använd knappen Moderera därifrån så följer rätt ID med automatiskt.
            </p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
