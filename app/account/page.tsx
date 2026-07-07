import AccountOverview from "@/components/account/AccountOverview";
import AppShell from "@/components/layout/AppShell";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";

export default async function AccountPage() {
  const { user, profile, identity } = await requireAuthenticatedUserWithProfile();

  return (
    <AppShell user={user} identity={identity}>
      <AccountOverview user={user} profile={profile} identity={identity} />
    </AppShell>
  );
}
