/** Paths blocked from crawling in robots.txt (authenticated / private / non-public). */
export const ROBOTS_DISALLOW_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/account",
  "/account/",
  "/dashboard",
  "/dashboard/",
  "/settings",
  "/messages",
  "/messages/",
  "/notifications",
  "/notifications/",
  "/contacts",
  "/watchlist",
  "/goals",
  "/calendar",
  "/brain",
  "/forum/new",
  "/forum/demo-interactions-preview",
  "/auth/",
  "/api/",
] as const;

/**
 * Mirrors robots.txt prefix matching for the plain path rules above.
 * Keep this helper aligned with app/robots.ts so regression tests can detect
 * accidental collisions between private prefixes and indexable public routes.
 */
export function isPathBlockedByRobotsPolicy(pathname: string): boolean {
  return ROBOTS_DISALLOW_PATHS.some((prefix) => pathname.startsWith(prefix));
}
