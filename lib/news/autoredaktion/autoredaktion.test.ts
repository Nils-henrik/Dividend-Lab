import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BORSSVERIGE_8_SEPTEMBER_2026_ARTICLE } from "@/data/news-articles/borssverige-8-september-2026";
import { NORDEN_I_CENTRUM_8_SEPTEMBER_2026_ARTICLE } from "@/data/news-articles/norden-i-centrum-8-september-2026";
import { USA_BORSEN_NVIDIA_NASDAQ_AI_RALLY_27_AUGUSTI_2026_ARTICLE } from "@/data/news-articles/usa-borsen-nvidia-nasdaq-ai-rally-27-augusti-2026";
import { getNewsArticles, getNewsArticlesWithSlug } from "@/lib/news/get-articles";

import { validateNewsArticle } from "./article-validator";
import { runAutoredaktionDryRun } from "./dry-run";
import {
  DRY_RUN_NOW,
  brokenImageFixture,
  duplicateSlugFixture,
  missingSeoDescriptionFixture,
  usaDominatedBorssverigeFixture,
  validBorssverigeFixture,
  validNordenFixture,
} from "./fixtures";
import { defaultPublicDir, normalizeBrokenLocalImageToNull } from "./images";
import { planPublication } from "./publication";
import { findRegistryIdentityCollisions } from "./registry";
import { validateEditorialSeries } from "./series-validator";

const publicDir = defaultPublicDir();

function validateCandidate(
  article: ReturnType<typeof validBorssverigeFixture>,
  series: "borssverige" | "norden-i-centrum" = "borssverige",
) {
  const articleResult = validateNewsArticle(article, {
    now: DRY_RUN_NOW,
    registry: getNewsArticles(),
    publicDir,
  });
  const seriesResult = validateEditorialSeries(article, series);
  return { articleResult, seriesResult };
}

describe("autoredaktion article validator", () => {
  it("A: accepts a valid BörsSverige article with imageUrl null", () => {
    const { articleResult, seriesResult } = validateCandidate(
      validBorssverigeFixture(),
      "borssverige",
    );

    assert.equal(articleResult.ok, true, articleResult.issues.map((issue) => issue.message).join("; "));
    assert.equal(seriesResult.ok, true, seriesResult.issues.map((issue) => issue.message).join("; "));
    assert.equal(validBorssverigeFixture().imageUrl, null);
  });

  it("B: rejects a slug that already exists in the published registry", () => {
    const existing = getNewsArticlesWithSlug()[0];
    assert.ok(existing?.slug);

    const result = validateNewsArticle(duplicateSlugFixture(existing.slug), {
      now: DRY_RUN_NOW,
      registry: getNewsArticles(),
      publicDir,
    });

    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "duplicate-slug"));
  });

  it("D: rejects a missing authored SEO description", () => {
    const result = validateNewsArticle(missingSeoDescriptionFixture(), {
      now: DRY_RUN_NOW,
      registry: getNewsArticles(),
      publicDir,
    });

    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.path === "seoDescription"));
  });

  it("F: rejects a broken local image path and does not silently null it", () => {
    const article = brokenImageFixture();
    const result = validateNewsArticle(article, {
      now: DRY_RUN_NOW,
      registry: getNewsArticles(),
      publicDir,
    });

    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "broken-image"));
    assert.equal(article.imageUrl, "/news-demo/this-file-does-not-exist-autoredaktion.png");
  });

  it("allows an explicit pre-validation fallback from a broken local path to null", () => {
    const normalized = normalizeBrokenLocalImageToNull(brokenImageFixture(), publicDir);
    assert.equal(normalized.imageUrl, null);

    const result = validateNewsArticle(normalized, {
      now: DRY_RUN_NOW,
      registry: getNewsArticles(),
      publicDir,
    });
    assert.equal(result.ok, true, result.issues.map((issue) => issue.message).join("; "));
  });

  it("accepts an existing local public image path", () => {
    const article = {
      ...validBorssverigeFixture(),
      imageUrl: "/news-demo/borssverige-2026-09-01.png",
    };

    const result = validateNewsArticle(article, {
      now: DRY_RUN_NOW,
      registry: getNewsArticles(),
      publicDir,
    });

    assert.equal(result.ok, true, result.issues.map((issue) => issue.message).join("; "));
  });

  it("rejects an obvious placeholder title", () => {
    const result = validateNewsArticle(
      { ...validBorssverigeFixture(), title: "TODO: insert title" },
      { now: DRY_RUN_NOW, registry: getNewsArticles(), publicDir },
    );

    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "placeholder"));
  });

  it("rejects a url that does not match /news/${slug}", () => {
    const result = validateNewsArticle(
      { ...validBorssverigeFixture(), url: "/news/wrong-slug" },
      { now: DRY_RUN_NOW, registry: getNewsArticles(), publicDir },
    );

    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.code === "url-mismatch"));
  });
});

describe("autoredaktion series validator", () => {
  it("E: rejects BörsSverige copy dominated by USA / Wall Street / Nasdaq / Asia", () => {
    const result = validateEditorialSeries(
      usaDominatedBorssverigeFixture(),
      "borssverige",
    );

    assert.equal(result.ok, false);
    assert.ok(
      result.issues.some(
        (issue) => issue.code === "usa-dominated" || issue.code === "sweden-focus",
      ),
    );
  });

  it("accepts published BörsSverige and Norden editions as on-mandate", () => {
    assert.equal(
      validateEditorialSeries(BORSSVERIGE_8_SEPTEMBER_2026_ARTICLE, "borssverige").ok,
      true,
    );
    assert.equal(
      validateEditorialSeries(
        NORDEN_I_CENTRUM_8_SEPTEMBER_2026_ARTICLE,
        "norden-i-centrum",
      ).ok,
      true,
    );
  });

  it("rejects a generic USA-market article as both BörsSverige and Norden i centrum", () => {
    assert.equal(
      validateEditorialSeries(
        USA_BORSEN_NVIDIA_NASDAQ_AI_RALLY_27_AUGUSTI_2026_ARTICLE,
        "borssverige",
      ).ok,
      false,
    );
    assert.equal(
      validateEditorialSeries(
        USA_BORSEN_NVIDIA_NASDAQ_AI_RALLY_27_AUGUSTI_2026_ARTICLE,
        "norden-i-centrum",
      ).ok,
      false,
    );
  });

  it("accepts a Nordic-led Norden fixture without requiring equal country distribution", () => {
    const result = validateEditorialSeries(validNordenFixture(), "norden-i-centrum");
    assert.equal(result.ok, true, result.issues.map((issue) => issue.message).join("; "));
  });
});

describe("autoredaktion publication planner", () => {
  const registrySource = `import { EXISTING_ARTICLE } from "@/data/news-articles/existing";
import { applyNewsSearchSeo } from "@/lib/seo/editorial-content";
import type { NewsArticle } from "@/types/news";

const PUBLISHED_NEWS_ARTICLES: NewsArticle[] = [
  applyNewsSearchSeo(EXISTING_ARTICLE),
];
`;

  it("G: same series/date does not create a second file, import or registry row", () => {
    const first = planPublication({
      series: "borssverige",
      date: DRY_RUN_NOW,
      article: validBorssverigeFixture(),
      registrySource,
      existingFiles: [],
    });

    assert.equal(first.status, "create");
    if (first.status !== "create") {
      return;
    }

    const second = planPublication({
      series: "borssverige",
      date: DRY_RUN_NOW,
      article: validBorssverigeFixture(),
      registrySource: first.nextRegistrySource,
      existingFiles: [first.plan.filePath],
    });

    assert.equal(second.status, "already-published");
    assert.equal(
      second.nextRegistrySource.split(first.plan.importLine).length - 1,
      1,
    );
    assert.equal(
      second.nextRegistrySource.split(first.plan.registryLine).length - 1,
      1,
    );
  });

  it("H: Norden then BörsSverige keeps both registry entries when refreshed from latest main", () => {
    const norden = planPublication({
      series: "norden-i-centrum",
      date: new Date("2026-09-11T08:00:00+02:00"),
      article: validNordenFixture(),
      registrySource,
      existingFiles: [],
      startedFromMainSha: "a",
      latestMainSha: "a",
    });
    assert.equal(norden.status, "create");
    if (norden.status !== "create") {
      return;
    }

    const stale = planPublication({
      series: "borssverige",
      date: DRY_RUN_NOW,
      article: validBorssverigeFixture(),
      registrySource,
      existingFiles: [norden.plan.filePath],
      startedFromMainSha: "a",
      latestMainSha: "b",
      refreshedFromLatestMain: false,
    });
    assert.equal(stale.status, "reject");

    const borssverige = planPublication({
      series: "borssverige",
      date: DRY_RUN_NOW,
      article: validBorssverigeFixture(),
      registrySource: norden.nextRegistrySource,
      existingFiles: [norden.plan.filePath],
      startedFromMainSha: "a",
      latestMainSha: "b",
      refreshedFromLatestMain: true,
    });

    assert.equal(borssverige.status, "create");
    if (borssverige.status !== "create") {
      return;
    }

    assert.match(borssverige.nextRegistrySource, /NORDEN_I_CENTRUM_11_SEPTEMBER_2026_ARTICLE/);
    assert.match(borssverige.nextRegistrySource, /BORSSVERIGE_11_SEPTEMBER_2026_ARTICLE/);
  });
});

describe("autoredaktion dry-run harness", () => {
  it("covers A–H with the expected fail-closed outcomes", () => {
    const report = runAutoredaktionDryRun();
    const failed = report.cases.filter((result) => !result.ok);

    assert.equal(
      report.ok,
      true,
      failed
        .map((result) => `${result.id} ${result.name}: ${result.actual}`)
        .join("\n"),
    );
    assert.deepEqual(
      report.cases.map((result) => result.id),
      ["A", "B", "C", "D", "E", "F", "G", "H"],
    );
  });
});

describe("published news registry identities", () => {
  it("has unique ids and slugs", () => {
    const issues = findRegistryIdentityCollisions(getNewsArticles());
    assert.deepEqual(issues, []);
  });
});
