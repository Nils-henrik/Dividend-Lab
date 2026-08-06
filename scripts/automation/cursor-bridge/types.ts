export type GitHubLabelEvent = {
  action: string;
  issue?: GitHubIssue;
  label?: { name: string };
  repository?: { full_name: string };
  sender?: { login: string };
  pull_request?: unknown;
};

export type GitHubIssue = {
  number: number;
  title: string;
  body: string | null;
  user?: { login: string };
  labels?: Array<{ name: string }>;
};

export type GitHubPullRequestLabelEvent = {
  action: string;
  label?: { name: string };
  pull_request: GitHubPullRequest;
  repository?: { full_name: string };
};

export type GitHubPullRequest = {
  number: number;
  title: string;
  body: string | null;
  draft: boolean;
  head: { ref: string; sha: string };
  base: { ref: string };
  labels?: Array<{ name: string }>;
  html_url: string;
};

export type IssueDispatchValidation =
  | { ok: true; issue: GitHubIssue }
  | { ok: false; reason: string };

export type PullRequestValidation =
  | { ok: true; pullRequest: GitHubPullRequest }
  | { ok: false; reason: string };

export type SensitivePathMatch = {
  category: string;
  path: string;
};

export type CheckState = {
  name: string;
  status: string;
  conclusion: string | null;
};

export type MergeEligibilityResult =
  | { eligible: true }
  | {
      eligible: false;
      reason: string;
      sensitiveMatches?: SensitivePathMatch[];
      blockedRisk?: string;
    };

export type CursorAgentCreateResponse = {
  agent?: {
    id?: string;
    url?: string;
  };
  run?: {
    id?: string;
  };
};

export type DispatchResult =
  | {
      status: "success";
      issueNumber: number;
      agentId: string;
      agentUrl: string | null;
      branchName: string;
      runId: string | null;
      duplicate: boolean;
    }
  | {
      status: "skipped";
      issueNumber: number;
      reason: string;
    }
  | {
      status: "failure";
      issueNumber: number;
      branchName: string;
      message: string;
    };
