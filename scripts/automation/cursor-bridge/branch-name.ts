import {
  CURSOR_BRANCH_PREFIX,
  MAX_BRANCH_NAME_LENGTH,
  MAX_BRANCH_SLUG_LENGTH,
} from "./config";

/**
 * Slugify issue title for branch names. Preserves Swedish letters; strips unsafe chars.
 */
export function slugifyForBranch(title: string): string {
  const normalized = title
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9åäöüéèêëïîìáàâãæçñøœß\u00c0-\u024f]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!normalized) {
    return "task";
  }

  return normalized.slice(0, MAX_BRANCH_SLUG_LENGTH);
}

/**
 * Deterministic branch name: cursor/issue-<number>-<slug>
 */
export function generateBranchName(issueNumber: number, title: string): string {
  const slug = slugifyForBranch(title);
  const branch = `${CURSOR_BRANCH_PREFIX}issue-${issueNumber}-${slug}`;

  if (branch.length <= MAX_BRANCH_NAME_LENGTH) {
    return branch;
  }

  const prefix = `${CURSOR_BRANCH_PREFIX}issue-${issueNumber}-`;
  const maxSlugLen = MAX_BRANCH_NAME_LENGTH - prefix.length;
  const truncatedSlug = slug.slice(0, Math.max(1, maxSlugLen)).replace(/-$/, "");
  return `${prefix}${truncatedSlug}`;
}

/**
 * Deterministic Cursor agentId for idempotent API creates (bc- UUID form).
 * Re-POSTing the same agentId returns 409 agent_id_conflict.
 */
export function deterministicAgentId(issueNumber: number): string {
  const hex = issueNumber.toString(16).padStart(12, "0");
  return `bc-91809180-9180-4000-8000-${hex}`;
}
