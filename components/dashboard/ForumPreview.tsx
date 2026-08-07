import Link from "next/link";
import type { ForumThread } from "@/types/forum";

type Props = {
  discussions: ForumThread[];
};

export default function ForumPreview({ discussions }: Props) {
  const visibleDiscussions = Array.isArray(discussions)
    ? discussions.slice(0, 4)
    : [];

  return (
    <section className="divlab-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="divlab-section-label">Community</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-divlab-text">
            Forumet just nu
          </h2>
        </div>
        <Link
          href="/forum"
          className="shrink-0 text-xs font-medium text-divlab-text-muted transition hover:text-divlab-blue-muted"
        >
          Till forumet →
        </Link>
      </div>

      {visibleDiscussions.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-divlab-text-secondary">
          Inga diskussioner ännu.
        </p>
      ) : (
        <div className="mt-5">
          {visibleDiscussions.map((discussion, index) => (
            <Link
              key={discussion.slug || discussion.id || discussion.title}
              href={`/forum/${discussion.slug}`}
              className={`group block py-4 first:pt-0 last:pb-0 ${
                index > 0 ? "border-t divlab-border-neutral" : ""
              }`}
            >
              <p className="text-sm font-medium leading-6 text-divlab-text transition group-hover:text-divlab-blue-muted">
                {discussion.title}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-divlab-text-muted">
                <span>{discussion.category}</span>
                <span aria-hidden="true">·</span>
                <span>{discussion.replies} svar</span>
                <span aria-hidden="true">·</span>
                <span>{discussion.lastActivity}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
