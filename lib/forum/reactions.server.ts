import { createClient } from "@/lib/supabase/server";
import {
  buildForumReactionMap,
  type ForumReactionRow,
} from "@/lib/forum/reactions";

function isMissingForumReactionsTableError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("forum_reactions")
  );
}

export async function getForumReactionsForThreadPage(
  threadId: string,
  replyIds: string[],
  currentUserId?: string | null,
) {
  const supabase = await createClient();

  let query = supabase
    .from("forum_reactions")
    .select("id, user_id, target_type, thread_id, reply_id, reaction_type");

  if (replyIds.length > 0) {
    query = query.or(
      `thread_id.eq.${threadId},reply_id.in.(${replyIds.join(",")})`,
    );
  } else {
    query = query.eq("thread_id", threadId);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingForumReactionsTableError(error)) {
      return buildForumReactionMap([], threadId, replyIds, currentUserId);
    }

    throw new Error(error.message);
  }

  return buildForumReactionMap(
    (data ?? []) as ForumReactionRow[],
    threadId,
    replyIds,
    currentUserId,
  );
}
