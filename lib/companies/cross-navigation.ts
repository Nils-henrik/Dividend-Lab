/**
 * Stable Phase 3 navigation contracts.
 * "Diskussion" points at the existing company comments section.
 * There is no read/unread state behind these links.
 */
export const COMPANY_DISCUSSION_SECTION_ID = "diskussion";

export const MITT_DIVLAB_PATH = "/watchlist";

export const AI_PORTFOLIOS_PATH = "/portfolios";

export function companyPageHref(slug: string) {
  return `/bolag/${slug}`;
}

export function companyDiscussionHref(slug: string) {
  return `${companyPageHref(slug)}#${COMPANY_DISCUSSION_SECTION_ID}`;
}

export function aiPortfolioHref(slug: string) {
  return `${AI_PORTFOLIOS_PATH}/${slug}`;
}
