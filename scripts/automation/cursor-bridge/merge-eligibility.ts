import {
  MERGE_CHECK_POLL_INTERVAL_MS,
  MERGE_CHECK_TIMEOUT_MS,
} from "./config";
import { isAutomaticMergeBlockedByRisk } from "./cursor-payload";
import {
  classifySensitivePaths,
  summarizeSensitiveCategories,
} from "./sensitive-paths";
import type {
  CheckState,
  MergeEligibilityResult,
  SensitivePathMatch,
} from "./types";

const BLOCKED_CHECK_CONCLUSIONS = new Set([
  "failure",
  "cancelled",
  "timed_out",
  "action_required",
]);

function isVercelCheckName(name: string): boolean {
  return /vercel/i.test(name);
}

/**
 * Conservative check validation — fail closed on ambiguous states.
 */
export function validateChecksForMerge(checks: CheckState[]): MergeEligibilityResult {
  if (checks.length === 0) {
    return {
      eligible: false,
      reason: "No status checks reported for the pull request head commit.",
    };
  }

  const vercelChecks = checks.filter((c) => isVercelCheckName(c.name));
  if (vercelChecks.length === 0) {
    return {
      eligible: false,
      reason: "Required Vercel deployment check is missing.",
    };
  }

  const successfulVercel = vercelChecks.some(
    (c) => c.status === "completed" && c.conclusion === "success",
  );
  if (!successfulVercel) {
    return {
      eligible: false,
      reason: "Vercel deployment check is not successful.",
    };
  }

  for (const check of checks) {
    if (check.status !== "completed") {
      return {
        eligible: false,
        reason: `Check "${check.name}" is still ${check.status}.`,
      };
    }

    if (!check.conclusion) {
      return {
        eligible: false,
        reason: `Check "${check.name}" has no conclusion.`,
      };
    }

    if (check.conclusion === "skipped") {
      return {
        eligible: false,
        reason: `Check "${check.name}" was skipped unexpectedly.`,
      };
    }

    if (BLOCKED_CHECK_CONCLUSIONS.has(check.conclusion)) {
      return {
        eligible: false,
        reason: `Check "${check.name}" concluded with ${check.conclusion}.`,
      };
    }

    if (check.conclusion !== "success" && check.conclusion !== "neutral") {
      return {
        eligible: false,
        reason: `Check "${check.name}" concluded with ${check.conclusion}.`,
      };
    }
  }

  return { eligible: true };
}

export function evaluateMergeEligibility(input: {
  changedPaths: string[];
  prBody: string | null;
  approvalHeadSha: string;
  currentHeadSha: string;
  checks: CheckState[];
}): MergeEligibilityResult {
  const sensitiveMatches = classifySensitivePaths(input.changedPaths);
  if (sensitiveMatches.length > 0) {
    return {
      eligible: false,
      reason: "Sensitive paths detected.",
      sensitiveMatches,
    };
  }

  const blockedRisk = isAutomaticMergeBlockedByRisk(input.prBody);
  if (blockedRisk) {
    return {
      eligible: false,
      reason: `Risk classification blocks automatic merge (${blockedRisk}).`,
      blockedRisk,
    };
  }

  if (input.approvalHeadSha !== input.currentHeadSha) {
    return {
      eligible: false,
      reason: "Pull request head SHA changed after approval.",
    };
  }

  return validateChecksForMerge(input.checks);
}

export function formatSensitiveBlockComment(matches: SensitivePathMatch[]): string {
  const categories = summarizeSensitiveCategories(matches);
  const lines = [
    "Automatic merge refused: sensitive path categories detected.",
    "",
    "**Blocked categories:**",
    ...categories.map((c) => `- ${c}`),
    "",
    "The `divlab-approved` label was removed and `divlab-manual-review` was applied.",
    "A human must review and merge this pull request manually.",
  ];
  return lines.join("\n");
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForChecksWithTimeout(
  fetchChecks: () => Promise<CheckState[]>,
  timeoutMs = MERGE_CHECK_TIMEOUT_MS,
  pollIntervalMs = MERGE_CHECK_POLL_INTERVAL_MS,
): Promise<{ checks: CheckState[]; timedOut: boolean }> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const checks = await fetchChecks();
    const pending = checks.some((c) => c.status !== "completed");

    if (!pending && checks.length > 0) {
      return { checks, timedOut: false };
    }

    await sleep(pollIntervalMs);
  }

  return { checks: await fetchChecks(), timedOut: true };
}
