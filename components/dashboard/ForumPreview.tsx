import Link from "next/link";
import { forumDiscussions } from "@/data/dashboard";

export default function ForumPreview() {
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

      <div className="space-y-3">
        {forumDiscussions.map((discussion) => (
          <div
            key={discussion.title}
            className="rounded-xl border divlab-inset p-4"
          >
            <p className="text-sm font-medium leading-6 text-divlab-text">
              {discussion.title}
            </p>
            <div className="mt-3 flex justify-between text-xs text-divlab-text-muted">
              <span>{discussion.replies} svar</span>
              <span>{discussion.activity}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
