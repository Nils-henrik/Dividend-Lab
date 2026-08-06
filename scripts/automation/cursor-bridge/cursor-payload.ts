import {
  DIVLAB_BASE_REF,
  DIVLAB_REPO_URL,
  RISK_CLASSIFICATION_HIGH,
  RISK_CLASSIFICATION_MANUAL_ONLY,
} from "./config";
import { deterministicAgentId, generateBranchName } from "./branch-name";
import type { GitHubIssue } from "./types";

const ENGINEERING_CONTRACT = `
## DivLab engineering contract (mandatory)

You are implementing a task for Dividend Lab (Dividend-Lab repository).

### Architecture and product rules
- Preserve the existing DivLab architecture and module boundaries.
- Preserve Swedish user-facing language in all UI copy.
- Follow accessibility requirements (semantic HTML, labels, focus, contrast).
- Maintain responsive desktop and mobile behavior.
- Follow SEO and editorial conventions where relevant.
- Make only changes required for this task — no unrelated refactors or drive-by edits.
- Never modify secrets, credentials, environment files, or CI configuration unless this task explicitly requires it and was approved for manual review.

### Branch and pull request
- Start from the \`main\` branch.
- Create and work on branch: {{BRANCH_NAME}}
- Open a **draft** pull request when your work is ready for review.
- **Never merge your own pull request.**

### Validation (run and report in the PR)
- \`npm run lint\`
- \`npm run typecheck\`
- Run focused tests for your change area and any new tests you add.
- \`npm run build\` when your changes touch imports, build config, or shared modules that affect the app build.

### Scope discipline
- Inspect only files necessary for this task.
- Do not change production behavior outside the stated acceptance criteria.
- If you discover required sensitive changes (auth, database, migrations, payments, secrets), stop and document why manual review is required — do not proceed silently.

### Repository
- Repository: ${DIVLAB_REPO_URL}
- Base ref: ${DIVLAB_BASE_REF}
`.trim();

export type CursorAgentCreatePayload = {
  agentId: string;
  name: string;
  prompt: { text: string };
  repos: Array<{ url: string; startingRef: string }>;
  autoCreatePR: boolean;
  mode: "agent";
};

export function buildCursorPrompt(issue: GitHubIssue, branchName: string): string {
  const body = issue.body?.trim() || "_No issue body provided._";

  return [
    ENGINEERING_CONTRACT.replace("{{BRANCH_NAME}}", branchName),
    "",
    "---",
    "",
    `## GitHub Issue #${issue.number}`,
    "",
    `### Title`,
    issue.title,
    "",
    `### Body`,
    body,
    "",
    "---",
    "",
    "Implement the task described above. When complete, ensure the draft PR summary includes validation commands run and their results.",
  ].join("\n");
}

export function buildCursorAgentPayload(issue: GitHubIssue): {
  payload: CursorAgentCreatePayload;
  branchName: string;
  agentId: string;
} {
  const branchName = generateBranchName(issue.number, issue.title);
  const agentId = deterministicAgentId(issue.number);
  const promptText = buildCursorPrompt(issue, branchName);
  const name = `Issue #${issue.number}: ${issue.title}`.slice(0, 100);

  const payload: CursorAgentCreatePayload = {
    agentId,
    name,
    prompt: { text: promptText },
    repos: [{ url: DIVLAB_REPO_URL, startingRef: DIVLAB_BASE_REF }],
    autoCreatePR: true,
    mode: "agent",
  };

  return { payload, branchName, agentId };
}

export function extractRiskClassificationFromText(text: string | null): string | null {
  if (!text) return null;

  const match = text.match(
    /###\s*Risk classification\s*\n+([^\n#]+)/i,
  );
  if (match?.[1]) {
    return match[1].trim();
  }

  const alt = text.match(/Risk classification:\s*([^\n]+)/i);
  return alt?.[1]?.trim() ?? null;
}

export function isAutomaticMergeBlockedByRisk(text: string | null): string | null {
  const risk = extractRiskClassificationFromText(text);
  if (!risk) return null;

  if (
    risk === RISK_CLASSIFICATION_MANUAL_ONLY ||
    risk.startsWith("Manual only")
  ) {
    return RISK_CLASSIFICATION_MANUAL_ONLY;
  }

  if (risk === RISK_CLASSIFICATION_HIGH || risk.startsWith("High")) {
    return RISK_CLASSIFICATION_HIGH;
  }

  return null;
}
