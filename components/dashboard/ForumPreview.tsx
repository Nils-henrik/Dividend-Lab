import Link from "next/link";
import ProfileAvatar from "@/components/account/ProfileAvatar";
import { getForumAuthorInitials } from "@/lib/forum/format";
import type { ForumThread } from "@/types/forum";

type Props = {
  discussions: ForumThread[];
};

export default function ForumPreview({ discussions }: Props) {
  const safeDiscussions = Array.isArray(discussions) ? discussions : [];

  return (
    <section className="divlab-card p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 divlab-section-label">
            Gemenskap
          </p>
          <h2 className="text-lg font-semibold text-divlab-text">Utforska forumet</h2>
          <p className="mt-2 text-sm leading-6 text-divlab-text-secondary">
            Läs diskussioner från andra utdelningsinvesterare. Ställ en fråga
            när du är redo.
          </p>
        </div>
        <Link href="/forum" className="divlab-btn-ghost shrink-0">
          Till forumet
        </Link>
      </div>

      {safeDiscussions.length === 0 ? (
        <div className="rounded-xl border divlab-inset px-4 py-5">
          <p className="text-sm leading-6 text-divlab-text-secondary">
            Inga diskussioner ännu.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {safeDiscussions.map((discussion) => {
            const username = discussion.authorUsername?.replace(/^@/, "") ?? null;
            const initials = getForumAuthorInitials(
              discussion.authorUsername,
              discussion.author,
            );

            return (
              <Link
                key={discussion.slug || discussion.id || discussion.title}
                href={`/forum/${discussion.slug}`}
                className="block rounded-xl border divlab-inset p-4 transition hover:border-divlab-blue/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-6 text-divlab-text">
                      {discussion.title}
                    </p>
                    <p className="mt-1 text-xs text-divlab-text-muted">
                      {discussion.category}
                    </p>
                  </div>
                  <ProfileAvatar
                    avatarUrl={discussion.authorAvatarUrl ?? null}
                    initials={initials}
                    sizeClassName="h-8 w-8"
                    textClassName="text-[10px]"
                    imageAlt={username ? `${username} profilbild` : "Profilbild"}
                  />
                </div>
                {discussion.excerpt ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-divlab-text-secondary">
                    {discussion.excerpt}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-divlab-text-muted">
                  <span>
                    {username ? `@${username}` : discussion.author}
                    {" · "}
                    {discussion.replies} svar
                  </span>
                  <span>{discussion.lastActivity}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
