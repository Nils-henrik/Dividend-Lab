import { createClient } from "@/lib/supabase/server";

function isMissingForumReactionsTableError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("forum_reactions")
  );
}

async function countReactionsForTargetIds(
  column: "thread_id" | "reply_id",
  targetIds: string[],
  profileId: string,
) {
  if (targetIds.length === 0) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("forum_reactions")
    .select("id", { count: "exact", head: true })
    .in(column, targetIds)
    .neq("user_id", profileId);

  if (error) {
    if (isMissingForumReactionsTableError(error)) {
      return 0;
    }

    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getForumReputationReceivedTotal(profileId: string) {
  const supabase = await createClient();

  const [threadsResult, repliesResult] = await Promise.all([
    supabase.from("forum_threads").select("id").eq("author_id", profileId),
    supabase.from("forum_replies").select("id").eq("author_id", profileId),
  ]);

  if (threadsResult.error) {
    throw new Error(threadsResult.error.message);
  }

  if (repliesResult.error) {
    throw new Error(repliesResult.error.message);
  }

  const threadIds = (threadsResult.data ?? []).map((row) => row.id);
  const replyIds = (repliesResult.data ?? []).map((row) => row.id);

  const [threadReactions, replyReactions] = await Promise.all([
    countReactionsForTargetIds("thread_id", threadIds, profileId),
    countReactionsForTargetIds("reply_id", replyIds, profileId),
  ]);

  return threadReactions + replyReactions;
}
