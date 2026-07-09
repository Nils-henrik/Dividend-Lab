"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { toggleForumReactionAction } from "@/app/forum/actions";
import type {
  ForumReactionSummary,
  ForumReactionTargetType,
} from "@/lib/forum/reactions";

type Props = {
  targetType: ForumReactionTargetType;
  targetId: string;
  threadSlug: string;
  reactions: ForumReactionSummary[];
  isAuthenticated: boolean;
  loginHref: string;
  disabled?: boolean;
};

const reactionButtonClass = (active: boolean) =>
  `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium leading-4 transition disabled:cursor-not-allowed disabled:opacity-60 ${
    active
      ? "divlab-selected"
      : "border-divlab-border-neutral bg-transparent text-divlab-text-muted hover:border-divlab-blue/25 hover:text-divlab-text-secondary"
  }`;

function ReactionSubmitButton({ summary }: { summary: ForumReactionSummary }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={summary.active}
      aria-label={`${summary.label}: ${summary.count}`}
      className={reactionButtonClass(summary.active)}
    >
      <span>{summary.label}</span>
      {summary.count > 0 && (
        <span className="tabular-nums text-divlab-text-subtle">{summary.count}</span>
      )}
    </button>
  );
}

export default function ForumQualityReactions({
  targetType,
  targetId,
  threadSlug,
  reactions,
  isAuthenticated,
  loginHref,
  disabled = false,
}: Props) {
  if (disabled) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {reactions.map((summary) => (
          <span
            key={summary.type}
            className="inline-flex items-center gap-1 rounded-full border border-divlab-border-neutral px-2.5 py-0.5 text-[10px] font-medium leading-4 text-divlab-text-muted"
          >
            <span>{summary.label}</span>
            {summary.count > 0 && (
              <span className="tabular-nums text-divlab-text-subtle">{summary.count}</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reactions.map((summary) =>
        isAuthenticated ? (
          <form key={summary.type} action={toggleForumReactionAction}>
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <input type="hidden" name="reactionType" value={summary.type} />
            <input type="hidden" name="threadSlug" value={threadSlug} />
            <ReactionSubmitButton summary={summary} />
          </form>
        ) : (
          <Link
            key={summary.type}
            href={loginHref}
            aria-label={`${summary.label}: logga in för att reagera`}
            className={reactionButtonClass(false)}
          >
            <span>{summary.label}</span>
            {summary.count > 0 && (
              <span className="tabular-nums text-divlab-text-subtle">{summary.count}</span>
            )}
          </Link>
        ),
      )}
    </div>
  );
}
