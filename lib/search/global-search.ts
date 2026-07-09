import { learningArticles } from "@/data/learning-articles";
import { getForumExcerpt } from "@/lib/forum/format";
import type {
  GlobalSearchResult,
  GlobalSearchResults,
} from "@/lib/search/types";
import { GLOBAL_SEARCH_LIMIT_PER_GROUP } from "@/lib/search/types";
import { createClient } from "@/lib/supabase/server";

function truncatePreview(value: string, maxLength = 90) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function escapeIlikePattern(value: string) {
  return value.replace(/[%_,]/g, " ").trim();
}

function isMissingSearchTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("forum_threads") ||
    error.message?.includes("forum_replies")
  );
}

function getLearningArticleSearchText(article: (typeof learningArticles)[number]) {
  const sectionText = article.sections.flatMap((section) => [
    section.heading ?? "",
    ...(section.intro ?? []),
    ...(section.paragraphs ?? []),
    ...(section.subsections?.flatMap((subsection) => [
      subsection.subheading,
      ...subsection.paragraphs,
    ]) ?? []),
    section.callout ?? "",
    ...(section.calculation?.lines ?? []),
  ]);

  return [
    article.title,
    article.description,
    article.excerpt,
    article.intro,
    ...sectionText,
  ]
    .join(" ")
    .toLowerCase();
}

async function searchProfiles(query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlikePattern(query)}%`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio")
    .not("username", "is", null)
    .or(`username.ilike.${pattern},display_name.ilike.${pattern}`)
    .limit(GLOBAL_SEARCH_LIMIT_PER_GROUP);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter((profile) => profile.username)
    .map((profile) => {
      const username = profile.username as string;
      const displayName = profile.display_name?.trim();

      return {
        id: profile.id,
        type: "user" as const,
        title: displayName ? displayName : `@${username}`,
        subtitle: displayName ? `@${username}` : "Medlem",
        href: `/profile/${encodeURIComponent(username.toLowerCase())}`,
        preview: profile.bio ? truncatePreview(profile.bio) : undefined,
      };
    });
}

async function searchForumThreads(query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlikePattern(query)}%`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_threads")
    .select("id, slug, title, body")
    .or(`title.ilike.${pattern},body.ilike.${pattern}`)
    .order("created_at", { ascending: false })
    .limit(GLOBAL_SEARCH_LIMIT_PER_GROUP);

  if (error) {
    if (isMissingSearchTableError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((thread) => ({
    id: thread.id,
    type: "forum" as const,
    title: thread.title,
    subtitle: "Diskussion",
    href: `/forum/${thread.slug}`,
    preview: truncatePreview(getForumExcerpt(thread.body)),
  }));
}

async function searchForumReplies(query: string): Promise<GlobalSearchResult[]> {
  const pattern = `%${escapeIlikePattern(query)}%`;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_replies")
    .select("id, body, forum_threads!inner(slug, title)")
    .ilike("body", pattern)
    .order("created_at", { ascending: false })
    .limit(GLOBAL_SEARCH_LIMIT_PER_GROUP);

  if (error) {
    if (isMissingSearchTableError(error)) {
      return [];
    }

    throw new Error(error.message);
  }

  return (data ?? []).map((reply) => {
    const thread = Array.isArray(reply.forum_threads)
      ? reply.forum_threads[0]
      : reply.forum_threads;

    return {
      id: reply.id,
      type: "forum" as const,
      title: thread?.title ?? "Forumsvar",
      subtitle: "Svar i diskussion",
      href: thread?.slug ? `/forum/${thread.slug}#forum-replies` : "/forum",
      preview: truncatePreview(reply.body),
    };
  });
}

function searchLearningArticles(query: string): GlobalSearchResult[] {
  const normalizedQuery = query.toLowerCase();

  return learningArticles
    .filter((article) =>
      getLearningArticleSearchText(article).includes(normalizedQuery),
    )
    .slice(0, GLOBAL_SEARCH_LIMIT_PER_GROUP)
    .map((article) => ({
      id: article.slug,
      type: "learning" as const,
      title: article.title,
      subtitle: "Utbildning",
      href: `/learning/${article.slug}`,
      preview: truncatePreview(article.excerpt || article.description),
    }));
}

function mergeForumResults(
  threads: GlobalSearchResult[],
  replies: GlobalSearchResult[],
) {
  const merged = [...threads];
  const seen = new Set(threads.map((item) => item.href));

  for (const reply of replies) {
    if (merged.length >= GLOBAL_SEARCH_LIMIT_PER_GROUP) {
      break;
    }

    const dedupeKey = `${reply.href}:${reply.preview ?? ""}`;

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    merged.push(reply);
  }

  return merged.slice(0, GLOBAL_SEARCH_LIMIT_PER_GROUP);
}

export async function globalSearch(query: string): Promise<GlobalSearchResults> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return {
      users: [],
      forum: [],
      learning: [],
    };
  }

  const [users, forumThreads, forumReplies, learning] = await Promise.all([
    searchProfiles(trimmedQuery),
    searchForumThreads(trimmedQuery),
    searchForumReplies(trimmedQuery),
    Promise.resolve(searchLearningArticles(trimmedQuery)),
  ]);

  return {
    users,
    forum: mergeForumResults(forumThreads, forumReplies),
    learning,
  };
}
