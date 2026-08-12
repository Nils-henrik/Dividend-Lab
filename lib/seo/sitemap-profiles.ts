import "server-only";

import { isTemporaryUsername } from "@/lib/profiles/username";
import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/seo/site";

type ProfileSitemapRow = {
  username: string | null;
  updated_at: string | null;
};

type SitemapEntry = {
  url: string;
  lastModified?: Date;
};

function parseReliableDate(value: string | null): Date | undefined {
  if (!value?.trim()) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

/**
 * Fail-soft discovery of public member profiles for the canonical sitemap.
 * Profiles are publicly readable by product policy; temporary onboarding
 * identities are omitted until the member has selected a real username.
 */
export async function listPublicProfileSitemapEntries(): Promise<
  SitemapEntry[]
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("username, updated_at")
      .not("username", "is", null)
      .order("username", { ascending: true })
      .returns<ProfileSitemapRow[]>();

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).flatMap((row) => {
      const username = row.username?.trim().toLowerCase();
      if (!username || isTemporaryUsername(username)) return [];

      return [
        {
          url: absoluteUrl(`/profile/${encodeURIComponent(username)}`),
          lastModified: parseReliableDate(row.updated_at),
        },
      ];
    });
  } catch {
    // Never make sitemap generation fail because profile discovery is unavailable.
    return [];
  }
}
