import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "@/components/layout/AppShell";
import PublicProfileView from "@/components/profile/PublicProfileView";
import {
  getAuthenticatedUser,
  requireAuthenticatedUserWithProfile,
} from "@/lib/auth/session";
import {
  getAcceptedContactCount,
  getProfileContactState,
} from "@/lib/contacts/contacts";
import type { ProfileContactState } from "@/lib/contacts/types";
import { getRecentForumActivityByAuthorId } from "@/lib/forum/queries";
import { getForumAuthorStats } from "@/lib/forum/forum-status.server";
import { getAvatarPublicUrl } from "@/lib/profiles/identity";
import { getPublicProfileByUsername } from "@/lib/profiles/profile";
import { getStaffRolesForUser } from "@/lib/profiles/staff-roles.server";
import { isTemporaryUsername } from "@/lib/profiles/username";
import { getCanonicalUrl } from "@/lib/seo/canonical";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    return {
      title: "Profilen hittades inte | DivLab",
      robots: { index: false, follow: false },
    };
  }

  if (isTemporaryUsername(profile.username)) {
    return {
      title: "Medlemsprofil | DivLab",
      robots: { index: false, follow: false },
    };
  }

  const profileLabel = profile.displayName?.trim() || `@${profile.username}`;
  const title = `${profileLabel} | DivLab`;
  const description = `Se ${profileLabel} på DivLab: publik medlemsprofil, forumaktivitet och investerarprofil.`;
  const canonical = getCanonicalUrl(`/profile/${profile.username}`);

  return {
    title: { absolute: title },
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "profile",
      locale: "sv_SE",
    },
  };
}

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

  let contactCount = 0;
  let contactState: ProfileContactState =
    currentUser?.id === profile.id
      ? { kind: "self" }
      : currentUser
        ? { kind: "none" }
        : { kind: "signed_out" };

  try {
    const [nextContactCount, nextContactState] = await Promise.all([
      getAcceptedContactCount(profile.id),
      getProfileContactState(currentUser?.id ?? null, profile.id),
    ]);
    contactCount = nextContactCount;
    contactState = nextContactState;
  } catch {
    // Contacts foundation may be unavailable before migration; keep profile usable.
  }

  return await renderWithAppShell(
    <PublicProfileView
      profile={profile}
      avatarUrl={avatarUrl}
      forumStats={forumStats}
      recentActivity={recentActivity}
      staffRoles={staffRoles}
      isSelf={currentUser?.id === profile.id}
      isAuthenticated={Boolean(currentUser)}
      contactCount={contactCount}
      contactState={contactState}
    />,
  );
}
