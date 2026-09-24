import {
  JOB_DEADLINE_EXCEEDED,
  type JobDeadline,
} from "@/lib/companies/ingestion/deadline";
import {
  fetchBoundedText,
  waitForCrawlDelay,
  type BoundedTextFetchResult,
} from "@/lib/companies/ingestion/http";

export const INGESTION_REQUEST_TIMEOUT_MS = 10_000;
export const INGESTION_CRAWL_DELAY_MS = 1_000;
export const INGESTION_MAX_HTML_BYTES = 1_000_000;
export const INGESTION_MAX_SITEMAP_BYTES = 1_500_000;

export type SourceFetchContext = {
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  now: Date;
  deadline?: JobDeadline;
};

export type OfficialTextResult =
  | BoundedTextFetchResult
  | { status: "error"; reason: typeof JOB_DEADLINE_EXCEEDED };

export async function fetchOfficialText(
  url: string,
  context: SourceFetchContext,
  options: {
    allowedOrigin: string;
    acceptedContentTypes: readonly string[];
    maxBytes: number;
    allowSearch?: boolean;
  },
): Promise<OfficialTextResult> {
  const timeoutMs = context.deadline
    ? context.deadline.requestTimeoutMs(INGESTION_REQUEST_TIMEOUT_MS)
    : INGESTION_REQUEST_TIMEOUT_MS;
  if (timeoutMs === null) {
    return { status: "error", reason: JOB_DEADLINE_EXCEEDED };
  }

  return fetchBoundedText(url, {
    allowedOrigin: options.allowedOrigin,
    acceptedContentTypes: options.acceptedContentTypes,
    maxBytes: options.maxBytes,
    timeoutMs,
    allowSearch: options.allowSearch,
    fetchImpl: context.fetchImpl,
  });
}

export async function pauseBetweenRequests(
  context: SourceFetchContext,
): Promise<"ok" | typeof JOB_DEADLINE_EXCEEDED> {
  if (
    context.deadline &&
    !context.deadline.allowDelay(INGESTION_CRAWL_DELAY_MS)
  ) {
    return JOB_DEADLINE_EXCEEDED;
  }

  await waitForCrawlDelay(INGESTION_CRAWL_DELAY_MS, context.sleep);
  return "ok";
}
