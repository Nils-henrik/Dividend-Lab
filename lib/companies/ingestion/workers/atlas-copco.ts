import {
  ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT,
  ATLAS_COPCO_MAX_PRESS_RELEASE_BYTES,
  ATLAS_COPCO_MAX_SITEMAP_BYTES,
  ATLAS_COPCO_MIN_REQUEST_INTERVAL_MS,
  ATLAS_COPCO_ORIGIN,
  ATLAS_COPCO_PRESS_RELEASE_SITEMAP_URL,
  ATLAS_COPCO_PRESS_RELEASE_SOURCE_URL,
  parseAtlasCopcoPressRelease,
  parseAtlasCopcoPressReleaseSitemap,
  type AtlasCopcoPressReleaseDocument,
} from "@/lib/companies/ingestion/adapters/atlas-copco";
import { fetchBoundedText, waitForCrawlDelay } from "@/lib/companies/ingestion/http";
import type { CompanyIngestionJob } from "@/lib/companies/ingestion/queue";
import type { CompanyIngestionStore } from "@/lib/companies/ingestion/store";

const REQUEST_TIMEOUT_MS = 10_000;

export type AtlasCopcoWorkerDependencies = {
  store: CompanyIngestionStore;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => Date;
};

export type AtlasCopcoWorkerResult =
  | { status: "completed"; savedDocuments: number }
  | { status: "retry_scheduled"; reason: string }
  | { status: "failed"; reason: string };

async function recordFailure(
  job: CompanyIngestionJob,
  reason: string,
  dependencies: AtlasCopcoWorkerDependencies,
): Promise<AtlasCopcoWorkerResult> {
  const recorded = await dependencies.store.retryOrFailJob(
    job,
    reason,
    (dependencies.now ?? (() => new Date()))().toISOString(),
  );

  if (!recorded || job.attempts >= 3) {
    return { status: "failed", reason };
  }

  return { status: "retry_scheduled", reason };
}

async function executeAtlasCopcoIngestionJob(
  job: CompanyIngestionJob,
  dependencies: AtlasCopcoWorkerDependencies,
): Promise<AtlasCopcoWorkerResult> {
  const sourceResult = await dependencies.store.loadOfficialSource({
    companyId: job.companyId,
    sourceType: "press_releases",
    sourceUrl: ATLAS_COPCO_PRESS_RELEASE_SOURCE_URL,
  });
  if (sourceResult.status === "error") {
    return recordFailure(job, "official_source_unavailable", dependencies);
  }

  const sitemapResponse = await fetchBoundedText(
    ATLAS_COPCO_PRESS_RELEASE_SITEMAP_URL,
    {
      allowedOrigin: ATLAS_COPCO_ORIGIN,
      acceptedContentTypes: ["application/xml", "text/xml"],
      maxBytes: ATLAS_COPCO_MAX_SITEMAP_BYTES,
      timeoutMs: REQUEST_TIMEOUT_MS,
      fetchImpl: dependencies.fetchImpl,
    },
  );
  if (sitemapResponse.status === "error") {
    return recordFailure(
      job,
      `sitemap_${sitemapResponse.reason}`,
      dependencies,
    );
  }

  const sitemap = parseAtlasCopcoPressReleaseSitemap(
    sitemapResponse.text,
    ATLAS_COPCO_INITIAL_DISCOVERY_LIMIT,
  );
  if (sitemap.status === "invalid" || sitemap.candidates.length === 0) {
    return recordFailure(job, "sitemap_invalid", dependencies);
  }

  const documents: AtlasCopcoPressReleaseDocument[] = [];
  for (const candidate of sitemap.candidates) {
    await waitForCrawlDelay(
      ATLAS_COPCO_MIN_REQUEST_INTERVAL_MS,
      dependencies.sleep,
    );
    const detailResponse = await fetchBoundedText(candidate.sourceUrl, {
      allowedOrigin: ATLAS_COPCO_ORIGIN,
      acceptedContentTypes: ["text/html"],
      maxBytes: ATLAS_COPCO_MAX_PRESS_RELEASE_BYTES,
      timeoutMs: REQUEST_TIMEOUT_MS,
      fetchImpl: dependencies.fetchImpl,
    });
    if (detailResponse.status === "error") {
      return recordFailure(
        job,
        `detail_${detailResponse.reason}`,
        dependencies,
      );
    }

    const detail = parseAtlasCopcoPressRelease(
      detailResponse.text,
      candidate.sourceUrl,
    );
    if (detail.status === "ok") {
      documents.push(detail.document);
    }
  }

  if (documents.length === 0) {
    return recordFailure(job, "no_valid_documents", dependencies);
  }

  const completedAt = (dependencies.now ?? (() => new Date()))().toISOString();
  if (
    !(await dependencies.store.savePressReleases({
      companyId: job.companyId,
      sourceId: sourceResult.source.id,
      documents,
      fetchedAt: completedAt,
    })) ||
    !(await dependencies.store.markSourceChecked(
      sourceResult.source.id,
      completedAt,
    )) ||
    !(await dependencies.store.completeJob(job, completedAt))
  ) {
    return recordFailure(job, "database_write_failed", dependencies);
  }

  return { status: "completed", savedDocuments: documents.length };
}

export async function runAtlasCopcoIngestionJob(
  job: CompanyIngestionJob,
  dependencies: AtlasCopcoWorkerDependencies,
): Promise<AtlasCopcoWorkerResult> {
  try {
    return await executeAtlasCopcoIngestionJob(job, dependencies);
  } catch {
    try {
      return await recordFailure(job, "worker_unexpected_error", dependencies);
    } catch {
      return { status: "failed", reason: "worker_unexpected_error" };
    }
  }
}
