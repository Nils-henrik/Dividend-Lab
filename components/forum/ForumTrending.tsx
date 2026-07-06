import Link from "next/link";
import { trendingThreads } from "@/data/forum";

export default function ForumTrending() {
  return (
    <section className="rounded-md border border-white/10 bg-[#161616] px-2.5 py-2">
      <h2 className="text-xs font-semibold text-white">Trending Discussions</h2>
      <div className="mt-2 space-y-2">
        {trendingThreads.map((thread) => (
          <Link
            key={thread.slug}
            href={`/forum/${thread.slug}`}
            className="block border-b border-white/10 pb-2 last:border-0 last:pb-0"
          >
            <p className="text-xs font-medium leading-4 text-white transition hover:text-[#D4AF37]">
              {thread.title}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {thread.replies} replies · {thread.lastActivity}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
