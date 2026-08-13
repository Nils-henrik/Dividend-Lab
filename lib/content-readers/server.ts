import "server-only";

import { createClient } from "@supabase/supabase-js";
import type {
  ContentReaderCountMap,
  ContentReaderType,
} from "@/lib/content-readers/types";

export type { ContentReaderCountMap, ContentReaderType } from "@/lib/content-readers/types";

type ContentReaderCountRow = {
  content_slug: string;
  unique_readers: number | string;
};

const CONTENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,179}$/;
const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegrambot|discordbot|linkedinbot|pinterest|headlesschrome|lighthouse|pagespeed|vercel|uptimerobot/i;

function createContentReaderAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function isContentReaderType(value: unknown): value is ContentReaderType {
  return value === "news" || value === "learning";
}

export function isValidContentSlug(value: unknown): value is string {
  return typeof value === "string" && CONTENT_SLUG_PATTERN.test(value);
}

export function isLikelyBotUserAgent(userAgent: string): boolean {
  return BOT_USER_AGENT_PATTERN.test(userAgent);
}

export async function getContentReaderCounts(
  contentType: ContentReaderType,
  slugs: string[],
): Promise<ContentReaderCountMap> {
  const uniqueSlugs = [...new Set(slugs.filter(isValidContentSlug))];
  const initialCounts = Object.fromEntries(
    uniqueSlugs.map((slug) => [slug, 0]),
  ) as ContentReaderCountMap;

  if (uniqueSlugs.length === 0) {
    return initialCounts;
  }

  const supabase = createContentReaderAdminClient();
  if (!supabase) {
    return initialCounts;
  }

  const { data, error } = await supabase.rpc("get_content_reader_counts", {
    p_content_type: contentType,
    p_content_slugs: uniqueSlugs,
  });

  if (error || !Array.isArray(data)) {
    return initialCounts;
  }

  for (const row of data as ContentReaderCountRow[]) {
    if (!isValidContentSlug(row.content_slug)) {
      continue;
    }

    const parsedCount = Number(row.unique_readers);
    initialCounts[row.content_slug] = Number.isFinite(parsedCount)
      ? Math.max(0, Math.floor(parsedCount))
      : 0;
  }

  return initialCounts;
}

export async function getContentReaderCount(
  contentType: ContentReaderType,
  slug: string,
): Promise<number> {
  const counts = await getContentReaderCounts(contentType, [slug]);
  return counts[slug] ?? 0;
}

export async function recordContentReader({
  contentType,
  slug,
  ipAddress,
  userAgent,
}: {
  contentType: ContentReaderType;
  slug: string;
  ipAddress: string;
  userAgent: string;
}): Promise<number> {
  if (!isValidContentSlug(slug)) {
    return 0;
  }

  const supabase = createContentReaderAdminClient();
  if (!supabase) {
    return getContentReaderCount(contentType, slug);
  }

  const { data, error } = await supabase.rpc("record_content_reader", {
    p_content_type: contentType,
    p_content_slug: slug,
    p_ip: ipAddress,
    p_user_agent: userAgent,
  });

  if (error) {
    return getContentReaderCount(contentType, slug);
  }

  const count = Number(data);
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}
