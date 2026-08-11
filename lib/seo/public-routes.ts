import { MODEL_PORTFOLIO_INDEXABLE_PATHS } from "@/lib/model-portfolios/public";

/**
 * Authoritative registry of indexable static public product/marketing routes.
 * Sitemap builders and SEO regression tests should prefer this source so new
 * public product routes are harder to forget.
 */
export const INDEXABLE_STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/features",
  "/contact",
  "/editorial",
  "/disclaimer",
  "/privacy",
  "/terms",
  "/cookies",
  "/news",
  "/learning",
  "/verktyg",
  "/verktyg/gav-kalkylator",
  "/frihetsmaskinen",
  "/forum",
  "/forum/senaste",
  "/forum/populart",
  "/forum/regler",
  "/forum/kategorier",
  "/forum/bolag",
  ...MODEL_PORTFOLIO_INDEXABLE_PATHS,
] as const;

export type IndexableStaticPublicPath =
  (typeof INDEXABLE_STATIC_PUBLIC_PATHS)[number];
