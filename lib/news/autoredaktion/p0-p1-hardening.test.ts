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

function p0Source(overrides: { cutoff?: string; pass?: boolean; sources?: boolean } = {}) {
  const cutoff = overrides.cutoff ?? "2026-09-17T08:10:00+02:00";
  return `/**
 * Editorial research cutoff: ${cutoff}
${overrides.pass === false ? "" : " * P0_FACT_GATE=PASS\n"}${
    overrides.sources === false
      ? ""
      : ` * P0_SOURCE[primary]: ${PRIMARY}\n * P0_SOURCE[secondary]: ${SECONDARY}\n`
  } */`;
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
