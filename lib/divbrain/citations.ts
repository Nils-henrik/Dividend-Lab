/**
 * DivBrain numbered citation model — shared by server and client.
 *
 * Citations reference source ids; they do not embed full source objects.
 * Visual citation UI belongs to later tickets.
 *
 * Citation builders:
 * - `buildDivBrainCitationsFromSources` — one citation entry per source
 * - `buildDivBrainCitationsForSourceIds` — one entry per appearance;
 *   repeated source ids reuse the same citation number
 *
 * Validated plain text is not safe for `dangerouslySetInnerHTML`.
 * Render with normal React text escaping.
 */

import { DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH } from "./constants";
import type { DivBrainResult } from "./results";
import { divBrainFailureFromCode, divBrainSuccess } from "./results";
import {
  containsHtmlLikeMarkup,
  normalizeDivBrainSources,
  resolveDivBrainSourceId,
  type DivBrainSource,
  type DivBrainSourceIdAliases,
  validateDivBrainSourceId,
} from "./sources";

export const DIVBRAIN_CITATION_LABEL_MAX_LENGTH = 200;
export const DIVBRAIN_CITATION_EXCERPT_REF_MAX_LENGTH = 240;
export const DIVBRAIN_CITATION_LOCATION_FIELD_MAX_LENGTH = 120;
export const DIVBRAIN_GROUNDED_ANSWER_TEXT_MAX_LENGTH =
  DIVBRAIN_MESSAGE_CONTENT_MAX_LENGTH;

/**
 * Numbered citation within one DivBrain answer.
 * `number` is 1-based and stable for a given deduped source list.
 */
export type DivBrainCitation = {
  number: number;
  sourceId: string;
  /** Short citation label — not a generated claim presented as evidence. */
  label?: string;
  excerptRef?: string;
  location?: DivBrainCitationLocation;
};

export type DivBrainCitationLocation = {
  page?: string;
  section?: string;
  heading?: string;
  recordField?: string;
};

/**
 * Grounded assistant payload for later provider/UI wiring.
 * Answer text is separate from evidence.
 * Final sources must all be cited — unused sources are rejected.
 */
export type DivBrainGroundedAnswer = {
  text: string;
  sources: DivBrainSource[];
  citations: DivBrainCitation[];
};

const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function failure(): DivBrainResult<never> {
  return divBrainFailureFromCode("invalid_request");
}

function normalizeOptionalCitationText(
  value: unknown,
  maxLength: number,
): DivBrainResult<string | undefined> {
  if (value === undefined || value === null) {
    return divBrainSuccess(undefined);
  }

  if (typeof value !== "string") {
    return failure();
  }

  const normalized = value.trim();

  if (!normalized) {
    return divBrainSuccess(undefined);
  }

  if (
    normalized.length > maxLength ||
    CONTROL_CHARS_PATTERN.test(normalized) ||
    containsHtmlLikeMarkup(normalized)
  ) {
    return failure();
  }

  return divBrainSuccess(normalized);
}

function validateCitationLocation(
  value: unknown,
): DivBrainResult<DivBrainCitationLocation | undefined> {
  if (value === undefined || value === null) {
    return divBrainSuccess(undefined);
  }

  if (typeof value !== "object" || Array.isArray(value)) {
    return failure();
  }

  const candidate = value as Record<string, unknown>;
  const allowedKeys = new Set(["page", "section", "heading", "recordField"]);

  for (const key of Object.keys(candidate)) {
    if (!allowedKeys.has(key)) {
      return failure();
    }
  }

  const pageResult = normalizeOptionalCitationText(
    candidate.page,
    DIVBRAIN_CITATION_LOCATION_FIELD_MAX_LENGTH,
  );
  if (!pageResult.ok) {
    return pageResult;
  }

  const sectionResult = normalizeOptionalCitationText(
    candidate.section,
    DIVBRAIN_CITATION_LOCATION_FIELD_MAX_LENGTH,
  );
  if (!sectionResult.ok) {
    return sectionResult;
  }

  const headingResult = normalizeOptionalCitationText(
    candidate.heading,
    DIVBRAIN_CITATION_LOCATION_FIELD_MAX_LENGTH,
  );
  if (!headingResult.ok) {
    return headingResult;
  }

  const recordFieldResult = normalizeOptionalCitationText(
    candidate.recordField,
    DIVBRAIN_CITATION_LOCATION_FIELD_MAX_LENGTH,
  );
  if (!recordFieldResult.ok) {
    return recordFieldResult;
  }

  const location: DivBrainCitationLocation = {};
  if (pageResult.data !== undefined) {
    location.page = pageResult.data;
  }
  if (sectionResult.data !== undefined) {
    location.section = sectionResult.data;
  }
  if (headingResult.data !== undefined) {
    location.heading = headingResult.data;
  }
  if (recordFieldResult.data !== undefined) {
    location.recordField = recordFieldResult.data;
  }

  if (Object.keys(location).length === 0) {
    return divBrainSuccess(undefined);
  }

  return divBrainSuccess(location);
}

type DivBrainCitationInput = {
  number?: unknown;
  sourceId: unknown;
  label?: unknown;
  excerptRef?: unknown;
  location?: unknown;
};

export function validateDivBrainCitation(
  input: DivBrainCitationInput | DivBrainCitation,
): DivBrainResult<DivBrainCitation> {
  const sourceIdResult = validateDivBrainSourceId(input.sourceId);
  if (!sourceIdResult.ok) {
    return sourceIdResult;
  }

  if (
    typeof input.number !== "number" ||
    !Number.isInteger(input.number) ||
    input.number < 1
  ) {
    return failure();
  }

  const labelResult = normalizeOptionalCitationText(
    input.label,
    DIVBRAIN_CITATION_LABEL_MAX_LENGTH,
  );
  if (!labelResult.ok) {
    return labelResult;
  }

  const excerptRefResult = normalizeOptionalCitationText(
    input.excerptRef,
    DIVBRAIN_CITATION_EXCERPT_REF_MAX_LENGTH,
  );
  if (!excerptRefResult.ok) {
    return excerptRefResult;
  }

  const locationResult = validateCitationLocation(input.location);
  if (!locationResult.ok) {
    return locationResult;
  }

  const output: DivBrainCitation = {
    number: input.number,
    sourceId: sourceIdResult.data,
  };

  if (labelResult.data !== undefined) {
    output.label = labelResult.data;
  }
  if (excerptRefResult.data !== undefined) {
    output.excerptRef = excerptRefResult.data;
  }
  if (locationResult.data !== undefined) {
    output.location = locationResult.data;
  }

  return divBrainSuccess(output);
}

/**
 * Enforce:
 * - one sourceId ↔ one citation number
 * - distinct numbers form contiguous 1..N
 * - orphan sourceIds are rejected by the caller via `sources`
 */
function enforceCitationNumberConsistency(
  citations: readonly DivBrainCitation[],
): DivBrainResult<void> {
  const numberBySourceId = new Map<string, number>();
  const sourceIdByNumber = new Map<number, string>();

  for (const citation of citations) {
    const existingNumber = numberBySourceId.get(citation.sourceId);
    if (existingNumber !== undefined && existingNumber !== citation.number) {
      return failure();
    }

    const existingSourceId = sourceIdByNumber.get(citation.number);
    if (
      existingSourceId !== undefined &&
      existingSourceId !== citation.sourceId
    ) {
      return failure();
    }

    numberBySourceId.set(citation.sourceId, citation.number);
    sourceIdByNumber.set(citation.number, citation.sourceId);
  }

  const distinctCount = numberBySourceId.size;
  if (distinctCount === 0) {
    return divBrainSuccess(undefined);
  }

  const numbers = [...sourceIdByNumber.keys()].sort((a, b) => a - b);
  if (numbers.length !== distinctCount) {
    return failure();
  }

  for (let index = 0; index < distinctCount; index += 1) {
    if (numbers[index] !== index + 1) {
      return failure();
    }
  }

  return divBrainSuccess(undefined);
}

/**
 * Build 1-based citations matching first-appearance order of deduped sources.
 * One source → one citation entry/number.
 */
export function buildDivBrainCitationsFromSources(
  sources: readonly DivBrainSource[],
): DivBrainCitation[] {
  return sources.map((source, index) => ({
    number: index + 1,
    sourceId: source.id,
  }));
}

/**
 * Build citation entries for a sequence of source ids (e.g. in-answer order).
 * Reuses the first-assigned number when the same sourceId reappears
 * (several occurrences may share one source number).
 * Fails if any id is missing from the provided source list.
 */
export function buildDivBrainCitationsForSourceIds(
  sourceIdsInAppearanceOrder: readonly string[],
  sources: readonly DivBrainSource[],
  sourceIdAliases: DivBrainSourceIdAliases = {},
): DivBrainResult<DivBrainCitation[]> {
  const sourceIds = new Set(sources.map((source) => source.id));
  const numberBySourceId = new Map<string, number>();
  const citations: DivBrainCitation[] = [];
  let nextNumber = 1;

  for (const sourceId of sourceIdsInAppearanceOrder) {
    const idResult = validateDivBrainSourceId(sourceId);
    if (!idResult.ok) {
      return idResult;
    }

    const canonicalId = resolveDivBrainSourceId(
      idResult.data,
      sourceIdAliases,
    );

    if (!sourceIds.has(canonicalId)) {
      return failure();
    }

    let number = numberBySourceId.get(canonicalId);
    if (number === undefined) {
      number = nextNumber;
      nextNumber += 1;
      numberBySourceId.set(canonicalId, number);
    }

    citations.push({
      number,
      sourceId: canonicalId,
    });
  }

  const consistency = enforceCitationNumberConsistency(citations);
  if (!consistency.ok) {
    return consistency;
  }

  return divBrainSuccess(citations);
}

/**
 * Validate citations and ensure every sourceId exists in `sources`.
 * Enforces stable 1..N numbering and one number per sourceId.
 * Does not imply cross-user authorization — repositories enforce ownership later.
 */
export function validateDivBrainCitations(
  citations: readonly (DivBrainCitationInput | DivBrainCitation)[],
  sources: readonly DivBrainSource[],
): DivBrainResult<DivBrainCitation[]> {
  const sourceIds = new Set(sources.map((source) => source.id));
  const validated: DivBrainCitation[] = [];

  for (const citation of citations) {
    const result = validateDivBrainCitation(citation);
    if (!result.ok) {
      return result;
    }

    if (!sourceIds.has(result.data.sourceId)) {
      return failure();
    }

    validated.push(result.data);
  }

  const consistency = enforceCitationNumberConsistency(validated);
  if (!consistency.ok) {
    return consistency;
  }

  return divBrainSuccess(validated);
}

function omitUndefinedFields(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldValue !== undefined) {
      output[key] = fieldValue;
    }
  }

  return output;
}

export function serializeDivBrainCitation(
  citation: DivBrainCitation,
): DivBrainResult<Record<string, unknown>> {
  const validated = validateDivBrainCitation(citation);
  if (!validated.ok) {
    return validated;
  }

  const location = validated.data.location
    ? omitUndefinedFields({ ...validated.data.location })
    : undefined;

  return divBrainSuccess(
    omitUndefinedFields({
      number: validated.data.number,
      sourceId: validated.data.sourceId,
      label: validated.data.label,
      excerptRef: validated.data.excerptRef,
      location:
        location && Object.keys(location).length > 0 ? location : undefined,
    }),
  );
}

export function serializeDivBrainCitations(
  citations: readonly DivBrainCitation[],
): DivBrainResult<Record<string, unknown>[]> {
  const serialized: Record<string, unknown>[] = [];

  for (const citation of citations) {
    const result = serializeDivBrainCitation(citation);
    if (!result.ok) {
      return result;
    }
    serialized.push(result.data);
  }

  return divBrainSuccess(serialized);
}

export function parseDivBrainCitation(
  value: unknown,
): DivBrainResult<DivBrainCitation> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return failure();
  }

  return validateDivBrainCitation(value as DivBrainCitationInput);
}

export function parseDivBrainCitations(
  value: unknown,
  sources: readonly DivBrainSource[],
): DivBrainResult<DivBrainCitation[]> {
  if (!Array.isArray(value)) {
    return failure();
  }

  return validateDivBrainCitations(value as DivBrainCitationInput[], sources);
}

type DivBrainGroundedAnswerInput = {
  text: unknown;
  sources: unknown;
  citations: unknown;
};

/**
 * Remap citation source IDs through aliases, preserve citation numbers,
 * then validate consistency. Conflicting numbers after alias resolution fail.
 */
function remapAndValidateCitations(
  citations: readonly (DivBrainCitationInput | DivBrainCitation)[],
  sources: readonly DivBrainSource[],
  sourceIdAliases: DivBrainSourceIdAliases,
): DivBrainResult<DivBrainCitation[]> {
  const canonicalSourceIds = new Set(sources.map((source) => source.id));
  const remapped: DivBrainCitation[] = [];

  for (const citation of citations) {
    const validated = validateDivBrainCitation(citation);
    if (!validated.ok) {
      return validated;
    }

    const canonicalId = resolveDivBrainSourceId(
      validated.data.sourceId,
      sourceIdAliases,
    );

    if (!canonicalSourceIds.has(canonicalId)) {
      return failure();
    }

    const next: DivBrainCitation = {
      number: validated.data.number,
      sourceId: canonicalId,
    };

    if (validated.data.label !== undefined) {
      next.label = validated.data.label;
    }
    if (validated.data.excerptRef !== undefined) {
      next.excerptRef = validated.data.excerptRef;
    }
    if (validated.data.location !== undefined) {
      next.location = validated.data.location;
    }

    remapped.push(next);
  }

  const consistency = enforceCitationNumberConsistency(remapped);
  if (!consistency.ok) {
    return consistency;
  }

  const citedSourceIds = new Set(remapped.map((citation) => citation.sourceId));
  for (const source of sources) {
    if (!citedSourceIds.has(source.id)) {
      return failure();
    }
  }

  return divBrainSuccess(remapped);
}

/**
 * Validate a complete grounded answer.
 *
 * Order:
 * 1. validate/normalize sources (dedupe + aliases)
 * 2. remap citation source IDs through aliases
 * 3. validate citation-number consistency (conflicts fail)
 * 4. reject orphan citations
 * 5. reject unused final sources
 *
 * Final payload contains only evidence actually cited by the answer.
 * Aliases are applied during validation and are not retained in the payload.
 */
export function validateDivBrainGroundedAnswer(
  input: DivBrainGroundedAnswerInput | DivBrainGroundedAnswer,
): DivBrainResult<DivBrainGroundedAnswer> {
  if (typeof input.text !== "string") {
    return failure();
  }

  const text = input.text.trim();
  if (
    !text ||
    text.length > DIVBRAIN_GROUNDED_ANSWER_TEXT_MAX_LENGTH ||
    CONTROL_CHARS_PATTERN.test(text) ||
    containsHtmlLikeMarkup(text)
  ) {
    return failure();
  }

  if (!Array.isArray(input.sources)) {
    return failure();
  }

  const sourcesResult = normalizeDivBrainSources(input.sources);
  if (!sourcesResult.ok) {
    return sourcesResult;
  }

  if (!Array.isArray(input.citations)) {
    return failure();
  }

  const citationsResult = remapAndValidateCitations(
    input.citations as DivBrainCitationInput[],
    sourcesResult.data.sources,
    sourcesResult.data.sourceIdAliases,
  );
  if (!citationsResult.ok) {
    return citationsResult;
  }

  return divBrainSuccess({
    text,
    sources: sourcesResult.data.sources,
    citations: citationsResult.data,
  });
}

export function parseDivBrainGroundedAnswer(
  value: unknown,
): DivBrainResult<DivBrainGroundedAnswer> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return failure();
  }

  return validateDivBrainGroundedAnswer(value as DivBrainGroundedAnswerInput);
}
