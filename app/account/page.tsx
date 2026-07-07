import AccountOverview from "@/components/account/AccountOverview";
import AppShell from "@/components/layout/AppShell";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export default async function AccountPage() {
  const user = await requireAuthenticatedUser();

  return (
    <AppShell user={user}>
      <AccountOverview user={user} />
    </AppShell>
  );
}
