import AccountOverview from "@/components/account/AccountOverview";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";

export default async function AccountOverviewPage() {
  const { user, profile, identity } = await requireAuthenticatedUserWithProfile();
  const staffRoles = await getStaffRolesForUser(user.id);

  return (
    <AccountOverview
      user={user}
      profile={profile}
      identity={identity}
      staffRoles={staffRoles}
    />
  );
}
