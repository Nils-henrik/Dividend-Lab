import "server-only";

import { FORUM_DEMO_THREAD_SLUG } from "@/data/forum";
import { getForumThreadsFromDatabase } from "@/lib/forum/queries";
import { absoluteUrl } from "@/lib/seo/site";

type SitemapEntry = {
  url: string;
  lastModified?: Date;
};

function parseReliableDate(value: string | undefined): Date | undefined {
  if (!value?.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

/**
 * Fail-soft discovery of public forum thread URLs for the sitemap.
 * Returns [] when the DB client/tables are unavailable so sitemap generation
 * never becomes brittle in local/preview environments without Supabase.
 */
export async function listPublicForumThreadSitemapEntries(): Promise<
  SitemapEntry[]
> {
  try {
    const threads = await getForumThreadsFromDatabase();
    return threads
      .filter((thread) => thread.slug && thread.slug !== FORUM_DEMO_THREAD_SLUG)
      .map((thread) => ({
        url: absoluteUrl(`/forum/${thread.slug}`),
        lastModified:
          parseReliableDate(thread.lastActivityAt) ??
          parseReliableDate(thread.updatedAt) ??
          parseReliableDate(thread.createdAt),
      }));
  } catch {
    return [];
  }
}
