import type { NewsArticle } from "@/types/news";

import {
  fail,
  resultFromIssues,
  type EditorialSeries,
  type ValidationIssue,
  type ValidationResult,
} from "./types";

/**
 * Lexical/metadata gates — not NLP.
 *
 * Limits:
 * - Cannot understand irony, implied geography, or a Swedish company whose
 *   name looks American.
 * - "Nasdaq" is treated as US unless it is "Nasdaq Stockholm/Copenhagen/Helsinki".
 * - A single foreign datapoint (oil, USD, a US rate) is allowed when Swedish
 *   or Nordic market language still dominates the lead and body.
 * - These gates cannot prove editorial quality; they only fail-closed obvious
 *   off-mandate drafts.
 */

const SWEDEN_PHRASES = [
  "nasdaq stockholm",
  "omx stockholm",
  "stockholmsbörsen",
  "svenska kronan",
  "svensk mäklarstatistik",
  "riksbanken",
  "sverige",
  "svenska",
  "svenskt",
  "svensk",
  "stockholm",
  "göteborg",
  "goteborg",
  "malmö",
  "malmo",
  "omxs30",
  "omxs",
  "scb",
] as const;

const NORDIC_PHRASES = [
  ...SWEDEN_PHRASES,
  "nasdaq copenhagen",
  "nasdaq helsinki",
  "oslo børs",
  "oslo bors",
  "köpenhamn",
  "kopenhamn",
  "helsingfors",
  "helsinki",
  "danmark",
  "danska",
  "danskt",
  "dansk",
  "norge",
  "norska",
  "norskt",
  "norsk",
  "finland",
  "finländska",
  "finlandska",
  "finska",
  "finskt",
  "finsk",
  "norden",
  "nordiska",
  "nordiskt",
  "nordisk",
  "omxc",
  "omxh",
] as const;

const FOREIGN_MARKET_PHRASES = [
  "wall street",
  "federal reserve",
  "s&p 500",
  "s&p500",
  "dow jones",
  "usa-börsen",
  "usa-borsen",
  "us-börsen",
  "us-borsen",
  "amerikanska",
  "amerikanskt",
  "amerikansk",
  "nasdaq",
  "nyse",
  "nikkei",
  "hang seng",
  "shanghai",
  "tokyo",
  "asien",
  "asia",
  "washington",
  "världsmarknaden",
  "varldsmarknaden",
  "global markets",
  "world market",
  "usa",
] as const;

const NORDIC_EXCHANGE_EXCEPTIONS = [
  "nasdaq stockholm",
  "nasdaq copenhagen",
  "nasdaq helsinki",
] as const;

function normalizeEditorialText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function articlePlainText(article: NewsArticle): string {
  const sections = (article.sections ?? [])
    .flatMap((section) => [section.heading, ...(section.paragraphs ?? [])])
    .join("\n");

  return [
    article.title,
    article.summary,
    article.seoTitle,
    article.seoDescription,
    ...(article.seoKeywords ?? []),
    ...(article.intro ?? []),
    sections,
  ]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
}

function leadText(article: NewsArticle): string {
  return [article.title, article.summary, ...(article.intro ?? [])]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
}

function countPhraseHits(text: string, phrases: readonly string[]): number {
  const normalized = normalizeEditorialText(text);
  let count = 0;

  for (const phrase of phrases) {
    const needle = normalizeEditorialText(phrase);
    if (!needle) {
      continue;
    }

    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,
      "gu",
    );
    count += normalized.match(pattern)?.length ?? 0;
  }

  return count;
}

function foreignMarketHits(text: string): number {
  const neutralized = NORDIC_EXCHANGE_EXCEPTIONS.reduce((current, exception) => {
    return current.split(exception).join(" ");
  }, normalizeEditorialText(text));

  return countPhraseHits(neutralized, FOREIGN_MARKET_PHRASES);
}

function swedenHits(text: string): number {
  return countPhraseHits(text, SWEDEN_PHRASES);
}

function nordicHits(text: string): number {
  return countPhraseHits(text, NORDIC_PHRASES);
}

function looksLikeSeries(article: NewsArticle, series: EditorialSeries): boolean {
  const haystack = normalizeEditorialText(
    `${article.title ?? ""} ${article.slug ?? ""} ${article.id ?? ""}`,
  );

  if (series === "borssverige") {
    return haystack.includes("borssverige") || haystack.includes("börssverige");
  }

  return haystack.includes("norden i centrum") || haystack.includes("norden-i-centrum");
}

function validateBorssverige(article: NewsArticle): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const body = articlePlainText(article);
  const lead = leadText(article);
  const sweden = swedenHits(body);
  const swedenLead = swedenHits(lead);
  const foreign = foreignMarketHits(body);
  const foreignLead = foreignMarketHits(lead);

  if (!looksLikeSeries(article, "borssverige")) {
    issues.push(
      fail(
        "series-identity",
        "BörsSverige articles must identify the series in title, slug or id",
        "title",
      ),
    );
  }

  if (sweden === 0) {
    issues.push(
      fail(
        "sweden-focus",
        "BörsSverige requires a Sweden-only editorial focus (Stockholm market, Swedish companies or Swedish macro)",
        "title",
      ),
    );
  }

  const foreignShare = foreign / Math.max(1, foreign + sweden);
  const usaDominated =
    (foreignLead >= 2 && swedenLead === 0) ||
    (foreign >= 6 && sweden <= 2) ||
    (foreign >= 8 && foreign >= sweden * 3) ||
    (foreign >= 8 && foreignShare >= 0.75);

  if (usaDominated) {
    issues.push(
      fail(
        "usa-dominated",
        "BörsSverige rejects copy dominated by USA / Wall Street / Nasdaq / Asia / foreign macro without an explicit Swedish-market connection",
        "title",
      ),
    );
  }

  return issues;
}

function validateNorden(article: NewsArticle): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const body = articlePlainText(article);
  const lead = leadText(article);
  const nordic = nordicHits(body);
  const nordicLead = nordicHits(lead);
  const foreign = foreignMarketHits(body);
  const foreignLead = foreignMarketHits(lead);

  if (!looksLikeSeries(article, "norden-i-centrum")) {
    issues.push(
      fail(
        "series-identity",
        "Norden i centrum articles must identify the series in title, slug or id",
        "title",
      ),
    );
  }

  if (nordic === 0 || nordicLead === 0) {
    issues.push(
      fail(
        "nordic-focus",
        "Norden i centrum must primarily concern Sweden, Norway, Denmark and/or Finland",
        "title",
      ),
    );
  }

  const genericWorld =
    (foreignLead >= 2 && nordicLead === 0) ||
    (foreign >= 8 && nordic <= 2);

  if (genericWorld) {
    issues.push(
      fail(
        "generic-world-market",
        "Norden i centrum rejects generic USA/world-market copy without a Nordic-market connection",
        "title",
      ),
    );
  }

  return issues;
}

export function validateEditorialSeries(
  article: NewsArticle,
  series: EditorialSeries,
): ValidationResult {
  if (series === "borssverige") {
    return resultFromIssues(validateBorssverige(article));
  }

  return resultFromIssues(validateNorden(article));
}

export function scoreEditorialGeography(article: NewsArticle): {
  sweden: number;
  nordic: number;
  foreign: number;
} {
  const body = articlePlainText(article);
  return {
    sweden: swedenHits(body),
    nordic: nordicHits(body),
    foreign: foreignMarketHits(body),
  };
}
