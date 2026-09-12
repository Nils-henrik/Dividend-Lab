import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { getNewsArticles } from "@/lib/news/get-articles";
import { validateNewsArticle } from "@/lib/news/autoredaktion/article-validator";
import { defaultPublicDir } from "@/lib/news/autoredaktion/images";
import { validateEditorialSeries } from "@/lib/news/autoredaktion/series-validator";
import {
  fail,
  type EditorialSeries,
  type ValidationIssue,
} from "@/lib/news/autoredaktion/types";
import { validateDeclaredGeneratedImage } from "@/lib/news/images/validate-generated-image";
import type { NewsArticle } from "@/types/news";

const REGISTRY_PATH = "lib/news/get-articles.ts";
const SERIES_FILE = /^data\/news-articles\/(borssverige-|norden-i-centrum-).+\.ts$/;

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

function baseSha(): string {
  const configured = process.env.AUTOREDAKTION_BASE_SHA?.trim();
  if (configured && !/^0+$/.test(configured)) return configured;
  return git(["rev-parse", "HEAD^"]);
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

function stockholmParts(date: Date): { date: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    hour: Number(value("hour")),
  };
}

function articleText(article: NewsArticle): string {
  return [
    article.title,
    article.summary,
    ...(article.intro ?? []),
    ...(article.sections ?? []).flatMap((section) => [
      section.heading,
      ...section.paragraphs,
    ]),
  ]
    .filter(Boolean)
    .join(" \n ");
}

function validateAutonomousContract(
  article: NewsArticle,
  sourceText: string,
  now = new Date(),
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!/Editorial research cutoff:\s*[^\n]+/i.test(sourceText)) {
    issues.push(
      fail(
        "research-cutoff",
        "Article module must contain an Editorial research cutoff comment.",
      ),
    );
  }

  if (article.source !== "DivLab Redaktion") {
    issues.push(
      fail(
        "author",
        'Autonomous articles must use source/author "DivLab Redaktion".',
        "source",
      ),
    );
  }

  if (!Number.isInteger(article.readingMinutes) || (article.readingMinutes ?? 0) < 1) {
    issues.push(
      fail(
        "reading-time",
        "readingMinutes must be a positive integer.",
        "readingMinutes",
      ),
    );
  }

  if (article.showDisclaimer !== true) {
    issues.push(
      fail(
        "disclaimer",
        "Autonomous articles must enable the standard disclaimer.",
        "showDisclaimer",
      ),
    );
  }

  const internalSignals = article.internalLinking
    ? [
        ...(article.internalLinking.relatedNewsSlugs ?? []),
        ...(article.internalLinking.relatedLearningSlugs ?? []),
        ...(article.internalLinking.companies ?? []),
        ...(article.internalLinking.tickers ?? []),
        ...(article.internalLinking.topics ?? []),
      ]
    : [];
  if (internalSignals.length === 0) {
    issues.push(
      fail(
        "internal-linking",
        "Autonomous articles must provide at least one useful internal-linking signal.",
        "internalLinking",
      ),
    );
  }

  const published = new Date(article.publishedAt);
  if (!Number.isNaN(published.getTime())) {
    const publicationClock = stockholmParts(published);
    const runClock = stockholmParts(now);
    if (publicationClock.date !== runClock.date) {
      issues.push(
        fail(
          "publication-date",
          "Autonomous morning articles must use the current Europe/Stockholm calendar date.",
          "publishedAt",
        ),
      );
    }

    const preOpenReaction =
      /\b(?:aktien|aktierna|stockholmsbörsen|omxs30)\b.{0,80}\b(?:stiger|rusar|faller|sjunker|backar)\b/i;
    if (publicationClock.hour < 9 && preOpenReaction.test(articleText(article))) {
      issues.push(
        fail(
          "preopen-market-reaction",
          "A pre-09:00 Europe/Stockholm article contains a present-tense Swedish market reaction. Verify prior-session wording or wait for the market to open.",
        ),
      );
    }
  }

  return issues;
}

function registryImports(source: string): Map<string, string> {
  const imports = new Map<string, string>();
  const pattern =
    /^import\s+\{\s*([A-Z0-9_]+)\s*\}\s+from\s+"@\/data\/news-articles\/([^"]+)";/gm;
  for (const match of source.matchAll(pattern)) {
    imports.set(match[1], match[2]);
  }
  return imports;
}

function registryPublishedSymbols(source: string): Set<string> {
  return new Set(
    [...source.matchAll(/applyNewsSearchSeo\(([A-Z0-9_]+)\)/g)].map(
      (match) => match[1],
    ),
  );
}

function validateRegistryPreservation(
  previous: string,
  current: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const beforeImports = registryImports(previous);
  const nowImports = registryImports(current);
  const beforePublished = registryPublishedSymbols(previous);
  const nowPublished = registryPublishedSymbols(current);

  for (const [symbol, modulePath] of beforeImports) {
    if (nowImports.get(symbol) !== modulePath) {
      issues.push(
        fail(
          "stale-registry-write",
          `Registry lost or changed existing import ${symbol} from ${modulePath}. Refresh from latest main before publishing.`,
          REGISTRY_PATH,
        ),
      );
    }
    if (beforePublished.has(symbol) && !nowPublished.has(symbol)) {
      issues.push(
        fail(
          "stale-registry-write",
          `Registry lost existing published entry ${symbol}. Refresh from latest main before publishing.`,
          REGISTRY_PATH,
        ),
      );
    }
  }

  return issues;
}

function printIssues(file: string, issues: readonly ValidationIssue[]) {
  for (const issue of issues) {
    console.error(
      `AUTOREDAKTION FAIL [${issue.code}] ${file}${issue.path ? ` (${issue.path})` : ""}: ${issue.message}`,
    );
  }
}

async function main() {
  const base = baseSha();
  const changed = git(["diff", "--name-only", `${base}...HEAD`])
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
  const articleFiles = changed.filter((file) => SERIES_FILE.test(file));

  if (articleFiles.length === 0) {
    console.log("Autoredaktion changed-article gate: no BörsSverige/Norden module changed.");
    return;
  }

  let failed = false;
  const registrySource = readFileSync(path.resolve(REGISTRY_PATH), "utf8");
  const baseRegistrySource = git(["show", `${base}:${REGISTRY_PATH}`]);
  const preservationIssues = validateRegistryPreservation(
    baseRegistrySource,
    registrySource,
  );
  if (preservationIssues.length) {
    failed = true;
    printIssues(REGISTRY_PATH, preservationIssues);
  }

  const published = getNewsArticles();
  const imports = registryImports(registrySource);
  const publishedSymbols = registryPublishedSymbols(registrySource);

  for (const file of articleFiles) {
    const sourceText = readFileSync(path.resolve(file), "utf8");
    const imported = (await import(
      `${pathToFileURL(path.resolve(file)).href}?autoredaktion=${Date.now()}`
    )) as Record<string, unknown>;
    const entries = Object.entries(imported).filter(
      (entry): entry is [string, NewsArticle] => isNewsArticle(entry[1]),
    );

    if (entries.length !== 1) {
      failed = true;
      console.error(
        `AUTOREDAKTION FAIL [article-export] ${file}: expected exactly one NewsArticle export; found ${entries.length}.`,
      );
      continue;
    }

    const [exportName, article] = entries[0];
    const moduleName = file
      .replace(/^data\/news-articles\//, "")
      .replace(/\.ts$/, "");
    const series: EditorialSeries = file.includes("/borssverige-")
      ? "borssverige"
      : "norden-i-centrum";

    const imageValidation = await validateDeclaredGeneratedImage(
      article,
      series,
      process.cwd(),
    );
    const imageIssues = imageValidation.issues.map((code) =>
      fail(
        `generated-image-${code}`,
        `Generated image validation failed: ${code}.`,
        "imageUrl",
      ),
    );

    const issues: ValidationIssue[] = [
      ...validateNewsArticle(article, {
        registry: published,
        publicDir: defaultPublicDir(),
      }).issues,
      ...validateEditorialSeries(article, series).issues,
      ...validateAutonomousContract(article, sourceText),
      ...imageIssues,
    ];

    if (imports.get(exportName) !== moduleName) {
      issues.push(
        fail(
          "registry-import",
          `Registry must import ${exportName} from @/data/news-articles/${moduleName}.`,
          REGISTRY_PATH,
        ),
      );
    }
    if (!publishedSymbols.has(exportName)) {
      issues.push(
        fail(
          "registry-entry",
          `Registry must publish applyNewsSearchSeo(${exportName}).`,
          REGISTRY_PATH,
        ),
      );
    }

    const registeredMatches = published.filter(
      (candidate) => candidate.id === article.id && candidate.slug === article.slug,
    );
    if (registeredMatches.length !== 1) {
      issues.push(
        fail(
          "registry-identity",
          `Expected exactly one published registry item for id/slug; found ${registeredMatches.length}.`,
          REGISTRY_PATH,
        ),
      );
    }

    if (issues.length) {
      failed = true;
      printIssues(file, issues);
    } else {
      console.log(`Autoredaktion changed-article PASS: ${series} -> ${article.slug}`);
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(
    `AUTOREDAKTION FAIL [unhandled] ${
      error instanceof Error ? error.stack ?? error.message : String(error)
    }`,
  );
  process.exitCode = 1;
});
