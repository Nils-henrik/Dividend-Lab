import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import ContentReportForm from "@/components/moderation/ContentReportForm";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { isContentReportTargetType } from "@/lib/moderation/config";
import type { ContentReportTargetType } from "@/lib/moderation/types";

export const metadata: Metadata = {
  title: { absolute: "Rapportera innehåll | DivLab" },
  description:
    "Rapportera misstänkt olagligt innehåll eller innehåll som bryter mot DivLabs regler.",
  robots: { index: true, follow: true },
};

type Props = {
  searchParams: Promise<{
    targetType?: string;
    targetId?: string;
    url?: string;
  }>;
};

export default async function ReportContentPage({ searchParams }: Props) {
  const params = await searchParams;
  const user = await getAuthenticatedUser();
  const requestedTargetType = params.targetType?.trim() ?? "";
  const initialTargetType: ContentReportTargetType = isContentReportTargetType(requestedTargetType)
    ? requestedTargetType
    : "other";

  return (
    <AppShell allowGuest>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="divlab-hero p-6 sm:p-8">
          <p className="divlab-section-label">Säkerhet & moderering</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-3xl">
            Rapportera innehåll
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-divlab-text-secondary">
            Här kan du elektroniskt anmäla misstänkt olagligt innehåll eller innehåll som bryter mot DivLabs regler. Du behöver inte ha ett DivLab-konto för att använda formuläret.
          </p>
          <div className="mt-4 rounded-xl border divlab-border-neutral divlab-inset p-4 text-xs leading-6 text-divlab-text-muted">
            <p>
              Försök länka så exakt som möjligt till den tråd, kommentar, profil eller annan plats som anmälan gäller. När anmälan registreras får du en referens direkt på sidan och, när e-post har lämnats, en mottagningsbekräftelse via e-post.
            </p>
          </div>
        </section>

        <section className="divlab-card p-5 sm:p-6">
          <ContentReportForm
            initialTargetType={initialTargetType}
            initialTargetId={params.targetId?.trim() ?? ""}
            initialTargetUrl={params.url?.trim() ?? ""}
            initialReporterName={user?.name ?? ""}
            initialReporterEmail={user?.email ?? ""}
          />
        </section>

        <section className="divlab-card p-5 text-xs leading-6 text-divlab-text-muted">
          <p>
            Rapportfunktionen är avsedd för innehåll på DivLab. Vid omedelbar fara för liv eller säkerhet ska du kontakta behörig räddnings- eller brottsbekämpande myndighet direkt.
          </p>
          <p className="mt-2">
            Läs även våra{" "}
            <Link href="/terms" className="divlab-link font-medium">
              användarvillkor
            </Link>{" "}
            och{" "}
            <Link href="/privacy" className="divlab-link font-medium">
              integritetspolicy
            </Link>
            .
          </p>
        </section>
      </div>
    </AppShell>
  );
}
