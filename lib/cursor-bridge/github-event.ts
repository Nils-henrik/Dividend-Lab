import { readFileSync } from "node:fs";
import { DIVLAB_REPO } from "./config";

export type DispatchRejectionReason =
  | "wrong_repository"
  | "not_an_issue"
  | "pull_request_masquerading"
  | "unauthorized_author"
  | "missing_issue_number"
  | "invalid_event"
  | "duplicate_dispatch";

export interface ValidatedIssueEvent {
  ok: true;
  issueNumber: number;
  title: string;
  body: string;
  author: string;
  htmlUrl: string;
  labelNames: string[];
}

export interface RejectedIssueEvent {
  ok: false;
  reason: DispatchRejectionReason;
  detail: string;
}

export type IssueEventResult = ValidatedIssueEvent | RejectedIssueEvent;

interface GitHubUser {
  login?: string;
}

interface GitHubIssue {
  number?: number;
  title?: string | null;
  body?: string | null;
  html_url?: string;
  user?: GitHubUser | null;
  labels?: Array<string | { name?: string }>;
  pull_request?: unknown;
}

interface IssuesEventPayload {
  action?: string;
  issue?: GitHubIssue;
  label?: { name?: string };
  repository?: {
    full_name?: string;
    name?: string;
    owner?: { login?: string };
  };
  // pull_request events must never be accepted by the dispatch path
  pull_request?: unknown;
}

export function readGithubEventFile(eventPath: string): unknown {
  const raw = readFileSync(eventPath, "utf8");
  return JSON.parse(raw) as unknown;
}

/**
 * Validate that a GitHub webhook payload is an eligible DivLab Issue for
 * Cursor dispatch. Treats all Issue text as untrusted data.
 */
export function validateIssueDispatchEvent(
  payload: unknown,
  options?: {
    repositoryFullName?: string;
    requireLabel?: string;
    alreadyRunning?: boolean;
  },
): IssueEventResult {
  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      reason: "invalid_event",
      detail: "Event payload is not an object",
    };
  }

  const event = payload as IssuesEventPayload;

  // Hard reject anything that looks like a pull_request event.
  if ("pull_request" in event && event.pull_request != null && !event.issue) {
    return {
      ok: false,
      reason: "pull_request_masquerading",
      detail: "Pull request events are ignored by the Cursor dispatch bridge",
    };
  }

  const repoFullName =
    options?.repositoryFullName ??
    event.repository?.full_name ??
    (event.repository?.owner?.login && event.repository?.name
      ? `${event.repository.owner.login}/${event.repository.name}`
      : undefined);

  if (repoFullName !== DIVLAB_REPO.fullName) {
    return {
      ok: false,
      reason: "wrong_repository",
      detail: `Repository must be ${DIVLAB_REPO.fullName}`,
    };
  }

  const issue = event.issue;
  if (!issue || typeof issue !== "object") {
    return {
      ok: false,
      reason: "not_an_issue",
      detail: "Event does not contain an issue object",
    };
  }

  // Issues that are secretly PRs expose pull_request on the issue object.
  if (issue.pull_request != null) {
    return {
      ok: false,
      reason: "pull_request_masquerading",
      detail: "Issue object references a pull request and is rejected",
    };
  }

  const author = issue.user?.login;
  if (!author || author !== DIVLAB_REPO.allowedAuthor) {
    return {
      ok: false,
      reason: "unauthorized_author",
      detail: `Only Issues authored by ${DIVLAB_REPO.allowedAuthor} are accepted`,
    };
  }

  const issueNumber = issue.number;
  if (!Number.isInteger(issueNumber) || (issueNumber as number) <= 0) {
    return {
      ok: false,
      reason: "missing_issue_number",
      detail: "Issue number is missing or invalid",
    };
  }

  const labelNames = extractLabelNames(issue.labels);
  if (options?.requireLabel && !labelNames.includes(options.requireLabel)) {
    // Still allow when the triggering label is in the event.label field.
    const triggering = event.label?.name;
    if (triggering !== options.requireLabel) {
      return {
        ok: false,
        reason: "invalid_event",
        detail: `Required label ${options.requireLabel} not present`,
      };
    }
  }

  if (options?.alreadyRunning) {
    return {
      ok: false,
      reason: "duplicate_dispatch",
      detail: "Issue already has cursor-running; refusing duplicate dispatch",
    };
  }

  // Title/body are untrusted data — never execute, only transport as JSON strings.
  const title = typeof issue.title === "string" ? issue.title : "";
  const body = typeof issue.body === "string" ? issue.body : "";

  return {
    ok: true,
    issueNumber: issueNumber as number,
    title,
    body,
    author,
    htmlUrl: typeof issue.html_url === "string" ? issue.html_url : "",
    labelNames,
  };
}

function extractLabelNames(
  labels: Array<string | { name?: string }> | undefined,
): string[] {
  if (!Array.isArray(labels)) {
    return [];
  }
  return labels
    .map((label) => (typeof label === "string" ? label : label?.name))
    .filter((name): name is string => typeof name === "string" && name.length > 0);
}
