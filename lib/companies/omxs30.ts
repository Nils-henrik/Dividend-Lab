import { COMPANY_INDEXES, indexIdsForSlug } from "@/lib/companies/indexes";

/**
 * OMXS30 membership now comes from the shared index registry in
 * `lib/companies/indexes.ts`. These exports stay so existing callers keep
 * working. A catalog company is OMXS30 only when that registry says so.
 */
export const VERIFIED_OMXS30_SLUGS =
  COMPANY_INDEXES.find((index) => index.id === "omxs30")?.constituentSlugs ?? [];

export function isVerifiedOmxs30Member(slug: string) {
  return indexIdsForSlug(slug).includes("omxs30");
}
