import { latestReplies } from "@/data/forum";

type Props = {
  embedded?: boolean;
};

export default function LatestReplies({ embedded = false }: Props) {
  const content =
    latestReplies.length === 0 ? (
      <p className="mt-3 text-[11px] leading-5 text-divlab-text-muted">
        Inga svar än.
      </p>
    ) : (
      <div className="mt-3 space-y-2">
        {latestReplies.map((reply) => (
          <div
            key={`${reply.threadTitle}-${reply.user}`}
            className="border-b divlab-border-neutral pb-2 last:border-0 last:pb-0"
          >
            <p className="text-xs leading-5 text-divlab-text-secondary">
              {reply.threadTitle}
            </p>
            <p className="mt-0.5 text-[11px] text-divlab-text-muted">
              {reply.user} · {reply.activity}
            </p>
          </div>
        ))}
      </div>
    );

  if (embedded) {
    return content;
  }

  return (
    <section className="divlab-aside-panel">
      <h2 className="divlab-aside-panel-title">Senaste svaren</h2>
      {content}
    </section>
  );
}
