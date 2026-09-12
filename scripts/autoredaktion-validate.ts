import path from "node:path";
import { pathToFileURL } from "node:url";

import { getNewsArticles } from "@/lib/news/get-articles";
import { validateNewsArticle } from "@/lib/news/autoredaktion/article-validator";
import { defaultPublicDir } from "@/lib/news/autoredaktion/images";
import { validateEditorialSeries } from "@/lib/news/autoredaktion/series-validator";
import {
  EDITORIAL_SERIES,
  type EditorialSeries,
} from "@/lib/news/autoredaktion/types";
import type { NewsArticle } from "@/types/news";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
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

function parseSeries(value: string | undefined): EditorialSeries {
  if (!value || !(EDITORIAL_SERIES as readonly string[]).includes(value)) {
    throw new Error(`--series must be one of: ${EDITORIAL_SERIES.join(", ")}`);
  }
  return value as EditorialSeries;
}

const series = parseSeries(readArg("--series"));
const modulePath = readArg("--module");

if (!modulePath) {
  throw new Error("Usage: tsx scripts/autoredaktion-validate.ts --series <series> --module <file>");
}

const resolved = path.resolve(process.cwd(), modulePath);
const imported = await import(pathToFileURL(resolved).href);
const article = Object.values(imported).find(isNewsArticle);

if (!article) {
  throw new Error(`No NewsArticle export found in ${modulePath}`);
}

const articleResult = validateNewsArticle(article, {
  registry: getNewsArticles(),
  publicDir: defaultPublicDir(),
});
const seriesResult = validateEditorialSeries(article, series);
const ok = articleResult.ok && seriesResult.ok;

console.log(
  JSON.stringify(
    {
      ok,
      series,
      id: article.id,
      slug: article.slug,
      articleValidator: articleResult,
      seriesValidator: seriesResult,
    },
    null,
    2,
  ),
);

if (!ok) {
  process.exitCode = 1;
}
