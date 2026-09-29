import "server-only";

import { unstable_cache } from "next/cache";
import { fetchBoundedText } from "@/lib/companies/ingestion/http";
import {
  REPORT_SNAPSHOT_REVALIDATE_SECONDS,
  REPORT_SNAPSHOT_TIMEOUT_MS,
  readLatestReportSnapshot,
  reportSnapshotOrigin,
  type ReportSnapshot,
} from "@/lib/companies/report-snapshot";

const HTML = ["text/html"] as const;

class ReportSnapshotTransientError extends Error {
  constructor() {
    super("report_snapshot_transient");
    this.name = "ReportSnapshotTransientError";
  }
}

function isTransientHttp(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

async function loadParsed(slug: string, reportUrl: string): Promise<ReportSnapshot | null> {
  const origin = reportSnapshotOrigin(slug);
  if (!origin) return null;
  const loaded = await readLatestReportSnapshot(slug, [{
    type: "quarterly_report",
    url: reportUrl,
    publishedAt: "9999-12-31T00:00:00.000Z",
  }], async (url) => {
    const result = await fetchBoundedText(url, {
      allowedOrigin: origin,
      acceptedContentTypes: HTML,
      maxBytes: 1_000_000,
      timeoutMs: REPORT_SNAPSHOT_TIMEOUT_MS,
    });
    if (result.status === "ok") return { status: "ok", text: result.text };
    if (
      result.reason === "network_error"
      || result.reason === "timeout"
      || (result.reason === "http_status" && isTransientHttp(result.httpStatus))
    ) {
      return { status: "transient" };
    }
    return { status: "miss" };
  });
  if (!loaded.cacheable) throw new ReportSnapshotTransientError();
  return loaded.snapshot;
}

const loadCached = unstable_cache(loadParsed, ["company-report-snapshot-v2"], {
  revalidate: REPORT_SNAPSHOT_REVALIDATE_SECONDS,
});

/**
 * One allowlisted report fetch when a verified document URL was already stored.
 * Transport, timeout and 5xx failures throw inside the cache callback so they
 * are not stored. A parsed snapshot, or a valid unsupported document, is cached
 * for one hour. The cache key includes the report URL, so a newer document is
 * fetched immediately.
 */
export async function loadCompanyReportSnapshot(
  slug: string,
  reportUrl: string | null,
): Promise<ReportSnapshot | null> {
  if (!reportUrl) return null;
  try {
    return await loadCached(slug, reportUrl);
  } catch (error) {
    if (
      error instanceof ReportSnapshotTransientError
      || (error instanceof Error && (
        error.name === "ReportSnapshotTransientError"
        || error.message === "report_snapshot_transient"
      ))
    ) {
      return null;
    }
    throw error;
  }
}
