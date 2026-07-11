import { FORUM_REACTION_OPTIONS } from "@/lib/forum/reactions";
import { formatForumStatusProgressText } from "@/lib/forum/forum-status";
import type { ForumAuthorStats } from "@/lib/forum/types";

type Props = {
  forumStats: ForumAuthorStats;
};

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="divlab-definition-row">
      <p className="divlab-definition-label">{label}</p>
      <p className="divlab-definition-value tabular-nums">{value}</p>
    </div>
  );
}

export default function ForumStatusSection({ forumStats }: Props) {
  const progressText = formatForumStatusProgressText({
    currentStatus: forumStats.currentStatus,
    nextStatus: forumStats.nextStatus,
    remainingContributions: forumStats.remainingContributions,
    remainingReactions: forumStats.remainingReactions,
  });

  return (
    <section className="divlab-card p-6">
      <p className="divlab-section-label">Forumstatus</p>
      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-[-0.03em] text-divlab-text">
            {forumStats.currentStatus.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
            {forumStats.currentStatus.description}
          </p>
          <p className="mt-3 text-sm text-divlab-text-muted">{progressText}</p>
        </div>
      </div>

      <div className="divlab-definition-list mt-6 border-t divlab-border-neutral pt-6">
        <StatRow label="Trådar" value={forumStats.threadCount} />
        <StatRow label="Svar" value={forumStats.replyCount} />
        <StatRow
          label="Mottagna reaktioner"
          value={forumStats.totalReceivedReactions}
        />
      </div>

      <div className="mt-6 border-t divlab-border-neutral pt-6">
        <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-divlab-text-muted">
          Reaktioner efter typ
        </p>
        <div className="divlab-definition-list mt-4">
          {FORUM_REACTION_OPTIONS.map((option) => (
            <StatRow
              key={option.type}
              label={option.label}
              value={forumStats.reactionsByType[option.type]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
