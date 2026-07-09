import Link from "next/link";
import ForumReputationBadge from "@/components/account/ForumReputationBadge";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { getForumReputationReceivedTotal } from "@/lib/forum/reputation.server";
import { getAvatarPublicUrl } from "@/lib/profiles/identity";
import { getPublicProfileByUsername } from "@/lib/profiles/profile";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

function getInitials(value: string) {
  const initials = value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "DL";
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#090909] px-8 py-8 text-white">
        <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[#161616] p-8">
          <p className="text-lg font-semibold text-white">Profile not found</p>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            This Dividend Lab member profile is not available.
          </p>
          <Link
            href="/forum"
            className="mt-6 inline-flex rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Back to forum
          </Link>
        </section>
      </main>
    );
  }

  const displayName = profile.displayName?.trim() || profile.username || "Dividend Lab Member";
  const avatarUrl = getAvatarPublicUrl(profile.avatarPath, profile.updatedAt);
  const totalReceivedReactions = await getForumReputationReceivedTotal(profile.id);

  return (
    <main className="min-h-screen bg-[#090909] px-8 py-8 text-white">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
          <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-[#D4AF37]/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
            <ProfileAvatar
              avatarUrl={avatarUrl}
              initials={getInitials(displayName)}
              sizeClassName="h-24 w-24"
              textClassName="text-2xl"
            />
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
                Dividend Lab Member
              </p>
              <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white">
                {displayName}
              </h1>
              {profile.username && (
                <p className="mt-3 text-sm text-gray-400">@{profile.username}</p>
              )}
              <ForumReputationBadge
                className="mt-5"
                totalReceivedReactions={totalReceivedReactions}
                showDescription
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-[#161616] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
              Bio
            </p>
            <p className="mt-4 text-sm leading-7 text-gray-300">
              {profile.bio || "This member has not added a public bio yet."}
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-[#161616] p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
              Investor Identity
            </p>
            <div className="mt-4 space-y-4 text-sm leading-6 text-gray-300">
              <p>
                <span className="text-gray-500">Favorite sector:</span>{" "}
                {profile.favoriteSector || "Not selected yet"}
              </p>
              <p>
                <span className="text-gray-500">Investor goal:</span>{" "}
                {profile.investorGoal || "Not added yet"}
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
