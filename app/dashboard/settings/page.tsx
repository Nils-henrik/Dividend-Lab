import SettingsPageContent from "@/components/settings/SettingsPageContent";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export default async function DashboardSettingsPage() {
  const user = await requireAuthenticatedUser();

  return <SettingsPageContent email={user.email} />;
}
