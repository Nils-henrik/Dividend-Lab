import "server-only";

import {
  extractNasdaqReleaseVisibleText,
  NASDAQ_RELEASE_TEXT_MAX_CHARS,
} from "./nasdaq-release-text";

export const NASDAQ_RELEASE_EVIDENCE_BOUNDS = {
  maxBytes: 750_000,
  maxTextChars: NASDAQ_RELEASE_TEXT_MAX_CHARS,
  maxRedirects: 1,
  timeoutMs: 8_000,
} as const;

const ALLOWED_HOST = "view.news.eu.nasdaq.com";
const ALLOWED_PATH = "/view";
const USER_AGENT = "DivLab/1.0 nordic-release-evidence";

type ReleaseFailureReason =
  | "invalid_url"
  | "non_https"
  | "host_not_allowed"
  | "path_not_allowed"
  | "redirect_not_allowed"
  | "timeout"
  | "http_error"
  | "oversized"
  | "content_type_mismatch"
  | "empty_body"
  | "invalid_html"
  | "fetch_failed";

export type NasdaqReleaseEvidenceResult =
  | {
      ok: true;
      finalUrl: string;
      bytes: number;
      text: string;
    }
  | {
      ok: false;
      reason: ReleaseFailureReason;
    };

function allowedUrl(value: string): { ok: true; url: URL } | { ok: false; reason: ReleaseFailureReason } {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (url.protocol !== "https:") return { ok: false, reason: "non_https" };
  if (url.username || url.password) return { ok: false, reason: "invalid_url" };
  if (url.hostname.toLowerCase() !== ALLOWED_HOST) {
    return { ok: false, reason: "host_not_allowed" };
  }
  if (url.pathname !== ALLOWED_PATH) {
    return { ok: false, reason: "path_not_allowed" };
  }
  return { ok: true, url };
}

function htmlContentType(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.split(";")[0]?.trim().toLowerCase() ?? "";
  return normalized === "text/html" || normalized === "application/xhtml+xml";
}

async function readBoundedText(
  response: Response,
  maxBytes: number,
): Promise<
  | { ok: true; bytes: number; text: string }
  | { ok: false; reason: "oversized" | "empty_body" }
> {
  const declared = Number(response.headers.get("content-length") ?? NaN);
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, reason: "oversized" };
  }

  if (!response.body) {
    const fallback = new Uint8Array(await response.arrayBuffer());
    if (!fallback.length) return { ok: false, reason: "empty_body" };
    if (fallback.byteLength > maxBytes) return { ok: false, reason: "oversized" };
    return {
      ok: true,
      bytes: fallback.byteLength,
      text: new TextDecoder("utf-8", { fatal: false }).decode(fallback),
    };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // Ignore cancellation errors; the request still fails closed.
      }
      return { ok: false, reason: "oversized" };
    }
    chunks.push(value);
  }
  if (!total) return { ok: false, reason: "empty_body" };

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return {
    ok: true,
    bytes: total,
    text: new TextDecoder("utf-8", { fatal: false }).decode(merged),
  };
}

/**
 * Fetch only the official Nasdaq disclosure page already returned by the CNS
 * adapter. No arbitrary company-site crawling is allowed here.
 */
export async function fetchNasdaqReleaseEvidence(input: {
  url: string;
  fetchImpl?: typeof fetch;
  maxBytes?: number;
  maxTextChars?: number;
  timeoutMs?: number;
  maxRedirects?: number;
}): Promise<NasdaqReleaseEvidenceResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const maxBytes = Math.min(
    Math.max(1, Math.floor(input.maxBytes ?? NASDAQ_RELEASE_EVIDENCE_BOUNDS.maxBytes)),
    NASDAQ_RELEASE_EVIDENCE_BOUNDS.maxBytes,
  );
  const maxTextChars = Math.min(
    Math.max(1, Math.floor(input.maxTextChars ?? NASDAQ_RELEASE_EVIDENCE_BOUNDS.maxTextChars)),
    NASDAQ_RELEASE_EVIDENCE_BOUNDS.maxTextChars,
  );
  const timeoutMs = Math.min(
    Math.max(1, Math.floor(input.timeoutMs ?? NASDAQ_RELEASE_EVIDENCE_BOUNDS.timeoutMs)),
    NASDAQ_RELEASE_EVIDENCE_BOUNDS.timeoutMs,
  );
  const maxRedirects = Math.min(
    Math.max(0, Math.floor(input.maxRedirects ?? NASDAQ_RELEASE_EVIDENCE_BOUNDS.maxRedirects)),
    NASDAQ_RELEASE_EVIDENCE_BOUNDS.maxRedirects,
  );

  let current = allowedUrl(input.url);
  if (!current.ok) return current;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    for (let redirectCount = 0; ; redirectCount += 1) {
      const response = await fetchImpl(current.url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9",
          "User-Agent": USER_AGENT,
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirectCount >= maxRedirects) {
          return { ok: false, reason: "redirect_not_allowed" };
        }
        const location = response.headers.get("location");
        if (!location) return { ok: false, reason: "redirect_not_allowed" };
        let nextRaw: string;
        try {
          nextRaw = new URL(location, current.url).toString();
        } catch {
          return { ok: false, reason: "redirect_not_allowed" };
        }
        const next = allowedUrl(nextRaw);
        if (!next.ok) return { ok: false, reason: "redirect_not_allowed" };
        current = next;
        continue;
      }

      if (!response.ok) return { ok: false, reason: "http_error" };
      if (!htmlContentType(response.headers.get("content-type"))) {
        return { ok: false, reason: "content_type_mismatch" };
      }
      const body = await readBoundedText(response, maxBytes);
      if (!body.ok) return body;
      const text = extractNasdaqReleaseVisibleText(body.text, maxTextChars);
      if (!text) return { ok: false, reason: "invalid_html" };
      return {
        ok: true,
        finalUrl: current.url.toString(),
        bytes: body.bytes,
        text,
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "fetch_failed" };
  } finally {
    clearTimeout(timer);
  }
}
