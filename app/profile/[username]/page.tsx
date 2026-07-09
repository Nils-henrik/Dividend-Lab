import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import PublicProfileView from "@/components/profile/PublicProfileView";
import {
  getAuthenticatedUser,
  requireAuthenticatedUserWithProfile,
} from "@/lib/auth/session";
import { getRecentForumActivityByAuthorId } from "@/lib/forum/queries";
import { getForumReputationReceivedTotal } from "@/lib/forum/reputation.server";
import { getAvatarPublicUrl } from "@/lib/profiles/identity";
import { getPublicProfileByUsername } from "@/lib/profiles/profile";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

function ProfileNotFound() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-3xl border border-white/10 bg-[#161616] p-8">
        <p className="text-lg font-semibold text-white">Profilen hittades inte</p>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Denna Dividend Lab-medlemsprofil är inte tillgänglig.
        </p>
        <Link
          href="/forum"
          className="mt-6 inline-flex rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
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
  const [totalReceivedReactions, recentActivity] = await Promise.all([
    getForumReputationReceivedTotal(profile.id),
    getRecentForumActivityByAuthorId(profile.id),
  ]);

  return await renderWithAppShell(
    <PublicProfileView
      profile={profile}
      avatarUrl={avatarUrl}
      totalReceivedReactions={totalReceivedReactions}
      recentActivity={recentActivity}
      isSelf={currentUser?.id === profile.id}
      isAuthenticated={Boolean(currentUser)}
    />,
  );
}
