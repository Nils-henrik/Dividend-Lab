import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  isNewsArticleLike,
  type AutoredaktionSeries,
  type AutoredaktionValidationIssue,
  validateAutoredaktionArticle,
  validateRegistryContainsEntry,
  validateRegistryPreservesBase,
  validateResearchCutoffComment,
} from "@/lib/news/autoredaktion";
import { getNewsArticles } from "@/lib/news/get-articles";

const REGISTRY_PATH = "lib/news/get-articles.ts";
const SERIES_FILE_PATTERN =
  /^data\/news-articles\/(borssverige-|norden-i-centrum-).+\.ts$/;

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
  }).trim();
}

function reportIssues(
  file: string,
  issues: readonly AutoredaktionValidationIssue[],
) {
  for (const issue of issues) {
    console.error(`AUTOREDAKTION FAIL [${issue.code}] ${file}: ${issue.message}`);
  }
}

function resolveBaseSha(): string {
  const configured = process.env.AUTOREDAKTION_BASE_SHA?.trim();
  if (configured && !/^0+$/.test(configured)) return configured;
  return git(["rev-parse", "HEAD^"]);
}

async function main() {
  const baseSha = resolveBaseSha();
  const changedFiles = git(["diff", "--name-only", `${baseSha}...HEAD`])
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
  const articleFiles = changedFiles.filter((file) => SERIES_FILE_PATTERN.test(file));

  if (articleFiles.length === 0) {
    console.log("Autoredaktion gate: no BörsSverige/Norden article changed; nothing to validate.");
    return;
  }

  let failed = false;
  const currentRegistry = readFileSync(path.resolve(REGISTRY_PATH), "utf8");
  const baseRegistry = git(["show", `${baseSha}:${REGISTRY_PATH}`]);
  const preservation = validateRegistryPreservesBase(baseRegistry, currentRegistry);
  if (!preservation.ok) {
    failed = true;
    reportIssues(REGISTRY_PATH, preservation.issues);
  }

  const allArticles = getNewsArticles();

  for (const articleFile of articleFiles) {
    const sourceText = readFileSync(path.resolve(articleFile), "utf8");
    const cutoff = validateResearchCutoffComment(sourceText);
    if (!cutoff.ok) {
      failed = true;
      reportIssues(articleFile, cutoff.issues);
    }

    const moduleUrl = `${pathToFileURL(path.resolve(articleFile)).href}?autoredaktion=${Date.now()}`;
    const articleModule = (await import(moduleUrl)) as Record<string, unknown>;
    const articleExports = Object.entries(articleModule).filter(([, value]) =>
      isNewsArticleLike(value),
    );

    if (articleExports.length !== 1) {
      failed = true;
      console.error(
        `AUTOREDAKTION FAIL [article_export_count] ${articleFile}: expected exactly one NewsArticle export; found ${articleExports.length}.`,
      );
      continue;
    }

    const [exportName, article] = articleExports[0];
    const series: AutoredaktionSeries = articleFile.includes("/borssverige-")
      ? "borssverige"
      : "norden-i-centrum";
    const modulePath = articleFile
      .replace(/^data\/news-articles\//, "")
      .replace(/\.ts$/, "");

    const registryEntry = validateRegistryContainsEntry(currentRegistry, {
      exportName,
      modulePath,
    });
    if (!registryEntry.ok) {
      failed = true;
      reportIssues(REGISTRY_PATH, registryEntry.issues);
    }

    const result = validateAutoredaktionArticle(article, series, {
      allArticles,
    });
    if (!result.ok) {
      failed = true;
      reportIssues(articleFile, result.issues);
    } else {
      console.log(
        `Autoredaktion PASS: ${series} -> ${article.slug} (${exportName})`,
      );
    }
  }

  if (failed) process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`AUTOREDAKTION FAIL [unhandled] ${message}`);
  process.exitCode = 1;
});
