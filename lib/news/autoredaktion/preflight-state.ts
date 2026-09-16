export type PreflightMode = "candidate" | "empty" | "frozen";

/**
 * Empty branch-create pushes and branches that already have an open managed PR
 * are neutral: they must not receive a new publication status or mutation.
 */
export function classifyPreflightMode(input: {
  changedFiles: readonly string[];
  hasOpenManagedPr: boolean;
}): PreflightMode {
  if (input.hasOpenManagedPr) return "frozen";
  if (input.changedFiles.length === 0) return "empty";
  return "candidate";
}
