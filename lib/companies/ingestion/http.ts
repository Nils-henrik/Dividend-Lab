export type BoundedTextFetchResult =
  | { status: "ok"; text: string }
  | {
      status: "error";
      reason:
        | "invalid_url"
        | "network_error"
        | "timeout"
        | "http_status"
        | "unexpected_content_type"
        | "too_large";
    };

export type BoundedTextFetchOptions = {
  allowedOrigin: string;
  acceptedContentTypes: readonly string[];
  maxBytes: number;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

const TEXT_DECODER = new TextDecoder("utf-8", { fatal: true });

function isAllowedUrl(value: string, allowedOrigin: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.origin === allowedOrigin &&
      url.username === "" &&
      url.password === "" &&
      url.port === "" &&
      url.search === "" &&
      url.hash === ""
    );
  } catch {
    return false;
  }
}

function hasAcceptedContentType(
  response: Response,
  acceptedContentTypes: readonly string[],
): boolean {
  const contentType = response.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();

  return Boolean(
    contentType && acceptedContentTypes.includes(contentType),
  );
}

async function readBoundedBody(
  response: Response,
  maxBytes: number,
): Promise<BoundedTextFetchResult> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { status: "error", reason: "too_large" };
  }

  if (!response.body) {
    return { status: "ok", text: "" };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return { status: "error", reason: "too_large" };
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { status: "ok", text: TEXT_DECODER.decode(body) };
  } catch {
    return { status: "error", reason: "network_error" };
  }
}

export async function fetchBoundedText(
  url: string,
  options: BoundedTextFetchOptions,
): Promise<BoundedTextFetchResult> {
  if (
    !isAllowedUrl(url, options.allowedOrigin) ||
    !Number.isInteger(options.maxBytes) ||
    options.maxBytes < 1 ||
    !Number.isInteger(options.timeoutMs) ||
    options.timeoutMs < 1
  ) {
    return { status: "error", reason: "invalid_url" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);

  try {
    const response = await (options.fetchImpl ?? fetch)(url, {
      method: "GET",
      redirect: "error",
      cache: "no-store",
      signal: controller.signal,
      headers: {
        accept: options.acceptedContentTypes.join(", "),
        "user-agent": "DivLabBot/1.0 (+https://divlab.se)",
      },
    });

    if (!response.ok) {
      return { status: "error", reason: "http_status" };
    }

    if (!hasAcceptedContentType(response, options.acceptedContentTypes)) {
      return { status: "error", reason: "unexpected_content_type" };
    }

    return await readBoundedBody(response, options.maxBytes);
  } catch (error) {
    return {
      status: "error",
      reason:
        error instanceof DOMException && error.name === "AbortError"
          ? "timeout"
          : "network_error",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function waitForCrawlDelay(
  milliseconds: number,
  sleep: (milliseconds: number) => Promise<void> = (delay) =>
    new Promise((resolve) => setTimeout(resolve, delay)),
): Promise<void> {
  if (!Number.isInteger(milliseconds) || milliseconds < 0) {
    throw new Error("Invalid crawl delay");
  }

  await sleep(milliseconds);
}
