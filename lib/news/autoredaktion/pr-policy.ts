import type { EditorialSeries } from "./types";

export const AUTOREDAKTION_PR_LABEL = "autoredaktion";
export const AUTOREDAKTION_PR_MARKER = "<!-- AUTOREDAKTION_MANAGED_V2 -->";

const BRANCH_PATTERN =
  /^autoredaktion\/(borssverige|norden-i-centrum|bolaget-i-fokus|usa-i-fokus)-(\d{4}-\d{2}-\d{2})$/;
const SWEDISH_MONTHS = [
  "januari",
  "februari",
  "mars",
  "april",
  "maj",
  "juni",
  "juli",
  "augusti",
  "september",
  "oktober",
  "november",
  "december",
] as const;

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

function expectedArticlePath(series: EditorialSeries, date: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `data/news-articles/${series}-${day}-${SWEDISH_MONTHS[month - 1]}-${match[1]}.ts`;
}

export function validateManagedPublicationPr(
  snapshot: ManagedPrSnapshot,
): ManagedPrPolicyResult {
  const issues: string[] = [];
  const branch = BRANCH_PATTERN.exec(snapshot.headRefName);
  const series = (branch?.[1] as EditorialSeries | undefined) ?? null;
  const date = branch?.[2] ?? null;
  const articlePath = series && date ? expectedArticlePath(series, date) : null;
  const imagePath = series && date ? `public/news/generated/${series}-${date}.png` : null;

  if (!branch || !series || !date || !articlePath || !imagePath) {
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
  const repairCommits = snapshot.commits.filter((commit) =>
    `${commit.messageHeadline ?? ""} ${commit.message ?? ""}`.includes(
      "[autoredaktion-ci-repair]",
    ),
  );
  if (repairCommits.length > 1) issues.push("repair-budget");

  if (articlePath && imagePath) {
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
