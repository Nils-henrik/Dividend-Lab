import { execFileSync } from "node:child_process";

import {
  LABEL_CURSOR_AGENT,
  LABEL_CURSOR_FAILED,
  LABEL_CURSOR_RUNNING,
  LABEL_DIVLAB_APPROVED,
  LABEL_DIVLAB_MANUAL_REVIEW,
} from "./config";

function ghApi(args: string[], input?: unknown): unknown {
  const ghArgs = ["api", ...args];
  const options: { encoding: "utf8"; env: typeof process.env; input?: string } = {
    encoding: "utf8",
    env: process.env,
  };

  if (input !== undefined) {
    ghArgs.push("--input", "-");
    options.input = JSON.stringify(input);
  }

  const output = execFileSync("gh", ghArgs, options);
  return output ? JSON.parse(output) : null;
}

function gh(args: string[]): string {
  return execFileSync("gh", args, {
    encoding: "utf8",
    env: process.env,
  }).trim();
}

export function postIssueComment(issueNumber: number, body: string): void {
  gh([
    "issue",
    "comment",
    String(issueNumber),
    "--body",
    body,
  ]);
}

export function postPullRequestComment(prNumber: number, body: string): void {
  gh([
    "pr",
    "comment",
    String(prNumber),
    "--body",
    body,
  ]);
}

export function addIssueLabels(issueNumber: number, labels: string[]): void {
  ghApi([`repos/{owner}/{repo}/issues/${issueNumber}/labels`, "-X", "POST"], {
    labels,
  });
}

export function removeIssueLabel(issueNumber: number, label: string): void {
  ghApi([
    `repos/{owner}/{repo}/issues/${issueNumber}/labels/${encodeURIComponent(label)}`,
    "-X",
    "DELETE",
  ]);
}

export function transitionIssueLabelsAfterDispatch(
  issueNumber: number,
  outcome: "success" | "failure",
): void {
  try {
    removeIssueLabel(issueNumber, LABEL_CURSOR_AGENT);
  } catch {
    // Label may already be removed.
  }

  if (outcome === "success") {
    addIssueLabels(issueNumber, [LABEL_CURSOR_RUNNING]);
  } else {
    addIssueLabels(issueNumber, [LABEL_CURSOR_FAILED]);
  }
}

export function removePullRequestLabel(prNumber: number, label: string): void {
  ghApi([
    `repos/{owner}/{repo}/issues/${prNumber}/labels/${encodeURIComponent(label)}`,
    "-X",
    "DELETE",
  ]);
}

export function addPullRequestLabels(prNumber: number, labels: string[]): void {
  ghApi([`repos/{owner}/{repo}/issues/${prNumber}/labels`, "-X", "POST"], {
    labels,
  });
}

export function blockPullRequestForManualReview(
  prNumber: number,
  comment: string,
): void {
  try {
    removePullRequestLabel(prNumber, LABEL_DIVLAB_APPROVED);
  } catch {
    // ignore
  }
  addPullRequestLabels(prNumber, [LABEL_DIVLAB_MANUAL_REVIEW]);
  postPullRequestComment(prNumber, comment);
}

export function markPullRequestReady(prNumber: number): void {
  gh([
    "pr",
    "ready",
    String(prNumber),
  ]);
}

export function getPullRequest(prNumber: number): {
  head: { sha: string; ref: string };
  mergeable: boolean | null;
  mergeable_state: string;
} {
  return ghApi([`repos/{owner}/{repo}/pulls/${prNumber}`]) as {
    head: { sha: string; ref: string };
    mergeable: boolean | null;
    mergeable_state: string;
  };
}

export function listPullRequestFiles(prNumber: number): Array<{ filename: string }> {
  return ghApi([`repos/{owner}/{repo}/pulls/${prNumber}/files`]) as Array<{
    filename: string;
  }>;
}

export function listCommitChecks(ref: string): Array<{
  name: string;
  status: string;
  conclusion: string | null;
}> {
  const response = ghApi([
    `repos/{owner}/{repo}/commits/${ref}/check-runs`,
    "-f",
    "per_page=100",
  ]) as {
    check_runs?: Array<{ name: string; status: string; conclusion: string | null }>;
  };

  return response.check_runs ?? [];
}

export function squashMergePullRequest(
  prNumber: number,
  headSha: string,
  headRef: string,
): void {
  ghApi([`repos/{owner}/{repo}/pulls/${prNumber}/merge`, "-X", "PUT"], {
    merge_method: "squash",
    sha: headSha,
  });

  try {
    ghApi([
      `repos/{owner}/{repo}/git/refs/heads/${headRef}`,
      "-X",
      "DELETE",
    ]);
  } catch {
    // Branch may already be deleted by merge settings.
  }
}

export function createLabelIfMissing(input: {
  name: string;
  color: string;
  description: string;
}): void {
  try {
    ghApi([
      `repos/{owner}/{repo}/labels/${encodeURIComponent(input.name)}`,
    ]);
    ghApi(
      [`repos/{owner}/{repo}/labels/${encodeURIComponent(input.name)}`, "-X", "PATCH"],
      {
        color: input.color,
        description: input.description,
      },
    );
  } catch {
    ghApi(["repos/{owner}/{repo}/labels", "-X", "POST"], {
      name: input.name,
      color: input.color,
      description: input.description,
    });
  }
}
