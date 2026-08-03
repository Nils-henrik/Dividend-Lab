/** Canonical production origin for SEO surfaces (sitemap, robots, canonical URLs). */
export const PRODUCTION_SITE_ORIGIN = "https://divlab.se";

/** Build an absolute https://divlab.se URL from a site-relative path. */
export function absoluteUrl(path: string): string {
  if (!path || path === "/") {
    return PRODUCTION_SITE_ORIGIN;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${PRODUCTION_SITE_ORIGIN}${normalized.replace(/\/$/, "")}`;
}
