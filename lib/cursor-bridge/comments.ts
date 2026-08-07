import { sanitizeErrorMessage } from "./sanitize";

export function buildDispatchSuccessComment(input: {
  agentId: string;
  agentUrl?: string | null;
  plannedBranchName: string;
  issueNumber: number;
  runId?: string | null;
}): string {
  const lines = [
    "### Cursor task started",
    "",
    "The DivLab automation bridge dispatched this Issue to Cursor Cloud Agents.",
    "",
    `| Field | Value |`,
    `| --- | --- |`,
    `| Agent ID | \`${input.agentId}\` |`,
  ];

  if (input.agentUrl) {
    lines.push(`| Agent | ${input.agentUrl} |`);
  } else {
    lines.push(`| Agent | (URL not returned by API) |`);
  }

  if (input.runId) {
    lines.push(`| Run ID | \`${input.runId}\` |`);
  }

  lines.push(
    `| Planned branch | \`${input.plannedBranchName}\` |`,
    `| Originating Issue | #${input.issueNumber} |`,
    "",
    "Labels: `cursor-agent` removed → `cursor-running` applied.",
    "",
    "<!-- divlab-cursor-dispatch:success -->",
  );

  return lines.join("\n");
}

export function buildDispatchFailureComment(input: {
  issueNumber: number;
  error: unknown;
  plannedBranchName?: string;
}): string {
  const safe = sanitizeErrorMessage(input.error);
  const lines = [
    "### Cursor dispatch failed",
    "",
    "The DivLab automation bridge could not start a Cursor Cloud Agent.",
    "",
    `- Originating Issue: #${input.issueNumber}`,
  ];

  if (input.plannedBranchName) {
    lines.push(`- Planned branch: \`${input.plannedBranchName}\``);
  }

  lines.push(
    `- Safe error summary: ${safe}`,
    "",
    "Secrets, Authorization headers, and raw API payloads are intentionally omitted.",
    "",
    "Labels: `cursor-agent` removed → `cursor-failed` applied.",
    "",
    "<!-- divlab-cursor-dispatch:failure -->",
  );

  return lines.join("\n");
}

export function buildSensitiveBlockComment(input: {
  categories: string[];
  pathsSample: string[];
}): string {
  const categoryList = input.categories.map((c) => `- ${c}`).join("\n");
  const pathList = input.pathsSample
    .slice(0, 30)
    .map((p) => `- \`${p}\``)
    .join("\n");

  return [
    "### Automatic merge blocked — manual review required",
    "",
    "This PR was labeled `divlab-approved`, but the DivLab bridge detected **sensitive paths**.",
    "",
    "Blocked path categories:",
    categoryList || "- (unspecified)",
    "",
    "Example matching paths:",
    pathList || "- (see full file list in the PR)",
    "",
    "Actions taken:",
    "- Removed `divlab-approved`",
    "- Applied `divlab-manual-review`",
    "- Did **not** mark ready for review",
    "- Did **not** merge",
    "",
    "<!-- divlab-cursor-approval:sensitive -->",
  ].join("\n");
}

export function buildApprovalRefusalComment(input: {
  detail: string;
  manualReview: boolean;
}): string {
  const safe = sanitizeErrorMessage(input.detail);
  return [
    "### Automatic merge refused",
    "",
    safe,
    "",
    input.manualReview
      ? "Label `divlab-manual-review` applied. Remove it only after a human review."
      : "The approval label was cleared. Re-apply `divlab-approved` only after fixing the blocking condition.",
    "",
    "<!-- divlab-cursor-approval:refused -->",
  ].join("\n");
}

export function buildMergeSuccessComment(input: {
  prNumber: number;
  headSha: string;
  branchName: string;
}): string {
  return [
    "### DivLab controlled merge completed",
    "",
    `Pull request #${input.prNumber} was squash-merged into \`main\` by the automation bridge.`,
    "",
    `- Head SHA at merge: \`${input.headSha}\``,
    `- Source branch deleted: \`${input.branchName}\``,
    "",
    "<!-- divlab-cursor-approval:merged -->",
  ].join("\n");
}

export function hasDispatchSuccessMarker(body: string): boolean {
  return body.includes("<!-- divlab-cursor-dispatch:success -->");
}
