import Link from "next/link";
import { trendingThreads } from "@/data/forum";

type Props = {
  embedded?: boolean;
};

export default function ForumTrending({ embedded = false }: Props) {
  const content =
    trendingThreads.length === 0 ? (
      <p className="mt-3 text-[11px] leading-5 text-divlab-text-muted">
        Inga trendande diskussioner än.
      </p>
    ) : (
      <div className="mt-3 space-y-2">
        {trendingThreads.map((thread) => (
          <Link
            key={thread.slug}
            href={`/forum/${thread.slug}`}
            className="block border-b divlab-border-neutral pb-2 last:border-0 last:pb-0"
          >
            <p className="text-xs font-medium leading-5 text-divlab-text transition hover:text-divlab-blue-muted">
              {thread.title}
            </p>
            <p className="mt-0.5 text-[11px] text-divlab-text-muted">
              {thread.replies} svar · {thread.lastActivity}
            </p>
          </Link>
        ))}
      </div>
    );

  if (embedded) {
    return content;
  }

  return (
    <section className="divlab-aside-panel">
      <h2 className="divlab-aside-panel-title">Trendande diskussioner</h2>
      {content}
    </section>
  );
}
