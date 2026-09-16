import type { NewsArticle } from "@/types/news";
import ts from "typescript";

import { parseIsoDateTime, stockholmCalendarDate } from "./dates";
import { fail, type ValidationIssue } from "./types";

const ISO_CUTOFF_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{3}))?(Z|([+-])(\d{2}):(\d{2}))$/;
const CUTOFF_DECLARATION = /^Editorial research cutoff:\s+(\S+)$/;
const P0_PASS_DECLARATION = /^P0_FACT_GATE=PASS$/;
const P0_SOURCE_DECLARATION =
  /^P0_SOURCE\[(primary|secondary)\]:\s+(\S+)$/;
const RESERVED_P0_PREFIX = /Editorial research cutoff|P0_/i;
const RESERVED_P0_OCCURRENCE = /Editorial research cutoff|P0_/gi;

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

type P0Declarations = {
  cutoffValues: string[];
  passCount: number;
  sources: P0SourceDeclaration[];
};

function exportedArticleDeclarations(
  sourceFile: ts.SourceFile,
): Array<{ statement: ts.VariableStatement; declaration: ts.VariableDeclaration }> {
  return sourceFile.statements.flatMap((statement) => {
    if (
      !ts.isVariableStatement(statement) ||
      !statement.modifiers?.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      )
    ) {
      return [];
    }

    return statement.declarationList.declarations.flatMap((declaration) => {
      let initializer = declaration.initializer;
      while (initializer) {
        if (
          ts.isParenthesizedExpression(initializer) ||
          ts.isAsExpression(initializer) ||
          ts.isTypeAssertionExpression(initializer) ||
          ts.isSatisfiesExpression(initializer)
        ) {
          initializer = initializer.expression;
          continue;
        }
        break;
      }
      if (!initializer || !ts.isObjectLiteralExpression(initializer)) return [];

      const propertyNames = new Set(
        initializer.properties.flatMap((property) => {
          const name = property.name;
          if (
            name &&
            (ts.isIdentifier(name) ||
              ts.isStringLiteral(name) ||
              ts.isNoSubstitutionTemplateLiteral(name))
          ) {
            return [name.text];
          }
          return [];
        }),
      );
      return ["id", "title", "publishedAt"].every((name) => propertyNames.has(name))
        ? [{ statement, declaration }]
        : [];
    });
  });
}

function canonicalEditorialComment(input: {
  sourceText: string;
  issues: ValidationIssue[];
}): string | null {
  const sourceFile = ts.createSourceFile(
    "managed-article.ts",
    input.sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const articleDeclarations = exportedArticleDeclarations(sourceFile);
  if (articleDeclarations.length !== 1) {
    input.issues.push(
      fail(
        "p0-article-declaration",
        `Expected exactly one exported article object for the editorial P0 comment; found ${articleDeclarations.length}.`,
      ),
    );
  }

  const statement = articleDeclarations[0]?.statement;
  const leadingComments = statement
    ? (ts.getLeadingCommentRanges(
        input.sourceText,
        statement.getFullStart(),
      ) ?? [])
    : [];
  const nearestLeadingComment = leadingComments.at(-1);
  const canonicalRange =
    nearestLeadingComment?.kind === ts.SyntaxKind.MultiLineCommentTrivia &&
    RESERVED_P0_PREFIX.test(
      input.sourceText.slice(
        nearestLeadingComment.pos,
        nearestLeadingComment.end,
      ),
    )
      ? nearestLeadingComment
      : null;

  if (!canonicalRange) {
    input.issues.push(
      fail(
        "p0-editorial-comment",
        "P0 declarations must be in the canonical block comment immediately preceding the exported article object.",
      ),
    );
  }

  const outsideOccurrences = [
    ...input.sourceText.matchAll(RESERVED_P0_OCCURRENCE),
  ].filter((match) => {
    const index = match.index;
    return (
      index === undefined ||
      !canonicalRange ||
      index < canonicalRange.pos ||
      index >= canonicalRange.end
    );
  });
  if (outsideOccurrences.length > 0) {
    input.issues.push(
      fail(
        "p0-reserved-outside-comment",
        `Reserved P0 declarations are allowed only in the canonical editorial block comment; found ${outsideOccurrences.length} outside it.`,
      ),
    );
  }

  return canonicalRange
    ? input.sourceText.slice(canonicalRange.pos, canonicalRange.end)
    : null;
}

function parseDeclarations(
  comment: string | null,
  issues: ValidationIssue[],
): P0Declarations {
  const declarations: P0Declarations = {
    cutoffValues: [],
    passCount: 0,
    sources: [],
  };
  if (!comment) return declarations;

  const body = comment.slice(2, -2);
  for (const rawLine of body.split(/\r\n|[\n\r\u2028\u2029]/)) {
    const line = rawLine.replace(/^\s*\*\s?/, "").trim();
    if (!RESERVED_P0_PREFIX.test(line)) continue;

    const cutoff = CUTOFF_DECLARATION.exec(line);
    if (cutoff) {
      declarations.cutoffValues.push(cutoff[1]);
      continue;
    }
    if (P0_PASS_DECLARATION.test(line)) {
      declarations.passCount += 1;
      continue;
    }
    const source = P0_SOURCE_DECLARATION.exec(line);
    if (source) {
      declarations.sources.push({
        kind: source[1] as P0SourceKind,
        href: source[2],
      });
      continue;
    }

    issues.push(
      fail(
        "p0-declaration-invalid",
        `Malformed, unknown or conflicting reserved P0 declaration: ${line}`,
      ),
    );
  }

  return declarations;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function parseStrictCutoff(value: string): Date | null {
  const match = ISO_CUTOFF_PATTERN.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const millisecond = Number(match[7] ?? "0");
  const offsetHour = Number(match[10] ?? "0");
  const offsetMinute = Number(match[11] ?? "0");
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  if (
    year === 0 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > (daysInMonth[month - 1] ?? 0) ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    offsetHour > 14 ||
    offsetMinute > 59 ||
    (offsetHour === 14 && offsetMinute !== 0)
  ) {
    return null;
  }

  const local = new Date(0);
  local.setUTCFullYear(year, month - 1, day);
  local.setUTCHours(hour, minute, second, millisecond);
  const offsetSign = match[9] === "-" ? -1 : 1;
  const offsetMilliseconds =
    offsetSign * (offsetHour * 60 + offsetMinute) * 60_000;
  const parsed = new Date(local.getTime() - offsetMilliseconds);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
  const editorialComment = canonicalEditorialComment({
    sourceText: input.sourceText,
    issues,
  });
  const declarations = parseDeclarations(editorialComment, issues);

  let cutoff: Date | null = null;
  if (declarations.cutoffValues.length !== 1) {
    issues.push(
      fail(
        "p0-cutoff-count",
        `Expected exactly one machine-readable Editorial research cutoff; found ${declarations.cutoffValues.length}.`,
      ),
    );
  } else {
    const rawCutoff = declarations.cutoffValues[0];
    cutoff = parseStrictCutoff(rawCutoff);
    if (!cutoff) {
      issues.push(
        fail(
          "p0-cutoff-invalid",
          "Editorial research cutoff must be an exact ISO 8601 date-time with seconds and an explicit UTC offset.",
        ),
      );
    }
  }

  if (declarations.passCount !== 1) {
    issues.push(
      fail(
        "p0-pass",
        `Expected exactly one literal P0_FACT_GATE=PASS attestation; found ${declarations.passCount}.`,
      ),
    );
  }

  const declaredSources = declarations.sources;
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
