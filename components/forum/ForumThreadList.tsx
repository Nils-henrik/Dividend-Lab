import type { ForumThread } from "@/types/forum";
import ForumThreadRow from "./ForumThreadRow";

type Props = {
  title: string;
  description?: string;
  threads: ForumThread[];
};

export default function ForumThreadList({ title, description, threads }: Props) {
  return (
    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#111111]/85">
      <div className="border-b border-white/10 px-3 py-2.5">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        )}
      </div>

      <div className="hidden border-b border-white/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-gray-600 xl:grid xl:grid-cols-[minmax(0,1fr)_70px_96px_58px]">
        <span>Discussion</span>
        <span>Replies</span>
        <span>Activity</span>
        <span className="text-right">Share</span>
      </div>

      <div>
        {threads.map((thread) => (
          <ForumThreadRow key={thread.slug} thread={thread} />
        ))}
      </div>

      {threads.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-gray-500">
          No discussions yet.
        </div>
      )}
    </section>
  );
}
