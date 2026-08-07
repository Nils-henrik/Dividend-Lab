/**
 * Map Learning retrieval hits to DivBrainSource (Ticket 1C-1).
 *
 * Article prose remains ordinary untrusted source text for later context
 * assembly — never promoted to system/policy instructions here.
 */

import {
  DIVBRAIN_SOURCE_ATTRIBUTION_MAX_LENGTH,
  DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH,
  DIVBRAIN_SOURCE_SCHEMA_VERSION,
  type DivBrainSource,
  validateDivBrainSource,
} from "../../sources";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import {
  DIVBRAIN_LEARNING_RETRIEVAL_MAX_EXCERPT_LENGTH,
  DIVBRAIN_LEARNING_SOURCE_PUBLISHER,
} from "./constants";
import type { DivBrainLearningScoredCandidate } from "./score";
import type { DivBrainLearningCitationInput } from "./types";

function boundedAttribution(heading?: string): string {
  const base = heading
    ? `DivLab Learning · ${heading.trim()}`
    : "DivLab Learning";
  if (base.length <= DIVBRAIN_SOURCE_ATTRIBUTION_MAX_LENGTH) {
    return base;
  }
  return base.slice(0, DIVBRAIN_SOURCE_ATTRIBUTION_MAX_LENGTH).trimEnd();
}

/**
 * Neutralize markup-like characters so Learning prose validates as plain
 * source text. Angle brackets never become HTML/policy instructions.
 */
function sanitizeLearningExcerpt(text: string): string {
  return text
    .replace(/[<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateExcerpt(text: string, maxLength: number): string {
  const normalized = sanitizeLearningExcerpt(text);
  if (!normalized) {
    return "";
  }

  const limit = Math.min(maxLength, DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH);
  if (normalized.length <= limit) {
    return normalized;
  }

  const sliced = normalized.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(" ");
  const clipped =
    lastSpace > Math.floor(limit * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  return `${clipped.trimEnd()}…`;
}

function buildExcerpt(candidate: DivBrainLearningScoredCandidate): string {
  const heading = candidate.section.heading?.trim();
  const body = candidate.section.bodyText.trim();
  const intro = candidate.record.introText.trim();
  const articleExcerpt = candidate.record.excerpt.trim();

  const parts: string[] = [];
  if (heading) {
    parts.push(heading);
  }
  if (body) {
    parts.push(body);
  } else if (intro) {
    parts.push(intro);
  } else if (articleExcerpt) {
    parts.push(articleExcerpt);
  }

  return truncateExcerpt(
    parts.join(". "),
    DIVBRAIN_LEARNING_RETRIEVAL_MAX_EXCERPT_LENGTH,
  );
}

/**
 * Opaque record reference for Learning articles.
 * Validated by `validateDivBrainRecordRef` (no URL / protocol chars).
 */
export function learningRecordRef(slug: string): string {
  return `learning/${slug}`;
}

export function learningSourceId(slug: string): string {
  return `learning:${slug}`;
}

/**
 * Build citation-ready inputs that share identifiers with the source.
 */
export function toLearningCitationInput(
  candidate: DivBrainLearningScoredCandidate,
): DivBrainLearningCitationInput {
  const sourceId = learningSourceId(candidate.record.slug);
  const heading = candidate.section.heading?.trim();
  const citation: DivBrainLearningCitationInput = {
    sourceId,
    label: candidate.record.title,
  };

  if (heading) {
    citation.excerptRef = heading;
    citation.location = {
      heading,
      section: `section-${candidate.section.sectionIndex}`,
    };
  } else {
    citation.location = {
      section: `section-${candidate.section.sectionIndex}`,
    };
  }

  return citation;
}

/**
 * Map a scored Learning candidate to a validated DivBrainSource.
 * Routes are always `/learning/<slug>` from the corpus — never external URLs.
 */
export function learningCandidateToSource(
  candidate: DivBrainLearningScoredCandidate,
): DivBrainResult<DivBrainSource> {
  const excerpt = buildExcerpt(candidate);
  const publishedAt =
    candidate.record.publishedAt ?? candidate.record.updatedAt;
  const dataAsOf =
    candidate.record.updatedAt ?? candidate.record.publishedAt;

  return validateDivBrainSource({
    id: learningSourceId(candidate.record.slug),
    title: candidate.record.title,
    category: "divlab_learning",
    verificationState: "internally_curated",
    freshnessState: "current",
    publisher: DIVBRAIN_LEARNING_SOURCE_PUBLISHER,
    publishedAt,
    dataAsOf,
    attribution: boundedAttribution(candidate.section.heading),
    excerpt: excerpt || undefined,
    internalRoute: candidate.record.internalRoute,
    recordRef: learningRecordRef(candidate.record.slug),
    schemaVersion: DIVBRAIN_SOURCE_SCHEMA_VERSION,
  });
}

/**
 * Map ranked candidates to sources; fail closed on invalid emission.
 */
export function learningCandidatesToSources(
  candidates: readonly DivBrainLearningScoredCandidate[],
): DivBrainResult<DivBrainSource[]> {
  const sources: DivBrainSource[] = [];

  for (const candidate of candidates) {
    const result = learningCandidateToSource(candidate);
    if (!result.ok) {
      return result;
    }

    if (
      !result.data.internalRoute ||
      !result.data.internalRoute.startsWith("/learning/") ||
      result.data.canonicalUrl !== undefined
    ) {
      return divBrainFailureFromCode("invalid_request");
    }

    sources.push(result.data);
  }

  return divBrainSuccess(sources);
}
