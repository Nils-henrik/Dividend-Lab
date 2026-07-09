import DashboardShell from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";

export default async function DashboardPage() {
  const { profile } = await requireAuthenticatedUserWithProfile();

  return <DashboardShell profile={profile} />;
}
