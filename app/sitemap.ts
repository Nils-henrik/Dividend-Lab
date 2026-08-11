import type { MetadataRoute } from "next";

import { buildSitemapEntries } from "@/lib/seo/sitemap-entries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await buildSitemapEntries();
  return entries.map((entry) => ({
    url: entry.url,
    ...(entry.lastModified ? { lastModified: entry.lastModified } : {}),
  }));
}
