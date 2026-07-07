import AccountOverview from "@/components/account/AccountOverview";
import { requireAuthenticatedUser } from "@/lib/auth/session";

export default async function AccountOverviewPage() {
  const user = await requireAuthenticatedUser();

  return <AccountOverview user={user} />;
}
