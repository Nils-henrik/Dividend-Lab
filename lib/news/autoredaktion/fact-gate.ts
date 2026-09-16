import type { NewsArticle } from "@/types/news";

import { parseIsoDateTime, stockholmCalendarDate } from "./dates";
import { fail, type ValidationIssue } from "./types";

const ISO_CUTOFF_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?(?:Z|[+-]\d{2}:\d{2})$/;

const CUTOFF_LINE =
  /^\s*\*\s*Editorial research cutoff:\s*(\S+)\s*$/gm;
const P0_PASS_LINE = /^\s*\*\s*P0_FACT_GATE=PASS\s*$/gm;
const P0_SOURCE_LINE =
  /^\s*\*\s*P0_SOURCE\[(primary|secondary)\]:\s*(https:\/\/\S+)\s*$/gm;

export type P0SourceKind = "primary" | "secondary";

export type P0SourceDeclaration = {
  kind: P0SourceKind;
  href: string;
};

export type P0FactGateResult = {
  ok: boolean;
  issues: ValidationIssue[];
  cutoff: Date | null;
  sources: P0SourceDeclaration[];
};

function matches(sourceText: string, pattern: RegExp): RegExpMatchArray[] {
  return [...sourceText.matchAll(pattern)];
}

function isValidHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname) &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

/**
 * Enforces the machine-verifiable part of the editorial P0 contract.
 *
 * This validator deliberately does not claim to prove that a source is true,
 * that a declared primary source is correctly classified, or that every prose
 * claim is supported. Those remain editorial research/fact-check duties.
 */
export function validateP0FactGate(input: {
  article: Pick<NewsArticle, "publishedAt" | "sources">;
  sourceText: string;
  handoffAt: Date;
}): P0FactGateResult {
  const issues: ValidationIssue[] = [];
  const cutoffMatches = matches(input.sourceText, CUTOFF_LINE);
  const passMatches = matches(input.sourceText, P0_PASS_LINE);
  const sourceMatches = matches(input.sourceText, P0_SOURCE_LINE);

  let cutoff: Date | null = null;
  if (cutoffMatches.length !== 1) {
    issues.push(
      fail(
        "p0-cutoff-count",
        `Expected exactly one machine-readable Editorial research cutoff; found ${cutoffMatches.length}.`,
      ),
    );
  } else {
    const rawCutoff = cutoffMatches[0][1];
    cutoff = ISO_CUTOFF_PATTERN.test(rawCutoff)
      ? parseIsoDateTime(rawCutoff)
      : null;
    if (!cutoff) {
      issues.push(
        fail(
          "p0-cutoff-invalid",
          "Editorial research cutoff must be an exact ISO 8601 date-time with seconds and an explicit UTC offset.",
        ),
      );
    }
  }

  if (passMatches.length !== 1) {
    issues.push(
      fail(
        "p0-pass",
        `Expected exactly one literal P0_FACT_GATE=PASS attestation; found ${passMatches.length}.`,
      ),
    );
  }

  const declaredSources: P0SourceDeclaration[] = sourceMatches.map((match) => ({
    kind: match[1] as P0SourceKind,
    href: match[2],
  }));
  if (declaredSources.length === 0) {
    issues.push(
      fail(
        "p0-sources-missing",
        "At least one machine-readable P0_SOURCE declaration is required.",
      ),
    );
  }
  if (!declaredSources.some((source) => source.kind === "primary")) {
    issues.push(
      fail(
        "p0-primary-source-missing",
        "At least one P0_SOURCE[primary] declaration is required.",
      ),
    );
  }

  const declaredUrls = declaredSources.map((source) => source.href);
  if (new Set(declaredUrls).size !== declaredUrls.length) {
    issues.push(
      fail("p0-source-duplicate", "P0_SOURCE declarations must be unique."),
    );
  }
  for (const source of declaredSources) {
    if (!isValidHttpsUrl(source.href)) {
      issues.push(
        fail(
          "p0-source-url",
          `P0 source must be a valid credential-free HTTPS URL: ${source.href}`,
        ),
      );
    }
  }

  const articleSources = input.article.sources ?? [];
  if (articleSources.length === 0) {
    issues.push(
      fail(
        "p0-article-sources-missing",
        "The article sources array is mandatory for managed publications.",
        "sources",
      ),
    );
  }

  const articleUrls: string[] = [];
  for (const source of articleSources) {
    const text = source.text.trim();
    const href = source.href?.trim() ?? "";
    if (!text || !href || !isValidHttpsUrl(href)) {
      issues.push(
        fail(
          "p0-article-source-invalid",
          "Every managed article source needs non-empty text and a valid credential-free HTTPS href.",
          "sources",
        ),
      );
      continue;
    }
    articleUrls.push(href);
  }

  if (new Set(articleUrls).size !== articleUrls.length) {
    issues.push(
      fail(
        "p0-article-source-duplicate",
        "Article source URLs must be unique.",
        "sources",
      ),
    );
  }

  const declaredSet = new Set(declaredUrls);
  const articleSet = new Set(articleUrls);
  const undeclared = articleUrls.filter((href) => !declaredSet.has(href));
  const unlisted = declaredUrls.filter((href) => !articleSet.has(href));
  if (undeclared.length > 0 || unlisted.length > 0) {
    issues.push(
      fail(
        "p0-source-mismatch",
        "P0_SOURCE declarations and article.sources href values must match exactly.",
        "sources",
      ),
    );
  }

  const publishedAt = parseIsoDateTime(input.article.publishedAt);
  if (!publishedAt) {
    issues.push(
      fail(
        "p0-published-at-invalid",
        "publishedAt must be a valid ISO date-time before P0 timing can be enforced.",
        "publishedAt",
      ),
    );
  }
  if (Number.isNaN(input.handoffAt.getTime())) {
    issues.push(
      fail(
        "p0-handoff-invalid",
        "The initial canonical Git handoff time could not be determined.",
      ),
    );
  }

  if (cutoff && publishedAt) {
    if (stockholmCalendarDate(cutoff) !== stockholmCalendarDate(publishedAt)) {
      issues.push(
        fail(
          "p0-cutoff-date",
          "Editorial research cutoff must use the same Europe/Stockholm calendar date as publishedAt.",
        ),
      );
    }
    if (cutoff.getTime() > publishedAt.getTime()) {
      issues.push(
        fail(
          "p0-cutoff-after-publication",
          "Editorial research cutoff cannot be later than publishedAt.",
        ),
      );
    }
  }

  if (
    cutoff &&
    !Number.isNaN(input.handoffAt.getTime()) &&
    cutoff.getTime() > input.handoffAt.getTime()
  ) {
    issues.push(
      fail(
        "p0-cutoff-after-handoff",
        "Editorial research cutoff cannot be later than the initial canonical Git commit used for handoff.",
      ),
    );
  }

  return {
    ok: issues.length === 0,
    issues,
    cutoff,
    sources: declaredSources,
  };
}
