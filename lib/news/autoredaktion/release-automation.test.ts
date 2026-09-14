import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTOREDAKTION_PR_LABEL,
  AUTOREDAKTION_PR_MARKER,
  type ManagedPrSnapshot,
  validateManagedPublicationPr,
} from "./pr-policy";
import {
  canonicalGeneratedImagePath,
  normalizeAutonomousArticleSource,
} from "./source-normalizer";

const BAD_ARTICLE_SOURCE = `export const ARTICLE = {
  id: "borssverige-test",
  source: "DivLab",
  featured: true,
  imageUrl: null,
  thumbnailImageUrl: null,
  imageAlt: null,
  imageCaption: null,
};
`;

function managedPr(overrides: Partial<ManagedPrSnapshot> = {}): ManagedPrSnapshot {
  return {
    number: 999,
    state: "OPEN",
    isDraft: true,
    headRefName: "autoredaktion/borssverige-2026-09-14",
    baseRefName: "main",
    headRefOid: "abc123",
    body: `${AUTOREDAKTION_PR_MARKER}\nManaged publication`,
    labels: [{ name: AUTOREDAKTION_PR_LABEL }],
    files: [
      { path: "data/news-articles/borssverige-14-september-2026.ts" },
      { path: "lib/news/get-articles.ts" },
      { path: "public/news/generated/borssverige-2026-09-14.png" },
    ],
    commits: [
      { messageHeadline: "news: BörsSverige 14 september" },
      { messageHeadline: "chore: [autoredaktion-prepared] image" },
    ],
    ...overrides,
  };
}

describe("autonomous article source normalization", () => {
  it("repairs author and omits all image fields on renderer fallback", () => {
    const normalized = normalizeAutonomousArticleSource(BAD_ARTICLE_SOURCE, {
      series: "borssverige",
      imagePath: null,
    });
    assert.match(normalized, /source: "DivLab Redaktion"/);
    assert.doesNotMatch(normalized, /imageUrl:/);
    assert.doesNotMatch(normalized, /thumbnailImageUrl:/);
    assert.doesNotMatch(normalized, /imageAlt:/);
    assert.doesNotMatch(normalized, /imageCaption:/);
  });

  it("wires one canonical generated path to article, thumbnail and accessible alt text", () => {
    const path = canonicalGeneratedImagePath("borssverige", "2026-09-14");
    const normalized = normalizeAutonomousArticleSource(BAD_ARTICLE_SOURCE, {
      series: "borssverige",
      imagePath: path,
    });
    assert.equal((normalized.match(/imageUrl:/g) ?? []).length, 1);
    assert.equal((normalized.match(/thumbnailImageUrl:/g) ?? []).length, 1);
    assert.equal((normalized.match(/\/news\/generated\/borssverige-2026-09-14\.png/g) ?? []).length, 2);
    assert.match(normalized, /imageAlt: "BörsSverige 2026-09-14/);
  });

  it("preserves a meaningful editorial image alt when one is already supplied", () => {
    const source = BAD_ARTICLE_SOURCE.replace(
      "  imageAlt: null,",
      '  imageAlt: "Egen redaktionell alttext",',
    );
    const normalized = normalizeAutonomousArticleSource(source, {
      series: "borssverige",
      imagePath: canonicalGeneratedImagePath("borssverige", "2026-09-14"),
    });
    assert.equal((normalized.match(/imageAlt:/g) ?? []).length, 1);
    assert.match(normalized, /imageAlt: "Egen redaktionell alttext"/);
  });
});

describe("managed publication PR policy", () => {
  it("accepts only the canonical article + registry + optional image diff", () => {
    const result = validateManagedPublicationPr(managedPr());
    assert.equal(result.ok, true, result.issues.join(", "));
  });

  it("allows image-less fail-safe with only article and registry", () => {
    const result = validateManagedPublicationPr(
      managedPr({
        files: [
          { path: "data/news-articles/borssverige-14-september-2026.ts" },
          { path: "lib/news/get-articles.ts" },
        ],
      }),
    );
    assert.equal(result.ok, true, result.issues.join(", "));
  });

  it("rejects legacy or spoofed branch names", () => {
    const result = validateManagedPublicationPr(
      managedPr({ headRefName: "cursor/autoredaktion-borssverige-2026-09-14" }),
    );
    assert.equal(result.ok, false);
    assert.ok(result.issues.includes("branch-identity"));
  });

  it("rejects unrelated files even when label and marker are present", () => {
    const result = validateManagedPublicationPr(
      managedPr({ files: [...managedPr().files, { path: "app/layout.tsx" }] }),
    );
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.startsWith("unexpected-files:")));
  });

  it("rejects a second CI repair commit", () => {
    const result = validateManagedPublicationPr(
      managedPr({
        commits: [
          { messageHeadline: "news: initial" },
          { messageHeadline: "fix: [autoredaktion-ci-repair] first" },
          { messageHeadline: "fix: [autoredaktion-ci-repair] second" },
        ],
      }),
    );
    assert.equal(result.ok, false);
    assert.ok(result.issues.includes("repair-budget"));
  });
});
