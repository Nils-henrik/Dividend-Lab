import { existsSync } from "node:fs";
import path from "node:path";

import { getCanonicalUrl } from "@/lib/seo/canonical";
import type { NewsArticle } from "@/types/news";

export type AutoredaktionSeries = "borssverige" | "norden-i-centrum";

export type AutoredaktionValidationIssue = {
  code: string;
  message: string;
};

export type AutoredaktionValidationResult = {
  ok: boolean;
  issues: AutoredaktionValidationIssue[];
};

type ValidateArticleOptions = {
  allArticles: readonly NewsArticle[];
  now?: Date;
  publicDir?: string;
};

type RegistryEntry = {
  exportName: string;
  modulePath: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLACEHOLDER_PATTERN = /\b(?:todo|tbd|fixme|placeholder|lorem ipsum|xxx)\b/i;
const NEWS_CATEGORIES = new Set([
  "market",
  "company",
  "macro",
  "funds-etfs",
  "dividends",
  "world-economy",
]);

const SWEDEN_MARKERS = [
  "sverige",
  "svensk",
  "stockholm",
  "stockholmsbörsen",
  "omxs",
  "riksbanken",
  "scb",
  "kronan",
  "sek",
  "nasdaq stockholm",
];

const NORDIC_MARKERS = [
  "norden",
  "nordisk",
  ...SWEDEN_MARKERS,
  "norge",
  "norsk",
  "oslo",
  "nok",
  "danmark",
  "dansk",
  "köpenhamn",
  "københavn",
  "dkk",
  "finland",
  "finsk",
  "helsingfors",
  "helsinki",
  "nasdaq helsinki",
  "nasdaq copenhagen",
  "oslo børs",
];

const FOREIGN_MARKERS = [
  "wall street",
  "usa",
  "amerikansk",
  "nasdaq",
  "s&p 500",
  "federal reserve",
  "fed ",
  "new york",
  "asien",
  "kina",
  "kinesisk",
  "japan",
  "tokyo",
  "hang seng",
];

function addIssue(
  issues: AutoredaktionValidationIssue[],
  code: string,
  message: string,
) {
  issues.push({ code, message });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function stockholmParts(date: Date) {
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
    ...(article.seoKeywords ?? []),
    ...(article.sections ?? []).flatMap((section) => [
      section.heading,
      ...section.paragraphs,
    ]),
  ]
    .filter(Boolean)
    .join(" \n ")
    .toLocaleLowerCase("sv-SE");
}

function countMarkers(text: string, markers: readonly string[]): number {
  return markers.reduce((total, marker) => {
    let count = 0;
    let from = 0;
    while (true) {
      const index = text.indexOf(marker, from);
      if (index === -1) break;
      count += 1;
      from = index + marker.length;
    }
    return total + count;
  }, 0);
}

function validateImagePath(
  value: string | null | undefined,
  field: string,
  publicDir: string,
  issues: AutoredaktionValidationIssue[],
) {
  if (value === null || value === undefined) return;

  if (!isNonEmptyString(value)) {
    addIssue(issues, "invalid_image_path", `${field} is empty.`);
    return;
  }

  if (/^https?:\/\//i.test(value)) {
    addIssue(
      issues,
      "external_image_unverifiable",
      `${field} uses an external URL. Autonomous publishing only accepts a verified local public asset or null.`,
    );
    return;
  }

  if (!value.startsWith("/")) {
    addIssue(
      issues,
      "invalid_image_path",
      `${field} must be an absolute public path beginning with /, or null.`,
    );
    return;
  }

  const cleanPath = value.split(/[?#]/, 1)[0];
  const publicRoot = path.resolve(publicDir);
  const resolved = path.resolve(publicRoot, `.${cleanPath}`);
  const insidePublic =
    resolved === publicRoot || resolved.startsWith(`${publicRoot}${path.sep}`);

  if (!insidePublic || !existsSync(resolved)) {
    addIssue(
      issues,
      "missing_image_asset",
      `${field} points to a missing or unsafe public asset: ${value}`,
    );
  }
}

function validateRequiredText(
  value: unknown,
  field: string,
  issues: AutoredaktionValidationIssue[],
) {
  if (!isNonEmptyString(value)) {
    addIssue(issues, `missing_${field}`, `${field} must be a non-empty string.`);
    return;
  }

  if (PLACEHOLDER_PATTERN.test(value)) {
    addIssue(
      issues,
      "placeholder_text",
      `${field} contains obvious placeholder text.`,
    );
  }
}

function validateSeries(
  article: NewsArticle,
  series: AutoredaktionSeries,
  issues: AutoredaktionValidationIssue[],
) {
  const text = articleText(article);
  const foreignHits = countMarkers(text, FOREIGN_MARKERS);

  if (series === "borssverige") {
    if (!article.slug?.startsWith("borssverige-")) {
      addIssue(
        issues,
        "series_slug_mismatch",
        "BörsSverige slug must begin with borssverige-.",
      );
    }
    if (!/^börssverige\b/i.test(article.title)) {
      addIssue(
        issues,
        "series_title_mismatch",
        "BörsSverige title must identify the BörsSverige series.",
      );
    }

    const localHits = countMarkers(text, SWEDEN_MARKERS);
    if (localHits < 4) {
      addIssue(
        issues,
        "borssverige_sweden_focus_too_weak",
        `BörsSverige has too few explicit Swedish-market signals (${localHits}).`,
      );
    }
    if (foreignHits >= 5 && foreignHits > localHits) {
      addIssue(
        issues,
        "borssverige_foreign_dominance",
        `Foreign-market signals (${foreignHits}) dominate Swedish-market signals (${localHits}).`,
      );
    }
  } else {
    if (!article.slug?.startsWith("norden-i-centrum-")) {
      addIssue(
        issues,
        "series_slug_mismatch",
        "Norden i centrum slug must begin with norden-i-centrum-.",
      );
    }
    if (!/^norden i centrum\b/i.test(article.title)) {
      addIssue(
        issues,
        "series_title_mismatch",
        "Title must identify the Norden i centrum series.",
      );
    }

    const localHits = countMarkers(text, NORDIC_MARKERS);
    if (localHits < 4) {
      addIssue(
        issues,
        "norden_focus_too_weak",
        `Norden i centrum has too few explicit Nordic-market signals (${localHits}).`,
      );
    }
    if (foreignHits >= 6 && foreignHits > localHits * 1.5) {
      addIssue(
        issues,
        "norden_foreign_dominance",
        `Foreign-market signals (${foreignHits}) dominate Nordic-market signals (${localHits}).`,
      );
    }
  }

  const published = new Date(article.publishedAt);
  if (!Number.isNaN(published.getTime())) {
    const { hour } = stockholmParts(published);
    const preOpenReaction =
      /\b(?:aktien|aktierna|stockholmsbörsen|omxs30)\b.{0,80}\b(?:stiger|rusar|faller|sjunker|backar)\b/i;
    if (hour < 9 && preOpenReaction.test(text)) {
      addIssue(
        issues,
        "preopen_market_reaction",
        "Article published before 09:00 Europe/Stockholm contains a present-tense Swedish market reaction. Use verified prior-session wording or wait for the market to open.",
      );
    }
  }
}

export function isNewsArticleLike(value: unknown): value is NewsArticle {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<NewsArticle>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.publishedAt === "string"
  );
}

export function validateAutoredaktionArticle(
  article: NewsArticle,
  series: AutoredaktionSeries,
  options: ValidateArticleOptions,
): AutoredaktionValidationResult {
  const issues: AutoredaktionValidationIssue[] = [];
  const now = options.now ?? new Date();
  const publicDir = options.publicDir ?? path.join(process.cwd(), "public");

  validateRequiredText(article.id, "id", issues);
  validateRequiredText(article.slug, "slug", issues);
  validateRequiredText(article.title, "title", issues);
  validateRequiredText(article.summary, "summary", issues);
  validateRequiredText(article.seoTitle, "seo_title", issues);
  validateRequiredText(article.seoDescription, "seo_description", issues);

  if (article.slug && !SLUG_PATTERN.test(article.slug)) {
    addIssue(
      issues,
      "invalid_slug",
      "slug must contain lowercase letters/numbers separated by single hyphens.",
    );
  }

  if (!NEWS_CATEGORIES.has(article.category)) {
    addIssue(issues, "invalid_category", `Unknown news category: ${article.category}`);
  }

  if (article.source !== "DivLab Redaktion") {
    addIssue(
      issues,
      "invalid_author",
      'Autonomous articles must use source/author "DivLab Redaktion".',
    );
  }

  if (article.url !== `/news/${article.slug}`) {
    addIssue(
      issues,
      "url_slug_mismatch",
      `url must equal /news/${article.slug ?? "[slug]"}.`,
    );
  }

  const published = new Date(article.publishedAt);
  if (Number.isNaN(published.getTime())) {
    addIssue(issues, "invalid_published_at", "publishedAt must be a valid date-time.");
  } else {
    if (stockholmParts(published).date !== stockholmParts(now).date) {
      addIssue(
        issues,
        "unexpected_publication_date",
        "publishedAt must resolve to today's date in Europe/Stockholm for an autonomous morning article.",
      );
    }
    if (published.getTime() > now.getTime() + 15 * 60 * 1000) {
      addIssue(
        issues,
        "future_publication_time",
        "publishedAt is more than 15 minutes in the future.",
      );
    }
  }

  if (article.updatedAt !== undefined) {
    const updated = new Date(article.updatedAt);
    if (Number.isNaN(updated.getTime())) {
      addIssue(issues, "invalid_updated_at", "updatedAt must be a valid date-time.");
    } else if (!Number.isNaN(published.getTime())) {
      if (updated.getTime() < published.getTime()) {
        addIssue(issues, "updated_before_published", "updatedAt cannot precede publishedAt.");
      }
      if (updated.getTime() > now.getTime() + 15 * 60 * 1000) {
        addIssue(issues, "future_updated_at", "updatedAt is more than 15 minutes in the future.");
      }
    }
  }

  if (!Array.isArray(article.seoKeywords) || article.seoKeywords.length < 3) {
    addIssue(
      issues,
      "missing_seo_keywords",
      "seoKeywords must contain at least three natural search terms.",
    );
  } else {
    article.seoKeywords.forEach((keyword, index) =>
      validateRequiredText(keyword, `seo_keyword_${index}`, issues),
    );
  }

  if (!Array.isArray(article.intro) || article.intro.length === 0) {
    addIssue(issues, "missing_intro", "intro must contain at least one paragraph.");
  } else {
    article.intro.forEach((paragraph, index) =>
      validateRequiredText(paragraph, `intro_${index}`, issues),
    );
  }

  if (!Array.isArray(article.sections) || article.sections.length === 0) {
    addIssue(issues, "missing_sections", "sections must contain at least one section.");
  } else {
    article.sections.forEach((section, sectionIndex) => {
      validateRequiredText(section.heading, `section_${sectionIndex}_heading`, issues);
      if (!Array.isArray(section.paragraphs) || section.paragraphs.length === 0) {
        addIssue(
          issues,
          "missing_section_paragraphs",
          `Section ${sectionIndex + 1} must contain at least one paragraph.`,
        );
      } else {
        section.paragraphs.forEach((paragraph, paragraphIndex) =>
          validateRequiredText(
            paragraph,
            `section_${sectionIndex}_paragraph_${paragraphIndex}`,
            issues,
          ),
        );
      }

      if (section.inlineImage) {
        validateImagePath(
          section.inlineImage.src,
          `sections[${sectionIndex}].inlineImage.src`,
          publicDir,
          issues,
        );
        validateRequiredText(
          section.inlineImage.alt,
          `section_${sectionIndex}_inline_image_alt`,
          issues,
        );
      }
    });
  }

  if (!Number.isInteger(article.readingMinutes) || (article.readingMinutes ?? 0) < 1) {
    addIssue(
      issues,
      "invalid_reading_minutes",
      "readingMinutes must be a positive integer.",
    );
  }

  if (article.showDisclaimer !== true) {
    addIssue(
      issues,
      "missing_disclaimer",
      "Autonomous articles must enable the standard disclaimer.",
    );
  }

  const linkSignals = article.internalLinking
    ? [
        ...(article.internalLinking.topics ?? []),
        ...(article.internalLinking.companies ?? []),
        ...(article.internalLinking.tickers ?? []),
        ...(article.internalLinking.relatedNewsSlugs ?? []),
        ...(article.internalLinking.relatedLearningSlugs ?? []),
      ]
    : [];
  if (linkSignals.length === 0) {
    addIssue(
      issues,
      "missing_internal_linking",
      "internalLinking must contain at least one useful editorial signal.",
    );
  }

  validateImagePath(article.imageUrl, "imageUrl", publicDir, issues);
  validateImagePath(
    article.thumbnailImageUrl,
    "thumbnailImageUrl",
    publicDir,
    issues,
  );

  const slugMatches = options.allArticles.filter(
    (candidate) => candidate.slug === article.slug,
  );
  if (slugMatches.length !== 1) {
    addIssue(
      issues,
      slugMatches.length === 0 ? "article_not_registered" : "duplicate_slug",
      `Expected exactly one published article with slug ${article.slug}; found ${slugMatches.length}.`,
    );
  }

  const idMatches = options.allArticles.filter(
    (candidate) => candidate.id === article.id,
  );
  if (idMatches.length !== 1) {
    addIssue(
      issues,
      idMatches.length === 0 ? "article_not_registered" : "duplicate_id",
      `Expected exactly one published article with id ${article.id}; found ${idMatches.length}.`,
    );
  }

  if (article.slug) {
    const canonical = getCanonicalUrl(`/news/${article.slug}`);
    if (canonical !== `https://divlab.se/news/${article.slug}`) {
      addIssue(
        issues,
        "invalid_canonical",
        `Canonical resolved unexpectedly: ${canonical}`,
      );
    }
  }

  validateSeries(article, series, issues);

  return { ok: issues.length === 0, issues };
}

export function validateResearchCutoffComment(
  sourceText: string,
): AutoredaktionValidationResult {
  const issues: AutoredaktionValidationIssue[] = [];
  if (!/Editorial research cutoff:\s*[^\n]+/i.test(sourceText)) {
    addIssue(
      issues,
      "missing_research_cutoff",
      "Article source must contain an Editorial research cutoff comment.",
    );
  }
  return { ok: issues.length === 0, issues };
}

function extractRegistryImports(source: string): Map<string, string> {
  const imports = new Map<string, string>();
  const pattern =
    /^import\s+\{\s*([A-Z0-9_]+)\s*\}\s+from\s+"@\/data\/news-articles\/([^"]+)";/gm;
  for (const match of source.matchAll(pattern)) {
    imports.set(match[1], match[2]);
  }
  return imports;
}

function extractPublishedSymbols(source: string): Set<string> {
  return new Set(
    [...source.matchAll(/applyNewsSearchSeo\(([A-Z0-9_]+)\)/g)].map(
      (match) => match[1],
    ),
  );
}

export function validateRegistryPreservesBase(
  baseSource: string,
  currentSource: string,
): AutoredaktionValidationResult {
  const issues: AutoredaktionValidationIssue[] = [];
  const baseImports = extractRegistryImports(baseSource);
  const currentImports = extractRegistryImports(currentSource);
  const basePublished = extractPublishedSymbols(baseSource);
  const currentPublished = extractPublishedSymbols(currentSource);

  for (const [symbol, modulePath] of baseImports) {
    if (currentImports.get(symbol) !== modulePath) {
      addIssue(
        issues,
        "stale_registry_write",
        `Current registry lost or changed existing import ${symbol} from ${modulePath}. Refresh from latest main before publishing.`,
      );
    }
    if (basePublished.has(symbol) && !currentPublished.has(symbol)) {
      addIssue(
        issues,
        "stale_registry_write",
        `Current registry lost existing published entry ${symbol}. Refresh from latest main before publishing.`,
      );
    }
  }

  return { ok: issues.length === 0, issues };
}

export function validateRegistryContainsEntry(
  source: string,
  entry: RegistryEntry,
): AutoredaktionValidationResult {
  const issues: AutoredaktionValidationIssue[] = [];
  const imports = extractRegistryImports(source);
  const published = extractPublishedSymbols(source);

  if (imports.get(entry.exportName) !== entry.modulePath) {
    addIssue(
      issues,
      "missing_registry_import",
      `Registry must import ${entry.exportName} from ${entry.modulePath}.`,
    );
  }
  if (!published.has(entry.exportName)) {
    addIssue(
      issues,
      "missing_registry_entry",
      `Registry must publish applyNewsSearchSeo(${entry.exportName}).`,
    );
  }

  return { ok: issues.length === 0, issues };
}

export function upsertAutoredaktionRegistrySource(
  source: string,
  entry: RegistryEntry,
): string {
  const importLine = `import { ${entry.exportName} } from "@/data/news-articles/${entry.modulePath}";`;
  const publishLine = `  applyNewsSearchSeo(${entry.exportName}),`;
  let next = source;

  const imports = extractRegistryImports(next);
  const existingPathForSymbol = imports.get(entry.exportName);
  const existingSymbolForPath = [...imports.entries()].find(
    ([, modulePath]) => modulePath === entry.modulePath,
  )?.[0];

  if (existingPathForSymbol && existingPathForSymbol !== entry.modulePath) {
    throw new Error(
      `Export ${entry.exportName} is already imported from ${existingPathForSymbol}.`,
    );
  }
  if (existingSymbolForPath && existingSymbolForPath !== entry.exportName) {
    throw new Error(
      `Module ${entry.modulePath} is already imported as ${existingSymbolForPath}.`,
    );
  }

  if (!next.includes(importLine)) {
    const importAnchor = 'import { DEMO_NEWS_ARTICLES } from "@/data/news-demo";';
    if (!next.includes(importAnchor)) {
      throw new Error("Could not find news registry import anchor.");
    }
    next = next.replace(importAnchor, `${importLine}\n${importAnchor}`);
  }

  if (!extractPublishedSymbols(next).has(entry.exportName)) {
    const listAnchor = "const PUBLISHED_NEWS_ARTICLES: NewsArticle[] = [";
    if (!next.includes(listAnchor)) {
      throw new Error("Could not find PUBLISHED_NEWS_ARTICLES anchor.");
    }
    next = next.replace(listAnchor, `${listAnchor}\n${publishLine}`);
  }

  return next;
}
