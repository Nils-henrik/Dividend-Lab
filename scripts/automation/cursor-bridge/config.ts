/**
 * Cursor Cloud Agents API configuration.
 *
 * Official contract (v1, public beta):
 * https://cursor.com/docs/cloud-agent/api/endpoints
 * OpenAPI: https://cursor.com/docs-static/cloud-agents-openapi.yaml
 *
 * Authentication: Bearer or Basic with CURSOR_API_KEY (see https://cursor.com/docs/api)
 */

/** Single maintainable location for the Agents API create endpoint. */
export const CURSOR_API_CREATE_AGENT_URL = "https://api.cursor.com/v1/agents";

export const DIVLAB_REPO = "Nils-henrik/Dividend-Lab";
export const DIVLAB_REPO_URL = `https://github.com/${DIVLAB_REPO}`;
export const DIVLAB_BASE_REF = "main";
export const ALLOWED_ISSUE_AUTHOR = "Nils-henrik";
export const CURSOR_BRANCH_PREFIX = "cursor/";

export const LABEL_CURSOR_AGENT = "cursor-agent";
export const LABEL_CURSOR_RUNNING = "cursor-running";
export const LABEL_CURSOR_FAILED = "cursor-failed";
export const LABEL_DIVLAB_APPROVED = "divlab-approved";
export const LABEL_DIVLAB_MANUAL_REVIEW = "divlab-manual-review";

/** Maximum GitHub branch name length. */
export const MAX_BRANCH_NAME_LENGTH = 255;

/** Conservative cap for the slug segment of cursor/issue-N-slug branches. */
export const MAX_BRANCH_SLUG_LENGTH = 80;

export const RISK_CLASSIFICATION_MANUAL_ONLY =
  "Manual only — migrations/RLS/secrets/payments/destructive changes";
export const RISK_CLASSIFICATION_HIGH =
  "High — auth/database/security/user data";

export const MERGE_CHECK_TIMEOUT_MS = 30 * 60 * 1000;
export const MERGE_CHECK_POLL_INTERVAL_MS = 30 * 1000;
