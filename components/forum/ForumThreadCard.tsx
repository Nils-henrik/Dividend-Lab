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
      className={`block rounded-lg border border-white/10 bg-[#161616] transition hover:border-[#D4AF37]/30 ${
        featured ? "p-3" : "p-2.5"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {thread.sticky && (
              <span className="rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-0.5 text-[11px] font-medium text-[#D4AF37]">
                Sticky
              </span>
            )}
            <span className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-gray-500">
              {thread.category}
            </span>
            {thread.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <Link
            href={`/forum/${thread.slug}`}
            className={`font-semibold tracking-[-0.02em] text-white ${
              featured ? "text-lg" : "text-base"
            }`}
          >
            {thread.title}
          </Link>
          <p className="mt-1 text-xs leading-5 text-gray-500">{thread.excerpt}</p>
        </div>

        <div className="hidden grid-cols-3 gap-4 text-right text-sm md:grid">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
              Replies
            </p>
            <p className="mt-1 text-white tabular-nums">{thread.replies}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
              Views
            </p>
            <p className="mt-1 text-white tabular-nums">{thread.views}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-600">
              Quality
            </p>
            <p className="mt-1 whitespace-nowrap text-[#D4AF37] tabular-nums">
              {thread.qualityScore}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-2.5 text-xs text-gray-500">
        <span>Started by {thread.author}</span>
        <div className="flex items-center gap-3">
          <span>{thread.lastActivity}</span>
          <ForumShareButton />
        </div>
      </div>
    </div>
  );
}
