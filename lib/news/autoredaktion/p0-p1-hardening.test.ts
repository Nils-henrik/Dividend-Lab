import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { NewsArticle } from "@/types/news";

import {
  type ManagedBranchCommit,
  validateManagedBranchHistory,
} from "./branch-history-policy";
import { validateP0FactGate } from "./fact-gate";
import { managedPublicationPaths } from "./path-contract";
import { classifyPreflightMode } from "./preflight-state";
import {
  AUTOREDAKTION_PR_LABEL,
  AUTOREDAKTION_PR_MARKER,
  type ManagedPrSnapshot,
  validateManagedPublicationPr,
} from "./pr-policy";

const PRIMARY = "https://example.com/issuer/press-release";
const SECONDARY = "https://example.org/market/context";

function p0Article(overrides: Partial<NewsArticle> = {}): NewsArticle {
  return {
    id: "norden-i-centrum-17-september-2026",
    slug: "norden-i-centrum-17-september-2026",
    title: "Norden i centrum 17 september",
    summary: "Verifierad nordisk morgonöversikt.",
    category: "market",
    source: "DivLab Redaktion",
    publishedAt: "2026-09-17T08:20:00+02:00",
    url: "/news/norden-i-centrum-17-september-2026",
    featured: true,
    intro: ["Verifierad ingress."],
    sections: [{ heading: "Verifierat", paragraphs: ["Verifierad text."] }],
    sources: [
      { text: "Primärkälla", href: PRIMARY },
      { text: "Sekundärkälla", href: SECONDARY },
    ],
    ...overrides,
  };
}

function editorialComment(lines: readonly string[]): string {
  return `/**\n${lines.map((line) => ` * ${line}`).join("\n")}\n */`;
}

function articleModule(input: {
  comment?: string;
  beforeComment?: string;
  betweenCommentAndArticle?: string;
  extraArticleProperties?: string;
  afterArticle?: string;
}): string {
  return `import type { NewsArticle } from "@/types/news";
${input.beforeComment ?? ""}
${input.comment ?? ""}
${input.betweenCommentAndArticle ?? ""}
export const ARTICLE: NewsArticle = {
  id: "managed-article",
  title: "Managed article",
  publishedAt: "2026-09-17T08:20:00+02:00",
${input.extraArticleProperties ?? ""}
};
${input.afterArticle ?? ""}`;
}

function p0Comment(
  overrides: { cutoff?: string; pass?: boolean; sources?: boolean } = {},
): string {
  const cutoff = overrides.cutoff ?? "2026-09-17T08:10:00+02:00";
  return editorialComment([
    `Editorial research cutoff: ${cutoff}`,
    ...(overrides.pass === false ? [] : ["P0_FACT_GATE=PASS"]),
    ...(overrides.sources === false
      ? []
      : [
          `P0_SOURCE[primary]: ${PRIMARY}`,
          `P0_SOURCE[secondary]: ${SECONDARY}`,
        ]),
  ]);
}

function p0Source(
  overrides: { cutoff?: string; pass?: boolean; sources?: boolean } = {},
): string {
  return articleModule({ comment: p0Comment(overrides) });
}

function managedPr(articlePath: string): ManagedPrSnapshot {
  return {
    number: 123,
    state: "OPEN",
    isDraft: true,
    headRefName: "autoredaktion/bolaget-i-fokus-2026-09-17",
    baseRefName: "main",
    headRefOid: "head",
    body: AUTOREDAKTION_PR_MARKER,
    labels: [{ name: AUTOREDAKTION_PR_LABEL }],
    files: [
      { path: articlePath },
      { path: "lib/news/get-articles.ts" },
    ],
    commits: [{ messageHeadline: "Autoredaktion: Bolaget i fokus" }],
  };
}

const BASE = "base";
const INITIAL: ManagedBranchCommit = {
  sha: "initial",
  parentShas: [BASE],
  message: "Autoredaktion: Bolaget i fokus 17 september 2026",
  changedFiles: [
    "data/news-articles/bolaget-i-fokus-17-september-2026.ts",
    "lib/news/get-articles.ts",
  ],
};
const PREPARATION: ManagedBranchCommit = {
  sha: "prepared",
  parentShas: [INITIAL.sha],
  message: "chore(autoredaktion): [autoredaktion-prepared] normalize article and render cover",
  changedFiles: [
    "data/news-articles/bolaget-i-fokus-17-september-2026.ts",
    "public/news/generated/bolaget-i-fokus-2026-09-17.png",
  ],
};
const REPAIR: ManagedBranchCommit = {
  sha: "repair",
  parentShas: [PREPARATION.sha],
  message: "fix(autoredaktion): [autoredaktion-ci-repair] deterministic publication repair",
  changedFiles: [
    "data/news-articles/bolaget-i-fokus-17-september-2026.ts",
  ],
};

describe("Autoredaktion P0/P1 regression A-J", () => {
  it("A: accepts a correct Norden P0 contract and canonical two-file candidate", () => {
    const factGate = validateP0FactGate({
      article: p0Article(),
      sourceText: p0Source(),
      handoffAt: new Date("2026-09-17T08:15:00+02:00"),
    });
    const paths = managedPublicationPaths("norden-i-centrum", "2026-09-17");

    assert.equal(factGate.ok, true, factGate.issues.map((issue) => issue.code).join(", "));
    assert.equal(
      paths.articlePath,
      "data/news-articles/norden-i-centrum-17-september-2026.ts",
    );
    assert.equal(paths.registryPath, "lib/news/get-articles.ts");
  });

  it("B: rejects a cutoff after the initial canonical handoff commit", () => {
    const result = validateP0FactGate({
      article: p0Article(),
      sourceText: p0Source({ cutoff: "2026-09-17T08:18:00+02:00" }),
      handoffAt: new Date("2026-09-17T08:15:00+02:00"),
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-cutoff-after-handoff"));
  });

  it("C: rejects a missing literal P0 PASS attestation", () => {
    const result = validateP0FactGate({
      article: p0Article(),
      sourceText: p0Source({ pass: false }),
      handoffAt: new Date("2026-09-17T08:15:00+02:00"),
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-pass"));
  });

  it("D: rejects missing mandatory article source evidence", () => {
    const result = validateP0FactGate({
      article: p0Article({ sources: [] }),
      sourceText: p0Source(),
      handoffAt: new Date("2026-09-17T08:15:00+02:00"),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-article-sources-missing"),
    );
  });

  it("E: rejects the old company-qualified Bolaget filename at the shared PR gate", () => {
    const result = validateManagedPublicationPr(
      managedPr(
        "data/news-articles/bolaget-i-fokus-svolder-17-september-2026.ts",
      ),
    );
    assert.equal(result.ok, false);
    assert.ok(result.issues.includes("article-file"));
  });

  it("F: accepts the canonical Bolaget filename", () => {
    const result = validateManagedPublicationPr(
      managedPr("data/news-articles/bolaget-i-fokus-17-september-2026.ts"),
    );
    assert.equal(result.ok, true, result.issues.join(", "));
  });

  it("G: classifies an empty branch-create event as neutral", () => {
    assert.equal(
      classifyPreflightMode({ changedFiles: [], hasOpenManagedPr: false }),
      "empty",
    );
  });

  it("H: rejects an unauthorized extra mutation after handoff", () => {
    const manual: ManagedBranchCommit = {
      sha: "manual",
      parentShas: [PREPARATION.sha],
      message: "manual article adjustment",
      changedFiles: [
        "data/news-articles/bolaget-i-fokus-17-september-2026.ts",
      ],
    };
    const result = validateManagedBranchHistory({
      branchName: "autoredaktion/bolaget-i-fokus-2026-09-17",
      baseSha: BASE,
      headSha: manual.sha,
      commits: [INITIAL, PREPARATION, manual],
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.startsWith("unauthorized-mutation:")));
  });

  it("I: permits the single deterministic preparation mutation", () => {
    const result = validateManagedBranchHistory({
      branchName: "autoredaktion/bolaget-i-fokus-2026-09-17",
      baseSha: BASE,
      headSha: PREPARATION.sha,
      commits: [INITIAL, PREPARATION],
    });
    assert.equal(result.ok, true, result.issues.join(", "));
  });

  it("J: permits exactly one bounded repair after preparation", () => {
    const result = validateManagedBranchHistory({
      branchName: "autoredaktion/bolaget-i-fokus-2026-09-17",
      baseSha: BASE,
      headSha: REPAIR.sha,
      commits: [INITIAL, PREPARATION, REPAIR],
    });
    assert.equal(result.ok, true, result.issues.join(", "));
  });
});

describe("P0 fact-gate adversarial contract", () => {
  function validate(input: {
    sourceText?: string;
    cutoff?: string;
    publishedAt?: string;
    handoffAt?: string;
    sources?: NewsArticle["sources"];
  } = {}) {
    return validateP0FactGate({
      article: p0Article({
        publishedAt: input.publishedAt ?? "2026-09-17T08:20:00+02:00",
        ...(input.sources ? { sources: input.sources } : {}),
      }),
      sourceText:
        input.sourceText ?? p0Source({ cutoff: input.cutoff }),
      handoffAt: new Date(
        input.handoffAt ?? "2026-09-17T08:15:00+02:00",
      ),
    });
  }

  function sourceWithLines(lines: readonly string[]): string {
    return articleModule({ comment: editorialComment(lines) });
  }

  const validLines = [
    "Editorial research cutoff: 2026-09-17T08:10:00+02:00",
    "P0_FACT_GATE=PASS",
    `P0_SOURCE[primary]: ${PRIMARY}`,
    `P0_SOURCE[secondary]: ${SECONDARY}`,
  ] as const;

  for (const [name, cutoff] of [
    ["rejects 30 February", "2026-02-30T08:00:00+01:00"],
    ["rejects 29 February in a non-leap year", "2026-02-29T08:00:00+01:00"],
    ["rejects month 13", "2026-13-01T08:00:00+01:00"],
    ["rejects 31 April", "2026-04-31T08:00:00+02:00"],
    ["rejects hour 24", "2026-09-16T24:01:00+02:00"],
    ["rejects minute 60", "2026-09-16T08:60:00+02:00"],
    ["rejects second 60", "2026-09-16T08:00:60+02:00"],
    ["rejects an ISO offset beyond 14 hours", "2026-09-16T08:00:00+15:00"],
    ["rejects a non-zero minute at offset 14", "2026-09-16T08:00:00+14:01"],
    ["rejects a cutoff without seconds", "2026-09-16T08:00+02:00"],
    ["rejects a cutoff without an explicit offset", "2026-09-16T08:00:00"],
    ["rejects an offset without its colon", "2026-09-16T08:00:00+0200"],
    ["rejects 29 February in Gregorian year 2100", "2100-02-29T08:00:00+01:00"],
  ] as const) {
    it(name, () => {
      const result = validate({ cutoff });
      assert.equal(result.ok, false);
      assert.ok(result.issues.some((issue) => issue.code === "p0-cutoff-invalid"));
    });
  }

  it("accepts 29 February in a leap year", () => {
    const result = validate({
      cutoff: "2028-02-29T08:00:00+01:00",
      publishedAt: "2028-02-29T08:20:00+01:00",
      handoffAt: "2028-02-29T08:15:00+01:00",
    });
    assert.equal(result.ok, true, result.issues.map((issue) => issue.code).join(", "));
  });

  it("rejects declarations that exist only in a template string", () => {
    const sourceText = articleModule({
      beforeComment: `const metadata = \`\n${validLines.join("\n")}\n\`;`,
    });
    const result = validate({ sourceText });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some(
        (issue) => issue.code === "p0-reserved-outside-comment",
      ),
    );
  });

  it("rejects declarations that exist only in line comments", () => {
    const sourceText = articleModule({
      beforeComment: validLines.map((line) => `// ${line}`).join("\n"),
    });
    const result = validate({ sourceText });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-editorial-comment"),
    );
  });

  it("accepts declarations in the canonical editorial block comment", () => {
    const result = validate();
    assert.equal(result.ok, true, result.issues.map((issue) => issue.code).join(", "));
  });

  it("rejects conflicting PASS and FAIL declarations", () => {
    const result = validate({
      sourceText: sourceWithLines([
        ...validLines,
        "P0_FACT_GATE=FAIL",
      ]),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-declaration-invalid"),
    );
  });

  it("rejects a malformed P0 source beside a valid primary source", () => {
    const result = validate({
      sourceText: sourceWithLines([
        validLines[0],
        validLines[1],
        validLines[2],
        "P0_SOURCE[secondary] https://example.org/malformed",
      ]),
      sources: [{ text: "Primärkälla", href: PRIMARY }],
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-declaration-invalid"),
    );
  });

  it("rejects an HTTP P0 source even beside a valid HTTPS primary source", () => {
    const httpSource = "http://example.org/insecure";
    const result = validate({
      sourceText: sourceWithLines([
        validLines[0],
        validLines[1],
        validLines[2],
        `P0_SOURCE[secondary]: ${httpSource}`,
      ]),
      sources: [
        { text: "Primärkälla", href: PRIMARY },
        { text: "Osäker källa", href: httpSource },
      ],
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-source-url"));
  });

  it("rejects credential-bearing source URLs", () => {
    const credentialSource = "https://user:secret@example.org/source";
    const result = validate({
      sourceText: sourceWithLines([
        validLines[0],
        validLines[1],
        `P0_SOURCE[primary]: ${credentialSource}`,
      ]),
      sources: [{ text: "Credential source", href: credentialSource }],
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-source-url"));
  });

  it("rejects an unknown declaration in the reserved P0 namespace", () => {
    const result = validate({
      sourceText: sourceWithLines([...validLines, "P0_EVIDENCE=PASS"]),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-declaration-invalid"),
    );
  });

  it("rejects an incomplete reserved P0 prefix instead of ignoring it", () => {
    const result = validate({
      sourceText: sourceWithLines([...validLines, "P0_"]),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-declaration-invalid"),
    );
  });

  it("rejects a case-mutated reserved declaration instead of ignoring it", () => {
    const result = validate({
      sourceText: sourceWithLines([...validLines, "p0_fact_gate=fail"]),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-declaration-invalid"),
    );
  });

  it("classifies reserved declarations separated by Unicode line breaks", () => {
    const comment = `/*${[...validLines, "P0_UNKNOWN=PASS"].join("\u2028")}*/`;
    const result = validate({ sourceText: articleModule({ comment }) });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-declaration-invalid"),
    );
  });

  it("rejects a reserved declaration in ordinary article text", () => {
    const result = validate({
      sourceText: articleModule({
        comment: p0Comment(),
        extraArticleProperties: '  summary: "P0_FACT_GATE=PASS",',
      }),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some(
        (issue) => issue.code === "p0-reserved-outside-comment",
      ),
    );
  });

  it("does not reserve ordinary prose that merely contains P0", () => {
    const result = validate({
      sourceText: articleModule({
        comment: p0Comment(),
        extraArticleProperties: '  summary: "P0 is the highest priority",',
      }),
    });
    assert.equal(result.ok, true, result.issues.map((issue) => issue.code).join(", "));
  });

  it("rejects declarations in a block comment not attached to the article", () => {
    const result = validate({
      sourceText: articleModule({
        comment: p0Comment(),
        betweenCommentAndArticle: "const unrelated = true;",
      }),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-editorial-comment"),
    );
  });

  it("rejects multiple exported article objects in one declaration statement", () => {
    const sourceText = `${p0Comment()}
export const ARTICLE = {
  id: "article",
  title: "Article",
  publishedAt: "2026-09-17T08:20:00+02:00",
}, DECOY = {
  id: "decoy",
  title: "Decoy",
  publishedAt: "2026-09-17T08:20:00+02:00",
};`;
    const result = validate({ sourceText });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-article-declaration"),
    );
  });

  it("rejects reserved declarations in a second block comment", () => {
    const result = validate({
      sourceText: articleModule({
        beforeComment: "/** P0_EVIDENCE=PASS */",
        comment: p0Comment(),
      }),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some(
        (issue) => issue.code === "p0-reserved-outside-comment",
      ),
    );
  });

  it("allows additional block comments when they do not use the reserved namespace", () => {
    const result = validate({
      sourceText: articleModule({
        beforeComment: "/** Ordinary editorial context where P0 is discussed. */",
        comment: p0Comment(),
      }),
    });
    assert.equal(result.ok, true, result.issues.map((issue) => issue.code).join(", "));
  });

  it("rejects a duplicated cutoff", () => {
    const result = validate({
      sourceText: sourceWithLines([
        ...validLines,
        "Editorial research cutoff: 2026-09-17T08:11:00+02:00",
      ]),
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-cutoff-count"));
  });

  it("rejects a missing cutoff", () => {
    const result = validate({
      sourceText: sourceWithLines(validLines.slice(1)),
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-cutoff-count"));
  });

  it("rejects a missing literal PASS", () => {
    const result = validate({
      sourceText: sourceWithLines([
        validLines[0],
        validLines[2],
        validLines[3],
      ]),
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-pass"));
  });

  it("rejects whitespace that changes the literal PASS declaration", () => {
    const result = validate({
      sourceText: sourceWithLines([
        validLines[0],
        "P0_FACT_GATE = PASS",
        validLines[2],
        validLines[3],
      ]),
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some((issue) => issue.code === "p0-declaration-invalid"),
    );
  });

  it("rejects duplicate PASS declarations", () => {
    const result = validate({
      sourceText: sourceWithLines([...validLines, "P0_FACT_GATE=PASS"]),
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-pass"));
  });

  it("accepts a normal Europe/Stockholm winter cutoff", () => {
    const result = validate({
      cutoff: "2026-01-15T08:00:00+01:00",
      publishedAt: "2026-01-15T08:20:00+01:00",
      handoffAt: "2026-01-15T08:15:00+01:00",
    });
    assert.equal(result.ok, true, result.issues.map((issue) => issue.code).join(", "));
  });

  it("accepts a normal Europe/Stockholm summer cutoff", () => {
    const result = validate({
      cutoff: "2026-07-15T08:00:00+02:00",
      publishedAt: "2026-07-15T08:20:00+02:00",
      handoffAt: "2026-07-15T08:15:00+02:00",
    });
    assert.equal(result.ok, true, result.issues.map((issue) => issue.code).join(", "));
  });

  it("keeps the spring DST transition ordered by absolute time", () => {
    const beforeTransition = validate({
      cutoff: "2026-03-29T01:55:00+01:00",
      publishedAt: "2026-03-29T03:20:00+02:00",
      handoffAt: "2026-03-29T03:10:00+02:00",
    });
    const afterTransition = validate({
      cutoff: "2026-03-29T03:05:00+02:00",
      publishedAt: "2026-03-29T03:20:00+02:00",
      handoffAt: "2026-03-29T03:10:00+02:00",
    });
    assert.equal(
      beforeTransition.ok,
      true,
      beforeTransition.issues.map((issue) => issue.code).join(", "),
    );
    assert.equal(
      afterTransition.ok,
      true,
      afterTransition.issues.map((issue) => issue.code).join(", "),
    );
  });

  it("accepts both explicit offsets for the repeated autumn 02 hour", () => {
    for (const cutoff of [
      "2026-10-25T02:10:00+02:00",
      "2026-10-25T02:10:00+01:00",
    ]) {
      const result = validate({
        cutoff,
        publishedAt: "2026-10-25T02:40:00+01:00",
        handoffAt: "2026-10-25T02:30:00+01:00",
      });
      assert.equal(
        result.ok,
        true,
        `${cutoff}: ${result.issues.map((issue) => issue.code).join(", ")}`,
      );
    }
  });

  it("accepts an equivalent UTC cutoff while enforcing the Stockholm date", () => {
    const result = validate({
      cutoff: "2026-07-15T06:00:00Z",
      publishedAt: "2026-07-15T08:20:00+02:00",
      handoffAt: "2026-07-15T08:15:00+02:00",
    });
    assert.equal(result.ok, true, result.issues.map((issue) => issue.code).join(", "));
  });

  it("rejects a valid instant that resolves to a different Stockholm date", () => {
    const result = validate({
      cutoff: "2026-09-16T23:30:00-02:00",
      publishedAt: "2026-09-16T08:20:00+02:00",
      handoffAt: "2026-09-17T04:00:00+02:00",
    });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "p0-cutoff-date"));
  });
});
