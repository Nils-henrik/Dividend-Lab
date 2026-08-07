/**
 * Safe /brain URL builders for active/archived conversation scope.
 *
 * Shared browser-safe helpers — no secrets, no actor ids, no open redirects.
 */

export type DivBrainArchiveScope = "active" | "archived";

/**
 * Parse an untrusted `archive` query value.
 * Malformed, repeated, or unknown values resolve to `active`.
 */
export function parseDivBrainArchiveScope(
  value: string | string[] | null | undefined,
): DivBrainArchiveScope {
  if (typeof value !== "string") {
    return "active";
  }

  const trimmed = value.trim().toLowerCase();
  if (trimmed === "archived") {
    return "archived";
  }

  return "active";
}

export type BuildDivBrainHrefParams = {
  archiveScope?: DivBrainArchiveScope;
  conversationId?: string | null;
};

/**
 * Build a /brain href from approved scope + optional validated conversation id.
 * Never accepts arbitrary external URLs.
 */
export function buildDivBrainHref(params: BuildDivBrainHrefParams = {}): string {
  const search = new URLSearchParams();
  const scope = params.archiveScope ?? "active";

  if (scope === "archived") {
    search.set("archive", "archived");
  }

  if (
    typeof params.conversationId === "string" &&
    params.conversationId.trim().length > 0
  ) {
    search.set("conversation", params.conversationId.trim());
  }

  const query = search.toString();
  return query.length > 0 ? `/brain?${query}` : "/brain";
}
