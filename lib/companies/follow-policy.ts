import { getCompanyProfile } from "@/lib/companies/catalog";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Catalog gate used before any company_follows write. Unknown slugs are ignored. */
export function isFollowableCompanySlug(slug: string) {
  return SLUG_PATTERN.test(slug) && getCompanyProfile(slug) !== null;
}
