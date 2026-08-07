import { BRANCH_PREFIX, MAX_BRANCH_NAME_LENGTH } from "./config";

/**
 * Generate a deterministic Cursor branch name for an Issue.
 * Format: cursor/issue-<number>-<slug>
 *
 * Note: Cursor Cloud Agents API v1 auto-generates a cursor/... branch when
 * workOnCurrentBranch is false. The bridge still computes this name so the
 * agent prompt and audit comments share one deterministic target.
 */
export function generateBranchName(
  issueNumber: number,
  title: string,
): string {
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error("Issue number must be a positive integer");
  }

  const slug = slugifyTitle(title);
  const base = `${BRANCH_PREFIX}issue-${issueNumber}`;
  if (!slug) {
    return truncateBranchName(base);
  }

  return truncateBranchName(`${base}-${slug}`);
}

export function slugifyTitle(title: string): string {
  const normalized = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  // Map common Swedish characters that NFKD may leave as base letters already;
  // also fold remaining letters outside a-z0-9 into separators.
  const folded = normalized
    .replace(/å/g, "a")
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return folded;
}

export function truncateBranchName(name: string): string {
  if (name.length <= MAX_BRANCH_NAME_LENGTH) {
    return name;
  }

  const truncated = name.slice(0, MAX_BRANCH_NAME_LENGTH).replace(/-+$/g, "");
  return truncated.length > 0 ? truncated : name.slice(0, MAX_BRANCH_NAME_LENGTH);
}

export function isCursorBranch(branchName: string): boolean {
  return branchName.startsWith(BRANCH_PREFIX);
}
