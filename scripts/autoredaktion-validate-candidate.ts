import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { stockholmCalendarDate } from "@/lib/news/autoredaktion/dates";
import { validateP0FactGate } from "@/lib/news/autoredaktion/fact-gate";
import {
  managedPublicationPaths,
  parseManagedBranchName,
} from "@/lib/news/autoredaktion/path-contract";
import type { NewsArticle } from "@/types/news";

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

function required(value: string | undefined, name: string): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${name} is required`);
  return trimmed;
}

function isNewsArticle(value: unknown): value is NewsArticle {
  return Boolean(
    value &&
      typeof value === "object" &&
      "id" in value &&
      "title" in value &&
      "publishedAt" in value,
  );
}

async function loadArticle(articlePath: string): Promise<NewsArticle> {
  const absolute = path.resolve(articlePath);
  const imported = (await import(
    `${pathToFileURL(absolute).href}?candidate=${Date.now()}`
  )) as Record<string, unknown>;
  const articles = Object.values(imported).filter(isNewsArticle);
  if (articles.length !== 1) {
    throw new Error(
      `Expected exactly one NewsArticle export in ${articlePath}; found ${articles.length}`,
    );
  }
  return articles[0];
}

async function main() {
  const branchName = required(
    process.env.AUTOREDAKTION_BRANCH_NAME ?? process.env.GITHUB_REF_NAME,
    "managed branch name",
  );
  const identity = parseManagedBranchName(branchName);
  if (!identity) throw new Error(`Unsupported managed branch identity: ${branchName}`);

  const baseSha = required(process.env.AUTOREDAKTION_BASE_SHA, "AUTOREDAKTION_BASE_SHA");
  const changedFiles = git(["diff", "--name-only", `${baseSha}...HEAD`])
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const paths = managedPublicationPaths(identity.series, identity.date);
  const allowed = new Set([paths.articlePath, paths.registryPath, paths.imagePath]);
  const unexpected = changedFiles.filter((file) => !allowed.has(file));
  const issues: string[] = [];

  if (!changedFiles.includes(paths.articlePath)) issues.push("canonical-article-path");
  if (!changedFiles.includes(paths.registryPath)) issues.push("registry-file");
  if (unexpected.length > 0) issues.push(`unexpected-files:${unexpected.join(",")}`);
  if (changedFiles.length < 2 || changedFiles.length > 3) issues.push("file-budget");
  if (issues.length > 0) {
    throw new Error(`candidate file contract failed: ${issues.join(", ")}`);
  }

  const article = await loadArticle(paths.articlePath);
  const publishedAt = new Date(article.publishedAt);
  if (
    Number.isNaN(publishedAt.getTime()) ||
    stockholmCalendarDate(publishedAt) !== identity.date
  ) {
    throw new Error(
      `Article publishedAt must resolve to branch date ${identity.date} in Europe/Stockholm`,
    );
  }

  const initialCommit = git([
    "rev-list",
    "--reverse",
    `${baseSha}..HEAD`,
    "--",
    paths.articlePath,
  ])
    .split("\n")
    .map((value) => value.trim())
    .find(Boolean);
  if (!initialCommit) {
    throw new Error("Could not resolve the initial canonical article commit");
  }
  const handoffAt = new Date(git(["show", "-s", "--format=%cI", initialCommit]));
  const sourceText = readFileSync(path.resolve(paths.articlePath), "utf8");
  const p0 = validateP0FactGate({ article, sourceText, handoffAt });
  if (!p0.ok) {
    throw new Error(
      `P0 fact-gate contract failed: ${p0.issues
        .map((issue) => `${issue.code}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  console.log(
    `Autoredaktion candidate PASS: ${identity.series} ${identity.date} -> ${paths.articlePath}; cutoff ${p0.cutoff?.toISOString()}`,
  );
}

main().catch((error: unknown) => {
  console.error(
    `AUTOREDAKTION CANDIDATE FAIL: ${
      error instanceof Error ? error.stack ?? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
