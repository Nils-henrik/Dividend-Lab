import { getForumReputationBadge } from "@/lib/forum/reputation-badge";

type Props = {
  totalReceivedReactions: number;
  showDescription?: boolean;
  className?: string;
};

export default function ForumReputationBadge({
  totalReceivedReactions,
  showDescription = false,
  className = "",
}: Props) {
  const badge = getForumReputationBadge(totalReceivedReactions);
  const isVeteran = badge.level === "dividend_lab_veteran";

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
          {badge.label}
        </span>
        <span className="text-xs text-divlab-text-muted">
          {badge.score}{" "}
          {badge.score === 1 ? "mottagen reaktion" : "mottagna reaktioner"}
        </span>
      </div>
      {showDescription && (
        <p className="mt-3 max-w-xl text-sm leading-6 text-divlab-text-secondary">
          {badge.description}
        </p>
      )}
    </div>
  );
}
