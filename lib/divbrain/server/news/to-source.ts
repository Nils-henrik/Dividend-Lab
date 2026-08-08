import {
  DIVBRAIN_SOURCE_ATTRIBUTION_MAX_LENGTH,
  DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH,
  DIVBRAIN_SOURCE_SCHEMA_VERSION,
  type DivBrainSource,
  validateDivBrainSource,
} from "../../sources";
import type { DivBrainResult } from "../../results";
import type { DivBrainLearningScoredCandidate } from "../learning/score";

const NEWS_EXCERPT_MAX_LENGTH = 900;

function calendarDate(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
  return match?.[1];
}

function sanitize(text: string): string {
  return text.replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string): string {
  const normalized = sanitize(text);
  const limit = Math.min(NEWS_EXCERPT_MAX_LENGTH, DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH);
  if (normalized.length <= limit) {
    return normalized;
  }
  const sliced = normalized.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(" ");
  const clipped = lastSpace > Math.floor(limit * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${clipped.trimEnd()}…`;
}

function attribution(heading?: string): string {
  const base = heading?.trim()
    ? `DivLab Börsnyheter · ${heading.trim()}`
    : "DivLab Börsnyheter";
  return base.length <= DIVBRAIN_SOURCE_ATTRIBUTION_MAX_LENGTH
    ? base
    : base.slice(0, DIVBRAIN_SOURCE_ATTRIBUTION_MAX_LENGTH).trimEnd();
}

function excerpt(candidate: DivBrainLearningScoredCandidate): string {
  const publication = candidate.record.publishedAt
    ? `Publicerad ${candidate.record.publishedAt}.`
    : "";
  const heading = candidate.section.heading?.trim() ?? "";
  const sectionBody = candidate.section.bodyText.trim();
  const fallback =
    sectionBody || candidate.record.introText.trim() || candidate.record.description.trim();

  return truncate([publication, heading, fallback].filter(Boolean).join(" "));
}

export function newsCandidateToDivBrainSource(
  candidate: DivBrainLearningScoredCandidate,
): DivBrainResult<DivBrainSource> {
  const publishedAt = calendarDate(candidate.record.publishedAt);

  return validateDivBrainSource({
    id: `news:${candidate.record.slug}`,
    title: candidate.record.title,
    category: "divlab_article",
    verificationState: "internally_curated",
    freshnessState: "dated",
    publisher: "DivLab",
    ...(publishedAt ? { publishedAt, dataAsOf: publishedAt } : {}),
    attribution: attribution(candidate.section.heading),
    excerpt: excerpt(candidate),
    internalRoute: candidate.record.internalRoute,
    recordRef: `news/${candidate.record.slug}`,
    schemaVersion: DIVBRAIN_SOURCE_SCHEMA_VERSION,
  });
}
