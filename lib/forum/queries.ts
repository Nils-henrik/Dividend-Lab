import {
  forumCategories,
  forumCategoryGroups,
  getForumCategory,
} from "@/data/forum";
import {
  formatForumRelativeActivity,
  getForumAuthorLabel,
  getForumAuthorUsername,
  getForumExcerpt,
} from "@/lib/forum/format";
import type {
  ForumCategoryCounts,
  ForumReplyRecord,
  ForumThreadRecord,
} from "@/lib/forum/types";
import { createClient } from "@/lib/supabase/server";
import type { ForumPost, ForumThread } from "@/types/forum";
import {
  getForumAuthorInitials,
  formatForumMemberSince,
  formatForumTimestamp,
} from "./format";

function isMissingForumTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("forum_threads") ||
    error.message?.includes("forum_replies")
  );
}

type ThreadProfileRow = {
  username: string | null;
  display_name: string | null;
  created_at: string | null;
};

type ThreadRow = {
  id: string;
  slug: string;
  author_id: string;
  category_slug: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  profiles: ThreadProfileRow | ThreadProfileRow[] | null;
};

type ReplyRow = {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles: ThreadProfileRow | ThreadProfileRow[] | null;
};

function getProfileRow(
  profiles: ThreadProfileRow | ThreadProfileRow[] | null,
): ThreadProfileRow | null {
  if (!profiles) {
    return null;
  }

  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

function mapThreadRow(row: ThreadRow, replyCount = 0): ForumThreadRecord {
  const profile = getProfileRow(row.profiles);

  return {
    id: row.id,
    slug: row.slug,
    authorId: row.author_id,
    categorySlug: row.category_slug,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    authorUsername: profile?.username ?? null,
    authorDisplayName: profile?.display_name ?? null,
    authorProfileCreatedAt: profile?.created_at ?? null,
    replyCount,
  };
}

function mapReplyRow(row: ReplyRow): ForumReplyRecord {
  const profile = getProfileRow(row.profiles);

  return {
    id: row.id,
    threadId: row.thread_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    authorUsername: profile?.username ?? null,
    authorDisplayName: profile?.display_name ?? null,
    authorProfileCreatedAt: profile?.created_at ?? null,
  };
}

async function getReplyCountsByThreadIds(threadIds: string[]) {
  if (threadIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_replies")
    .select("thread_id")
    .in("thread_id", threadIds);

  if (error) {
    if (isMissingForumTableError(error)) {
      return new Map<string, number>();
    }

    throw new Error(error.message);
  }

  const counts = new Map<string, number>();

  for (const row of data ?? []) {
    counts.set(row.thread_id, (counts.get(row.thread_id) ?? 0) + 1);
  }

  return counts;
}

export function mapThreadRecordToForumThread(
  record: ForumThreadRecord,
): ForumThread {
  const category = getForumCategory(record.categorySlug);

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    body: record.body,
    categorySlug: record.categorySlug,
    category: category.name,
    groupSlug: category.groupSlug,
    group: category.groupName,
    author: getForumAuthorLabel(
      record.authorUsername,
      record.authorDisplayName,
    ),
    authorUsername: record.authorUsername,
    authorUserId: record.authorId,
    replies: record.replyCount,
    lastActivity: formatForumRelativeActivity(record.updatedAt),
    createdAt: record.createdAt,
    excerpt: getForumExcerpt(record.body),
    tags: [],
  };
}

export function mapReplyRecordToForumPost(record: ForumReplyRecord): ForumPost {
  const username = getForumAuthorUsername(
    record.authorUsername,
    record.authorDisplayName,
  );

  return {
    id: record.id,
    username,
    displayName: record.authorDisplayName,
    avatar: getForumAuthorInitials(
      record.authorUsername,
      record.authorDisplayName,
    ),
    memberSince: formatForumMemberSince(record.authorProfileCreatedAt),
    joinDate: formatForumMemberSince(record.authorProfileCreatedAt),
    timestamp: formatForumTimestamp(record.createdAt),
    content: record.body,
    reactions: [],
    authorUserId: record.authorId,
  };
}

export async function getForumThreadsFromDatabase() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_threads")
    .select(
      `
      id,
      slug,
      author_id,
      category_slug,
      title,
      body,
      created_at,
      updated_at,
      profiles:author_id (
        username,
        display_name,
        created_at
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingForumTableError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  const rows = (data ?? []) as ThreadRow[];
  const replyCounts = await getReplyCountsByThreadIds(rows.map((row) => row.id));

  return rows.map((row) => mapThreadRow(row, replyCounts.get(row.id) ?? 0));
}

export async function getForumThreadBySlugFromDatabase(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_threads")
    .select(
      `
      id,
      slug,
      author_id,
      category_slug,
      title,
      body,
      created_at,
      updated_at,
      profiles:author_id (
        username,
        display_name,
        created_at
      )
    `,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    if (isMissingForumTableError(error)) {
      return null;
    }

    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const replyCounts = await getReplyCountsByThreadIds([data.id]);

  return mapThreadRow(data as ThreadRow, replyCounts.get(data.id) ?? 0);
}

export async function getForumRepliesByThreadIdFromDatabase(threadId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_replies")
    .select(
      `
      id,
      thread_id,
      author_id,
      body,
      created_at,
      profiles:author_id (
        username,
        display_name,
        created_at
      )
    `,
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  if (error) {
    if (isMissingForumTableError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return ((data ?? []) as ReplyRow[]).map(mapReplyRow);
}

export function buildForumCategoryCounts(
  threads: ForumThreadRecord[],
): ForumCategoryCounts {
  const counts: ForumCategoryCounts = {};

  for (const category of forumCategories) {
    counts[category.slug] = {
      discussions: 0,
      latestActivity: null,
    };
  }

  for (const thread of threads) {
    const current = counts[thread.categorySlug] ?? {
      discussions: 0,
      latestActivity: null,
    };

    current.discussions += 1;

    if (
      !current.latestActivity ||
      new Date(thread.createdAt).getTime() >
        new Date(current.latestActivity).getTime()
    ) {
      current.latestActivity = thread.createdAt;
    }

    counts[thread.categorySlug] = current;
  }

  return counts;
}

export function getForumCategoriesWithCounts(categoryCounts: ForumCategoryCounts) {
  return forumCategoryGroups.map((group) => ({
    ...group,
    categories: group.categories.map((category) => {
      const counts = categoryCounts[category.slug];

      return {
        ...category,
        discussions: counts?.discussions ?? 0,
        posts: counts?.discussions ?? 0,
        latestActivity: counts?.latestActivity
          ? formatForumRelativeActivity(counts.latestActivity)
          : "—",
      };
    }),
  }));
}

export function isForumCategorySlug(value: string) {
  return forumCategories.some((category) => category.slug === value);
}
