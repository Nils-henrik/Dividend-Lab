export const ATLAS_COPCO_PRESS_RELEASE_SITEMAP_URL =
  "https://www.atlascopcogroup.com/en/sitemap.xml";
export const ATLAS_COPCO_PRESS_RELEASE_SOURCE_URL =
  "https://www.atlascopcogroup.com/en/media/press-releases";
export const ATLAS_COPCO_MIN_REQUEST_INTERVAL_MS = 1_000;
export const ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT = 20;
export const ATLAS_COPCO_MAX_SITEMAP_BYTES = 1_000_000;
export const ATLAS_COPCO_MAX_PRESS_RELEASE_BYTES = 500_000;
export const ATLAS_COPCO_ORIGIN = "https://www.atlascopcogroup.com";

const PRESS_RELEASE_PATH = /^\/en\/media\/press-releases\/\d{4}\/[^/?#]+$/;
const URL_BLOCK_PATTERN = /<url>\s*([\s\S]*?)<\/url>/gi;
const LOC_PATTERN = /<loc>\s*([\s\S]*?)<\/loc>/i;
const LAST_MODIFIED_PATTERN = /<lastmod>\s*([\s\S]*?)<\/lastmod>/i;
const TITLE_PATTERN =
  /<h1\b[^>]*class=["'][^"']*\bcmp-title__text\b[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i;
const PUBLISHED_DATE_PATTERN =
  /<p\b[^>]*class=["'][^"']*\bcmp-pagedate\b[^"']*["'][^>]*>([\s\S]*?)<\/p>/i;
const HTML_TAG_PATTERN = /<[^>]*>/g;
const MONTHS = new Map([
  ["january", 0],
  ["february", 1],
  ["march", 2],
  ["april", 3],
  ["may", 4],
  ["june", 5],
  ["july", 6],
  ["august", 7],
  ["september", 8],
  ["october", 9],
  ["november", 10],
  ["december", 11],
]);

export type AtlasCopcoPressReleaseCandidate = {
  sourceUrl: string;
  sourceModifiedAt: string | null;
};

export type AtlasCopcoSitemapResult =
  | { status: "ok"; candidates: AtlasCopcoPressReleaseCandidate[] }
  | { status: "invalid"; reason: "too_large" | "unexpected_document" };

export type AtlasCopcoPressReleaseDocument = {
  documentType: "press_release";
  title: string;
  sourceUrl: string;
  sourcePublisher: "Atlas Copco Group";
  publishedAt: string;
};

export type AtlasCopcoPressReleaseResult =
  | { status: "ok"; document: AtlasCopcoPressReleaseDocument }
  | {
      status: "invalid";
      reason: "too_large" | "invalid_source_url" | "missing_metadata";
    };

function decodeXmlText(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .trim();
}

function normalizeLastModified(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(decodeXmlText(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizePressReleaseUrl(value: string): string | null {
  try {
    const url = new URL(decodeXmlText(value), ATLAS_COPCO_ORIGIN);
    if (
      url.origin !== ATLAS_COPCO_ORIGIN ||
      url.search.length > 0 ||
      url.hash.length > 0 ||
      !PRESS_RELEASE_PATH.test(url.pathname)
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function decodeCodePoint(value: string, radix: number): string {
  const codePoint = Number.parseInt(value, radix);
  if (
    !Number.isInteger(codePoint) ||
    codePoint < 0 ||
    codePoint > 0x10ffff ||
    (codePoint >= 0xd800 && codePoint <= 0xdfff)
  ) {
    return "";
  }

  return String.fromCodePoint(codePoint);
}

function decodeHtmlText(value: string): string {
  return value
    .replace(HTML_TAG_PATTERN, " ")
    .replace(/&#(\d+);/g, (_, decimal: string) => decodeCodePoint(decimal, 10))
    .replace(/&#x([0-9a-f]+);/gi, (_, hexadecimal: string) =>
      decodeCodePoint(hexadecimal, 16),
    )
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePublishedDate(value: string): string | null {
  const match = decodeHtmlText(value).match(
    /^([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/,
  );
  if (!match) {
    return null;
  }

  const month = MONTHS.get(match[1].toLowerCase());
  const day = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);
  if (month === undefined || day < 1 || day > 31 || year < 2000) {
    return null;
  }

  const date = new Date(Date.UTC(year, month, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
}

function compareCandidates(
  first: AtlasCopcoPressReleaseCandidate,
  second: AtlasCopcoPressReleaseCandidate,
) {
  const modifiedOrder = (second.sourceModifiedAt ?? "").localeCompare(
    first.sourceModifiedAt ?? "",
  );

  return modifiedOrder || first.sourceUrl.localeCompare(second.sourceUrl);
}

export function parseAtlasCopcoPressReleaseSitemap(
  xml: string,
  limit = ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT,
): AtlasCopcoSitemapResult {
  if (Buffer.byteLength(xml, "utf8") > ATLAS_COPCO_MAX_SITEMAP_BYTES) {
    return { status: "invalid", reason: "too_large" };
  }

  if (!/<urlset(?:\s|>)/i.test(xml)) {
    return { status: "invalid", reason: "unexpected_document" };
  }

  const boundedLimit = Math.max(
    1,
    Math.min(ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT, Math.floor(limit) || 1),
  );
  const candidates = new Map<string, AtlasCopcoPressReleaseCandidate>();

  for (const match of xml.matchAll(URL_BLOCK_PATTERN)) {
    const block = match[1];
    const location = block.match(LOC_PATTERN)?.[1];
    if (!location) {
      continue;
    }

    const sourceUrl = normalizePressReleaseUrl(location);
    if (!sourceUrl) {
      continue;
    }

    const candidate = {
      sourceUrl,
      sourceModifiedAt: normalizeLastModified(
        block.match(LAST_MODIFIED_PATTERN)?.[1],
      ),
    };
    const existing = candidates.get(sourceUrl);

    if (!existing || compareCandidates(candidate, existing) < 0) {
      candidates.set(sourceUrl, candidate);
    }
  }

  return {
    status: "ok",
    candidates: [...candidates.values()]
      .sort(compareCandidates)
      .slice(0, boundedLimit),
  };
}

export function parseAtlasCopcoPressRelease(
  html: string,
  sourceUrl: string,
): AtlasCopcoPressReleaseResult {
  if (Buffer.byteLength(html, "utf8") > ATLAS_COPCO_MAX_PRESS_RELEASE_BYTES) {
    return { status: "invalid", reason: "too_large" };
  }

  const normalizedSourceUrl = normalizePressReleaseUrl(sourceUrl);
  if (!normalizedSourceUrl) {
    return { status: "invalid", reason: "invalid_source_url" };
  }

  const titleMatch = html.match(TITLE_PATTERN)?.[1];
  const publishedDateMatch = html.match(PUBLISHED_DATE_PATTERN)?.[1];
  const title = titleMatch ? decodeHtmlText(titleMatch) : "";
  const publishedAt = publishedDateMatch
    ? parsePublishedDate(publishedDateMatch)
    : null;

  if (!title || title.length > 500 || !publishedAt) {
    return { status: "invalid", reason: "missing_metadata" };
  }

  return {
    status: "ok",
    document: {
      documentType: "press_release",
      title,
      sourceUrl: normalizedSourceUrl,
      sourcePublisher: "Atlas Copco Group",
      publishedAt,
    },
  };
}
