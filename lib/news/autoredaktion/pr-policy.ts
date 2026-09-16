import type { EditorialSeries } from "./types";
import {
  managedPublicationPaths,
  parseManagedBranchName,
} from "./path-contract";

export const AUTOREDAKTION_PR_LABEL = "autoredaktion";
export const AUTOREDAKTION_REPAIR_USED_LABEL = "autoredaktion-repair-used";
export const AUTOREDAKTION_PR_MARKER = "<!-- AUTOREDAKTION_MANAGED_V2 -->";

export type ManagedPrSnapshot = {
  number: number;
  state: string;
  isDraft: boolean;
  headRefName: string;
  baseRefName: string;
  headRefOid: string;
  body?: string | null;
  labels: Array<{ name: string }>;
  files: Array<{ path: string; additions?: number; deletions?: number }>;
  commits: Array<{ messageHeadline?: string; message?: string }>;
};

export type ManagedPrPolicyResult = {
  ok: boolean;
  issues: string[];
  series: EditorialSeries | null;
  date: string | null;
  expectedArticlePath: string | null;
  expectedImagePath: string | null;
};

export function validateManagedPublicationPr(
  snapshot: ManagedPrSnapshot,
): ManagedPrPolicyResult {
  const issues: string[] = [];
  const branch = parseManagedBranchName(snapshot.headRefName);
  const series = branch?.series ?? null;
  const date = branch?.date ?? null;
  const paths = series && date ? managedPublicationPaths(series, date) : null;
  const articlePath = paths?.articlePath ?? null;
  const imagePath = paths?.imagePath ?? null;

  if (!branch || !series || !date || !paths || !articlePath || !imagePath) {
    issues.push("branch-identity");
  }
  if (snapshot.baseRefName !== "main") issues.push("base-main");
  if (snapshot.state !== "OPEN") issues.push("pr-open");
  if (!snapshot.isDraft) issues.push("pr-must-remain-draft-until-green");
  if (!snapshot.body?.includes(AUTOREDAKTION_PR_MARKER)) issues.push("managed-marker");
  if (!snapshot.labels.some((label) => label.name === AUTOREDAKTION_PR_LABEL)) {
    issues.push("managed-label");
  }
  if (!snapshot.headRefOid) issues.push("head-sha");

  if (snapshot.commits.length < 1 || snapshot.commits.length > 3) {
    issues.push("commit-budget");
  }
  const initialMessage = `${snapshot.commits[0]?.messageHeadline ?? ""} ${
    snapshot.commits[0]?.message ?? ""
  }`;
  if (
    initialMessage.includes("[autoredaktion-prepared]") ||
    initialMessage.includes("[autoredaktion-ci-repair]")
  ) {
    issues.push("initial-marker");
  }
  const repairCommits = snapshot.commits.filter((commit) =>
    `${commit.messageHeadline ?? ""} ${commit.message ?? ""}`.includes(
      "[autoredaktion-ci-repair]",
    ),
  );
  const preparationCommits = snapshot.commits.filter((commit) =>
    `${commit.messageHeadline ?? ""} ${commit.message ?? ""}`.includes(
      "[autoredaktion-prepared]",
    ),
  );
  if (repairCommits.length > 1) issues.push("repair-budget");
  if (preparationCommits.length > 1) issues.push("preparation-budget");
  const repairBudgetMarked = snapshot.labels.some(
    (label) => label.name === AUTOREDAKTION_REPAIR_USED_LABEL,
  );
  if (repairBudgetMarked !== (repairCommits.length === 1)) {
    issues.push("repair-budget-marker");
  }

  const controlMarkers = snapshot.commits.slice(1).map((commit) => {
    const message = `${commit.messageHeadline ?? ""} ${commit.message ?? ""}`;
    const prepared = message.includes("[autoredaktion-prepared]");
    const repair = message.includes("[autoredaktion-ci-repair]");
    return prepared === repair ? "invalid" : prepared ? "prepared" : "repair";
  });
  if (controlMarkers.includes("invalid")) issues.push("unauthorized-mutation");
  if (
    controlMarkers.indexOf("repair") >= 0 &&
    controlMarkers.lastIndexOf("prepared") > controlMarkers.indexOf("repair")
  ) {
    issues.push("preparation-after-repair");
  }

  if (paths && articlePath && imagePath) {
    const paths = snapshot.files.map((file) => file.path);
    const allowed = new Set([articlePath, "lib/news/get-articles.ts", imagePath]);
    const unexpected = paths.filter((file) => !allowed.has(file));
    if (unexpected.length) issues.push(`unexpected-files:${unexpected.join(",")}`);
    if (!paths.includes(articlePath)) issues.push("article-file");
    if (!paths.includes("lib/news/get-articles.ts")) issues.push("registry-file");
    if (paths.filter((file) => file.startsWith("public/news/generated/")).length > 1) {
      issues.push("generated-image-count");
    }
    if (paths.length < 2 || paths.length > 3) issues.push("file-budget");
  }

  return {
    ok: issues.length === 0,
    issues,
    series,
    date,
    expectedArticlePath: articlePath,
    expectedImagePath: imagePath,
  };
}
