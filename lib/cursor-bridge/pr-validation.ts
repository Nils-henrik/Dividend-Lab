import { DIVLAB_REPO } from "./config.ts";

export interface GithubPullRequestLike {
  number?: number;
  state?: string;
  draft?: boolean;
  mergeable?: boolean | null;
  mergeable_state?: string | null;
  html_url?: string;
  body?: string | null;
  user?: { login?: string; type?: string } | null;
  head?: {
    ref?: string;
    sha?: string;
    repo?: { full_name?: string | null } | null;
    user?: { login?: string } | null;
  } | null;
  base?: {
    ref?: string;
    repo?: { full_name?: string | null } | null;
  } | null;
  labels?: Array<string | { name?: string }>;
}

/**
 * Heuristic for expected DivLab Cursor PR creation flow.
 * Fail closed when authorship / head repo is ambiguous.
 */
export function isExpectedCursorCreatorFlow(
  pr: GithubPullRequestLike,
): boolean {
  const baseFullName = pr.base?.repo?.full_name;
  if (baseFullName !== DIVLAB_REPO.fullName) {
    return false;
  }

  const headFullName = pr.head?.repo?.full_name;
  // Must be same-repo PR (no forks) for Cursor cloud agents on this bridge.
  if (headFullName !== DIVLAB_REPO.fullName) {
    return false;
  }

  const headBranch = pr.head?.ref ?? "";
  if (!headBranch.startsWith("cursor/")) {
    return false;
  }

  // Cursor / GitHub app bots often create the PR; owner may also open it.
  const login = (pr.user?.login ?? "").toLowerCase();
  if (!login) {
    return false;
  }

  const allowedLogins = new Set([
    DIVLAB_REPO.allowedAuthor.toLowerCase(),
    "cursor",
    "cursor[bot]",
    "cursor-agent",
    "cursor-agent[bot]",
  ]);

  if (allowedLogins.has(login)) {
    return true;
  }

  // Allow GitHub App bot accounts that contain "cursor"
  if (login.includes("cursor") && (pr.user?.type === "Bot" || login.endsWith("[bot]"))) {
    return true;
  }

  return false;
}

export function extractPrLabelNames(
  labels: GithubPullRequestLike["labels"],
): string[] {
  if (!Array.isArray(labels)) {
    return [];
  }
  return labels
    .map((label) => (typeof label === "string" ? label : label?.name))
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}
