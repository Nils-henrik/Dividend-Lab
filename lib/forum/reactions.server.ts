import { createClient } from "@/lib/supabase/server";
import {
  buildForumReactionMap,
  type ForumReactionRow,
  type ForumReactionTargetType,
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

export async function isSelfForumReactionTarget(
  userId: string,
  targetType: ForumReactionTargetType,
  targetId: string,
) {
  const supabase = await createClient();

  if (targetType === "thread") {
    const { data, error } = await supabase
      .from("forum_threads")
      .select("author_id")
      .eq("id", targetId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data?.author_id === userId;
  }

  const { data, error } = await supabase
    .from("forum_replies")
    .select("author_id")
    .eq("id", targetId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.author_id === userId;
}
