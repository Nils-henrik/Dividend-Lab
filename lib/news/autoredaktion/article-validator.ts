import type { NewsArticle, NewsCategory } from "@/types/news";
import { getCanonicalUrl } from "@/lib/seo/canonical";

import { parseIsoDateTime, isReasonableArticleDate } from "./dates";
import {
  collectImagePaths,
  defaultPublicDir,
  isLocalPublicPath,
  localPublicAssetExists,
} from "./images";
import { collectPlaceholderHits } from "./placeholders";
import {
  fail,
  resultFromIssues,
  type ArticleValidatorOptions,
  type ValidationIssue,
  type ValidationResult,
} from "./types";

const NEWS_CATEGORIES: readonly NewsCategory[] = [
  "market",
  "company",
  "macro",
  "funds-etfs",
  "dividends",
  "world-economy",
];

const DEFAULT_MAX_AGE_HOURS = 36;
const DEFAULT_MAX_FUTURE_HOURS = 12;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function checkRequiredString(
  issues: ValidationIssue[],
  value: unknown,
  path: string,
  code = "empty-field",
): string | null {
  const trimmed = asTrimmedString(value);
  if (!trimmed) {
    issues.push(fail(code, `${path} must be a non-empty string`, path));
    return null;
  }

  for (const hit of collectPlaceholderHits(trimmed, path)) {
    issues.push(
      fail(
        "placeholder",
        `${hit.path} contains an obvious placeholder (${hit.excerpt})`,
        hit.path,
      ),
    );
  }

  return trimmed;
}

function checkStringList(
  issues: ValidationIssue[],
  value: unknown,
  path: string,
  { min = 1 }: { min?: number } = {},
): string[] {
  if (!Array.isArray(value) || value.length < min) {
    issues.push(
      fail(
        "empty-list",
        `${path} must be a non-empty array`,
        path,
      ),
    );
    return [];
  }

  const items: string[] = [];
  value.forEach((entry, index) => {
    const itemPath = `${path}[${index}]`;
    const trimmed = checkRequiredString(issues, entry, itemPath);
    if (trimmed) {
      items.push(trimmed);
    }
  });
  return items;
}

function checkNewsArticleShape(value: unknown): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!isRecord(value)) {
    return [fail("shape", "Candidate is not a NewsArticle object")];
  }

  if (typeof value.featured !== "boolean") {
    issues.push(fail("shape", "featured must be a boolean", "featured"));
  }

  if (
    typeof value.category !== "string" ||
    !NEWS_CATEGORIES.includes(value.category as NewsCategory)
  ) {
    issues.push(
      fail(
        "shape",
        `category must be one of: ${NEWS_CATEGORIES.join(", ")}`,
        "category",
      ),
    );
  }

  if (value.url !== null && typeof value.url !== "string") {
    issues.push(fail("shape", "url must be a string or null", "url"));
  }

  if (
    value.imageUrl !== undefined &&
    value.imageUrl !== null &&
    typeof value.imageUrl !== "string"
  ) {
    issues.push(fail("shape", "imageUrl must be a string or null", "imageUrl"));
  }

  if (value.intro !== undefined && !Array.isArray(value.intro)) {
    issues.push(fail("shape", "intro must be an array of strings", "intro"));
  }

  if (value.sections !== undefined && !Array.isArray(value.sections)) {
    issues.push(fail("shape", "sections must be an array", "sections"));
  }

  if (value.seoKeywords !== undefined && !Array.isArray(value.seoKeywords)) {
    issues.push(
      fail("shape", "seoKeywords must be an array of strings", "seoKeywords"),
    );
  }

  return issues;
}

function collectRegistryDuplicates(
  registry: readonly NewsArticle[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const ids = new Map<string, number>();
  const slugs = new Map<string, number>();

  for (const article of registry) {
    if (article.id) {
      ids.set(article.id, (ids.get(article.id) ?? 0) + 1);
    }
    if (article.slug) {
      slugs.set(article.slug, (slugs.get(article.slug) ?? 0) + 1);
    }
  }

  for (const [id, count] of ids) {
    if (count > 1) {
      issues.push(
        fail(
          "registry-duplicate-id",
          `Published registry contains duplicate id "${id}" (${count} entries)`,
          "id",
        ),
      );
    }
  }

  for (const [slug, count] of slugs) {
    if (count > 1) {
      issues.push(
        fail(
          "registry-duplicate-slug",
          `Published registry contains duplicate slug "${slug}" (${count} entries)`,
          "slug",
        ),
      );
    }
  }

  return issues;
}

function isSelfRegistryEntry(
  article: NewsArticle,
  registered: NewsArticle,
): boolean {
  return registered.id === article.id && registered.slug === article.slug;
}

/**
 * Fail-closed validator for autonomous NewsArticle publication.
 * Historical articles are not rewritten; this gate is for new series modules.
 */
export function validateNewsArticle(
  article: unknown,
  options: ArticleValidatorOptions = {},
): ValidationResult {
  const issues = checkNewsArticleShape(article);
  if (!isRecord(article) || issues.some((issue) => issue.code === "shape" && !issue.path)) {
    return resultFromIssues(issues);
  }

  const candidate = article as unknown as NewsArticle;
  const now = options.now ?? new Date();
  const publicDir = options.publicDir ?? defaultPublicDir();
  const maxAgeHours = options.maxAgeHours ?? DEFAULT_MAX_AGE_HOURS;
  const maxFutureHours = options.maxFutureHours ?? DEFAULT_MAX_FUTURE_HOURS;

  const id = checkRequiredString(issues, candidate.id, "id");
  const slug = checkRequiredString(issues, candidate.slug, "slug");
  checkRequiredString(issues, candidate.title, "title");
  checkRequiredString(issues, candidate.summary, "summary");
  checkRequiredString(issues, candidate.source, "source");
  const seoTitle = checkRequiredString(issues, candidate.seoTitle, "seoTitle");
  checkRequiredString(issues, candidate.seoDescription, "seoDescription");
  checkStringList(issues, candidate.seoKeywords, "seoKeywords");
  checkStringList(issues, candidate.intro, "intro");

  if (slug && !SLUG_PATTERN.test(slug)) {
    issues.push(
      fail(
        "invalid-slug",
        "slug must be lowercase kebab-case ([a-z0-9-])",
        "slug",
      ),
    );
  }

  if (slug && candidate.url !== `/news/${slug}`) {
    issues.push(
      fail(
        "url-mismatch",
        `url must be exactly "/news/${slug}"`,
        "url",
      ),
    );
  }

  if (slug) {
    const expectedCanonical = `https://divlab.se/news/${slug}`;
    const generated = getCanonicalUrl(`/news/${slug}`);
    if (generated !== expectedCanonical) {
      issues.push(
        fail(
          "canonical",
          `canonical could not be generated as ${expectedCanonical}`,
          "url",
        ),
      );
    }
  }

  if (seoTitle && /\|\s*DivLab/i.test(seoTitle)) {
    issues.push(
      fail(
        "seo-title-suffix",
        'seoTitle must not include the global "| DivLab" suffix',
        "seoTitle",
      ),
    );
  }

  const publishedAt = parseIsoDateTime(String(candidate.publishedAt ?? ""));
  if (!publishedAt) {
    issues.push(
      fail(
        "invalid-published-at",
        "publishedAt must be a valid ISO date-time",
        "publishedAt",
      ),
    );
  } else if (
    !isReasonableArticleDate(publishedAt, now, maxAgeHours, maxFutureHours)
  ) {
    issues.push(
      fail(
        "stale-or-future-date",
        `publishedAt must be a current article date (within ${maxAgeHours}h past / ${maxFutureHours}h future of the run clock)`,
        "publishedAt",
      ),
    );
  }

  if (candidate.updatedAt !== undefined) {
    const updatedAt = parseIsoDateTime(String(candidate.updatedAt));
    if (!updatedAt) {
      issues.push(
        fail(
          "invalid-updated-at",
          "updatedAt must be a valid ISO date-time when present",
          "updatedAt",
        ),
      );
    } else if (publishedAt && updatedAt.getTime() < publishedAt.getTime()) {
      issues.push(
        fail(
          "updated-before-published",
          "updatedAt must not be earlier than publishedAt",
          "updatedAt",
        ),
      );
    }
  }

  if (!Array.isArray(candidate.sections) || candidate.sections.length === 0) {
    issues.push(
      fail("empty-sections", "sections must contain at least one section", "sections"),
    );
  } else {
    candidate.sections.forEach((section, index) => {
      if (!isRecord(section)) {
        issues.push(
          fail("shape", `sections[${index}] must be an object`, `sections[${index}]`),
        );
        return;
      }

      checkRequiredString(issues, section.heading, `sections[${index}].heading`);
      checkStringList(
        issues,
        section.paragraphs,
        `sections[${index}].paragraphs`,
      );
    });
  }

  for (const image of collectImagePaths(candidate)) {
    if (!isLocalPublicPath(image.value)) {
      issues.push(
        fail(
          "unsupported-image",
          `${image.path} must be a local public path or null`,
          image.path,
        ),
      );
      continue;
    }

    if (!localPublicAssetExists(image.value, publicDir)) {
      issues.push(
        fail(
          "broken-image",
          `${image.path} does not resolve to an existing public asset (${image.value})`,
          image.path,
        ),
      );
    }
  }

  if (options.registry) {
    issues.push(...collectRegistryDuplicates(options.registry));

    const foreignId = options.registry.find(
      (entry) => entry.id === id && !isSelfRegistryEntry(candidate, entry),
    );
    if (id && foreignId) {
      issues.push(
        fail("duplicate-id", `id "${id}" is already in the published registry`, "id"),
      );
    }

    const foreignSlug = options.registry.find(
      (entry) => entry.slug === slug && !isSelfRegistryEntry(candidate, entry),
    );
    if (slug && foreignSlug) {
      issues.push(
        fail(
          "duplicate-slug",
          `slug "${slug}" is already in the published registry`,
          "slug",
        ),
      );
    }
  }

  return resultFromIssues(issues);
}
