/**
 * Cursor Cloud Agents API configuration for the DivLab automation bridge.
 *
 * Contract source (verified against Cursor official docs / OpenAPI, 2026):
 * - https://cursor.com/docs/cloud-agent/api/endpoints
 * - https://cursor.com/docs-static/cloud-agents-openapi.yaml
 *
 * Use the current v1 Agents API. Do not use the legacy v0 surface for new
 * integrations. Keep endpoint and version constants here only.
 */

export const CURSOR_API = {
  /** Production API host. */
  baseUrl: "https://api.cursor.com",
  /** Current Cloud Agents API version path prefix. */
  version: "v1",
  /** Create-agent endpoint (POST). */
  createAgentPath: "/v1/agents",
} as const;

export const DIVLAB_REPO = {
  owner: "Nils-henrik",
  name: "Dividend-Lab",
  fullName: "Nils-henrik/Dividend-Lab",
  url: "https://github.com/Nils-henrik/Dividend-Lab",
  defaultBranch: "main",
  allowedAuthor: "Nils-henrik",
} as const;

export const BRIDGE_LABELS = {
  agent: "cursor-agent",
  running: "cursor-running",
  failed: "cursor-failed",
  approved: "divlab-approved",
  manualReview: "divlab-manual-review",
} as const;

export const BRANCH_PREFIX = "cursor/";

/** GitHub Actions secret name — never log or echo its value. */
export const CURSOR_API_KEY_SECRET_NAME = "CURSOR_API_KEY";

/** Max length for Git refs (GitHub soft limit guidance). */
export const MAX_BRANCH_NAME_LENGTH = 100;

/** Polling budget for required checks before merge (ms). */
export const CHECK_WAIT_TIMEOUT_MS = 30 * 60 * 1000;

/** Polling interval for required checks (ms). */
export const CHECK_POLL_INTERVAL_MS = 15_000;

export type RiskClassification =
  | "low"
  | "medium"
  | "high"
  | "manual-only"
  | "unknown";

export const AUTO_MERGE_ELIGIBLE_RISKS: ReadonlySet<RiskClassification> =
  new Set(["low", "medium"]);
