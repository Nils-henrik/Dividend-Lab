import "server-only";

import { createClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/seo/site";

type SitemapEntry = {
  url: string;
  lastModified?: Date;
};

function isMissingForumCompanyTableError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("forum_companies")
  );
}

/**
 * Fail-soft discovery of active public company directory URLs.
 * Unavailable/error placeholders are never included.
 */
export async function listActiveForumCompanySitemapEntries(): Promise<
  SitemapEntry[]
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_companies")
      .select("slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      if (isMissingForumCompanyTableError(error)) {
        return [];
      }
      return [];
    }

    return (data ?? [])
      .map((row) => String(row.slug ?? "").trim())
      .filter(Boolean)
      .map((slug) => ({
        url: absoluteUrl(`/forum/bolag/${slug}`),
      }));
  } catch {
    return [];
  }
}
