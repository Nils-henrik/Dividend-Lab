#!/usr/bin/env node
/**
 * Cursor agent dispatch CLI for GitHub Actions.
 *
 * Reads GITHUB_EVENT_PATH, validates the Issue, builds a Cursor API payload
 * with proper JSON encoding, calls the official v1 API, and writes safe
 * outputs for the workflow (never logs CURSOR_API_KEY).
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { BRIDGE_LABELS, CURSOR_API_KEY_SECRET_NAME } from "../../lib/cursor-bridge/config";
import {
  buildDispatchFailureComment,
  buildDispatchSuccessComment,
  hasDispatchSuccessMarker,
} from "../../lib/cursor-bridge/comments";
import {
  createCursorAgent,
  CursorApiError,
} from "../../lib/cursor-bridge/cursor-client";
import { buildCursorDispatchPayload } from "../../lib/cursor-bridge/cursor-payload";
import {
  readGithubEventFile,
  validateIssueDispatchEvent,
} from "../../lib/cursor-bridge/github-event";
import { sanitizeErrorMessage } from "../../lib/cursor-bridge/sanitize";

interface DispatchOutputs {
  outcome: "success" | "failure" | "rejected";
  issue_number?: string;
  agent_id?: string;
  agent_url?: string;
  planned_branch?: string;
  comment_body: string;
  apply_label?: string;
  remove_labels: string;
}

async function main(): Promise<void> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const repository = process.env.GITHUB_REPOSITORY;
  const apiKey = process.env.CURSOR_API_KEY ?? "";
  const alreadyRunning = process.env.CURSOR_ALREADY_RUNNING === "true";
  const priorSuccess = process.env.CURSOR_PRIOR_SUCCESS === "true";

  if (!eventPath) {
    failHard("GITHUB_EVENT_PATH is required");
  }

  let payload: unknown;
  try {
    payload = readGithubEventFile(eventPath);
  } catch (error) {
    const outputs = rejectedOutputs(
      `Failed to read GitHub event: ${sanitizeErrorMessage(error)}`,
    );
    writeOutputs(outputs);
    process.exitCode = 1;
    return;
  }

  const validated = validateIssueDispatchEvent(payload, {
    repositoryFullName: repository,
    requireLabel: BRIDGE_LABELS.agent,
    alreadyRunning: alreadyRunning || priorSuccess,
  });

  if (!validated.ok) {
    const outputs: DispatchOutputs = {
      outcome: "rejected",
      comment_body: "",
      remove_labels: "",
      apply_label: "",
    };

    // Duplicate / unauthorized / PR masquerading: do not spam failure comments
    // for every invalid label event, but clear cursor-agent when it was a
    // non-author attempt on a real Issue.
    if (
      validated.reason === "unauthorized_author" ||
      validated.reason === "pull_request_masquerading"
    ) {
      outputs.remove_labels = BRIDGE_LABELS.agent;
      outputs.comment_body = [
        "### Cursor dispatch rejected",
        "",
        sanitizeErrorMessage(validated.detail),
        "",
        "<!-- divlab-cursor-dispatch:rejected -->",
      ].join("\n");
      outputs.apply_label = BRIDGE_LABELS.failed;
    }

    if (validated.reason === "duplicate_dispatch") {
      outputs.remove_labels = BRIDGE_LABELS.agent;
      outputs.comment_body = [
        "### Duplicate Cursor dispatch prevented",
        "",
        "This Issue already has an active or successful Cursor dispatch marker / `cursor-running` label.",
        "Refusing to start another agent. Remove `cursor-running` and the success marker comment only if you intentionally want a new agent.",
        "",
        "<!-- divlab-cursor-dispatch:duplicate -->",
      ].join("\n");
    }

    writeOutputs(outputs);
    // Soft-reject: workflow should not look like an infra failure for auth rejects
    process.exitCode = validated.reason === "duplicate_dispatch" ? 0 : 1;
    return;
  }

  const built = buildCursorDispatchPayload({
    issueNumber: validated.issueNumber,
    title: validated.title,
    body: validated.body,
    issueHtmlUrl: validated.htmlUrl,
  });

  if (!apiKey) {
    const outputs: DispatchOutputs = {
      outcome: "failure",
      issue_number: String(validated.issueNumber),
      planned_branch: built.plannedBranchName,
      comment_body: buildDispatchFailureComment({
        issueNumber: validated.issueNumber,
        plannedBranchName: built.plannedBranchName,
        error: `${CURSOR_API_KEY_SECRET_NAME} is not configured in repository secrets`,
      }),
      apply_label: BRIDGE_LABELS.failed,
      remove_labels: BRIDGE_LABELS.agent,
    };
    writeOutputs(outputs);
    process.exitCode = 1;
    return;
  }

  try {
    const result = await createCursorAgent({
      apiKey,
      request: built.request,
    });

    const outputs: DispatchOutputs = {
      outcome: "success",
      issue_number: String(validated.issueNumber),
      agent_id: result.agentId,
      agent_url: result.agentUrl ?? "",
      planned_branch: built.plannedBranchName,
      comment_body: buildDispatchSuccessComment({
        agentId: result.agentId,
        agentUrl: result.agentUrl,
        plannedBranchName: built.plannedBranchName,
        issueNumber: validated.issueNumber,
        runId: result.runId,
      }),
      apply_label: BRIDGE_LABELS.running,
      remove_labels: [BRIDGE_LABELS.agent, BRIDGE_LABELS.failed].join("\n"),
    };
    writeOutputs(outputs);

    // Safe stdout summary (no secrets)
    process.stdout.write(
      JSON.stringify({
        ok: true,
        agentId: result.agentId,
        agentUrl: result.agentUrl,
        plannedBranch: built.plannedBranchName,
        issueNumber: validated.issueNumber,
      }) + "\n",
    );
  } catch (error) {
    const status = error instanceof CursorApiError ? error.status : 0;
    // 409 agent_id_conflict → treat as idempotent success/no-op duplicate
    if (status === 409) {
      const outputs: DispatchOutputs = {
        outcome: "rejected",
        issue_number: String(validated.issueNumber),
        agent_id: built.agentId,
        planned_branch: built.plannedBranchName,
        comment_body: [
          "### Duplicate Cursor dispatch prevented (API)",
          "",
          `Cursor returned agent_id_conflict for deterministic id \`${built.agentId}\`.`,
          "No new agent was created.",
          "",
          "<!-- divlab-cursor-dispatch:duplicate -->",
        ].join("\n"),
        apply_label: BRIDGE_LABELS.running,
        remove_labels: BRIDGE_LABELS.agent,
      };
      writeOutputs(outputs);
      process.exitCode = 0;
      return;
    }

    const outputs: DispatchOutputs = {
      outcome: "failure",
      issue_number: String(validated.issueNumber),
      planned_branch: built.plannedBranchName,
      comment_body: buildDispatchFailureComment({
        issueNumber: validated.issueNumber,
        plannedBranchName: built.plannedBranchName,
        error,
      }),
      apply_label: BRIDGE_LABELS.failed,
      remove_labels: BRIDGE_LABELS.agent,
    };
    writeOutputs(outputs);
    process.exitCode = 1;
  }
}

function rejectedOutputs(detail: string): DispatchOutputs {
  return {
    outcome: "rejected",
    comment_body: [
      "### Cursor dispatch rejected",
      "",
      sanitizeErrorMessage(detail),
      "",
      "<!-- divlab-cursor-dispatch:rejected -->",
    ].join("\n"),
    remove_labels: BRIDGE_LABELS.agent,
    apply_label: BRIDGE_LABELS.failed,
  };
}

function writeOutputs(outputs: DispatchOutputs): void {
  const githubOutput = process.env.GITHUB_OUTPUT;
  const lines = [
    `outcome=${outputs.outcome}`,
    `issue_number=${outputs.issue_number ?? ""}`,
    `agent_id=${outputs.agent_id ?? ""}`,
    `agent_url=${outputs.agent_url ?? ""}`,
    `planned_branch=${outputs.planned_branch ?? ""}`,
    `apply_label=${outputs.apply_label ?? ""}`,
    `remove_labels<<REMOVE_EOF`,
    outputs.remove_labels,
    `REMOVE_EOF`,
    `comment_body<<COMMENT_EOF`,
    outputs.comment_body,
    `COMMENT_EOF`,
  ];

  if (githubOutput) {
    appendFileSync(githubOutput, `${lines.join("\n")}\n`, "utf8");
  }

  // Also write a machine-readable artifact for local debugging (no secrets).
  if (process.env.CURSOR_BRIDGE_OUTPUT_PATH) {
    writeFileSync(
      process.env.CURSOR_BRIDGE_OUTPUT_PATH,
      JSON.stringify(outputs, null, 2),
      "utf8",
    );
  }
}

function failHard(message: string): never {
  process.stderr.write(`${sanitizeErrorMessage(message)}\n`);
  process.exit(1);
}

// Re-export helper for tests that inspect prior comments
export { hasDispatchSuccessMarker };

main().catch((error) => {
  process.stderr.write(`${sanitizeErrorMessage(error)}\n`);
  process.exit(1);
});
