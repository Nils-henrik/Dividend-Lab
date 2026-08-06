import { deterministicAgentId } from "./agent-id.ts";
import { generateBranchName } from "./branch-name.ts";
import { CURSOR_API, DIVLAB_REPO } from "./config.ts";
import { parseRiskClassification, riskMarker } from "./risk.ts";

export interface CursorCreateAgentRequest {
  prompt: { text: string };
  name: string;
  agentId: string;
  repos: Array<{ url: string; startingRef: string }>;
  workOnCurrentBranch: false;
  autoCreatePR: true;
  skipReviewerRequest: true;
  mode: "agent";
}

export interface BuiltCursorDispatch {
  endpoint: string;
  request: CursorCreateAgentRequest;
  plannedBranchName: string;
  agentId: string;
  risk: ReturnType<typeof parseRiskClassification>;
}

export interface BuildDispatchInput {
  issueNumber: number;
  title: string;
  body: string;
  issueHtmlUrl?: string;
}

/**
 * Construct a Cursor Cloud Agents API v1 create-agent payload.
 * Issue title/body are embedded as JSON string data only — never shell-interpolated.
 */
export function buildCursorDispatchPayload(
  input: BuildDispatchInput,
): BuiltCursorDispatch {
  const plannedBranchName = generateBranchName(input.issueNumber, input.title);
  const agentId = deterministicAgentId(input.issueNumber);
  const risk = parseRiskClassification(input.body);
  const promptText = buildEngineeringPrompt({
    ...input,
    plannedBranchName,
    risk,
  });

  const name = truncateName(
    `DivLab #${input.issueNumber}: ${input.title || "Untitled"}`,
  );

  const request: CursorCreateAgentRequest = {
    prompt: { text: promptText },
    name,
    agentId,
    repos: [
      {
        url: DIVLAB_REPO.url,
        startingRef: DIVLAB_REPO.defaultBranch,
      },
    ],
    workOnCurrentBranch: false,
    autoCreatePR: true,
    skipReviewerRequest: true,
    mode: "agent",
  };

  return {
    endpoint: `${CURSOR_API.baseUrl}${CURSOR_API.createAgentPath}`,
    request,
    plannedBranchName,
    agentId,
    risk,
  };
}

function truncateName(name: string): string {
  if (name.length <= 100) {
    return name;
  }
  return `${name.slice(0, 97)}...`;
}

function buildEngineeringPrompt(input: {
  issueNumber: number;
  title: string;
  body: string;
  plannedBranchName: string;
  risk: ReturnType<typeof parseRiskClassification>;
  issueHtmlUrl?: string;
}): string {
  const issueUrl =
    input.issueHtmlUrl ||
    `${DIVLAB_REPO.url}/issues/${input.issueNumber}`;

  return [
    "# DivLab Cursor Bridge Task",
    "",
    "You are a Cursor Cloud Agent working on Dividend Lab (DivLab).",
    "Henrik Karlsson is the Founder and Product Owner.",
    "",
    "## Strict engineering contract",
    "",
    "- Start from the latest `main` branch of https://github.com/Nils-henrik/Dividend-Lab.",
    `- Create and use this deterministic branch name: \`${input.plannedBranchName}\`.`,
    "- Open a **draft** pull request when done. Never mark it ready unless asked.",
    "- **Never merge** your own pull request.",
    "- Do not commit directly to `main`.",
    "- Preserve existing DivLab architecture and the Dividend Lab Engineering & Design Standard.",
    "- Inspect only the files necessary for this task. Do not perform broad exploratory refactors.",
    "- Preserve Swedish user-facing language unless the task explicitly changes copy language.",
    "- Follow accessibility requirements; maintain responsive desktop and mobile behavior.",
    "- Follow SEO and editorial conventions where relevant.",
    "- Avoid unrelated changes.",
    "- Never modify secrets, credentials, `.env*` files, or GitHub Actions secrets.",
    "- Never print, echo, log, or commit secrets.",
    "- Run and fix: lint, typecheck, relevant tests, and build where appropriate for the change.",
    "- Do not modify production UI or normal application behavior unless the task requires it.",
    "",
    "## Risk classification",
    "",
    `Parsed from the Issue: **${input.risk}**`,
    `${riskMarker(input.risk)}`,
    "",
    "Include the HTML risk marker above in the PR body.",
    "If risk is `high` or `manual-only`, state clearly that automatic merge is forbidden.",
    "",
    "## Originating Issue",
    "",
    `- Issue number: #${input.issueNumber}`,
    `- Issue URL: ${issueUrl}`,
    `- Planned branch: \`${input.plannedBranchName}\``,
    "",
    "### Issue title",
    "",
    input.title || "(empty title)",
    "",
    "### Issue body",
    "",
    input.body || "(empty body)",
    "",
    "## Delivery",
    "",
    "- Implement the task completely and autonomously.",
    "- Leave an auditable draft PR with a precise summary.",
    "- Stop when the draft PR is ready for human/ChatGPT review.",
  ].join("\n");
}
