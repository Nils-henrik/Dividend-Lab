import type { MetadataRoute } from "next";

import { ROBOTS_DISALLOW_PATHS } from "@/lib/seo/robots-policy";
import { PRODUCTION_SITE_ORIGIN } from "@/lib/seo/site";

/**
 * Allow public crawling while blocking authenticated, private and non-indexable areas.
 * Advertise the canonical sitemap plus dedicated News and Learning sitemaps.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: [
      `${PRODUCTION_SITE_ORIGIN}/sitemap.xml`,
      `${PRODUCTION_SITE_ORIGIN}/news-sitemap.xml`,
      `${PRODUCTION_SITE_ORIGIN}/learning-sitemap.xml`,
    ],
    host: PRODUCTION_SITE_ORIGIN,
  };
}
