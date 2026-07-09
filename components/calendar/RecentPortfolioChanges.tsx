import type { PortfolioChange } from "@/types/calendar";
import { portfolioChangeTypeLabels } from "@/lib/events";

type Props = {
  changes: PortfolioChange[];
};

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function RecentPortfolioChanges({ changes }: Props) {
  return (
    <section className="divlab-card p-4">
      <p className="divlab-section-label text-[10px] tracking-[0.2em]">
        Senaste portföljförändringar
      </p>

      <div className="mt-3 space-y-2">
        {changes.map((change) => (
          <article
            key={change.id}
            className="rounded-xl border divlab-border-neutral bg-divlab-surface px-3.5 py-2.5 transition-all duration-300 hover:border-divlab-blue/25"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.1em] text-divlab-text-subtle">
                  {portfolioChangeTypeLabels[change.type]}
                </p>
                <p className="mt-1 text-sm font-medium text-divlab-text">
                  {change.company}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-divlab-text-secondary">
                  {change.title}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-divlab-text-muted tabular-nums">
                {formatTimestamp(change.timestamp)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
