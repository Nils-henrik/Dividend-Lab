import { formatForumTimestamp } from "@/lib/forum/format";
import { createClient } from "@/lib/supabase/server";
import type {
  LearningArticleComment,
  LearningCommentRecord,
} from "./types";

function getProfileUsername(
  profiles: { username: string | null } | { username: string | null }[] | null,
) {
  if (!profiles) {
    return null;
  }

  const profile = Array.isArray(profiles) ? profiles[0] : profiles;
  return profile?.username?.trim() ?? null;
}

function mapCommentRecord(record: LearningCommentRecord): LearningArticleComment | null {
  const username = getProfileUsername(record.profiles);

  if (!username) {
    return null;
  }

  return {
    id: record.id,
    articleSlug: record.article_slug,
    userId: record.user_id,
    body: record.body,
    createdAt: record.created_at,
    username,
  };
}

export async function getLearningArticleComments(articleSlug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_article_comments")
    .select(
      `
      id,
      article_slug,
      user_id,
      body,
      created_at,
      profiles (
        username
      )
    `,
    )
    .eq("article_slug", articleSlug)
    .eq("is_hidden", false)
    .order("created_at", { ascending: true });

  if (error) {
    if (
      error.code === "PGRST205" ||
      error.message?.includes("learning_article_comments")
    ) {
      return [];
    }

    return [];
  }

  return (data as LearningCommentRecord[] | null)
    ?.map(mapCommentRecord)
    .filter((comment): comment is LearningArticleComment => comment !== null) ?? [];
}

export function formatLearningCommentTimestamp(value: string) {
  return formatForumTimestamp(value);
}
