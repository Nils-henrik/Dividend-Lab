import Link from "next/link";
import type { ForumThread } from "@/types/forum";
import ForumShareButton from "./ForumShareButton";

type Props = {
  thread: ForumThread;
  featured?: boolean;
};

export default function ForumThreadCard({ thread, featured = false }: Props) {
  return (
    <div
      className={`block divlab-card transition hover:border-divlab-border-strong ${
        featured ? "p-4" : "p-3.5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border divlab-border-neutral px-2 py-0.5 text-[11px] font-medium text-divlab-text-muted">
              {thread.category}
            </span>
          </div>

          <Link
            href={`/forum/${thread.slug}`}
            className={`block font-semibold tracking-[-0.02em] text-divlab-text transition hover:text-divlab-blue-muted ${
              featured ? "text-lg" : "text-base"
            }`}
          >
            {thread.title}
          </Link>
          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-divlab-text-secondary">
            {thread.excerpt}
          </p>
        </div>

        <div className="hidden shrink-0 text-right md:block">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
            Svar
          </p>
          <p className="mt-1 text-lg font-medium text-divlab-text tabular-nums">
            {thread.replies}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t divlab-border-neutral pt-3 text-xs text-divlab-text-muted">
        <span className="text-divlab-text-secondary">{thread.author}</span>
        <div className="flex items-center gap-3">
          <span className="tabular-nums">{thread.lastActivity}</span>
          <ForumShareButton
            shareUrl={`/forum/${thread.slug}`}
            shareTitle={thread.title}
          />
        </div>
      </div>
    </div>
  );
}
