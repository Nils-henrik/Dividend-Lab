import { existsSync } from "node:fs";
import path from "node:path";

import type { NewsArticle } from "@/types/news";

const LOCAL_PUBLIC_PATH = /^\/(?!\/)[^?\s]+$/;

export function defaultPublicDir(repoRoot = process.cwd()): string {
  return path.join(repoRoot, "public");
}

export function isLocalPublicPath(value: string): boolean {
  return LOCAL_PUBLIC_PATH.test(value) && !/^https?:\/\//i.test(value);
}

export function resolveLocalPublicAsset(
  imagePath: string,
  publicDir: string,
): string | null {
  if (!isLocalPublicPath(imagePath)) {
    return null;
  }

  const relative = imagePath.replace(/^\/+/, "");
  return path.join(publicDir, relative);
}

export function localPublicAssetExists(
  imagePath: string,
  publicDir: string,
): boolean {
  const resolved = resolveLocalPublicAsset(imagePath, publicDir);
  return Boolean(resolved && existsSync(resolved));
}

/**
 * Explicit pre-validation helper. The article validator must not call this
 * implicitly — a broken local path is a fail-closed error unless an operator
 * chooses to null it out before validation.
 */
export function normalizeBrokenLocalImageToNull<T extends NewsArticle>(
  article: T,
  publicDir: string,
): T {
  const next = { ...article };

  if (typeof next.imageUrl === "string" && next.imageUrl.trim()) {
    if (
      isLocalPublicPath(next.imageUrl) &&
      !localPublicAssetExists(next.imageUrl, publicDir)
    ) {
      next.imageUrl = null;
    }
  }

  if (typeof next.thumbnailImageUrl === "string" && next.thumbnailImageUrl.trim()) {
    if (
      isLocalPublicPath(next.thumbnailImageUrl) &&
      !localPublicAssetExists(next.thumbnailImageUrl, publicDir)
    ) {
      next.thumbnailImageUrl = null;
    }
  }

  return next;
}

export function collectImagePaths(article: NewsArticle): { path: string; value: string }[] {
  const found: { path: string; value: string }[] = [];

  if (typeof article.imageUrl === "string" && article.imageUrl.trim()) {
    found.push({ path: "imageUrl", value: article.imageUrl.trim() });
  }

  if (
    typeof article.thumbnailImageUrl === "string" &&
    article.thumbnailImageUrl.trim()
  ) {
    found.push({
      path: "thumbnailImageUrl",
      value: article.thumbnailImageUrl.trim(),
    });
  }

  article.sections?.forEach((section, index) => {
    const src = section.inlineImage?.src?.trim();
    if (src) {
      found.push({ path: `sections[${index}].inlineImage.src`, value: src });
    }
  });

  return found;
}
