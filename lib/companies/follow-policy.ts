import { getCompanyProfile } from "@/lib/companies/catalog";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Planned free allowance. Billing is not built here, and this version never
 * refuses a follow, so existing users stay unblocked.
 */
export const FOLLOW_PREMIUM_PLAN = {
  freeCompanyLimit: 3,
  monthlyPriceSek: 99,
  enforcement: "disabled",
} as const;

export type FollowWriteDecision = {
  allowed: true;
  enforcement: "disabled";
};

/** Later a Premium gate can refuse counts at or above the free limit. */
export function decideFollowWrite(currentFollowCount: number): FollowWriteDecision {
  void currentFollowCount;
  return { allowed: true, enforcement: FOLLOW_PREMIUM_PLAN.enforcement };
}

/** Catalog gate used before any company_follows write. Unknown slugs are ignored. */
export function isFollowableCompanySlug(slug: string) {
  return SLUG_PATTERN.test(slug) && getCompanyProfile(slug) !== null;
}
