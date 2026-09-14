import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { normalizeAutonomousArticleSource } from "@/lib/news/autoredaktion/source-normalizer";
import type { EditorialSeries } from "@/lib/news/autoredaktion/types";
import { renderSeriesImageForArticle } from "@/lib/news/images";
import type { NewsArticle } from "@/types/news";

const SERIES_FILE = /^data\/news-articles\/(borssverige-|norden-i-centrum-).+\.ts$/;

function git(args: string[]): string {
  return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" }).trim();
}

function baseSha(): string {
  const configured = process.env.AUTOREDAKTION_BASE_SHA?.trim();
  if (configured && !/^0+$/.test(configured)) return configured;
  return git(["merge-base", "origin/main", "HEAD"]);
}

function seriesFromFile(file: string): EditorialSeries {
  if (file.startsWith("data/news-articles/borssverige-")) return "borssverige";
  if (file.startsWith("data/news-articles/norden-i-centrum-")) return "norden-i-centrum";
  throw new Error(`Unsupported autonomous article file: ${file}`);
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

async function loadArticle(file: string): Promise<NewsArticle> {
  const absolute = path.resolve(file);
  const imported = (await import(
    `${pathToFileURL(absolute).href}?autoredaktionPrepare=${Date.now()}`
  )) as Record<string, unknown>;
  const articles = Object.values(imported).filter(isNewsArticle);
  if (articles.length !== 1) {
    throw new Error(`Expected exactly one NewsArticle export in ${file}; found ${articles.length}`);
  }
  return articles[0];
}

function stockholmDate(publishedAt: string): string {
  const parsed = new Date(publishedAt);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid publishedAt: ${publishedAt}`);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Stockholm",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function writeIfChanged(file: string, next: string) {
  if (readFileSync(file, "utf8") !== next) writeFileSync(file, next, "utf8");
}

async function main() {
  const base = baseSha();
  const changed = git(["diff", "--name-only", `${base}...HEAD`])
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);
  const articleFiles = changed.filter((file) => SERIES_FILE.test(file));
  if (articleFiles.length !== 1) {
    throw new Error(
      `Managed publication must contain exactly one BörsSverige/Norden article; found ${articleFiles.length}`,
    );
  }

  const file = articleFiles[0];
  const series = seriesFromFile(file);

  // Repair deterministic contract errors before TypeScript/validator gates:
  // exact author and omission-based no-image fallback. Editorial prose is untouched.
  const initial = readFileSync(file, "utf8");
  const normalizedBeforeRender = normalizeAutonomousArticleSource(initial, {
    series,
    imagePath: null,
  });
  writeIfChanged(file, normalizedBeforeRender);

  const article = await loadArticle(file);
  const date = stockholmDate(article.publishedAt);
  const rendered = await renderSeriesImageForArticle(article, series, { mode: "publish" });
  const canonicalOutput = path.join(
    process.cwd(),
    "public",
    "news",
    "generated",
    `${series}-${date}.png`,
  );

  let publicPath: string | null = null;
  if (rendered.image.status === "generated" && rendered.image.publicPath) {
    publicPath = rendered.image.publicPath;
  } else {
    // A failed renderer must not leave a half-valid binary in the PR.
    rmSync(canonicalOutput, { force: true });
  }

  const finalSource = normalizeAutonomousArticleSource(readFileSync(file, "utf8"), {
    series,
    imagePath: publicPath,
  });
  writeIfChanged(file, finalSource);

  console.log(
    JSON.stringify(
      {
        file,
        series,
        date,
        imageStatus: rendered.image.status,
        imagePath: publicPath,
        templateVersion: rendered.image.templateVersion,
        companiesUsed: rendered.image.companiesUsed,
        missingCompanyLogos: rendered.image.missingCompanyLogos,
        fallbackUsed: publicPath === null,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
