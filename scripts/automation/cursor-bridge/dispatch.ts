import { buildCursorAgentPayload } from "./cursor-payload";
import { createCursorAgent, requireApiKey } from "./cursor-api";
import {
  readEventFromPath,
  shouldSkipDuplicateDispatch,
  validateIssueLabelEvent,
} from "./github-event";
import {
  postIssueComment,
  transitionIssueLabelsAfterDispatch,
} from "./github-api";
import type { DispatchResult, GitHubLabelEvent } from "./types";

function formatSuccessComment(result: DispatchResult & { status: "success" }): string {
  const lines = [
    "✅ **Cursor Cloud Agent dispatch succeeded**",
    "",
    `- Issue: #${result.issueNumber}`,
    `- Planned branch: \`${result.branchName}\``,
    `- Agent ID: \`${result.agentId}\``,
  ];

  if (result.agentUrl) {
    lines.push(`- Agent link: ${result.agentUrl}`);
  }

  if (result.runId) {
    lines.push(`- Initial run ID: \`${result.runId}\``);
  }

  if (result.duplicate) {
    lines.push(
      "",
      "_Note: dispatch was idempotent — an agent for this issue was already registered._",
    );
  }

  lines.push(
    "",
    "The `cursor-agent` label was removed and `cursor-running` was applied.",
  );

  return lines.join("\n");
}

function formatFailureComment(
  issueNumber: number,
  branchName: string,
  message: string,
): string {
  return [
    "❌ **Cursor Cloud Agent dispatch failed**",
    "",
    `- Issue: #${issueNumber}`,
    `- Planned branch: \`${branchName}\``,
    "",
    "**Safe error summary:**",
    message,
    "",
    "The `cursor-agent` label was removed and `cursor-failed` was applied.",
    "You may fix the issue and re-apply `cursor-agent` to retry.",
  ].join("\n");
}

export async function runDispatch(): Promise<DispatchResult> {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error("GITHUB_EVENT_PATH is not set.");
  }

  const event = readEventFromPath<GitHubLabelEvent>(eventPath);
  const validation = validateIssueLabelEvent(event);
  if (!validation.ok) {
    return {
      status: "skipped",
      issueNumber: event.issue?.number ?? 0,
      reason: validation.reason,
    };
  }

  const issue = validation.issue;
  const duplicateReason = shouldSkipDuplicateDispatch(issue);
  if (duplicateReason) {
    return {
      status: "skipped",
      issueNumber: issue.number,
      reason: duplicateReason,
    };
  }

  const { payload, branchName, agentId } = buildCursorAgentPayload(issue);
  const apiKey = requireApiKey();
  const apiResult = await createCursorAgent(apiKey, payload);

  if (!apiResult.ok) {
    const failure: DispatchResult = {
      status: "failure",
      issueNumber: issue.number,
      branchName,
      message: apiResult.message,
    };

    transitionIssueLabelsAfterDispatch(issue.number, "failure");
    postIssueComment(
      issue.number,
      formatFailureComment(issue.number, branchName, apiResult.message),
    );

    return failure;
  }

  const agentIdFromApi = apiResult.data.agent?.id ?? agentId;
  const agentUrl = apiResult.data.agent?.url ?? null;
  const runId = apiResult.data.run?.id ?? null;

  const success: DispatchResult = {
    status: "success",
    issueNumber: issue.number,
    agentId: agentIdFromApi,
    agentUrl,
    branchName,
    runId,
    duplicate: apiResult.duplicate,
  };

  transitionIssueLabelsAfterDispatch(issue.number, "success");
  postIssueComment(issue.number, formatSuccessComment(success));

  return success;
}

if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, "/") ?? "")) {
  runDispatch()
    .then((result) => {
      if (result.status === "skipped") {
        console.log(`Skipped: ${result.reason}`);
        return;
      }
      if (result.status === "failure") {
        console.error(`Dispatch failed: ${result.message}`);
        process.exitCode = 1;
        return;
      }
      console.log(
        `Dispatch succeeded for issue #${result.issueNumber} (agent ${result.agentId}).`,
      );
    })
    .catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : "Dispatch error");
      process.exitCode = 1;
    });
}
