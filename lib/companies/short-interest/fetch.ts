import {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
  FI_ODS_CONTENT_TYPE,
  FI_ORIGIN,
  FI_SHORT_INTEREST_MAX_BYTES,
  FI_SHORT_INTEREST_TIMEOUT_MS,
} from "@/lib/companies/short-interest/constants";

const ALLOWED_URLS = new Set<string>([FI_AGGREGATE_ODS_URL, FI_CURRENT_POSITIONS_ODS_URL]);

export type BoundedBytesResult =
  | { status: "ok"; bytes: Uint8Array }
  | {
      status: "error";
      reason: "invalid_url" | "network_error" | "timeout" | "unexpected_content_type" | "too_large";
    }
  | { status: "error"; reason: "http_status"; httpStatus: number };

export function isTransientFiFetchError(result: BoundedBytesResult): boolean {
  if (result.status === "ok") return false;
  if (result.reason === "network_error" || result.reason === "timeout") return true;
  return result.reason === "http_status" && (
    result.httpStatus === 408 || result.httpStatus === 429 || result.httpStatus >= 500
  );
}

function isAllowedFiOdsUrl(value: string): boolean {
  if (!ALLOWED_URLS.has(value)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.origin === FI_ORIGIN
      && url.username === ""
      && url.password === ""
      && url.port === ""
      && url.search === ""
      && url.hash === "";
  } catch {
    return false;
  }
}

function acceptedContentType(response: Response): boolean {
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  return contentType === FI_ODS_CONTENT_TYPE;
}

async function readBoundedBytes(response: Response, maxBytes: number): Promise<Uint8Array | "too_large"> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) return "too_large";
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    if (total + value.byteLength > maxBytes) {
      await reader.cancel();
      return "too_large";
    }
    total += value.byteLength;
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function fetchFiOds(
  url: string,
  options?: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    maxBytes?: number;
  },
): Promise<BoundedBytesResult> {
  const timeoutMs = options?.timeoutMs ?? FI_SHORT_INTEREST_TIMEOUT_MS;
  const maxBytes = options?.maxBytes ?? FI_SHORT_INTEREST_MAX_BYTES;
  if (
    !isAllowedFiOdsUrl(url)
    || !Number.isInteger(timeoutMs)
    || timeoutMs < 1
    || !Number.isInteger(maxBytes)
    || maxBytes < 1
  ) {
    return { status: "error", reason: "invalid_url" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await (options?.fetchImpl ?? fetch)(url, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: FI_ODS_CONTENT_TYPE,
        "user-agent": "DivLabBot/1.0 (+https://divlab.se)",
      },
    });
    if (!response.ok) return { status: "error", reason: "http_status", httpStatus: response.status };
    if (!acceptedContentType(response)) return { status: "error", reason: "unexpected_content_type" };
    const bytes = await readBoundedBytes(response, maxBytes);
    if (bytes === "too_large") return { status: "error", reason: "too_large" };
    if (bytes.byteLength < 1) return { status: "error", reason: "network_error" };
    return { status: "ok", bytes };
  } catch (error) {
    return {
      status: "error",
      reason: error instanceof DOMException && error.name === "AbortError" ? "timeout" : "network_error",
    };
  } finally {
    clearTimeout(timeout);
  }
}
