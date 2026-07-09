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
    <article className="divlab-card p-6">
      <p className="divlab-section-label">{label}</p>
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
      <section className="divlab-hero">
        <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-divlab-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-divlab-gold/30 to-transparent" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <div className="relative shrink-0">
              <div className="absolute inset-[-10px] rounded-full border border-divlab-gold/10 bg-divlab-gold/[0.03]" />
              <div className="absolute inset-[-18px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.12),transparent_62%)]" />
              <ProfileAvatar
                avatarUrl={avatarUrl}
                initials={getInitials(displayName)}
                sizeClassName="h-28 w-28"
                textClassName="text-3xl tracking-[-0.04em]"
              />
            </div>

            <div className="min-w-0">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-divlab-gold">
                Dividend Lab-medlem
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text md:text-4xl">
                {displayName}
              </h1>
              {profile.username && (
                <p className="mt-3 text-sm text-divlab-text-secondary">
                  @{profile.username}
                </p>
              )}
              <p className="mt-2 text-sm text-divlab-text-muted">{memberLabel}</p>
              <ForumReputationBadge
                className="mt-5"
                totalReceivedReactions={totalReceivedReactions}
                showDescription
              />
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto lg:items-end">
            {isSelf ? (
              <Link href="/account/edit" className="divlab-btn-primary w-full sm:w-auto">
                Redigera profil
              </Link>
            ) : (
              <Link
                href={isAuthenticated ? messageHref : loginHref}
                className="divlab-btn-primary w-full sm:w-auto"
              >
                Skicka meddelande
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ProfileInfoCard label="Bio">
          <p className="text-sm leading-7 text-divlab-text-secondary">
            {profile.bio || "Medlemmen har inte lagt till en offentlig bio ännu."}
          </p>
        </ProfileInfoCard>

        <ProfileInfoCard label="Investeraridentitet">
          <div className="space-y-4 text-sm leading-6 text-divlab-text-secondary">
            <p>
              <span className="text-divlab-text-muted">Favoritsektor:</span>{" "}
              {profile.favoriteSector || "Inte valt ännu"}
            </p>
            <p>
              <span className="text-divlab-text-muted">Investeringsmål:</span>{" "}
              {profile.investorGoal || "Inte tillagt ännu"}
            </p>
          </div>
        </ProfileInfoCard>
      </section>

      <section className="divlab-card p-5">
        <div>
          <p className="divlab-section-label">Forum</p>
          <h2 className="mt-1.5 text-lg font-semibold tracking-[-0.03em] text-divlab-text">
            Senaste inlägg i forumet
          </h2>
        </div>

        {recentActivity.length === 0 ? (
          <p className="mt-4 rounded-xl border divlab-inset px-3 py-3 text-sm leading-6 text-divlab-text-secondary">
            Medlemmen har inte publicerat något i forumet ännu.
          </p>
        ) : (
          <ul className="mt-4 overflow-hidden rounded-xl border divlab-border-neutral">
            {recentActivity.map((item, index) => (
              <li
                key={`${item.kind}-${item.id}`}
                className={index > 0 ? "border-t divlab-border-neutral" : undefined}
              >
                <Link
                  href={`/forum/${encodeURIComponent(item.threadSlug)}`}
                  className="group block px-3 py-2.5 divlab-row-hover sm:px-4 sm:py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded-md border divlab-border-neutral px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-divlab-text-muted">
                      {item.kind === "thread" ? "Ämne" : "Svar"}
                    </span>
                    <span className="truncate text-[11px] text-divlab-text-muted">
                      {formatForumTimestamp(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm font-medium text-divlab-text transition group-hover:text-divlab-gold">
                    {item.kind === "thread"
                      ? item.threadTitle
                      : `Svar i ${item.threadTitle}`}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-divlab-text-secondary">
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
