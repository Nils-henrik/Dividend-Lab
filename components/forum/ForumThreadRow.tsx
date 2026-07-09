import Link from "next/link";
import type { ForumThread } from "@/types/forum";
import ForumShareButton from "./ForumShareButton";

type Props = {
  thread: ForumThread;
};

export default function ForumThreadRow({ thread }: Props) {
  return (
    <div className="grid gap-2 border-b divlab-border-neutral px-4 py-3 transition last:border-0 divlab-row-hover xl:grid-cols-[minmax(0,1fr)_70px_96px_58px] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md border divlab-border-neutral px-2 py-0.5 text-[11px] font-medium text-divlab-text-muted">
            {thread.category}
          </span>
        </div>

        <Link
          href={`/forum/${thread.slug}`}
          className="mt-1.5 block truncate text-[15px] font-medium text-divlab-text transition hover:text-divlab-blue-muted"
        >
          {thread.title}
        </Link>
        <p className="mt-1 line-clamp-1 text-sm text-divlab-text-secondary">
          {thread.excerpt}
        </p>
        <p className="mt-1.5 text-xs text-divlab-text-muted">{thread.author}</p>
      </div>

      <div className="hidden text-sm xl:block">
        <p className="text-divlab-text tabular-nums">{thread.replies}</p>
      </div>

      <div className="hidden text-sm xl:block">
        <p className="whitespace-nowrap text-divlab-text-secondary tabular-nums">
          {thread.lastActivity}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 xl:justify-end">
        <div className="flex flex-wrap gap-3 text-xs text-divlab-text-muted xl:hidden">
          <span>{thread.replies} svar</span>
          <span>{thread.lastActivity}</span>
        </div>
        <ForumShareButton
          shareUrl={`/forum/${thread.slug}`}
          shareTitle={thread.title}
        />
      </div>
    </div>
  );
}
