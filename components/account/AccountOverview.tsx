import Link from "next/link";
import type { AuthenticatedUser } from "@/lib/auth/user";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import type { UserProfile } from "@/lib/profiles/types";
import ProfileAvatar from "./ProfileAvatar";

type Props = {
  user: AuthenticatedUser;
  profile: UserProfile;
  identity: UserDisplayIdentity;
};

function formatMemberSince(createdAt: string | null) {
  if (!createdAt) {
    return "Account creation date unavailable";
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "Account creation date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(createdDate);
}

function EmptyField({ children }: { children: React.ReactNode }) {
  return <span className="text-gray-500">{children}</span>;
}

export default function AccountOverview({ user, profile, identity }: Props) {
  const memberSince = formatMemberSince(user.createdAt);
  const hasPublicProfile =
    profile.displayName ||
    profile.username ||
    profile.bio ||
    profile.favoriteSector ||
    profile.investorGoal;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-7 md:flex-row md:items-center">
            <div className="flex flex-col items-start gap-4">
              <div className="relative">
                <div className="absolute inset-[-10px] rounded-full border border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]" />
                <div className="absolute inset-[-18px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_62%)]" />
                <ProfileAvatar
                  avatarUrl={identity.avatarUrl}
                  initials={identity.initials}
                  sizeClassName="h-28 w-28"
                  textClassName="text-3xl tracking-[-0.04em]"
                />
              </div>

              <Link
                href="/account/edit"
                className="rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.16)] transition-all duration-300 hover:bg-[#F9D976] hover:shadow-[0_0_34px_rgba(212,175,55,0.22)]"
              >
                Edit Profile
              </Link>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
                Investor Identity
              </p>
              <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
                {identity.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span>
                  {identity.username
                    ? `@${identity.username}`
                    : "No public handle selected yet"}
                </span>
                <span className="h-1 w-1 rounded-full bg-gray-600" />
                <span>Member since {memberSince}</span>
              </div>
              <div className="mt-7 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                  Profile Status
                </p>
                <p className="mt-3 text-base leading-7 text-gray-300">
                  {hasPublicProfile
                    ? "Your Dividend Lab profile is ready for the next community features."
                    : "Your investor profile is not completed yet. Complete your investor identity to personalize your Dividend Lab profile."}
                </p>
              </div>
            </div>
          </div>

          <div className="w-fit rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-gray-400">
            Authenticated account
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-white/10 bg-[#161616] p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Account Details
          </p>
          <h3 className="text-lg font-semibold text-white">
            Account and public profile
          </h3>
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Private Account Email
              </p>
              <p className="mt-2 break-all text-sm text-gray-300">
                {user.email}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Public Handle
              </p>
              <p className="mt-2 text-sm text-gray-300">
                {profile.username ? (
                  `@${profile.username}`
                ) : (
                  <EmptyField>
                    Choose a public handle before joining discussions.
                  </EmptyField>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Account Created
              </p>
              <p className="mt-2 text-sm text-gray-300">{memberSince}</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-[#161616] p-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Profile Setup
          </p>
          <h3 className="text-lg font-semibold text-white">
            Investor identity
          </h3>
          <div className="mt-6 space-y-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Display Name
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                {profile.displayName ?? (
                  <EmptyField>Add a display name for your profile.</EmptyField>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Bio
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                {profile.bio ?? (
                  <EmptyField>
                    Add a short investor bio to personalize your Dividend Lab
                    identity.
                  </EmptyField>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Favorite Sector
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                {profile.favoriteSector ?? (
                  <EmptyField>No favorite sector selected yet.</EmptyField>
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Investor Goal
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                {profile.investorGoal ?? (
                  <EmptyField>No investor goal added yet.</EmptyField>
                )}
              </p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
