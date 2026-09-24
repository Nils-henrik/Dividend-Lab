import "server-only";

import { formatForumTimestamp, getForumAuthorInitials, getForumAuthorLabel } from "@/lib/forum/format";
import { getAvatarPublicUrl } from "@/lib/profiles/identity";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { COMPANY_COMMENT_PAGE_SIZE, type CompanyComment } from "./comments";

type CommentRow = {
  id: string;
  company_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type ProfileRow = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_path: string | null;
  updated_at: string | null;
};

function isMissingCommentsTable(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("company_comments") === true
  );
}

export async function getCompanyComments(companyId: string): Promise<CompanyComment[]> {
  if (!tryGetSupabaseConfig() || !companyId) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_comments")
    .select("id, company_id, user_id, body, created_at")
    .eq("company_id", companyId)
    .eq("moderation_status", "visible")
    .order("created_at", { ascending: false })
    .limit(COMPANY_COMMENT_PAGE_SIZE);

  if (error) {
    if (isMissingCommentsTable(error)) {
      return [];
    }

    console.error("[companies] comment lookup failed", {
      code: error.code,
      message: error.message,
    });
    return [];
  }

  const rows = (data ?? []) as CommentRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];

  const profilesById = new Map<string, ProfileRow>();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_path, updated_at")
      .in("id", userIds);

    if (profileError) {
      console.error("[companies] comment author lookup failed", {
        code: profileError.code,
        message: profileError.message,
      });
    } else {
      for (const profile of (profiles ?? []) as ProfileRow[]) {
        profilesById.set(profile.id, profile);
      }
    }
  }

  return rows.map((row) => {
    const profile = profilesById.get(row.user_id);
    const username = profile?.username?.trim() || null;
    const displayName = getForumAuthorLabel(username, profile?.display_name);

    return {
      id: row.id,
      companyId: row.company_id,
      userId: row.user_id,
      body: row.body,
      createdAt: row.created_at,
      username,
      displayName,
      initials: getForumAuthorInitials(username, profile?.display_name),
      avatarUrl: getAvatarPublicUrl(profile?.avatar_path, profile?.updated_at),
    };
  });
}

export function formatCompanyCommentTimestamp(value: string) {
  return formatForumTimestamp(value);
}
