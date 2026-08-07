import { DIVLAB_REPO, type RiskClassification } from "./config";
import { isCursorBranch } from "./branch-name";
import { isAutoMergeRisk } from "./risk";
import {
  findSensitivePaths,
  getCategoryLabel,
  summarizeSensitiveCategories,
  type SensitiveCategory,
  type SensitivePathMatch,
} from "./sensitive-paths";

export type MergeBlockReason =
  | "wrong_repository"
  | "wrong_base_branch"
  | "non_cursor_head"
  | "sensitive_paths"
  | "high_risk"
  | "ambiguous_risk"
  | "head_sha_changed"
  | "checks_not_ready"
  | "vercel_check_missing"
  | "mergeable_state_blocked"
  | "not_open"
  | "ambiguous_state";

export interface PullRequestMergeContext {
  repositoryFullName: string;
  baseBranch: string;
  headBranch: string;
  headSha: string;
  approvedHeadSha: string;
  state: string;
  draft: boolean;
  mergeable: boolean | null;
  mergeableState: string | null;
  changedFiles: string[];
  risk: RiskClassification;
  /** true when the PR appears to come from the expected owner/Cursor flow */
  expectedCreatorFlow: boolean;
}

export interface CheckStatusSummary {
  /** All required contexts that must pass. */
  requiredChecks: Array<{
    name: string;
    conclusion: string | null;
    status: string;
  }>;
  /** Name/pattern of the Vercel deployment check if found. */
  vercelCheck?: {
    name: string;
    conclusion: string | null;
    status: string;
  };
}

export type MergeDecision =
  | {
      allowed: false;
      reason: MergeBlockReason;
      detail: string;
      sensitiveMatches?: SensitivePathMatch[];
      blockedCategories?: SensitiveCategory[];
      requireManualReview: boolean;
    }
  | {
      allowed: true;
      detail: string;
    };

export function evaluateMergeEligibility(
  pr: PullRequestMergeContext,
  checks?: CheckStatusSummary,
  options?: { allowDraftMergeableState?: boolean },
): MergeDecision {
  if (pr.repositoryFullName !== DIVLAB_REPO.fullName) {
    return fail("wrong_repository", `PR must belong to ${DIVLAB_REPO.fullName}`);
  }

  if (pr.baseBranch !== DIVLAB_REPO.defaultBranch) {
    return fail(
      "wrong_base_branch",
      `PR base must be ${DIVLAB_REPO.defaultBranch}`,
    );
  }

  if (!isCursorBranch(pr.headBranch)) {
    return fail(
      "non_cursor_head",
      "PR head branch must begin with cursor/",
    );
  }

  if (!pr.expectedCreatorFlow) {
    return fail(
      "ambiguous_state",
      "PR does not match the expected owner/Cursor creation flow",
      true,
    );
  }

  if (pr.state !== "open") {
    return fail("not_open", `PR state is ${pr.state}, expected open`);
  }

  if (pr.headSha !== pr.approvedHeadSha) {
    return fail(
      "head_sha_changed",
      "PR head SHA changed after approval; refusing merge",
      true,
    );
  }

  if (!isAutoMergeRisk(pr.risk)) {
    if (pr.risk === "high" || pr.risk === "manual-only") {
      return fail(
        "high_risk",
        `Risk classification "${pr.risk}" is not eligible for automatic merge`,
        true,
      );
    }
    return fail(
      "ambiguous_risk",
      "Risk classification is missing or ambiguous; automatic merge is blocked",
      true,
    );
  }

  const sensitiveMatches = findSensitivePaths(pr.changedFiles);
  if (sensitiveMatches.length > 0) {
    const categories = summarizeSensitiveCategories(sensitiveMatches);
    return {
      allowed: false,
      reason: "sensitive_paths",
      detail: `Sensitive paths detected: ${categories
        .map(getCategoryLabel)
        .join("; ")}`,
      sensitiveMatches,
      blockedCategories: categories,
      requireManualReview: true,
    };
  }

  // Path/policy preflight may run while the PR is still draft.
  const allowDraft = options?.allowDraftMergeableState === true;

  if (pr.mergeable === false) {
    return fail(
      "mergeable_state_blocked",
      "PR has merge conflicts or is not mergeable",
    );
  }

  if (pr.mergeable === null || pr.mergeableState === "unknown") {
    return fail(
      "ambiguous_state",
      "Mergeable state is ambiguous; fail closed",
    );
  }

  if (
    pr.mergeableState &&
    !["clean", "has_hooks", "unstable"].includes(pr.mergeableState)
  ) {
    if (pr.mergeableState === "draft" && allowDraft) {
      // Continue — caller will mark ready before the final gate.
    } else if (["dirty", "blocked", "draft"].includes(pr.mergeableState)) {
      return fail(
        "mergeable_state_blocked",
        `mergeable_state is ${pr.mergeableState}`,
      );
    }
  }

  if (checks) {
    const checkDecision = evaluateChecks(checks);
    if (!checkDecision.allowed) {
      return checkDecision;
    }
  }

  return {
    allowed: true,
    detail: "PR is eligible for squash-merge under DivLab bridge policy",
  };
}

export function evaluateChecks(checks: CheckStatusSummary): MergeDecision {
  if (!checks.vercelCheck) {
    return fail(
      "vercel_check_missing",
      "Vercel deployment check is absent; refusing merge",
    );
  }

  if (!isSuccessfulCheck(checks.vercelCheck)) {
    return fail(
      "checks_not_ready",
      `Vercel check "${checks.vercelCheck.name}" is not successful`,
    );
  }

  if (checks.requiredChecks.length === 0) {
    // Fail closed if GitHub reports no required contexts — ambiguous protection state.
    return fail(
      "checks_not_ready",
      "No required checks were reported; refusing to bypass branch protection",
    );
  }

  for (const check of checks.requiredChecks) {
    if (!isSuccessfulCheck(check)) {
      return fail(
        "checks_not_ready",
        `Required check "${check.name}" is ${check.status}/${check.conclusion ?? "none"}`,
      );
    }
  }

  return {
    allowed: true,
    detail: "All required checks and Vercel deployment passed",
  };
}

export function isSuccessfulCheck(check: {
  status: string;
  conclusion: string | null;
}): boolean {
  const status = check.status.toLowerCase();
  const conclusion = (check.conclusion ?? "").toLowerCase();

  if (status !== "completed") {
    return false;
  }

  return conclusion === "success" || conclusion === "neutral";
}

export function isVercelCheckName(name: string): boolean {
  const lower = name.toLowerCase();
  return (
    lower.includes("vercel") ||
    (lower.includes("deployment") && lower.includes("preview")) ||
    lower === "vercel" ||
    lower.startsWith("vercel —") ||
    lower.startsWith("vercel -")
  );
}

function fail(
  reason: MergeBlockReason,
  detail: string,
  requireManualReview = false,
): MergeDecision {
  return {
    allowed: false,
    reason,
    detail,
    requireManualReview,
  };
}
