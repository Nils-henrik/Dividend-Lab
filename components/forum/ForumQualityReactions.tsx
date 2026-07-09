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

function ReactionSubmitButton({ summary }: { summary: ForumReactionSummary }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={summary.active}
      aria-label={`${summary.label}: ${summary.count}`}
      className={`rounded border px-1.5 py-0.5 text-[10px] leading-4 transition disabled:cursor-not-allowed disabled:opacity-60 ${
        summary.active
          ? "border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]"
          : "border-white/10 bg-white/[0.03] text-gray-400 hover:border-[#D4AF37]/30 hover:text-white"
      }`}
    >
      <span aria-hidden="true">{summary.icon}</span>
      {summary.count > 0 && (
        <span className="ml-1 tabular-nums">{summary.count}</span>
      )}
      <span className="ml-1 text-gray-500">{summary.label}</span>
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
      <div className="flex flex-wrap items-center gap-1">
        {reactions.map((summary) => (
          <span
            key={summary.type}
            className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] leading-4 text-gray-500"
          >
            <span aria-hidden="true">{summary.icon}</span>
            {summary.count > 0 && (
              <span className="ml-1 tabular-nums">{summary.count}</span>
            )}
            <span className="ml-1 text-gray-600">{summary.label}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
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
            className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[10px] leading-4 text-gray-500 transition hover:border-[#D4AF37]/30 hover:text-[#D4AF37]"
          >
            <span aria-hidden="true">{summary.icon}</span>
            {summary.count > 0 && (
              <span className="ml-1 tabular-nums">{summary.count}</span>
            )}
            <span className="ml-1 text-gray-600">{summary.label}</span>
          </Link>
        ),
      )}
    </div>
  );
}
