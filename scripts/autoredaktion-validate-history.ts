import { execFileSync } from "node:child_process";

import {
  type ManagedBranchCommit,
  validateManagedBranchHistory,
} from "@/lib/news/autoredaktion/branch-history-policy";

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

function currentBranchName(): string {
  return required(
    process.env.AUTOREDAKTION_BRANCH_NAME ??
      process.env.GITHUB_HEAD_REF ??
      process.env.GITHUB_REF_NAME ??
      git(["branch", "--show-current"]),
    "managed branch name",
  );
}

function main() {
  const branchName = currentBranchName();
  const baseSha = required(process.env.AUTOREDAKTION_BASE_SHA, "AUTOREDAKTION_BASE_SHA");
  const headSha = process.env.AUTOREDAKTION_HEAD_SHA?.trim() || git(["rev-parse", "HEAD"]);

  try {
    git(["merge-base", "--is-ancestor", baseSha, headSha]);
  } catch {
    throw new Error(`Managed head ${headSha} is not a descendant of base ${baseSha}`);
  }

  const shas = git(["rev-list", "--reverse", "--ancestry-path", `${baseSha}..${headSha}`])
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const commits: ManagedBranchCommit[] = shas.map((sha) => ({
    sha,
    parentShas: git(["show", "-s", "--format=%P", sha])
      .split(/\s+/)
      .filter(Boolean),
    message: git(["show", "-s", "--format=%B", sha]),
    changedFiles: git(["diff-tree", "--no-commit-id", "--name-only", "-r", sha])
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean),
  }));

  const result = validateManagedBranchHistory({
    branchName,
    baseSha,
    headSha,
    commits,
  });
  if (!result.ok) {
    console.error(`AUTOREDAKTION HISTORY POLICY FAIL: ${result.issues.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Autoredaktion history policy PASS: ${branchName} (${commits.length}/3 commits, head ${headSha})`,
  );
}

try {
  main();
} catch (error: unknown) {
  console.error(
    `AUTOREDAKTION HISTORY POLICY FAIL: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
}
