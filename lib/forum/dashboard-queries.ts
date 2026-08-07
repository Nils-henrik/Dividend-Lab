import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ForumThreadRecord } from "@/lib/forum/types";
import { mapThreadRecordToForumThread } from "@/lib/forum/queries";
import type { ForumThread } from "@/types/forum";

type DashboardForumThreadRow = {
  id: string;
  slug: string;
  author_id: string;
  category_slug: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  content_version: number | null;
  edited_at: string | null;
  author_username: string | null;
  author_display_name: string | null;
  author_profile_created_at: string | null;
  author_avatar_path: string | null;
  author_profile_updated_at: string | null;
  reply_count: number | null;
  last_activity_at: string;
};

function normalizeDashboardForumLimit(limit: number) {
  if (!Number.isFinite(limit)) {
    return 5;
  }

  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

function mapDashboardRowToRecord(
  row: DashboardForumThreadRow,
): ForumThreadRecord {
  return {
    id: row.id,
    slug: row.slug,
    authorId: row.author_id,
    categorySlug: row.category_slug,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contentVersion: row.content_version ?? 1,
    editedAt: row.edited_at,
    authorUsername: row.author_username,
    authorDisplayName: row.author_display_name,
    authorProfileCreatedAt: row.author_profile_created_at,
    authorAvatarPath: row.author_avatar_path,
    authorProfileUpdatedAt: row.author_profile_updated_at,
    replyCount: row.reply_count ?? 0,
    lastActivityAt: row.last_activity_at,
  };
}

export async function getDashboardForumThreadsByLatestActivity(
  limit = 5,
): Promise<ForumThread[]> {
  if (!tryGetSupabaseConfig()) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "get_forum_threads_by_latest_activity",
    {
      p_limit: normalizeDashboardForumLimit(limit),
    },
  );

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as DashboardForumThreadRow[]).flatMap((row) => {
    try {
      return [mapThreadRecordToForumThread(mapDashboardRowToRecord(row))];
    } catch {
      return [];
    }
  });
}
