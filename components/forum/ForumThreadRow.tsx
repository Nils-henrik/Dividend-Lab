import Link from "next/link";
import type { ForumThread } from "@/types/forum";
import ForumShareButton from "./ForumShareButton";

type Props = {
  thread: ForumThread;
};

export default function ForumThreadRow({ thread }: Props) {
  return (
    <div className="grid gap-2 border-b border-white/10 px-3 py-2 transition last:border-0 hover:bg-white/[0.025] xl:grid-cols-[minmax(0,1fr)_70px_96px_58px] xl:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-gray-500">
            {thread.category}
          </span>
        </div>

        <Link
          href={`/forum/${thread.slug}`}
          className="mt-1 block truncate text-[15px] font-medium text-white transition hover:text-[#D4AF37]"
        >
          {thread.title}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
          {thread.excerpt}
        </p>
        <p className="mt-1 text-[11px] text-gray-600">{thread.author}</p>
      </div>

      <div className="hidden text-sm text-gray-400 xl:block">
        <p className="text-white tabular-nums">{thread.replies}</p>
      </div>

      <div className="hidden text-sm xl:block">
        <p className="whitespace-nowrap text-gray-400">{thread.lastActivity}</p>
      </div>

      <div className="flex items-center justify-between gap-3 xl:justify-end">
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 xl:hidden">
          <span>{thread.replies} replies</span>
          <span>{thread.lastActivity}</span>
        </div>
        <ForumShareButton />
      </div>
    </div>
  );
}
