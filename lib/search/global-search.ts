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

function normalizeSearchQuery(query: string) {
  return query.trim().replace(/^@+/, "");
}

function isUserOnlySearchQuery(query: string) {
  return query.trim().startsWith("@");
}

function isMissingSearchTableError(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST205" || error.message?.includes("forum_threads")
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
  const normalizedQuery = normalizeSearchQuery(query);

  if (!normalizedQuery) {
    return [];
  }

  const pattern = `%${escapeIlikePattern(normalizedQuery)}%`;
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
    subtitle: "Forumämne",
    href: `/forum/${thread.slug}`,
    preview: truncatePreview(getForumExcerpt(thread.body)),
  }));
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

export async function globalSearch(query: string): Promise<GlobalSearchResults> {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 2) {
    return {
      users: [],
      forum: [],
      learning: [],
    };
  }

  if (isUserOnlySearchQuery(trimmedQuery)) {
    const users = await searchProfiles(trimmedQuery);

    return {
      users,
      forum: [],
      learning: [],
    };
  }

  const [users, forum, learning] = await Promise.all([
    searchProfiles(trimmedQuery),
    searchForumThreads(trimmedQuery),
    Promise.resolve(searchLearningArticles(trimmedQuery)),
  ]);

  return {
    users,
    forum,
    learning,
  };
}
