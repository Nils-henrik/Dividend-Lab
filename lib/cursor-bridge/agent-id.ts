import { createHash } from "node:crypto";

/**
 * Deterministic Cursor agent ID for an Issue.
 * Cursor API accepts optional client-supplied ids matching:
 *   ^bc-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$
 *
 * Re-POSTing the same agentId returns 409 agent_id_conflict instead of
 * creating a duplicate agent — primary API-level idempotency control.
 */
export function deterministicAgentId(issueNumber: number): string {
  if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
    throw new Error("Issue number must be a positive integer");
  }

  const digest = createHash("sha256")
    .update(`divlab-cursor-bridge:v1:issue:${issueNumber}`)
    .digest();

  const hex = digest.toString("hex");
  const timeLow = hex.slice(0, 8);
  const timeMid = hex.slice(8, 12);
  // RFC-like version nibble forced to 5 (name-based)
  const timeHigh = `5${hex.slice(13, 16)}`;
  // RFC variant bits 10xxxxxx
  const clockSeqHi = ((Number.parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80)
    .toString(16)
    .padStart(2, "0");
  const clockSeqLow = hex.slice(18, 20);
  const node = hex.slice(20, 32);

  return `bc-${timeLow}-${timeMid}-${timeHigh}-${clockSeqHi}${clockSeqLow}-${node}`;
}

export function isValidAgentId(agentId: string): boolean {
  return /^bc-[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    agentId,
  );
}
