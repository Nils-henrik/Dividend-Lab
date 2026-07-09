import Link from "next/link";
import ForumReputationBadge from "@/components/account/ForumReputationBadge";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import {
  formatForumMemberSince,
  formatForumTimestamp,
  getForumExcerpt,
} from "@/lib/forum/format";
import type { ForumAuthorActivityItem } from "@/lib/forum/types";
import type { UserProfile } from "@/lib/profiles/types";

type Props = {
  profile: UserProfile;
  avatarUrl: string | null;
  totalReceivedReactions: number;
  recentActivity: ForumAuthorActivityItem[];
  isSelf: boolean;
  isAuthenticated: boolean;
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

function ProfileInfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        {label}
      </p>
      <div className="mt-4">{children}</div>
    </article>
  );
}

export default function PublicProfileView({
  profile,
  avatarUrl,
  totalReceivedReactions,
  recentActivity,
  isSelf,
  isAuthenticated,
}: Props) {
  const displayName =
    profile.displayName?.trim() || profile.username || "Dividend Lab-medlem";
  const normalizedUsername = profile.username?.trim().toLowerCase() ?? "";
  const memberLabel = formatForumMemberSince(profile.createdAt);
  const messageHref = normalizedUsername
    ? `/messages/new?username=${encodeURIComponent(normalizedUsername)}`
    : "/messages/new";
  const loginHref = `/login?redirect=${encodeURIComponent(messageHref)}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)] md:p-8">
        <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative shrink-0">
              <div className="absolute inset-[-10px] rounded-full border border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]" />
              <div className="absolute inset-[-18px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_62%)]" />
              <ProfileAvatar
                avatarUrl={avatarUrl}
                initials={getInitials(displayName)}
                sizeClassName="h-28 w-28"
                textClassName="text-3xl tracking-[-0.04em]"
              />
            </div>

            <div className="min-w-0">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
                Dividend Lab-medlem
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                {displayName}
              </h1>
              {profile.username && (
                <p className="mt-3 text-sm text-gray-400">@{profile.username}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">{memberLabel}</p>
              <ForumReputationBadge
                className="mt-5"
                totalReceivedReactions={totalReceivedReactions}
                showDescription
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto lg:items-end">
            {isSelf ? (
              <Link
                href="/account/edit"
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.16)] transition-all duration-300 hover:bg-[#F9D976] hover:shadow-[0_0_34px_rgba(212,175,55,0.22)] sm:w-auto"
              >
                Redigera profil
              </Link>
            ) : (
              <Link
                href={isAuthenticated ? messageHref : loginHref}
                className="inline-flex w-full items-center justify-center rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.16)] transition-all duration-300 hover:bg-[#F9D976] hover:shadow-[0_0_34px_rgba(212,175,55,0.22)] sm:w-auto"
              >
                Skicka meddelande
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ProfileInfoCard label="Bio">
          <p className="text-sm leading-7 text-gray-300">
            {profile.bio || "Medlemmen har inte lagt till en offentlig bio ännu."}
          </p>
        </ProfileInfoCard>

        <ProfileInfoCard label="Investeraridentitet">
          <div className="space-y-4 text-sm leading-6 text-gray-300">
            <p>
              <span className="text-gray-500">Favoritsektor:</span>{" "}
              {profile.favoriteSector || "Inte valt ännu"}
            </p>
            <p>
              <span className="text-gray-500">Investeringsmål:</span>{" "}
              {profile.investorGoal || "Inte tillagt ännu"}
            </p>
          </div>
        </ProfileInfoCard>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#161616] p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Forum
          </p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.03em] text-white">
            Senaste inlägg i forumet
          </h2>
        </div>

        {recentActivity.length === 0 ? (
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-gray-400">
            Medlemmen har inte publicerat något i forumet ännu.
          </p>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-xl border border-white/10">
            {recentActivity.map((item, index) => (
              <li
                key={`${item.kind}-${item.id}`}
                className={index > 0 ? "border-t border-white/10" : undefined}
              >
                <Link
                  href={`/forum/${encodeURIComponent(item.threadSlug)}`}
                  className="group block px-3 py-2.5 transition hover:bg-white/[0.03] sm:px-4 sm:py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-gray-500">
                      {item.kind === "thread" ? "Ämne" : "Svar"}
                    </span>
                    <span className="truncate text-[11px] text-gray-500">
                      {formatForumTimestamp(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm font-medium text-white transition group-hover:text-[#D4AF37]">
                    {item.kind === "thread"
                      ? item.threadTitle
                      : `Svar i ${item.threadTitle}`}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-gray-400">
                    {getForumExcerpt(item.body, 90)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
