/**
 * Verified followable OMXS30 membership.
 *
 * Source of truth: Nasdaq OMXS30 composition as of 1 July 2025, unchanged at
 * the semi-annual review effective 1 June 2026. The same slugs are members of
 * `forum_company_collections.slug = omxs30` via
 * `20260711193000_create_forum_companies.sql` and
 * `20260924190000_expand_omxs30_followable_companies.sql`.
 *
 * A catalog company is not labeled OMXS30 until its slug is added here after
 * that membership is verified. Nasdaq-100, S&P 500 and DAX are not listed:
 * DivLab has no verified full constituent set that is also followable.
 */
export const VERIFIED_OMXS30_SLUGS = [
  "abb",
  "addtech",
  "alfa-laval",
  "assa-abloy",
  "astrazeneca",
  "atlas-copco",
  "boliden",
  "epiroc",
  "eqt",
  "ericsson",
  "essity",
  "evolution",
  "handelsbanken",
  "hexagon",
  "hm",
  "industrivarden",
  "investor",
  "lifco",
  "nibe",
  "nordea",
  "saab",
  "sandvik",
  "sca",
  "seb",
  "skanska",
  "skf",
  "swedbank",
  "tele2",
  "telia",
  "volvo",
] as const;

const VERIFIED_OMXS30_SLUG_SET = new Set<string>(VERIFIED_OMXS30_SLUGS);

export function isVerifiedOmxs30Member(slug: string) {
  return VERIFIED_OMXS30_SLUG_SET.has(slug);
}
