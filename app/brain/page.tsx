import AppShell from "@/components/layout/AppShell";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { resolveDivBrainAlphaPageAccess } from "@/lib/divbrain/server/access";

export default async function DividendBrainPage() {
  const user = await requireAuthenticatedUser();
  const access = await resolveDivBrainAlphaPageAccess({ actorId: user.id });

  if (access.status === "unavailable") {
    return (
      <AppShell>
        <PlaceholderPage
          title="DivBrain är inte tillgängligt"
          description="DivBrain är inte tillgängligt för det här kontot. DivBrain testas just nu i en begränsad intern Alpha."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PlaceholderPage
        title="DivBrain"
        description="Den tekniska grunden för DivBrain utvecklas. Ingen AI-motor är ansluten ännu — inga genererade svar, portföljanalyser eller marknadsdata visas."
      />
    </AppShell>
  );
}
