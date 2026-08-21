import "server-only";

import {
  buildGlobalEvidenceBundle,
  extractBoundedSecFilingText,
  GLOBAL_EVIDENCE_BOUNDS,
  isAllowedSecTextContentType,
  validateSecArchiveUrl,
  type GlobalEvidenceBundle,
  type SecFilingDocument,
} from "./global-evidence-contract";
import type { GlobalPrimarySource } from "./global-primary-source-contract";

const USER_AGENT = "DivLab/1.0 (+https://divlab.se/contact) global-evidence-extraction";
const MAX_FETCH_ATTEMPTS_PER_DOCUMENT = 2;
const TRANSIENT_RETRY_DELAY_MS = 750;

type FetchFailureReason =
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
  | "decode_failed"
  | "empty_text"
  | "fetch_failed";

type FetchDocumentResult =
  | { ok: true; document: SecFilingDocument }
  | { ok: false; sourceId: string; reason: FetchFailureReason };

type FetchAttemptResult =
  | { ok: true; document: SecFilingDocument }
  | { ok: false; sourceId: string; reason: FetchFailureReason; retryable: boolean };

export type GlobalEvidenceExtractionResult = {
  bundle: GlobalEvidenceBundle;
  failures: Array<{ sourceId: string; reason: FetchFailureReason }>;
};

function isRetryableHttpStatus(status: number): boolean {
  return status === 403 || status === 408 || status === 425 || status === 429 || status >= 500;
}

async function waitBeforeRetry(attempt: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, TRANSIENT_RETRY_DELAY_MS * attempt);
  });
}

async function readBoundedTextBody(
  response: Response,
  maxBytes: number,
): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; reason: "oversized" | "empty_body" }> {
  const declared = Number(response.headers.get("content-length") ?? Number.NaN);
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, reason: "oversized" };
  }

  if (!response.body) {
    const fallback = new Uint8Array(await response.arrayBuffer());
    if (!fallback.length) return { ok: false, reason: "empty_body" };
    if (fallback.byteLength > maxBytes) return { ok: false, reason: "oversized" };
    return { ok: true, bytes: fallback };
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
        // Ignore cooperative cancellation failures.
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
  return { ok: true, bytes: merged };
}

async function fetchOneSecFilingAttempt(input: {
  source: GlobalPrimarySource;
  fetchImpl: typeof fetch;
}): Promise<FetchAttemptResult> {
  const initial = validateSecArchiveUrl(input.source.url);
  if (!initial.ok) {
    return {
      ok: false,
      sourceId: input.source.id,
      reason: initial.reason,
      retryable: false,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GLOBAL_EVIDENCE_BOUNDS.timeoutMs);
  let current = initial.url;

  try {
    for (let redirectCount = 0; ; redirectCount += 1) {
      const response = await input.fetchImpl(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,application/xhtml+xml,text/plain,application/xml,text/xml;q=0.9,*/*;q=0.1",
          "User-Agent": USER_AGENT,
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirectCount >= GLOBAL_EVIDENCE_BOUNDS.maxRedirects) {
          return {
            ok: false,
            sourceId: input.source.id,
            reason: "redirect_not_allowed",
            retryable: false,
          };
        }
        const location = response.headers.get("location");
        if (!location) {
          return {
            ok: false,
            sourceId: input.source.id,
            reason: "redirect_not_allowed",
            retryable: false,
          };
        }
        let nextUrl: string;
        try {
          nextUrl = new URL(location, current).toString();
        } catch {
          return {
            ok: false,
            sourceId: input.source.id,
            reason: "redirect_not_allowed",
            retryable: false,
          };
        }
        const next = validateSecArchiveUrl(nextUrl);
        if (!next.ok) {
          return {
            ok: false,
            sourceId: input.source.id,
            reason: "redirect_not_allowed",
            retryable: false,
          };
        }
        current = next.url;
        continue;
      }

      if (!response.ok) {
        return {
          ok: false,
          sourceId: input.source.id,
          reason: "http_error",
          retryable: isRetryableHttpStatus(response.status),
        };
      }
      const contentType = response.headers.get("content-type");
      if (!isAllowedSecTextContentType(contentType)) {
        return {
          ok: false,
          sourceId: input.source.id,
          reason: "content_type_mismatch",
          retryable: false,
        };
      }

      const body = await readBoundedTextBody(response, GLOBAL_EVIDENCE_BOUNDS.maxDocumentBytes);
      if (!body.ok) {
        return {
          ok: false,
          sourceId: input.source.id,
          reason: body.reason,
          retryable: false,
        };
      }

      let decoded: string;
      try {
        decoded = new TextDecoder("utf-8", { fatal: false }).decode(body.bytes);
      } catch {
        return {
          ok: false,
          sourceId: input.source.id,
          reason: "decode_failed",
          retryable: false,
        };
      }
      const extracted = extractBoundedSecFilingText({ document: decoded });
      if (!extracted.ok) {
        return {
          ok: false,
          sourceId: input.source.id,
          reason: "empty_text",
          retryable: false,
        };
      }

      return {
        ok: true,
        document: {
          sourceId: input.source.id,
          finalUrl: current.toString(),
          contentType: contentType?.split(";")[0]?.trim().toLowerCase() ?? "text/html",
          bytes: body.bytes.byteLength,
          text: extracted.text,
          truncated: extracted.truncated,
        },
      };
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        sourceId: input.source.id,
        reason: "timeout",
        retryable: true,
      };
    }
    return {
      ok: false,
      sourceId: input.source.id,
      reason: "fetch_failed",
      retryable: true,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchOneSecFiling(input: {
  source: GlobalPrimarySource;
  fetchImpl: typeof fetch;
}): Promise<FetchDocumentResult> {
  let lastFailure: Extract<FetchAttemptResult, { ok: false }> | null = null;

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS_PER_DOCUMENT; attempt += 1) {
    const result = await fetchOneSecFilingAttempt(input);
    if (result.ok) return result;
    lastFailure = result;

    if (!result.retryable || attempt >= MAX_FETCH_ATTEMPTS_PER_DOCUMENT) {
      return { ok: false, sourceId: result.sourceId, reason: result.reason };
    }

    await waitBeforeRetry(attempt);
  }

  return {
    ok: false,
    sourceId: input.source.id,
    reason: lastFailure?.reason ?? "fetch_failed",
  };
}

export async function extractGlobalSecEvidence(input: {
  companyName: string;
  sources: readonly GlobalPrimarySource[];
  fetchImpl?: typeof fetch;
}): Promise<GlobalEvidenceExtractionResult> {
  const fetchImpl = input.fetchImpl ?? fetch;
  const filingSources = input.sources
    .filter((source) =>
      source.primary &&
      (source.kind === "regulatory_annual_filing" || source.kind === "regulatory_interim_filing")
    )
    .slice(0, GLOBAL_EVIDENCE_BOUNDS.maxDocuments);

  const documents: SecFilingDocument[] = [];
  const failures: Array<{ sourceId: string; reason: FetchFailureReason }> = [];

  // Sequential on purpose: the pass is still bounded to two official SEC
  // documents. Each document gets at most one additional attempt, and only for
  // transient transport/rate-limit failures; validation/content failures never retry.
  for (const source of filingSources) {
    const result = await fetchOneSecFiling({ source, fetchImpl });
    if (result.ok) documents.push(result.document);
    else failures.push({ sourceId: result.sourceId, reason: result.reason });
  }

  return {
    bundle: buildGlobalEvidenceBundle({
      companyName: input.companyName,
      sources: filingSources,
      documents,
    }),
    failures,
  };
}
