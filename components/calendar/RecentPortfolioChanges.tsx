import type { PortfolioChange } from "@/types/calendar";
import { portfolioChangeTypeLabels } from "@/lib/events";

type Props = {
  changes: PortfolioChange[];
};

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function RecentPortfolioChanges({ changes }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
        Recent Portfolio Changes
      </p>

      <div className="mt-3 space-y-2">
        {changes.map((change) => (
          <article
            key={change.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 transition-all duration-300 hover:border-[#D4AF37]/25"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.1em] text-gray-600">
                  {portfolioChangeTypeLabels[change.type]}
                </p>
                <p className="mt-1 text-sm font-medium text-white">
                  {change.company}
                </p>
                <p className="mt-1 text-[12px] leading-5 text-gray-400">
                  {change.title}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-gray-600 tabular-nums">
                {formatTimestamp(change.timestamp)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
