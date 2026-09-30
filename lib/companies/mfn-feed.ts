import { fetchBoundedText } from "@/lib/companies/ingestion/http";

/**
 * Issuer-authorized MFN JSON feed.
 * The NIBE feed id is the endpoint embedded on nibegroup.com.
 * The LEI must match the stored FI identifier before any item is kept.
 * Redirects are refused. The item cap is stricter than the issuer page's 48.
 */

export const NIBE_MFN_ORIGIN = "https://feed.mfn.se";
export const NIBE_MFN_FEED_ID = "f9cedcd2-6006-4325-bb43-6ffb51e93b6b";
export const NIBE_MFN_LEI = "549300ZQH0FIF1P0MX67";
export const NIBE_MFN_PROVIDER = "nibe_mfn_feed";

export const MFN_FETCH_POLICY = {
  redirect: "error",
  allowRedirects: false,
  maxBytes: 262_144,
  timeoutMs: 8_000,
  itemLimit: 20,
  lang: "en",
} as const;

const FEED_VERSION = "https://www.mfn.se/feed/version/1";
const REPORT_TAG_PREFIX = "sub:report";

export type MfnDisclosure = {
  newsId: string;
  title: string;
  publishedAt: string;
  sourceUrl: string;
  kind: "press" | "report";
  lei: string;
};

export type MfnReadResult =
  | { status: "ok"; value: readonly MfnDisclosure[]; asOf: string }
  | { status: "missing"; reason: string }
  | { status: "unavailable"; reason: string };

export function nibeMfnFeedUrl(): string {
  const url = new URL(`${NIBE_MFN_ORIGIN}/v1/feed/${NIBE_MFN_FEED_ID}.json`);
  url.searchParams.set("lang", MFN_FETCH_POLICY.lang);
  url.searchParams.set("limit", String(MFN_FETCH_POLICY.itemLimit));
  return url.toString();
}

function isReportTag(tag: string): boolean {
  return tag === REPORT_TAG_PREFIX || tag.startsWith(`${REPORT_TAG_PREFIX}:`);
}

function isoTimestamp(value: unknown): string | null {
  if (typeof value !== "string" || !value.endsWith("Z")) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString();
}

function sameOriginItemUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port) return null;
    if (url.origin !== NIBE_MFN_ORIGIN) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function parseNibeMfnFeed(
  payload: string,
  domain: "press" | "reports",
): MfnReadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload);
  } catch {
    return { status: "unavailable", reason: "invalid_json" };
  }
  if (!parsed || typeof parsed !== "object") {
    return { status: "unavailable", reason: "invalid_payload" };
  }
  const record = parsed as Record<string, unknown>;
  if (record.version !== FEED_VERSION) {
    return { status: "unavailable", reason: "unexpected_version" };
  }
  if (!Array.isArray(record.items)) {
    return { status: "unavailable", reason: "invalid_payload" };
  }

  const items: MfnDisclosure[] = [];
  let sawForeignIssuer = false;
  for (const entry of record.items) {
    if (items.length >= MFN_FETCH_POLICY.itemLimit) break;
    if (!entry || typeof entry !== "object") continue;
    const item = entry as Record<string, unknown>;
    const author = item.author;
    if (!author || typeof author !== "object") continue;
    const authorRecord = author as Record<string, unknown>;
    if (authorRecord.entity_id !== NIBE_MFN_FEED_ID) {
      sawForeignIssuer = true;
      continue;
    }
    const leis = authorRecord.leis;
    if (!Array.isArray(leis) || !leis.includes(NIBE_MFN_LEI)) {
      sawForeignIssuer = true;
      continue;
    }
    const properties = item.properties;
    if (!properties || typeof properties !== "object") continue;
    const propertyRecord = properties as Record<string, unknown>;
    if (propertyRecord.type !== "ir") continue;
    const tags = Array.isArray(propertyRecord.tags)
      ? propertyRecord.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
    const content = item.content;
    if (!content || typeof content !== "object") continue;
    const contentRecord = content as Record<string, unknown>;
    const title = typeof contentRecord.title === "string" ? contentRecord.title.trim() : "";
    const publishedAt = isoTimestamp(contentRecord.publish_date);
    const sourceUrl = sameOriginItemUrl(item.url);
    const newsId = typeof item.news_id === "string" ? item.news_id : "";
    if (!title || title.length > 500 || !publishedAt || !sourceUrl || !newsId) continue;
    const kind = tags.some(isReportTag) ? "report" : "press";
    if (domain === "reports" && kind !== "report") continue;
    items.push({
      newsId,
      title,
      publishedAt,
      sourceUrl,
      kind,
      lei: NIBE_MFN_LEI,
    });
  }

  if (items.length === 0) {
    return {
      status: sawForeignIssuer ? "unavailable" : "missing",
      reason: sawForeignIssuer ? "issuer_binding_mismatch" : "no_disclosures",
    };
  }
  const asOf = items.map((item) => item.publishedAt).sort().at(-1) ?? null;
  if (!asOf) return { status: "missing", reason: "no_disclosures" };
  return { status: "ok", value: items, asOf };
}

export async function readNibeMfnFeed(input: {
  lei: string;
  feedId: string;
  domain: "press" | "reports";
  fetchImpl?: typeof fetch;
}): Promise<MfnReadResult> {
  if (input.lei !== NIBE_MFN_LEI || input.feedId !== NIBE_MFN_FEED_ID) {
    return { status: "unavailable", reason: "unexpected_binding" };
  }
  const endpoint = nibeMfnFeedUrl();
  const response = await fetchBoundedText(endpoint, {
    allowedOrigin: NIBE_MFN_ORIGIN,
    acceptedContentTypes: ["application/json"],
    maxBytes: MFN_FETCH_POLICY.maxBytes,
    timeoutMs: MFN_FETCH_POLICY.timeoutMs,
    allowSearch: true,
    fetchImpl: input.fetchImpl,
  });
  if (response.status === "error") {
    return { status: "unavailable", reason: response.reason };
  }
  return parseNibeMfnFeed(response.text, input.domain);
}

export function mfnDisclosuresConflict(
  left: readonly MfnDisclosure[],
  right: readonly MfnDisclosure[],
): boolean {
  const rightById = new Map(right.map((item) => [item.newsId, item]));
  return left.some((item) => {
    const other = rightById.get(item.newsId);
    if (!other) return false;
    return other.title !== item.title
      || other.publishedAt !== item.publishedAt
      || other.sourceUrl !== item.sourceUrl
      || other.kind !== item.kind
      || other.lei !== item.lei;
  });
}
