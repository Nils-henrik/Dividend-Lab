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
};

export async function fetchOfficialText(
  url: string,
  context: SourceFetchContext,
  options: {
    allowedOrigin: string;
    acceptedContentTypes: readonly string[];
    maxBytes: number;
    allowSearch?: boolean;
  },
): Promise<BoundedTextFetchResult> {
  return fetchBoundedText(url, {
    allowedOrigin: options.allowedOrigin,
    acceptedContentTypes: options.acceptedContentTypes,
    maxBytes: options.maxBytes,
    timeoutMs: INGESTION_REQUEST_TIMEOUT_MS,
    allowSearch: options.allowSearch,
    fetchImpl: context.fetchImpl,
  });
}

export async function pauseBetweenRequests(context: SourceFetchContext): Promise<void> {
  await waitForCrawlDelay(INGESTION_CRAWL_DELAY_MS, context.sleep);
}
