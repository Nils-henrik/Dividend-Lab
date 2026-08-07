#!/usr/bin/env node
/**
 * Controlled PR approval / squash-merge CLI for GitHub Actions.
 *
 * Security:
 * - Intended for pull_request_target workflows that NEVER check out PR code.
 * - Talks only to GitHub's API using GITHUB_TOKEN.
 * - Fail closed on ambiguous state, sensitive paths, high risk, or failed checks.
 */
import { appendFileSync } from "node:fs";
import {
  BRIDGE_LABELS,
  CHECK_POLL_INTERVAL_MS,
  CHECK_WAIT_TIMEOUT_MS,
  DIVLAB_REPO,
} from "../../lib/cursor-bridge/config";
import {
  buildApprovalRefusalComment,
  buildMergeSuccessComment,
  buildSensitiveBlockComment,
} from "../../lib/cursor-bridge/comments";
import {
  evaluateChecks,
  evaluateMergeEligibility,
  isVercelCheckName,
  type CheckStatusSummary,
  type PullRequestMergeContext,
} from "../../lib/cursor-bridge/merge-eligibility";
import { getCategoryLabel } from "../../lib/cursor-bridge/sensitive-paths";
import { parseRiskClassification } from "../../lib/cursor-bridge/risk";
import {
  extractPrLabelNames,
  isExpectedCursorCreatorFlow,
  type GithubPullRequestLike,
} from "../../lib/cursor-bridge/pr-validation";
import { sanitizeErrorMessage } from "../../lib/cursor-bridge/sanitize";

interface ApproveOutputs {
  outcome:
    | "merged"
    | "blocked_sensitive"
    | "refused"
    | "rejected";
  comment_body: string;
  apply_label: string;
  remove_labels: string;
}

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
  const repository = process.env.GITHUB_REPOSITORY ?? DIVLAB_REPO.fullName;
  const prNumber = Number(process.env.PR_NUMBER ?? "");
  const approvedSha = process.env.APPROVED_HEAD_SHA ?? "";
  const dryRun = process.env.CURSOR_BRIDGE_DRY_RUN === "true";
  const waitTimeoutMs = Number(
    process.env.CHECK_WAIT_TIMEOUT_MS ?? CHECK_WAIT_TIMEOUT_MS,
  );
  const pollIntervalMs = Number(
    process.env.CHECK_POLL_INTERVAL_MS ?? CHECK_POLL_INTERVAL_MS,
  );

  if (!token) {
    failHard("GITHUB_TOKEN is required");
  }
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    failHard("PR_NUMBER must be a positive integer");
  }
  if (!approvedSha || !/^[0-9a-f]{7,40}$/i.test(approvedSha)) {
    failHard("APPROVED_HEAD_SHA is missing or invalid");
  }
  if (repository !== DIVLAB_REPO.fullName) {
    const outputs: ApproveOutputs = {
      outcome: "rejected",
      comment_body: buildApprovalRefusalComment({
        detail: `Repository must be ${DIVLAB_REPO.fullName}`,
        manualReview: false,
      }),
      apply_label: "",
      remove_labels: BRIDGE_LABELS.approved,
    };
    writeOutputs(outputs);
    process.exitCode = 1;
    return;
  }

  const api = createGithubApi(token, repository);

  // Initial PR fetch
  let pr = await api.getPull(prNumber);
  const labels = extractPrLabelNames(pr.labels);
  if (!labels.includes(BRIDGE_LABELS.approved)) {
    writeOutputs({
      outcome: "rejected",
      comment_body: "",
      apply_label: "",
      remove_labels: "",
    });
    process.exitCode = 0;
    return;
  }

  const changedFiles = await api.listChangedFiles(prNumber);
  const risk = parseRiskClassification(pr.body ?? "");

  const context = buildContext(pr, {
    approvedHeadSha: approvedSha,
    changedFiles,
    risk,
  });

  // Path / policy gate before any ready/merge mutation.
  // Draft PRs often report mergeable_state=draft — allow that only in preflight.
  const early = evaluateMergeEligibility(context, undefined, {
    allowDraftMergeableState: true,
  });
  if (!early.allowed) {
    await handleBlocked(api, prNumber, early, dryRun);
    return;
  }

  if (!dryRun) {
    if (pr.draft) {
      await api.markReady(prNumber);
    }
  }

  // Wait for required checks + Vercel
  const checks = await waitForChecks(api, approvedSha, waitTimeoutMs, pollIntervalMs);

  // Re-fetch PR and confirm SHA unchanged
  pr = await api.getPull(prNumber);
  const refreshed = buildContext(pr, {
    approvedHeadSha: approvedSha,
    changedFiles: await api.listChangedFiles(prNumber),
    risk: parseRiskClassification(pr.body ?? ""),
  });

  const finalDecision = evaluateMergeEligibility(refreshed, checks);
  if (!finalDecision.allowed) {
    await handleBlocked(api, prNumber, finalDecision, dryRun);
    return;
  }

  if (pr.head?.sha !== approvedSha) {
    await handleBlocked(
      api,
      prNumber,
      {
        allowed: false,
        reason: "head_sha_changed",
        detail: "PR head SHA changed after approval; refusing merge",
        requireManualReview: true,
      },
      dryRun,
    );
    return;
  }

  if (dryRun) {
    writeOutputs({
      outcome: "merged",
      comment_body: buildMergeSuccessComment({
        prNumber,
        headSha: approvedSha,
        branchName: pr.head?.ref ?? "cursor/unknown",
      }),
      apply_label: "",
      remove_labels: BRIDGE_LABELS.approved,
    });
    process.stdout.write(JSON.stringify({ ok: true, dryRun: true }) + "\n");
    return;
  }

  await api.squashMerge(prNumber, approvedSha);
  const branch = pr.head?.ref;
  if (branch?.startsWith("cursor/")) {
    try {
      await api.deleteBranch(branch);
    } catch (error) {
      // Non-fatal: merge already succeeded
      process.stderr.write(
        `Branch delete warning: ${sanitizeErrorMessage(error)}\n`,
      );
    }
  }

  const successBody = buildMergeSuccessComment({
    prNumber,
    headSha: approvedSha,
    branchName: branch ?? "cursor/unknown",
  });

  await api.createComment(prNumber, successBody);
  await api.removeLabel(prNumber, BRIDGE_LABELS.approved);

  writeOutputs({
    outcome: "merged",
    comment_body: successBody,
    apply_label: "",
    remove_labels: BRIDGE_LABELS.approved,
  });
  process.stdout.write(
    JSON.stringify({ ok: true, prNumber, headSha: approvedSha }) + "\n",
  );
}

async function handleBlocked(
  api: GithubApi,
  prNumber: number,
  decision: Extract<
    ReturnType<typeof evaluateMergeEligibility>,
    { allowed: false }
  >,
  dryRun: boolean,
): Promise<void> {
  if (decision.reason === "sensitive_paths") {
    const categories = (decision.blockedCategories ?? []).map(getCategoryLabel);
    const pathsSample = (decision.sensitiveMatches ?? []).map((m) => m.path);
    const comment = buildSensitiveBlockComment({ categories, pathsSample });

    if (!dryRun) {
      await api.removeLabel(prNumber, BRIDGE_LABELS.approved);
      await api.addLabel(prNumber, BRIDGE_LABELS.manualReview);
      await api.createComment(prNumber, comment);
    }

    writeOutputs({
      outcome: "blocked_sensitive",
      comment_body: comment,
      apply_label: BRIDGE_LABELS.manualReview,
      remove_labels: BRIDGE_LABELS.approved,
    });
    process.exitCode = 0;
    return;
  }

  const comment = buildApprovalRefusalComment({
    detail: decision.detail,
    manualReview: decision.requireManualReview,
  });

  if (!dryRun) {
    await api.removeLabel(prNumber, BRIDGE_LABELS.approved);
    if (decision.requireManualReview) {
      await api.addLabel(prNumber, BRIDGE_LABELS.manualReview);
    }
    await api.createComment(prNumber, comment);
  }

  writeOutputs({
    outcome: "refused",
    comment_body: comment,
    apply_label: decision.requireManualReview
      ? BRIDGE_LABELS.manualReview
      : "",
    remove_labels: BRIDGE_LABELS.approved,
  });
  process.exitCode = 0;
}

function buildContext(
  pr: GithubPullRequestLike,
  extras: {
    approvedHeadSha: string;
    changedFiles: string[];
    risk: ReturnType<typeof parseRiskClassification>;
  },
): PullRequestMergeContext {
  return {
    repositoryFullName: pr.base?.repo?.full_name ?? "",
    baseBranch: pr.base?.ref ?? "",
    headBranch: pr.head?.ref ?? "",
    headSha: pr.head?.sha ?? "",
    approvedHeadSha: extras.approvedHeadSha,
    state: pr.state ?? "",
    draft: Boolean(pr.draft),
    mergeable: pr.mergeable ?? null,
    mergeableState: pr.mergeable_state ?? null,
    changedFiles: extras.changedFiles,
    risk: extras.risk,
    expectedCreatorFlow: isExpectedCursorCreatorFlow(pr),
  };
}

async function waitForChecks(
  api: GithubApi,
  headSha: string,
  timeoutMs: number,
  pollIntervalMs: number,
): Promise<CheckStatusSummary> {
  const started = Date.now();
  let last: CheckStatusSummary | null = null;

  while (Date.now() - started < timeoutMs) {
    last = await api.getCheckSummary(headSha);
    const checkDecision = evaluateChecks(last);

    if (checkDecision.allowed) {
      return last;
    }

    const pending = hasPendingChecks(last);
    if (!pending && checkDecision.reason === "vercel_check_missing") {
      // Give checks a short window to appear after mark-ready, then fail closed.
      if (Date.now() - started > Math.min(timeoutMs, 120_000) && !last.vercelCheck) {
        return last;
      }
    }

    if (!pending && checkDecision.reason === "checks_not_ready") {
      const failed = last.requiredChecks.some(
        (c) =>
          c.status === "completed" &&
          c.conclusion &&
          !["success", "neutral"].includes(c.conclusion),
      );
      if (failed || last.vercelCheck) {
        return last;
      }
    }

    await sleep(pollIntervalMs);
  }

  return (
    last ?? {
      requiredChecks: [],
    }
  );
}

function hasPendingChecks(summary: CheckStatusSummary): boolean {
  const all = [
    ...summary.requiredChecks,
    ...(summary.vercelCheck ? [summary.vercelCheck] : []),
  ];
  return all.some(
    (check) =>
      check.status !== "completed" &&
      check.status !== "completed".toUpperCase(),
  );
}

interface GithubApi {
  getPull(number: number): Promise<GithubPullRequestLike>;
  listChangedFiles(number: number): Promise<string[]>;
  getCheckSummary(sha: string): Promise<CheckStatusSummary>;
  markReady(number: number): Promise<void>;
  squashMerge(number: number, sha: string): Promise<void>;
  deleteBranch(branch: string): Promise<void>;
  createComment(number: number, body: string): Promise<void>;
  addLabel(number: number, label: string): Promise<void>;
  removeLabel(number: number, label: string): Promise<void>;
}

function createGithubApi(token: string, repository: string): GithubApi {
  const [owner, repo] = repository.split("/");
  const base = "https://api.github.com";

  async function gh<T>(
    path: string,
    init?: RequestInit & { raw?: boolean },
  ): Promise<T> {
    const response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `GitHub API ${response.status}: ${sanitizeErrorMessage(text)}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  return {
    async getPull(number) {
      return gh<GithubPullRequestLike>(`/repos/${owner}/${repo}/pulls/${number}`);
    },

    async listChangedFiles(number) {
      const files: string[] = [];
      let page = 1;
      for (;;) {
        const batch = await gh<Array<{ filename?: string }>>(
          `/repos/${owner}/${repo}/pulls/${number}/files?per_page=100&page=${page}`,
        );
        for (const file of batch) {
          if (file.filename) {
            files.push(file.filename);
          }
        }
        if (batch.length < 100) {
          break;
        }
        page += 1;
        if (page > 50) {
          throw new Error("Changed file list exceeded pagination safety limit");
        }
      }
      return files;
    },

    async getCheckSummary(sha) {
      const [checkRuns, combined] = await Promise.all([
        gh<{
          check_runs?: Array<{
            name?: string;
            status?: string;
            conclusion?: string | null;
          }>;
        }>(`/repos/${owner}/${repo}/commits/${sha}/check-runs?per_page=100`),
        gh<{
          statuses?: Array<{
            context?: string;
            state?: string;
          }>;
          state?: string;
        }>(`/repos/${owner}/${repo}/commits/${sha}/status`),
      ]);

      // Branch protection required contexts
      let requiredContexts: string[] = [];
      try {
        const protection = await gh<{
          required_status_checks?: { contexts?: string[]; checks?: Array<{ context?: string }> };
        }>(`/repos/${owner}/${repo}/branches/${DIVLAB_REPO.defaultBranch}/protection`);
        requiredContexts = [
          ...(protection.required_status_checks?.contexts ?? []),
          ...(protection.required_status_checks?.checks ?? [])
            .map((c) => c.context)
            .filter((c): c is string => typeof c === "string"),
        ];
      } catch {
        // If protection cannot be read (permissions), fail closed by requiring
        // every observed check + Vercel rather than bypassing.
        requiredContexts = [];
      }

      const runEntries = (checkRuns.check_runs ?? []).map((run) => ({
        name: run.name ?? "unknown",
        status: run.status ?? "queued",
        conclusion: run.conclusion ?? null,
      }));

      const statusEntries = (combined.statuses ?? []).map((status) => ({
        name: status.context ?? "unknown",
        status: status.state === "pending" ? "in_progress" : "completed",
        conclusion:
          status.state === "success"
            ? "success"
            : status.state === "pending"
              ? null
              : status.state === "error" || status.state === "failure"
                ? "failure"
                : status.state ?? null,
      }));

      const byName = new Map<string, { name: string; status: string; conclusion: string | null }>();
      for (const entry of [...runEntries, ...statusEntries]) {
        byName.set(entry.name, entry);
      }

      let requiredChecks = [...byName.values()].filter((entry) =>
        requiredContexts.includes(entry.name),
      );

      // If protection contexts are unknown, require all completed/in-progress checks
      // except obvious non-gating noise — still fail closed without Vercel.
      if (requiredChecks.length === 0 && requiredContexts.length === 0) {
        requiredChecks = [...byName.values()].filter(
          (entry) => !/codecov|sonar|mention|stale/i.test(entry.name),
        );
      }

      const vercelCheck =
        [...byName.values()].find((entry) => isVercelCheckName(entry.name)) ??
        undefined;

      return { requiredChecks, vercelCheck };
    },

    async markReady(number) {
      // Convert draft → ready via GraphQL (REST lacks a dedicated endpoint).
      const pull = await gh<{ node_id?: string }>(
        `/repos/${owner}/${repo}/pulls/${number}`,
      );
      if (!pull.node_id) {
        throw new Error("Unable to resolve PR node_id for mark-ready");
      }
      const response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github+json",
        },
        body: JSON.stringify({
          query:
            "mutation($id:ID!){ markPullRequestReadyForReview(input:{pullRequestId:$id}) { pullRequest { isDraft } } }",
          variables: { id: pull.node_id },
        }),
      });
      if (!response.ok) {
        throw new Error(
          `markReady failed: ${sanitizeErrorMessage(await response.text())}`,
        );
      }
      const body = (await response.json()) as {
        errors?: Array<{ message?: string }>;
      };
      if (body.errors?.length) {
        throw new Error(
          `markReady failed: ${sanitizeErrorMessage(body.errors[0]?.message)}`,
        );
      }
    },

    async squashMerge(number, sha) {
      await gh(`/repos/${owner}/${repo}/pulls/${number}/merge`, {
        method: "PUT",
        body: JSON.stringify({
          merge_method: "squash",
          sha,
        }),
      });
    },

    async deleteBranch(branch) {
      const encoded = branch
        .split("/")
        .map((part) => encodeURIComponent(part))
        .join("/");
      await gh(`/repos/${owner}/${repo}/git/refs/heads/${encoded}`, {
        method: "DELETE",
      });
    },

    async createComment(number, body) {
      await gh(`/repos/${owner}/${repo}/issues/${number}/comments`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
    },

    async addLabel(number, label) {
      await gh(`/repos/${owner}/${repo}/issues/${number}/labels`, {
        method: "POST",
        body: JSON.stringify({ labels: [label] }),
      });
    },

    async removeLabel(number, label) {
      try {
        await gh(
          `/repos/${owner}/${repo}/issues/${number}/labels/${encodeURIComponent(label)}`,
          { method: "DELETE" },
        );
      } catch {
        // Label already absent — idempotent
      }
    },
  };
}

function writeOutputs(outputs: ApproveOutputs): void {
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (!githubOutput) {
    return;
  }
  appendFileSync(
    githubOutput,
    [
      `outcome=${outputs.outcome}`,
      `apply_label=${outputs.apply_label}`,
      `remove_labels<<REMOVE_EOF`,
      outputs.remove_labels,
      `REMOVE_EOF`,
      `comment_body<<COMMENT_EOF`,
      outputs.comment_body,
      `COMMENT_EOF`,
      "",
    ].join("\n"),
    "utf8",
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function failHard(message: string): never {
  process.stderr.write(`${sanitizeErrorMessage(message)}\n`);
  process.exit(1);
}

main().catch((error) => {
  process.stderr.write(`${sanitizeErrorMessage(error)}\n`);
  process.exit(1);
});
