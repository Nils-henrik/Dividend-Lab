import {
  ALLOWED_ISSUE_AUTHOR,
  DIVLAB_REPO,
  LABEL_CURSOR_AGENT,
  LABEL_CURSOR_RUNNING,
} from "./config";
import type {
  GitHubIssue,
  GitHubLabelEvent,
  GitHubPullRequestLabelEvent,
  IssueDispatchValidation,
  PullRequestValidation,
} from "./types";

function hasLabel(issue: GitHubIssue, labelName: string): boolean {
  return (issue.labels ?? []).some((label) => label.name === labelName);
}

/**
 * Validates a labeled-issue webhook payload for Cursor dispatch.
 * Treats all issue fields as untrusted data — never executed as shell.
 */
export function validateIssueLabelEvent(
  event: GitHubLabelEvent,
): IssueDispatchValidation {
  if (event.pull_request !== undefined) {
    return { ok: false, reason: "Pull request events are not accepted." };
  }

  if (event.action !== "labeled") {
    return { ok: false, reason: "Only labeled actions are accepted." };
  }

  if (!event.label || event.label.name !== LABEL_CURSOR_AGENT) {
    return {
      ok: false,
      reason: `Label must be ${LABEL_CURSOR_AGENT}.`,
    };
  }

  if (!event.repository || event.repository.full_name !== DIVLAB_REPO) {
    return {
      ok: false,
      reason: `Repository must be ${DIVLAB_REPO}.`,
    };
  }

  const issue = event.issue;
  if (!issue) {
    return { ok: false, reason: "Missing issue payload." };
  }

  const author = issue.user?.login;
  if (!author || author !== ALLOWED_ISSUE_AUTHOR) {
    return {
      ok: false,
      reason: `Issue author must be ${ALLOWED_ISSUE_AUTHOR}.`,
    };
  }

  if (!issue.title || issue.title.trim().length === 0) {
    return { ok: false, reason: "Issue title is required." };
  }

  return { ok: true, issue };
}

/**
 * Returns whether dispatch should be skipped because an agent is already running.
 */
export function shouldSkipDuplicateDispatch(issue: GitHubIssue): string | null {
  if (hasLabel(issue, LABEL_CURSOR_RUNNING)) {
    return "Issue already has cursor-running; refusing duplicate dispatch.";
  }
  return null;
}

export function validatePullRequestLabelEvent(
  event: GitHubPullRequestLabelEvent,
): PullRequestValidation {
  if (event.action !== "labeled") {
    return { ok: false, reason: "Only labeled actions are accepted." };
  }

  if (!event.label || event.label.name !== "divlab-approved") {
    return { ok: false, reason: "Label must be divlab-approved." };
  }

  if (!event.repository || event.repository.full_name !== DIVLAB_REPO) {
    return {
      ok: false,
      reason: `Repository must be ${DIVLAB_REPO}.`,
    };
  }

  const pullRequest = event.pull_request;
  if (!pullRequest) {
    return { ok: false, reason: "Missing pull request payload." };
  }

  if (pullRequest.base.ref !== "main") {
    return { ok: false, reason: "Pull request must target main." };
  }

  if (!pullRequest.head.ref.startsWith("cursor/")) {
    return {
      ok: false,
      reason: "Pull request head branch must start with cursor/.",
    };
  }

  return { ok: true, pullRequest };
}

import { readFileSync } from "node:fs";

export function readEventFromPath<T>(eventPath: string): T {
  const raw = readFileSync(eventPath, "utf8");
  return JSON.parse(raw) as T;
}
