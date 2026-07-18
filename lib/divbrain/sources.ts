/**
 * DivBrain structured source model — shared by server and client.
 *
 * Retrieval, web search, provider calls and persistence belong in later
 * server-only tickets. This module defines evidence metadata only.
 * Generated DivBrain interpretation is never a source category.
 *
 * Validated plain text is not safe for `dangerouslySetInnerHTML`.
 * Render with normal React text escaping.
 */

import type { DivBrainResult } from "./results";
import { divBrainFailureFromCode, divBrainSuccess } from "./results";

/** Source-model schema version (domain constant; not a DB migration). */
export const DIVBRAIN_SOURCE_SCHEMA_VERSION = 1 as const;

/**
 * Canonical source categories (machine-stable).
 * Generated assistant text must never appear as a category.
 */
export const DIVBRAIN_SOURCE_CATEGORIES = [
  "divlab_learning",
  "divlab_article",
  "official_company_report",
  "official_authority",
  "exchange",
  "market_data_provider",
  "fund_document",
  "internal_structured_data",
  "user_provided",
  "external_unverified",
] as const;

export type DivBrainSourceCategory =
  (typeof DIVBRAIN_SOURCE_CATEGORIES)[number];

/** Optional Swedish UI labels — not used for machine identity. */
export const DIVBRAIN_SOURCE_CATEGORY_LABELS_SV: Record<
  DivBrainSourceCategory,
  string
> = {
  divlab_learning: "DivLab Utbildning",
  divlab_article: "DivLab-artikel",
  official_company_report: "Officiell bolagsrapport",
  official_authority: "Officiell myndighet",
  exchange: "Börs",
  market_data_provider: "Marknadsdataleverantör",
  fund_document: "Fonddokument",
  internal_structured_data: "Intern strukturerad data",
  user_provided: "Användarförsedd källa",
  external_unverified: "Extern overifierad källa",
};

/**
 * Trust / provenance. Independent of freshness:
 * a source may be verified but stale, or current but unverified.
 * `unavailable` means the source could not be used or confirmed.
 */
export const DIVBRAIN_SOURCE_VERIFICATION_STATES = [
  "verified",
  "internally_curated",
  "user_provided",
  "unverified",
  "unavailable",
] as const;

export type DivBrainSourceVerificationState =
  (typeof DIVBRAIN_SOURCE_VERIFICATION_STATES)[number];

/**
 * Time relevance. Independent of verification.
 * `unknown` must never be treated as `current`.
 */
export const DIVBRAIN_SOURCE_FRESHNESS_STATES = [
  "current",
  "dated",
  "stale",
  "unknown",
] as const;

export type DivBrainSourceFreshnessState =
  (typeof DIVBRAIN_SOURCE_FRESHNESS_STATES)[number];

/** Conservative text limits for source metadata (tunable without migration). */
export const DIVBRAIN_SOURCE_ID_MAX_LENGTH = 128;
export const DIVBRAIN_SOURCE_TITLE_MAX_LENGTH = 200;
export const DIVBRAIN_SOURCE_PUBLISHER_MAX_LENGTH = 120;
export const DIVBRAIN_SOURCE_ATTRIBUTION_MAX_LENGTH = 240;
/** Aligns with blueprint Learning excerpt guidance (~1_500). */
export const DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH = 1_500;
export const DIVBRAIN_SOURCE_URL_MAX_LENGTH = 2_000;
export const DIVBRAIN_SOURCE_INTERNAL_ROUTE_MAX_LENGTH = 500;
/** Opaque document/record identifier — not a URL or free-form blob. */
export const DIVBRAIN_SOURCE_RECORD_REF_MAX_LENGTH = 120;

/**
 * Canonical DivBrain source. JSON-serializable plain data only.
 * External URLs and internal routes are separate fields.
 */
export type DivBrainSource = {
  id: string;
  title: string;
  category: DivBrainSourceCategory;
  verificationState: DivBrainSourceVerificationState;
  freshnessState: DivBrainSourceFreshnessState;
  publisher?: string;
  /** Validated https URL only — never an internal path. */
  canonicalUrl?: string;
  /**
   * Publication timestamp:
   * - calendar date `YYYY-MM-DD`, or
   * - UTC instant `YYYY-MM-DDTHH:mm:ss(.sss)?Z`
   */
  publishedAt?: string;
  /** When DivBrain retrieved/attached the source — full UTC instant (`...Z`) only. */
  retrievedAt?: string;
  /**
   * As-of time of the underlying data:
   * - calendar date `YYYY-MM-DD`, or
   * - UTC instant `YYYY-MM-DDTHH:mm:ss(.sss)?Z`
   */
  dataAsOf?: string;
  attribution?: string;
  excerpt?: string;
  /** App path starting with `/` — not `//` and not a protocol URL. */
  internalRoute?: string;
  /**
   * Opaque document/record identifier only (e.g. report code, ISIN-like id).
   * Not a URL, email, credential, token, or provider payload.
   */
  recordRef?: string;
  schemaVersion?: typeof DIVBRAIN_SOURCE_SCHEMA_VERSION;
};

const CONTROL_CHARS_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
/**
 * Tag-shaped markup only. Comparison operators such as `P/E < 15` are allowed.
 * Ordinary HTML entities (e.g. `&amp;`) are not rejected solely for containing `&`.
 */
const HTML_LIKE_MARKUP_PATTERN =
  /<!--|-->|<!|<\?|<\/[A-Za-z]|<[A-Za-z]/;
const RECORD_REF_PATTERN = /^[A-Za-zÅÄÖåäö0-9][A-Za-zÅÄÖåäö0-9 \-_./#()]*$/;
const CALENDAR_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const UTC_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/;

function failure(): DivBrainResult<never> {
  return divBrainFailureFromCode("invalid_request");
}

function hasDisallowedControlChars(value: string): boolean {
  return CONTROL_CHARS_PATTERN.test(value);
}

/** True when text contains HTML/XML-like markup constructs — not bare `<`/`>`. */
export function containsHtmlLikeMarkup(value: string): boolean {
  return HTML_LIKE_MARKUP_PATTERN.test(value);
}

function isValidCalendarDateParts(
  year: number,
  month: number,
  day: number,
): boolean {
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const utc = new Date(Date.UTC(year, month - 1, day));

  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

/** Strict calendar date `YYYY-MM-DD` with real calendar validation. */
export function isDivBrainCalendarDate(value: string): boolean {
  const calendarMatch = CALENDAR_DATE_PATTERN.exec(value);
  if (!calendarMatch) {
    return false;
  }

  const year = Number(calendarMatch[1]);
  const month = Number(calendarMatch[2]);
  const day = Number(calendarMatch[3]);
  return isValidCalendarDateParts(year, month, day);
}

/**
 * Strict UTC instant `YYYY-MM-DDTHH:mm:ss(.sss)?Z`.
 * Does not use permissive Date.parse of arbitrary strings.
 */
export function isDivBrainUtcInstant(value: string): boolean {
  const dateTimeMatch = UTC_DATE_TIME_PATTERN.exec(value);
  if (!dateTimeMatch) {
    return false;
  }

  const year = Number(dateTimeMatch[1]);
  const month = Number(dateTimeMatch[2]);
  const day = Number(dateTimeMatch[3]);
  const hour = Number(dateTimeMatch[4]);
  const minute = Number(dateTimeMatch[5]);
  const second = Number(dateTimeMatch[6]);

  if (
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    !isValidCalendarDateParts(year, month, day)
  ) {
    return false;
  }

  return true;
}

/** Calendar date or UTC instant. */
export function isDivBrainTimestamp(value: string): boolean {
  return isDivBrainCalendarDate(value) || isDivBrainUtcInstant(value);
}

export function isDivBrainSourceCategory(
  value: unknown,
): value is DivBrainSourceCategory {
  return (
    typeof value === "string" &&
    (DIVBRAIN_SOURCE_CATEGORIES as readonly string[]).includes(value)
  );
}

export function isDivBrainSourceVerificationState(
  value: unknown,
): value is DivBrainSourceVerificationState {
  return (
    typeof value === "string" &&
    (DIVBRAIN_SOURCE_VERIFICATION_STATES as readonly string[]).includes(value)
  );
}

export function isDivBrainSourceFreshnessState(
  value: unknown,
): value is DivBrainSourceFreshnessState {
  return (
    typeof value === "string" &&
    (DIVBRAIN_SOURCE_FRESHNESS_STATES as readonly string[]).includes(value)
  );
}

function normalizeRequiredText(
  value: unknown,
  maxLength: number,
): DivBrainResult<string> {
  if (typeof value !== "string") {
    return failure();
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.length > maxLength ||
    hasDisallowedControlChars(normalized) ||
    containsHtmlLikeMarkup(normalized)
  ) {
    return failure();
  }

  return divBrainSuccess(normalized);
}

function normalizeOptionalText(
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
    hasDisallowedControlChars(normalized) ||
    containsHtmlLikeMarkup(normalized)
  ) {
    return failure();
  }

  return divBrainSuccess(normalized);
}

function normalizeOptionalTimestamp(
  value: unknown,
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

  if (hasDisallowedControlChars(normalized) || !isDivBrainTimestamp(normalized)) {
    return failure();
  }

  return divBrainSuccess(normalized);
}

function normalizeOptionalUtcInstant(
  value: unknown,
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
    hasDisallowedControlChars(normalized) ||
    !isDivBrainUtcInstant(normalized)
  ) {
    return failure();
  }

  return divBrainSuccess(normalized);
}

/**
 * Validate an opaque record/document reference.
 * Not a URL, email, credential, or unrestricted metadata blob.
 */
export function validateDivBrainRecordRef(
  value: unknown,
): DivBrainResult<string> {
  if (typeof value !== "string") {
    return failure();
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.length > DIVBRAIN_SOURCE_RECORD_REF_MAX_LENGTH ||
    hasDisallowedControlChars(normalized) ||
    containsHtmlLikeMarkup(normalized) ||
    !RECORD_REF_PATTERN.test(normalized) ||
    normalized.includes("://") ||
    normalized.includes("//") ||
    normalized.includes("@") ||
    normalized.includes("?") ||
    normalized.includes("=") ||
    normalized.includes(":")
  ) {
    return failure();
  }

  return divBrainSuccess(normalized);
}

/**
 * Validate an external canonical URL.
 * Syntactic validity does not imply trustworthiness.
 * Only `https:` is accepted for shared source metadata.
 */
export function validateDivBrainCanonicalUrl(
  value: unknown,
): DivBrainResult<string> {
  if (typeof value !== "string") {
    return failure();
  }

  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.length > DIVBRAIN_SOURCE_URL_MAX_LENGTH ||
    hasDisallowedControlChars(trimmed) ||
    trimmed.startsWith("//") ||
    !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    return failure();
  }

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("blob:")
  ) {
    return failure();
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return failure();
  }

  if (parsed.protocol !== "https:") {
    return failure();
  }

  if (parsed.username || parsed.password) {
    return failure();
  }

  if (!parsed.hostname) {
    return failure();
  }

  return divBrainSuccess(parsed.href);
}

/**
 * Validate an internal DivLab route (path only).
 * Must start with `/`, must not start with `//`, must not include a protocol.
 */
export function validateDivBrainInternalRoute(
  value: unknown,
): DivBrainResult<string> {
  if (typeof value !== "string") {
    return failure();
  }

  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.length > DIVBRAIN_SOURCE_INTERNAL_ROUTE_MAX_LENGTH ||
    hasDisallowedControlChars(trimmed) ||
    containsHtmlLikeMarkup(trimmed) ||
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("://") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
  ) {
    return failure();
  }

  return divBrainSuccess(trimmed);
}

export function validateDivBrainSourceTitle(
  value: unknown,
): DivBrainResult<string> {
  return normalizeRequiredText(value, DIVBRAIN_SOURCE_TITLE_MAX_LENGTH);
}

export function validateDivBrainSourceId(
  value: unknown,
): DivBrainResult<string> {
  const result = normalizeRequiredText(value, DIVBRAIN_SOURCE_ID_MAX_LENGTH);
  if (!result.ok) {
    return result;
  }

  if (/\s/.test(result.data) || result.data.includes("/") || result.data.includes("\\")) {
    return failure();
  }

  return result;
}

export function validateDivBrainSourceCategory(
  value: unknown,
): DivBrainResult<DivBrainSourceCategory> {
  if (!isDivBrainSourceCategory(value)) {
    return failure();
  }

  return divBrainSuccess(value);
}

export function validateDivBrainSourceVerificationState(
  value: unknown,
): DivBrainResult<DivBrainSourceVerificationState> {
  if (!isDivBrainSourceVerificationState(value)) {
    return failure();
  }

  return divBrainSuccess(value);
}

export function validateDivBrainSourceFreshnessState(
  value: unknown,
): DivBrainResult<DivBrainSourceFreshnessState> {
  if (!isDivBrainSourceFreshnessState(value)) {
    return failure();
  }

  return divBrainSuccess(value);
}

type DivBrainSourceInput = {
  id: unknown;
  title: unknown;
  category: unknown;
  verificationState: unknown;
  freshnessState: unknown;
  publisher?: unknown;
  canonicalUrl?: unknown;
  publishedAt?: unknown;
  retrievedAt?: unknown;
  dataAsOf?: unknown;
  attribution?: unknown;
  excerpt?: unknown;
  internalRoute?: unknown;
  recordRef?: unknown;
  schemaVersion?: unknown;
};

/**
 * Validate and normalize a complete source object.
 * Does not fetch URLs or verify financial truth.
 * Unknown extra fields on input objects are ignored (not retained).
 */
export function validateDivBrainSource(
  input: DivBrainSourceInput | DivBrainSource,
): DivBrainResult<DivBrainSource> {
  const idResult = validateDivBrainSourceId(input.id);
  if (!idResult.ok) {
    return idResult;
  }

  const titleResult = validateDivBrainSourceTitle(input.title);
  if (!titleResult.ok) {
    return titleResult;
  }

  const categoryResult = validateDivBrainSourceCategory(input.category);
  if (!categoryResult.ok) {
    return categoryResult;
  }

  const verificationResult = validateDivBrainSourceVerificationState(
    input.verificationState,
  );
  if (!verificationResult.ok) {
    return verificationResult;
  }

  const freshnessResult = validateDivBrainSourceFreshnessState(
    input.freshnessState,
  );
  if (!freshnessResult.ok) {
    return freshnessResult;
  }

  const publisherResult = normalizeOptionalText(
    input.publisher,
    DIVBRAIN_SOURCE_PUBLISHER_MAX_LENGTH,
  );
  if (!publisherResult.ok) {
    return publisherResult;
  }

  let canonicalUrl: string | undefined;
  if (input.canonicalUrl !== undefined && input.canonicalUrl !== null) {
    if (typeof input.canonicalUrl === "string" && input.canonicalUrl.trim() === "") {
      canonicalUrl = undefined;
    } else {
      const urlResult = validateDivBrainCanonicalUrl(input.canonicalUrl);
      if (!urlResult.ok) {
        return urlResult;
      }
      canonicalUrl = urlResult.data;
    }
  }

  let internalRoute: string | undefined;
  if (input.internalRoute !== undefined && input.internalRoute !== null) {
    if (typeof input.internalRoute === "string" && input.internalRoute.trim() === "") {
      internalRoute = undefined;
    } else {
      const routeResult = validateDivBrainInternalRoute(input.internalRoute);
      if (!routeResult.ok) {
        return routeResult;
      }
      internalRoute = routeResult.data;
    }
  }

  const publishedAtResult = normalizeOptionalTimestamp(input.publishedAt);
  if (!publishedAtResult.ok) {
    return publishedAtResult;
  }

  const retrievedAtResult = normalizeOptionalUtcInstant(input.retrievedAt);
  if (!retrievedAtResult.ok) {
    return retrievedAtResult;
  }

  const dataAsOfResult = normalizeOptionalTimestamp(input.dataAsOf);
  if (!dataAsOfResult.ok) {
    return dataAsOfResult;
  }

  const attributionResult = normalizeOptionalText(
    input.attribution,
    DIVBRAIN_SOURCE_ATTRIBUTION_MAX_LENGTH,
  );
  if (!attributionResult.ok) {
    return attributionResult;
  }

  const excerptResult = normalizeOptionalText(
    input.excerpt,
    DIVBRAIN_SOURCE_EXCERPT_MAX_LENGTH,
  );
  if (!excerptResult.ok) {
    return excerptResult;
  }

  let recordRef: string | undefined;
  if (input.recordRef !== undefined && input.recordRef !== null) {
    if (typeof input.recordRef === "string" && input.recordRef.trim() === "") {
      recordRef = undefined;
    } else {
      const recordRefResult = validateDivBrainRecordRef(input.recordRef);
      if (!recordRefResult.ok) {
        return recordRefResult;
      }
      recordRef = recordRefResult.data;
    }
  }

  let schemaVersion: typeof DIVBRAIN_SOURCE_SCHEMA_VERSION | undefined;
  if (input.schemaVersion !== undefined && input.schemaVersion !== null) {
    if (input.schemaVersion !== DIVBRAIN_SOURCE_SCHEMA_VERSION) {
      return failure();
    }
    schemaVersion = DIVBRAIN_SOURCE_SCHEMA_VERSION;
  }

  const source: DivBrainSource = {
    id: idResult.data,
    title: titleResult.data,
    category: categoryResult.data,
    verificationState: verificationResult.data,
    freshnessState: freshnessResult.data,
  };

  if (publisherResult.data !== undefined) {
    source.publisher = publisherResult.data;
  }
  if (canonicalUrl !== undefined) {
    source.canonicalUrl = canonicalUrl;
  }
  if (publishedAtResult.data !== undefined) {
    source.publishedAt = publishedAtResult.data;
  }
  if (retrievedAtResult.data !== undefined) {
    source.retrievedAt = retrievedAtResult.data;
  }
  if (dataAsOfResult.data !== undefined) {
    source.dataAsOf = dataAsOfResult.data;
  }
  if (attributionResult.data !== undefined) {
    source.attribution = attributionResult.data;
  }
  if (excerptResult.data !== undefined) {
    source.excerpt = excerptResult.data;
  }
  if (internalRoute !== undefined) {
    source.internalRoute = internalRoute;
  }
  if (recordRef !== undefined) {
    source.recordRef = recordRef;
  }
  if (schemaVersion !== undefined) {
    source.schemaVersion = schemaVersion;
  }

  return divBrainSuccess(source);
}

function omitUndefinedFields<T extends Record<string, unknown>>(
  value: T,
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldValue !== undefined) {
      output[key] = fieldValue;
    }
  }

  return output;
}

/** Material fields only — excludes `id` so compatible aliases can be detected. */
function sourceMaterialSnapshot(source: DivBrainSource): string {
  return JSON.stringify(
    omitUndefinedFields({
      title: source.title,
      category: source.category,
      verificationState: source.verificationState,
      freshnessState: source.freshnessState,
      publisher: source.publisher,
      canonicalUrl: source.canonicalUrl,
      publishedAt: source.publishedAt,
      retrievedAt: source.retrievedAt,
      dataAsOf: source.dataAsOf,
      attribution: source.attribution,
      excerpt: source.excerpt,
      internalRoute: source.internalRoute,
      recordRef: source.recordRef,
      schemaVersion: source.schemaVersion,
    }),
  );
}

function sourcesAreMateriallyCompatible(
  left: DivBrainSource,
  right: DivBrainSource,
): boolean {
  return sourceMaterialSnapshot(left) === sourceMaterialSnapshot(right);
}

/** alias sourceId → retained canonical sourceId */
export type DivBrainSourceIdAliases = Record<string, string>;

export type DivBrainNormalizedSources = {
  sources: DivBrainSource[];
  /** Maps discarded duplicate IDs to the retained canonical ID. */
  sourceIdAliases: DivBrainSourceIdAliases;
};

/**
 * Resolve a source id through aliases, collapsing chains deterministically.
 * Cycles fail closed by returning the last observed id before repeat.
 */
export function resolveDivBrainSourceId(
  sourceId: string,
  sourceIdAliases: DivBrainSourceIdAliases,
): string {
  let current = sourceId;
  const seen = new Set<string>();

  while (sourceIdAliases[current] !== undefined) {
    if (seen.has(current)) {
      return current;
    }
    seen.add(current);
    current = sourceIdAliases[current];
  }

  return current;
}

/**
 * Serialize a validated source to plain JSON-safe data.
 * Rejects non-plain values; does not stringify arbitrary objects.
 */
export function serializeDivBrainSource(
  source: DivBrainSource,
): DivBrainResult<Record<string, unknown>> {
  const validated = validateDivBrainSource(source);
  if (!validated.ok) {
    return validated;
  }

  return divBrainSuccess(
    omitUndefinedFields({
      id: validated.data.id,
      title: validated.data.title,
      category: validated.data.category,
      verificationState: validated.data.verificationState,
      freshnessState: validated.data.freshnessState,
      publisher: validated.data.publisher,
      canonicalUrl: validated.data.canonicalUrl,
      publishedAt: validated.data.publishedAt,
      retrievedAt: validated.data.retrievedAt,
      dataAsOf: validated.data.dataAsOf,
      attribution: validated.data.attribution,
      excerpt: validated.data.excerpt,
      internalRoute: validated.data.internalRoute,
      recordRef: validated.data.recordRef,
      schemaVersion: validated.data.schemaVersion,
    }),
  );
}

export function serializeDivBrainSources(
  sources: readonly DivBrainSource[],
): DivBrainResult<Record<string, unknown>[]> {
  const serialized: Record<string, unknown>[] = [];

  for (const source of sources) {
    const result = serializeDivBrainSource(source);
    if (!result.ok) {
      return result;
    }
    serialized.push(result.data);
  }

  return divBrainSuccess(serialized);
}

/** Parse unknown JSON into a validated source. */
export function parseDivBrainSource(
  value: unknown,
): DivBrainResult<DivBrainSource> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return failure();
  }

  return validateDivBrainSource(value as DivBrainSourceInput);
}

export function parseDivBrainSources(
  value: unknown,
): DivBrainResult<DivBrainSource[]> {
  if (!Array.isArray(value)) {
    return failure();
  }

  const sources: DivBrainSource[] = [];

  for (const item of value) {
    const parsed = parseDivBrainSource(item);
    if (!parsed.ok) {
      return parsed;
    }
    sources.push(parsed.data);
  }

  return divBrainSuccess(sources);
}

function normalizeUrlDedupeKey(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return null;
    }
    parsed.hash = "";
    const path =
      parsed.pathname.length > 1 && parsed.pathname.endsWith("/")
        ? parsed.pathname.slice(0, -1)
        : parsed.pathname;
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${path}${parsed.search}`;
  } catch {
    return null;
  }
}

function normalizeRouteDedupeKey(route: string): string {
  const trimmed = route.trim();
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

/**
 * Deduplicate sources while preserving first-appearance order.
 *
 * Identity precedence:
 * 1. exact source id
 * 2. normalized canonical URL (when present)
 * 3. normalized internal route (when present)
 * 4. otherwise keep as separate sources
 *
 * Exact same-ID duplicates with compatible material are dropped.
 * Same URL/route with a different ID and compatible material:
 * retain the first source/ID and alias the later ID → retained ID.
 * Contradictory material on any identity match fails.
 * Titles alone never cause a merge.
 * Caller arrays are not mutated.
 */
export function dedupeDivBrainSources(
  sources: readonly DivBrainSource[],
): DivBrainResult<DivBrainNormalizedSources> {
  const result: DivBrainSource[] = [];
  const sourceIdAliases: DivBrainSourceIdAliases = {};
  const keptById = new Map<string, DivBrainSource>();
  const keptByUrl = new Map<string, DivBrainSource>();
  const keptByRoute = new Map<string, DivBrainSource>();

  for (const source of sources) {
    const urlKey = source.canonicalUrl
      ? normalizeUrlDedupeKey(source.canonicalUrl)
      : null;
    if (source.canonicalUrl && urlKey === null) {
      return failure();
    }

    const routeKey = source.internalRoute
      ? normalizeRouteDedupeKey(source.internalRoute)
      : null;

    const matchedById = keptById.get(source.id);
    const matchedByUrl = urlKey ? keptByUrl.get(urlKey) : undefined;
    const matchedByRoute = routeKey ? keptByRoute.get(routeKey) : undefined;

    const matchCandidates = [matchedById, matchedByUrl, matchedByRoute].filter(
      (candidate): candidate is DivBrainSource => candidate !== undefined,
    );

    if (matchCandidates.length > 0) {
      const canonicalId = matchCandidates[0].id;
      for (const candidate of matchCandidates) {
        if (candidate.id !== canonicalId) {
          return failure();
        }
      }

      const matched = matchCandidates[0];
      if (!sourcesAreMateriallyCompatible(matched, source)) {
        return failure();
      }

      if (source.id !== matched.id) {
        sourceIdAliases[source.id] = matched.id;
        keptById.set(source.id, matched);
      }

      continue;
    }

    const copy = { ...source };
    result.push(copy);
    keptById.set(copy.id, copy);
    if (urlKey) {
      keptByUrl.set(urlKey, copy);
    }
    if (routeKey) {
      keptByRoute.set(routeKey, copy);
    }
  }

  return divBrainSuccess({
    sources: result,
    sourceIdAliases,
  });
}

/**
 * Validate, then dedupe. Invalid entries or contradictory duplicates fail.
 * Compatible different-ID duplicates produce `sourceIdAliases`.
 */
export function normalizeDivBrainSources(
  sources: readonly (DivBrainSourceInput | DivBrainSource)[],
): DivBrainResult<DivBrainNormalizedSources> {
  const validated: DivBrainSource[] = [];

  for (const source of sources) {
    const result = validateDivBrainSource(source);
    if (!result.ok) {
      return result;
    }
    validated.push(result.data);
  }

  return dedupeDivBrainSources(validated);
}
