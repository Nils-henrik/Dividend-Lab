import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import PublicProfileView from "@/components/profile/PublicProfileView";
import {
  getAuthenticatedUser,
  requireAuthenticatedUserWithProfile,
} from "@/lib/auth/session";
import { getRecentForumActivityByAuthorId } from "@/lib/forum/queries";
import { getForumAuthorStats } from "@/lib/forum/forum-status.server";
import { getAvatarPublicUrl } from "@/lib/profiles/identity";
import { getPublicProfileByUsername } from "@/lib/profiles/profile";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

function ProfileNotFound() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="divlab-card p-8">
        <p className="text-lg font-semibold text-divlab-text">Profilen hittades inte</p>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Denna DivLab-medlemsprofil är inte tillgänglig.
        </p>
        <Link href="/forum" className="divlab-btn-ghost mt-6 inline-flex px-5 py-2.5 text-sm">
          Tillbaka till forumet
        </Link>
      </section>
    </div>
  );
}

async function renderWithAppShell(content: React.ReactNode) {
  const currentUser = await getAuthenticatedUser();

  if (currentUser) {
    const session = await requireAuthenticatedUserWithProfile();

    return (
      <AppShell user={session.user} identity={session.identity}>
        {content}
      </AppShell>
    );
  }

  return <AppShell allowGuest>{content}</AppShell>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    return await renderWithAppShell(<ProfileNotFound />);
  }

  const currentUser = await getAuthenticatedUser();
  const avatarUrl = getAvatarPublicUrl(profile.avatarPath, profile.updatedAt);
  const [forumStats, recentActivity, staffRoles] = await Promise.all([
    getForumAuthorStats(profile.id),
    getRecentForumActivityByAuthorId(profile.id, 5),
    getStaffRolesForUser(profile.id),
  ]);

  return await renderWithAppShell(
    <PublicProfileView
      profile={profile}
      avatarUrl={avatarUrl}
      forumStats={forumStats}
      recentActivity={recentActivity}
      staffRoles={staffRoles}
      isSelf={currentUser?.id === profile.id}
      isAuthenticated={Boolean(currentUser)}
    />,
  );
}
