import { getNewsArticles } from "@/lib/news/get-articles";
import type { NewsArticle } from "@/types/news";

import { validateNewsArticle } from "./article-validator";
import {
  DRY_RUN_NOW,
  INVALID_TYPESCRIPT_SNIPPET,
  brokenImageFixture,
  duplicateSlugFixture,
  missingSeoDescriptionFixture,
  usaDominatedBorssverigeFixture,
  validBorssverigeFixture,
  validNordenFixture,
} from "./fixtures";
import { defaultPublicDir } from "./images";
import {
  applyRegistryEntryFromLatestMain,
  countRegistryEntries,
  planPublication,
} from "./publication";
import { validateEditorialSeries } from "./series-validator";
import { typecheckIsolatedSnippet } from "./typecheck-gate";

export const DRY_RUN_CASES = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

export type DryRunCaseId = (typeof DRY_RUN_CASES)[number];

export type DryRunCaseResult = {
  id: DryRunCaseId;
  name: string;
  expected: "pass" | "fail" | "blocked" | "no-duplicate" | "both-preserved";
  actual: string;
  ok: boolean;
  detail: string;
};

export type DryRunReport = {
  now: string;
  ok: boolean;
  cases: DryRunCaseResult[];
};

const MINIMAL_REGISTRY_SOURCE = `import { EXISTING_ARTICLE } from "@/data/news-articles/existing";
import { applyNewsSearchSeo } from "@/lib/seo/editorial-content";
import type { NewsArticle } from "@/types/news";

const PUBLISHED_NEWS_ARTICLES: NewsArticle[] = [
  applyNewsSearchSeo(EXISTING_ARTICLE),
];
`;

function articleGateDetail(ok: boolean, codes: string[]): string {
  return ok ? "PASS" : `FAIL (${codes.join(", ") || "unknown"})`;
}

function codesFrom(article: NewsArticle, series: "borssverige" | "norden-i-centrum") {
  const articleResult = validateNewsArticle(article, {
    now: DRY_RUN_NOW,
    registry: getNewsArticles(),
    publicDir: defaultPublicDir(),
  });
  const seriesResult = validateEditorialSeries(article, series);
  return {
    ok: articleResult.ok && seriesResult.ok,
    codes: [...articleResult.issues, ...seriesResult.issues].map(
      (issue) => issue.code,
    ),
  };
}

function caseA(): DryRunCaseResult {
  const article = validBorssverigeFixture();
  const result = codesFrom(article, "borssverige");
  return {
    id: "A",
    name: "valid BörsSverige",
    expected: "pass",
    actual: articleGateDetail(result.ok, result.codes),
    ok: result.ok,
    detail: "imageUrl null is accepted; authored SEO and Sweden focus hold.",
  };
}

function caseB(): DryRunCaseResult {
  const existing = getNewsArticles().find((article) => article.slug);
  if (!existing?.slug) {
    return {
      id: "B",
      name: "duplicate slug",
      expected: "fail",
      actual: "FAIL (no-registry-slug)",
      ok: false,
      detail: "Published registry unexpectedly had no slugs to collide with.",
    };
  }

  const article = duplicateSlugFixture(existing.slug);
  const result = validateNewsArticle(article, {
    now: DRY_RUN_NOW,
    registry: getNewsArticles(),
    publicDir: defaultPublicDir(),
  });
  const failedOnDuplicate = result.issues.some(
    (issue) => issue.code === "duplicate-slug",
  );

  return {
    id: "B",
    name: "duplicate slug",
    expected: "fail",
    actual: articleGateDetail(result.ok, result.issues.map((issue) => issue.code)),
    ok: !result.ok && failedOnDuplicate,
    detail: `Collided with published slug "${existing.slug}".`,
  };
}

function caseC(): DryRunCaseResult {
  const typecheck = typecheckIsolatedSnippet(INVALID_TYPESCRIPT_SNIPPET);
  return {
    id: "C",
    name: "invalid TypeScript",
    expected: "blocked",
    actual: typecheck.passed
      ? "TYPECHECK PASSED (unexpected)"
      : "blocked by typecheck",
    ok: !typecheck.passed,
    detail: typecheck.diagnostics[0] ?? "isolated typecheck rejected the snippet",
  };
}

function caseD(): DryRunCaseResult {
  const article = missingSeoDescriptionFixture();
  const result = validateNewsArticle(article, {
    now: DRY_RUN_NOW,
    registry: getNewsArticles(),
    publicDir: defaultPublicDir(),
  });
  const missingSeo = result.issues.some((issue) => issue.path === "seoDescription");

  return {
    id: "D",
    name: "missing SEO description",
    expected: "fail",
    actual: articleGateDetail(result.ok, result.issues.map((issue) => issue.code)),
    ok: !result.ok && missingSeo,
    detail: "Authored seoDescription is required; applyNewsSearchSeo fallback is not enough.",
  };
}

function caseE(): DryRunCaseResult {
  const article = usaDominatedBorssverigeFixture();
  const articleResult = validateNewsArticle(article, {
    now: DRY_RUN_NOW,
    registry: getNewsArticles(),
    publicDir: defaultPublicDir(),
  });
  const seriesResult = validateEditorialSeries(article, "borssverige");
  const usaDominated = seriesResult.issues.some(
    (issue) => issue.code === "usa-dominated" || issue.code === "sweden-focus",
  );

  return {
    id: "E",
    name: "BörsSverige dominated by USA",
    expected: "fail",
    actual: articleGateDetail(
      articleResult.ok && seriesResult.ok,
      [...articleResult.issues, ...seriesResult.issues].map((issue) => issue.code),
    ),
    ok: !seriesResult.ok && usaDominated,
    detail: "Lexical Sweden-only gate rejected Wall Street / Nasdaq / Asia-led copy.",
  };
}

function caseF(): DryRunCaseResult {
  const article = brokenImageFixture();
  const result = validateNewsArticle(article, {
    now: DRY_RUN_NOW,
    registry: getNewsArticles(),
    publicDir: defaultPublicDir(),
  });
  const broken = result.issues.some((issue) => issue.code === "broken-image");

  return {
    id: "F",
    name: "broken image path",
    expected: "fail",
    actual: articleGateDetail(result.ok, result.issues.map((issue) => issue.code)),
    ok: !result.ok && broken,
    detail: "Validator fail-closes on a missing local public asset. It does not null the path.",
  };
}

function caseG(): DryRunCaseResult {
  const first = planPublication({
    series: "borssverige",
    date: DRY_RUN_NOW,
    article: validBorssverigeFixture(),
    registrySource: MINIMAL_REGISTRY_SOURCE,
    existingFiles: [],
  });

  if (first.status !== "create") {
    return {
      id: "G",
      name: "same day/series twice",
      expected: "no-duplicate",
      actual: first.status,
      ok: false,
      detail: "First publication did not plan a create.",
    };
  }

  const second = planPublication({
    series: "borssverige",
    date: DRY_RUN_NOW,
    article: validBorssverigeFixture(),
    registrySource: first.nextRegistrySource,
    existingFiles: [first.plan.filePath],
  });

  if (second.status === "reject") {
    return {
      id: "G",
      name: "same day/series twice",
      expected: "no-duplicate",
      actual: "reject",
      ok: false,
      detail: second.issues.map((issue) => issue.code).join(", "),
    };
  }

  const exportCount = countRegistryEntries(second.nextRegistrySource, [
    first.plan.exportName,
  ]);

  const ok =
    second.status === "already-published" &&
    exportCount === 1 &&
    second.nextRegistrySource.split(first.plan.importLine).length === 2;

  return {
    id: "G",
    name: "same day/series twice",
    expected: "no-duplicate",
    actual: ok ? "no duplicate" : `${second.status} (${exportCount} registry rows)`,
    ok,
    detail: "Second run reused the same module/export instead of adding another row.",
  };
}

function caseH(): DryRunCaseResult {
  const nordenDate = new Date("2026-09-11T08:00:00+02:00");
  const borssverigeDate = new Date("2026-09-11T08:20:00+02:00");

  const norden = planPublication({
    series: "norden-i-centrum",
    date: nordenDate,
    article: validNordenFixture(),
    registrySource: MINIMAL_REGISTRY_SOURCE,
    existingFiles: [],
    startedFromMainSha: "sha-main-1",
    latestMainSha: "sha-main-1",
  });

  if (norden.status !== "create") {
    return {
      id: "H",
      name: "Norden first then BörsSverige",
      expected: "both-preserved",
      actual: norden.status,
      ok: false,
      detail: "Norden publication did not plan a create.",
    };
  }

  const staleAttempt = planPublication({
    series: "borssverige",
    date: borssverigeDate,
    article: validBorssverigeFixture(),
    registrySource: MINIMAL_REGISTRY_SOURCE,
    existingFiles: [norden.plan.filePath],
    startedFromMainSha: "sha-main-1",
    latestMainSha: "sha-main-2",
    refreshedFromLatestMain: false,
  });

  const refreshedSource = applyRegistryEntryFromLatestMain(
    norden.nextRegistrySource,
    norden.plan,
  );

  const borssverige = planPublication({
    series: "borssverige",
    date: borssverigeDate,
    article: validBorssverigeFixture(),
    registrySource: refreshedSource,
    existingFiles: [norden.plan.filePath],
    startedFromMainSha: "sha-main-1",
    latestMainSha: "sha-main-2",
    refreshedFromLatestMain: true,
  });

  if (borssverige.status === "reject") {
    return {
      id: "H",
      name: "Norden first then BörsSverige",
      expected: "both-preserved",
      actual: "reject",
      ok: false,
      detail: borssverige.issues.map((issue) => issue.code).join(", "),
    };
  }

  const bothPreserved =
    countRegistryEntries(borssverige.nextRegistrySource, [
      norden.plan.exportName,
      borssverige.plan.exportName,
    ]) === 2;

  const staleBlocked = staleAttempt.status === "reject";

  return {
    id: "H",
    name: "Norden first then BörsSverige",
    expected: "both-preserved",
    actual: bothPreserved && staleBlocked ? "both preserved" : "lost or stale write",
    ok: bothPreserved && staleBlocked,
    detail:
      "08:20 run must refresh from latest main after the 08:00 Norden merge; stale overwrite is rejected.",
  };
}

export function runAutoredaktionDryRun(): DryRunReport {
  const cases = [
    caseA(),
    caseB(),
    caseC(),
    caseD(),
    caseE(),
    caseF(),
    caseG(),
    caseH(),
  ];

  return {
    now: DRY_RUN_NOW.toISOString(),
    ok: cases.every((result) => result.ok),
    cases,
  };
}
