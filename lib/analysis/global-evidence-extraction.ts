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

export type GlobalEvidenceExtractionResult = {
  bundle: GlobalEvidenceBundle;
  failures: Array<{ sourceId: string; reason: FetchFailureReason }>;
};

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

async function fetchOneSecFiling(input: {
  source: GlobalPrimarySource;
  fetchImpl: typeof fetch;
}): Promise<FetchDocumentResult> {
  const initial = validateSecArchiveUrl(input.source.url);
  if (!initial.ok) return { ok: false, sourceId: input.source.id, reason: initial.reason };

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
          return { ok: false, sourceId: input.source.id, reason: "redirect_not_allowed" };
        }
        const location = response.headers.get("location");
        if (!location) return { ok: false, sourceId: input.source.id, reason: "redirect_not_allowed" };
        let nextUrl: string;
        try {
          nextUrl = new URL(location, current).toString();
        } catch {
          return { ok: false, sourceId: input.source.id, reason: "redirect_not_allowed" };
        }
        const next = validateSecArchiveUrl(nextUrl);
        if (!next.ok) return { ok: false, sourceId: input.source.id, reason: "redirect_not_allowed" };
        current = next.url;
        continue;
      }

      if (!response.ok) return { ok: false, sourceId: input.source.id, reason: "http_error" };
      const contentType = response.headers.get("content-type");
      if (!isAllowedSecTextContentType(contentType)) {
        return { ok: false, sourceId: input.source.id, reason: "content_type_mismatch" };
      }

      const body = await readBoundedTextBody(response, GLOBAL_EVIDENCE_BOUNDS.maxDocumentBytes);
      if (!body.ok) return { ok: false, sourceId: input.source.id, reason: body.reason };

      let decoded: string;
      try {
        decoded = new TextDecoder("utf-8", { fatal: false }).decode(body.bytes);
      } catch {
        return { ok: false, sourceId: input.source.id, reason: "decode_failed" };
      }
      const extracted = extractBoundedSecFilingText({ document: decoded });
      if (!extracted.ok) return { ok: false, sourceId: input.source.id, reason: "empty_text" };

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
      return { ok: false, sourceId: input.source.id, reason: "timeout" };
    }
    return { ok: false, sourceId: input.source.id, reason: "fetch_failed" };
  } finally {
    clearTimeout(timer);
  }
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

  // Sequential on purpose: the entire global evidence pass is bounded to two
  // official SEC documents and never fans out arbitrary outbound requests.
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
