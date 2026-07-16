import AppShell from "@/components/layout/AppShell";
import SettingsPageContent from "@/components/settings/SettingsPageContent";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export default async function SettingsPage() {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell>
      <SettingsPageContent email={user.email} />
    </AppShell>
  );
}
