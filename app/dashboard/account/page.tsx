import AccountOverview from "@/components/account/AccountOverview";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";

export default async function AccountOverviewPage() {
  const { user, profile, identity } = await requireAuthenticatedUserWithProfile();

  return <AccountOverview user={user} profile={profile} identity={identity} />;
}
