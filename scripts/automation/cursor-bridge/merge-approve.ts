import {
  evaluateMergeEligibility,
  formatSensitiveBlockComment,
  waitForChecksWithTimeout,
} from "./merge-eligibility";

import {
  readEventFromPath,
  validatePullRequestLabelEvent,
} from "./github-event";
import {
  blockPullRequestForManualReview,
  getPullRequest,
  listCommitChecks,
  listPullRequestFiles,
  markPullRequestReady,
  postPullRequestComment,
  squashMergePullRequest,
} from "./github-api";
import type { GitHubPullRequestLabelEvent } from "./types";

export async function runMergeApproval(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error("GITHUB_EVENT_PATH is not set.");
  }

  const event = readEventFromPath<GitHubPullRequestLabelEvent>(eventPath);
  const validation = validatePullRequestLabelEvent(event);
  if (!validation.ok) {
    console.log(`Skipped: ${validation.reason}`);
    return;
  }

  const pullRequest = validation.pullRequest;
  const prNumber = pullRequest.number;
  const approvalHeadSha = pullRequest.head.sha;

  const files = listPullRequestFiles(prNumber);
  const changedPaths = files.map((file) => file.filename);

  const eligibility = evaluateMergeEligibility({
    changedPaths,
    prBody: pullRequest.body,
    approvalHeadSha,
    currentHeadSha: approvalHeadSha,
    checks: [],
  });

  if (!eligibility.eligible) {
    if (eligibility.sensitiveMatches?.length) {
      blockPullRequestForManualReview(
        prNumber,
        formatSensitiveBlockComment(eligibility.sensitiveMatches),
      );
      console.log("Blocked: sensitive paths");
      return;
    }

    if (eligibility.blockedRisk) {
      blockPullRequestForManualReview(
        prNumber,
        `Automatic merge refused: risk classification **${eligibility.blockedRisk}** blocks automated merge even with \`divlab-approved\`.`,
      );
      console.log("Blocked: risk classification");
      return;
    }

    console.log(`Skipped early: ${eligibility.reason}`);
    return;
  }

  markPullRequestReady(prNumber);

  const { checks, timedOut } = await waitForChecksWithTimeout(async () =>
    listCommitChecks(approvalHeadSha),
  );

  const refreshed = getPullRequest(prNumber);
  const finalEligibility = evaluateMergeEligibility({
    changedPaths,
    prBody: pullRequest.body,
    approvalHeadSha,
    currentHeadSha: refreshed.head.sha,
    checks,
  });

  if (!finalEligibility.eligible) {
    if (finalEligibility.sensitiveMatches?.length) {
      blockPullRequestForManualReview(
        prNumber,
        formatSensitiveBlockComment(finalEligibility.sensitiveMatches),
      );
      return;
    }

    if (finalEligibility.blockedRisk) {
      blockPullRequestForManualReview(
        prNumber,
        `Automatic merge refused: risk classification **${finalEligibility.blockedRisk}** blocks automated merge.`,
      );
      return;
    }

    const reason = timedOut
      ? `Timed out waiting for required checks. Last state: ${finalEligibility.reason}`
      : finalEligibility.reason;

    postPullRequestComment(
      prNumber,
      `Automatic merge refused: ${reason}`,
    );
    console.log(`Merge blocked: ${reason}`);
    return;
  }

  if (refreshed.mergeable === false) {
    postPullRequestComment(
      prNumber,
      "Automatic merge refused: pull request has merge conflicts.",
    );
    console.log("Merge blocked: conflicts");
    return;
  }

  if (refreshed.mergeable_state === "blocked") {
    postPullRequestComment(
      prNumber,
      "Automatic merge refused: branch protection or required reviews still block merge.",
    );
    console.log("Merge blocked: branch protection");
    return;
  }

  squashMergePullRequest(prNumber, refreshed.head.sha, refreshed.head.ref);

  postPullRequestComment(
    prNumber,
    [
      "✅ **Automatic squash-merge completed**",
      "",
      `- Pull request: #${prNumber}`,
      `- Head SHA merged: \`${refreshed.head.sha}\``,
      `- Branch: \`${refreshed.head.ref}\``,
      "",
      "Source branch deletion was requested via GitHub merge API.",
    ].join("\n"),
  );

  console.log(`Merged PR #${prNumber}`);
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "")) {
  runMergeApproval()
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : "Merge approval error");
      process.exitCode = 1;
    });
}
