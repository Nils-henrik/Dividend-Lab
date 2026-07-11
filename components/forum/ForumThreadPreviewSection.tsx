import Link from "next/link";
import type { ForumThread } from "@/types/forum";
import ForumThreadRow from "./ForumThreadRow";

type Props = {
  title: string;
  threads: ForumThread[];
  viewAllHref?: string;
  viewAllLabel?: string;
};

export default function ForumThreadPreviewSection({
  title,
  threads,
  viewAllHref,
  viewAllLabel = "Visa alla",
}: Props) {
  return (
    <section className="divlab-surface-panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b divlab-border-neutral px-3 py-2.5">
        <h2 className="text-base font-semibold text-divlab-text">{title}</h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="shrink-0 text-xs font-medium text-divlab-text-muted transition hover:text-divlab-blue-muted"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>

      {threads.length === 0 ? (
        <p className="px-4 py-6 text-sm text-divlab-text-muted">
          Inga diskussioner än.
        </p>
      ) : (
        <div>
          {threads.map((thread) => (
            <ForumThreadRow key={thread.slug} thread={thread} />
          ))}
        </div>
      )}
    </section>
  );
}
