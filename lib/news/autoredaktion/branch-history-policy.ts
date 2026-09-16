import {
  managedPublicationPaths,
  parseManagedBranchName,
} from "./path-contract";

const PREPARATION_MARKER = "[autoredaktion-prepared]";
const REPAIR_MARKER = "[autoredaktion-ci-repair]";

export type ManagedBranchCommit = {
  sha: string;
  parentShas: string[];
  message: string;
  changedFiles: string[];
};

export type ManagedBranchHistoryResult = {
  ok: boolean;
  issues: string[];
};

function sameFiles(actual: readonly string[], expected: readonly string[]): boolean {
  const left = [...new Set(actual)].sort();
  const right = [...new Set(expected)].sort();
  return (
    left.length === right.length &&
    left.every((file, index) => file === right[index])
  );
}

/**
 * Validates the only histories that the managed release chain may create:
 * initial article+registry, optional deterministic preparation, optional one
 * bounded deterministic repair. This is a workflow guard, not a substitute
 * for repository-level force-push protection.
 */
export function validateManagedBranchHistory(input: {
  branchName: string;
  baseSha: string;
  headSha: string;
  commits: readonly ManagedBranchCommit[];
}): ManagedBranchHistoryResult {
  const issues: string[] = [];
  const identity = parseManagedBranchName(input.branchName);
  if (!identity) return { ok: false, issues: ["branch-identity"] };

  const paths = managedPublicationPaths(identity.series, identity.date);
  if (input.commits.length < 1 || input.commits.length > 3) {
    issues.push("commit-budget");
  }

  let expectedParent = input.baseSha;
  for (const commit of input.commits) {
    if (commit.parentShas.length !== 1 || commit.parentShas[0] !== expectedParent) {
      issues.push(`non-linear-history:${commit.sha}`);
    }
    expectedParent = commit.sha;
  }
  if (input.commits.at(-1)?.sha !== input.headSha) {
    issues.push("head-sha-mismatch");
  }

  const initial = input.commits[0];
  if (initial) {
    if (
      initial.message.includes(PREPARATION_MARKER) ||
      initial.message.includes(REPAIR_MARKER)
    ) {
      issues.push("initial-marker");
    }
    if (
      !sameFiles(initial.changedFiles, [paths.articlePath, paths.registryPath])
    ) {
      issues.push("initial-two-file-contract");
    }
  }

  let preparationCount = 0;
  let repairCount = 0;
  let repairSeen = false;
  for (const commit of input.commits.slice(1)) {
    const isPreparation = commit.message.includes(PREPARATION_MARKER);
    const isRepair = commit.message.includes(REPAIR_MARKER);
    if (isPreparation === isRepair) {
      issues.push(`unauthorized-mutation:${commit.sha}`);
      continue;
    }

    if (isPreparation) {
      preparationCount += 1;
      if (repairSeen) issues.push("preparation-after-repair");
    }
    if (isRepair) {
      repairCount += 1;
      repairSeen = true;
    }

    const allowed = new Set([paths.articlePath, paths.imagePath]);
    if (
      commit.changedFiles.length === 0 ||
      commit.changedFiles.some((file) => !allowed.has(file))
    ) {
      issues.push(`mutation-file-scope:${commit.sha}`);
    }
  }

  if (preparationCount > 1) issues.push("preparation-budget");
  if (repairCount > 1) issues.push("repair-budget");

  return { ok: issues.length === 0, issues };
}
