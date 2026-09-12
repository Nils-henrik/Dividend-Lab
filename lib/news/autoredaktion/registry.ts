import type { NewsArticle } from "@/types/news";

import { fail, type ValidationIssue } from "./types";

export type RegistryIdentity = {
  id: string;
  slug?: string;
};

export function findRegistryIdentityCollisions(
  articles: readonly NewsArticle[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seenIds = new Map<string, number>();
  const seenSlugs = new Map<string, number>();

  for (const article of articles) {
    if (article.id) {
      seenIds.set(article.id, (seenIds.get(article.id) ?? 0) + 1);
    }
    if (article.slug) {
      seenSlugs.set(article.slug, (seenSlugs.get(article.slug) ?? 0) + 1);
    }
  }

  for (const [id, count] of seenIds) {
    if (count > 1) {
      issues.push(
        fail(
          "registry-duplicate-id",
          `Published registry contains duplicate id "${id}"`,
          "id",
        ),
      );
    }
  }

  for (const [slug, count] of seenSlugs) {
    if (count > 1) {
      issues.push(
        fail(
          "registry-duplicate-slug",
          `Published registry contains duplicate slug "${slug}"`,
          "slug",
        ),
      );
    }
  }

  return issues;
}

export function registryHasId(
  articles: readonly NewsArticle[],
  id: string,
): boolean {
  return articles.some((article) => article.id === id);
}

export function registryHasSlug(
  articles: readonly NewsArticle[],
  slug: string,
): boolean {
  return articles.some((article) => article.slug === slug);
}
