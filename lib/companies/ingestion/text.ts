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

export function decodeHtmlText(value: string): string {
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
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isoTimestamp(value: string): string | null {
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      value,
    )
  ) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function isoDateOnly(value: string): string | null {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
}

export function englishDateToIso(value: string): string | null {
  const normalized = value.trim().replace(/,/g, "");
  const monthFirst = normalized.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$/);
  const dayFirst = normalized.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  const monthName = monthFirst?.[1] ?? dayFirst?.[2];
  const dayText = monthFirst?.[2] ?? dayFirst?.[1];
  const yearText = monthFirst?.[3] ?? dayFirst?.[3];
  if (!monthName || !dayText || !yearText) {
    return null;
  }

  const month = MONTHS.get(monthName.toLowerCase());
  const day = Number.parseInt(dayText, 10);
  const year = Number.parseInt(yearText, 10);
  if (month === undefined || day < 1 || day > 31 || year < 2000 || year > 2100) {
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

export function compactDateToIso(value: string): string | null {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (!match) {
    return null;
  }

  return isoDateOnly(`${match[1]}-${match[2]}-${match[3]}`);
}

export function officialEventUrl(pageUrl: string, eventAt: string, title: string): string | null {
  try {
    const url = new URL(pageUrl);
    if (url.protocol !== "https:" || url.search !== "" || url.hash !== "") {
      return null;
    }

    const day = eventAt.slice(0, 10);
    const slug = title
      .toLowerCase()
      .replace(/&amp;/g, " ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !slug) {
      return null;
    }

    url.hash = `${day}-${slug}`;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeSameOriginUrl(
  value: string,
  origin: string,
  pathPattern: RegExp,
): string | null {
  try {
    const url = new URL(value, origin);
    if (
      url.origin !== origin ||
      url.protocol !== "https:" ||
      url.username !== "" ||
      url.password !== "" ||
      url.port !== "" ||
      url.search !== "" ||
      url.hash !== "" ||
      !pathPattern.test(url.pathname)
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export function uniqueDocuments<T extends { sourceUrl: string }>(
  documents: readonly T[],
  limit: number,
): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const document of documents) {
    if (seen.has(document.sourceUrl)) {
      continue;
    }

    seen.add(document.sourceUrl);
    unique.push(document);
    if (unique.length >= limit) {
      break;
    }
  }

  return unique;
}
