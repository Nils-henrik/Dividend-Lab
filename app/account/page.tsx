import AccountOverview from "@/components/account/AccountOverview";
import AppShell from "@/components/layout/AppShell";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";

export default async function AccountPage() {
  const { user, profile, identity } = await requireAuthenticatedUserWithProfile();
  const staffRoles = await getStaffRolesForUser(user.id);

  return (
    <AppShell user={user} identity={identity}>
      <AccountOverview
        user={user}
        profile={profile}
        identity={identity}
        staffRoles={staffRoles}
      />
    </AppShell>
  );
}
