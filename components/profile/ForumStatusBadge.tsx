import type { ForumAuthorStats } from "@/lib/forum/types";

type Props = {
  forumStats: ForumAuthorStats;
  className?: string;
};

export default function ForumStatusBadge({ forumStats, className = "" }: Props) {
  const isVeteran = forumStats.currentStatus.id === "veteran";

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.02em] ${
            isVeteran
              ? "border-divlab-blue/35 bg-divlab-blue/10 text-divlab-blue"
              : "border-divlab-border-neutral divlab-inset text-divlab-text-secondary"
          }`}
        >
          {forumStats.currentStatus.label}
        </span>
        <span className="text-xs text-divlab-text-muted">
          {forumStats.totalReceivedReactions}{" "}
          {forumStats.totalReceivedReactions === 1
            ? "mottagen reaktion"
            : "mottagna reaktioner"}
        </span>
      </div>
    </div>
  );
}
