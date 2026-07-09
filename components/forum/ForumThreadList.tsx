import type { ForumThread } from "@/types/forum";
import ForumThreadRow from "./ForumThreadRow";

type Props = {
  title: string;
  description?: string;
  threads: ForumThread[];
};

export default function ForumThreadList({ title, description, threads }: Props) {
  return (
    <section className="divlab-surface-panel overflow-hidden">
      <div className="border-b divlab-border-neutral px-3 py-2.5">
        <h2 className="text-base font-semibold text-divlab-text">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-divlab-text-muted">{description}</p>
        )}
      </div>

      <div className="hidden border-b divlab-border-neutral px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted xl:grid xl:grid-cols-[minmax(0,1fr)_70px_96px_58px]">
        <span>Diskussion</span>
        <span>Svar</span>
        <span>Aktivitet</span>
        <span className="text-right">Dela</span>
      </div>

      <div>
        {threads.map((thread) => (
          <ForumThreadRow key={thread.slug} thread={thread} />
        ))}
      </div>

      {threads.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-divlab-text-muted">
          Inga diskussioner än.
        </div>
      )}
    </section>
  );
}
