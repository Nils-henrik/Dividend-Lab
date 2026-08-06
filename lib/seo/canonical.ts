import { absoluteUrl, PRODUCTION_SITE_ORIGIN } from "@/lib/seo/site";

/**
 * Production canonical origin for public SEO metadata.
 * Always resolves to https://divlab.se — never preview or Vercel deployment domains.
 */
export function getCanonicalOrigin(): string {
  return PRODUCTION_SITE_ORIGIN;
}

/** Build a production canonical URL from a site-relative path. */
export function getCanonicalUrl(path: string): string {
  return absoluteUrl(path);
}
