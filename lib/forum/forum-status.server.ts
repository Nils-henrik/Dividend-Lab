import { getForumStatusProgress } from "@/lib/forum/forum-status";
import type { ForumAuthorStats } from "@/lib/forum/types";
import { createClient } from "@/lib/supabase/server";

type ForumAuthorStatsRow = {
  thread_count: number | string;
  reply_count: number | string;
  contribution_count: number | string;
  helpful_count: number | string;
  insightful_count: number | string;
  well_researched_count: number | string;
  total_received_reactions: number | string;
};

function isMissingForumStatsFunctionError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST202" &&
    Boolean(error.message?.includes("get_forum_author_stats"))
  );
}

function logForumAuthorStatsFailure(
  profileId: string,
  error: { code?: string; message?: string; details?: string; hint?: string },
) {
  console.error("Failed to load forum author stats", {
    profileId,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

function toCount(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.floor(parsed);
}

function mapStatsRow(row: ForumAuthorStatsRow): ForumAuthorStats {
  const threadCount = toCount(row.thread_count);
  const replyCount = toCount(row.reply_count);
  const contributionCount = toCount(row.contribution_count);
  const totalReceivedReactions = toCount(row.total_received_reactions);
  const statusProgress = getForumStatusProgress(
    contributionCount,
    totalReceivedReactions,
  );

  return {
    threadCount,
    replyCount,
    contributionCount,
    totalReceivedReactions,
    reactionsByType: {
      helpful: toCount(row.helpful_count),
      insightful: toCount(row.insightful_count),
      well_researched: toCount(row.well_researched_count),
    },
    currentStatus: statusProgress.currentStatus,
    nextStatus: statusProgress.nextStatus,
    remainingContributions: statusProgress.remainingContributions,
    remainingReactions: statusProgress.remainingReactions,
  };
}

function emptyForumAuthorStats(): ForumAuthorStats {
  return mapStatsRow({
    thread_count: 0,
    reply_count: 0,
    contribution_count: 0,
    helpful_count: 0,
    insightful_count: 0,
    well_researched_count: 0,
    total_received_reactions: 0,
  });
}

export async function getForumAuthorStats(
  profileId: string,
): Promise<ForumAuthorStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_forum_author_stats", {
    p_author_id: profileId,
  });

  if (error) {
    if (isMissingForumStatsFunctionError(error)) {
      return emptyForumAuthorStats();
    }

    logForumAuthorStatsFailure(profileId, error);
    throw new Error("Forum statistics are temporarily unavailable.");
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    logForumAuthorStatsFailure(profileId, {
      message: "get_forum_author_stats returned no rows",
    });
    throw new Error("Forum statistics are temporarily unavailable.");
  }

  return mapStatsRow(row as ForumAuthorStatsRow);
}
