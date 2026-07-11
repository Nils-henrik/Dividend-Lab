import { FORUM_REACTION_OPTIONS } from "@/lib/forum/reactions";
import { formatForumStatusProgressText } from "@/lib/forum/forum-status";
import type { ForumAuthorStats } from "@/lib/forum/types";

type Props = {
  forumStats: ForumAuthorStats;
};

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-0 py-3 sm:px-4 sm:py-2 first:sm:pl-0 last:sm:pr-0">
      <p className="divlab-definition-label">{label}</p>
      <p className="mt-1 text-base font-medium leading-none tabular-nums text-divlab-text">
        {value}
      </p>
    </div>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {children}
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

      <div className="mt-5 border-t divlab-border-neutral pt-5">
        <StatGrid>
          <StatCell label="Trådar" value={forumStats.threadCount} />
          <StatCell label="Svar" value={forumStats.replyCount} />
          <StatCell
            label="Mottagna reaktioner"
            value={forumStats.totalReceivedReactions}
          />
        </StatGrid>
      </div>

      <div className="mt-5 border-t divlab-border-neutral pt-5">
        <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-divlab-text-muted">
          Reaktioner efter typ
        </p>
        <div className="mt-3">
          <StatGrid>
            {FORUM_REACTION_OPTIONS.map((option) => (
              <StatCell
                key={option.type}
                label={option.label}
                value={forumStats.reactionsByType[option.type]}
              />
            ))}
          </StatGrid>
        </div>
      </div>
    </section>
  );
}
