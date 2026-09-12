import path from "node:path";
import { pathToFileURL } from "node:url";

import { renderSeriesImage, renderSeriesImageForArticle } from "@/lib/news/images";
import type { EditorialSeries } from "@/lib/news/autoredaktion/types";
import type { NewsArticle } from "@/types/news";

function arg(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function seriesArg(): EditorialSeries {
  const value = arg("series");
  if (value === "borssverige" || value === "norden-i-centrum") return value;
  throw new Error("--series must be borssverige or norden-i-centrum");
}

function isNewsArticle(value: unknown): value is NewsArticle {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NewsArticle>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.publishedAt === "string"
  );
}

async function loadArticle(modulePath: string): Promise<NewsArticle> {
  const absolute = path.resolve(modulePath);
  const importedModule = await import(pathToFileURL(absolute).href);
  const article = Object.values(importedModule).find(isNewsArticle);
  if (!article) throw new Error(`No NewsArticle export found in ${modulePath}`);
  return article;
}

async function main() {
  const series = seriesArg();
  const publish = flag("publish");
  const articlePath = arg("article");

  if (articlePath) {
    const article = await loadArticle(articlePath);
    const result = await renderSeriesImageForArticle(article, series, {
      mode: publish ? "publish" : "dry-run",
    });
    console.log(JSON.stringify(result, null, 2));
    if (result.image.status === "failed") process.exitCode = 1;
    return;
  }

  const date = arg("date");
  if (!date) throw new Error("Use --article <module.ts> (preferred) or --date YYYY-MM-DD");
  const companies = (arg("companies") ?? "")
    .split(",")
    .map((company) => company.trim())
    .filter(Boolean);

  const result = await renderSeriesImage(
    {
      series,
      date,
      articleSlug: arg("slug") ?? `${series}-${date}`,
      companies,
    },
    { mode: publish ? "publish" : "dry-run" },
  );
  console.log(JSON.stringify(result, null, 2));
  if (result.status === "failed") process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
