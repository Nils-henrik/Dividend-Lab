import type { SupabaseClient } from "@supabase/supabase-js";

import type { SourceSupportMode } from "@/lib/companies/ingestion/baseline";
import {
  COMPANY_FACT_SOURCE_TYPES,
  validateNormalizedCompanyDocument,
  type CompanySourceType,
  type NormalizedCompanyDocument,
} from "@/lib/companies/ingestion/document";
import {
  companyFactRows,
  companyOwnershipRows,
  type CompanyFactDraft,
  type CompanyOwnershipDraft,
} from "@/lib/companies/ingestion/facts";
import type { CompanyIngestionJob } from "@/lib/companies/ingestion/queue";
import type { AtlasCopcoPressReleaseDocument } from "@/lib/companies/ingestion/adapters/atlas-copco";

export type CompanyIngestionSource = {
  id: string;
};

export type CompanyIngestionStore = {
  loadOfficialSource(input: {
    companyId: string;
    sourceType: "press_releases";
    sourceUrl: string;
  }): Promise<{ status: "ok"; source: CompanyIngestionSource } | { status: "error" }>;
  savePressReleases(input: {
    companyId: string;
    sourceId: string;
    documents: AtlasCopcoPressReleaseDocument[];
    fetchedAt: string;
  }): Promise<boolean>;
  markSourceChecked(sourceId: string, checkedAt: string): Promise<boolean>;
  completeJob(job: CompanyIngestionJob, completedAt: string): Promise<boolean>;
  retryOrFailJob(
    job: CompanyIngestionJob,
    reason: string,
    failedAt: string,
  ): Promise<boolean>;
};

export type OfficialCompanySource = {
  id: string;
  sourceType: CompanySourceType;
  sourceUrl: string;
  publisher: string;
  lastCheckedAt: string | null;
  supportMode: SourceSupportMode;
  lastSuccessAt: string | null;
  lastFailureReason: string | null;
};

export type PersistedCompanyDocument = {
  source_url: string;
  published_at: string | null;
  event_at: string | null;
  fiscal_period: string | null;
};

export type CompanyIngestionOrchestratorStore = CompanyIngestionStore & {
  loadCompany(
    companyId: string,
  ): Promise<
    | { status: "ok"; company: { id: string; slug: string } }
    | { status: "error" }
  >;
  loadOfficialSources(
    companyId: string,
  ): Promise<
    | { status: "ok"; sources: OfficialCompanySource[] }
    | { status: "error" }
  >;
  saveDocuments(input: {
    companyId: string;
    sourceId: string;
    documents: NormalizedCompanyDocument[];
    allowedOrigins: readonly string[];
    fetchedAt: string;
  }): Promise<boolean>;
  saveFacts(input: {
    companyId: string;
    facts: CompanyFactDraft[];
    allowedOrigins: readonly string[];
    fetchedAt: string;
  }): Promise<boolean>;
  replaceOwnership(input: {
    companyId: string;
    owners: CompanyOwnershipDraft[];
    allowedOrigins: readonly string[];
    fetchedAt: string;
  }): Promise<boolean>;
  markSourceFailure(sourceId: string, checkedAt: string, reason: string): Promise<boolean>;
  markSourceSupport(sourceId: string, supportMode: SourceSupportMode, checkedAt: string): Promise<boolean>;
};

export function mergePersistedCompanyDocument(
  document: NormalizedCompanyDocument,
  existing: PersistedCompanyDocument | null,
): PersistedCompanyDocument & {
  document_type: NormalizedCompanyDocument["documentType"];
  title: string;
  source_publisher: string;
} {
  return {
    document_type: document.documentType,
    title: document.title,
    source_url: document.sourceUrl,
    source_publisher: document.sourcePublisher,
    published_at: document.publishedAt ?? existing?.published_at ?? null,
    event_at: document.eventAt ?? existing?.event_at ?? null,
    fiscal_period: document.fiscalPeriod ?? existing?.fiscal_period ?? null,
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_JOB_ATTEMPTS = 3;

function sanitizeJobError(reason: string): string {
  return reason.replace(/[^a-z0-9_-]/gi, "_").slice(0, 160) || "unknown_error";
}

const SOURCE_TYPES = new Set<CompanySourceType>([
  "press_releases",
  "financial_reports",
  "financial_calendar",
  ...COMPANY_FACT_SOURCE_TYPES,
]);
const SUPPORT_MODES = new Set<SourceSupportMode>(["automated", "source_link_only", "blocked"]);

function isMissingCoverageColumn(error: { message?: string; code?: string } | null): boolean {
  const message = error?.message ?? "";
  return error?.code === "42703" || /support_mode|last_success_at|last_failure_reason/.test(message);
}
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function createCompanyIngestionStore(
  client: SupabaseClient,
): CompanyIngestionOrchestratorStore {
  return {
    async loadCompany(companyId) {
      const { data, error } = await client
        .from("companies")
        .select("id, slug")
        .eq("id", companyId)
        .maybeSingle();
      if (
        error ||
        !data ||
        data.id !== companyId ||
        typeof data.slug !== "string" ||
        !SLUG_PATTERN.test(data.slug)
      ) {
        return { status: "error" };
      }

      return { status: "ok", company: { id: data.id, slug: data.slug } };
    },

    async loadOfficialSources(companyId) {
      const covered = await client
        .from("company_sources")
        .select("id, source_type, source_url, publisher, last_checked_at, support_mode, last_success_at, last_failure_reason")
        .eq("company_id", companyId)
        .eq("is_official", true)
        .eq("is_active", true);
      const legacy = isMissingCoverageColumn(covered.error)
        ? await client
          .from("company_sources")
          .select("id, source_type, source_url, publisher, last_checked_at")
          .eq("company_id", companyId)
          .eq("is_official", true)
          .eq("is_active", true)
        : covered;
      const data = legacy.data;
      const error = legacy.error;
      if (error || !Array.isArray(data)) {
        return { status: "error" };
      }

      const sources: OfficialCompanySource[] = [];
      for (const row of data) {
        const supportMode = "support_mode" in row && typeof row.support_mode === "string"
          ? row.support_mode
          : "automated";
        if (
          typeof row.id !== "string" ||
          !UUID_PATTERN.test(row.id) ||
          typeof row.source_type !== "string" ||
          !SOURCE_TYPES.has(row.source_type as CompanySourceType) ||
          typeof row.source_url !== "string" ||
          !row.source_url.startsWith("https://") ||
          typeof row.publisher !== "string" ||
          (row.last_checked_at !== null && typeof row.last_checked_at !== "string") ||
          !SUPPORT_MODES.has(supportMode as SourceSupportMode)
        ) {
          return { status: "error" };
        }

        sources.push({
          id: row.id,
          sourceType: row.source_type as CompanySourceType,
          sourceUrl: row.source_url,
          publisher: row.publisher,
          lastCheckedAt: row.last_checked_at,
          supportMode: supportMode as SourceSupportMode,
          lastSuccessAt: "last_success_at" in row && typeof row.last_success_at === "string" ? row.last_success_at : null,
          lastFailureReason: "last_failure_reason" in row && typeof row.last_failure_reason === "string" ? row.last_failure_reason : null,
        });
      }

      return { status: "ok", sources };
    },

    async saveDocuments(input) {
      const invalid = input.documents.some(
        (document) =>
          !validateNormalizedCompanyDocument(document, input.allowedOrigins),
      );
      if (invalid || input.documents.length === 0) {
        return false;
      }

      const { data: existingRows, error: existingError } = await client
        .from("company_documents")
        .select("source_url, published_at, event_at, fiscal_period")
        .eq("company_id", input.companyId)
        .in(
          "source_url",
          input.documents.map((document) => document.sourceUrl),
        );
      if (existingError || !Array.isArray(existingRows)) {
        return false;
      }

      const existingByUrl = new Map<string, PersistedCompanyDocument>();
      for (const row of existingRows) {
        if (typeof row.source_url !== "string") {
          return false;
        }

        existingByUrl.set(row.source_url, {
          source_url: row.source_url,
          published_at: typeof row.published_at === "string" ? row.published_at : null,
          event_at: typeof row.event_at === "string" ? row.event_at : null,
          fiscal_period: typeof row.fiscal_period === "string" ? row.fiscal_period : null,
        });
      }

      const rows = input.documents.map((document) => {
        const merged = mergePersistedCompanyDocument(
          document,
          existingByUrl.get(document.sourceUrl) ?? null,
        );
        return {
          company_id: input.companyId,
          source_id: input.sourceId,
          document_type: merged.document_type,
          title: merged.title,
          source_url: merged.source_url,
          source_publisher: merged.source_publisher,
          published_at: merged.published_at,
          event_at: merged.event_at,
          fiscal_period: merged.fiscal_period,
          fetched_at: input.fetchedAt,
          is_published: true,
        };
      });
      const { error } = await client.from("company_documents").upsert(rows, {
        onConflict: "company_id,source_url",
      });

      return !error;
    },

    async loadOfficialSource(input) {
      const { data, error } = await client
        .from("company_sources")
        .select("id")
        .eq("company_id", input.companyId)
        .eq("source_type", input.sourceType)
        .eq("source_url", input.sourceUrl)
        .eq("is_official", true)
        .eq("is_active", true)
        .maybeSingle();

      if (
        error ||
        !data ||
        typeof data.id !== "string" ||
        !UUID_PATTERN.test(data.id)
      ) {
        return { status: "error" };
      }

      return { status: "ok", source: { id: data.id } };
    },

    async savePressReleases(input) {
      if (input.documents.length === 0) {
        return true;
      }

      const rows = input.documents.map((document) => ({
        company_id: input.companyId,
        source_id: input.sourceId,
        document_type: document.documentType,
        title: document.title,
        source_url: document.sourceUrl,
        source_publisher: document.sourcePublisher,
        published_at: document.publishedAt,
        event_at: null,
        fiscal_period: null,
        fetched_at: input.fetchedAt,
        is_published: true,
      }));
      const { error } = await client.from("company_documents").upsert(rows, {
        onConflict: "company_id,source_url",
      });

      return !error;
    },

    async saveFacts(input) {
      const rows = companyFactRows(input.facts, input.allowedOrigins, input.fetchedAt);
      if (!rows || rows.length === 0) return false;
      const { error } = await client.from("company_facts").upsert(
        rows.map((row) => ({ ...row, company_id: input.companyId })),
        { onConflict: "company_id,fact_type" },
      );
      return !error;
    },

    async replaceOwnership(input) {
      const rows = companyOwnershipRows(input.owners, input.allowedOrigins, input.fetchedAt);
      if (!rows) return false;
      const { error } = await client.from("company_ownership").upsert(
        rows.map((row) => ({ ...row, company_id: input.companyId })),
        { onConflict: "company_id,owner_name" },
      );
      if (error) return false;
      const { data: existing, error: existingError } = await client
        .from("company_ownership")
        .select("id, owner_name")
        .eq("company_id", input.companyId);
      if (existingError || !Array.isArray(existing)) return false;
      const names = new Set(rows.map((row) => row.owner_name));
      const staleIds = existing.flatMap((row) =>
        typeof row.id === "string" && typeof row.owner_name === "string" && !names.has(row.owner_name)
          ? [row.id]
          : [],
      );
      if (staleIds.length === 0) return true;
      const { error: deleteError } = await client.from("company_ownership").delete().in("id", staleIds);
      return !deleteError;
    },

    async markSourceChecked(sourceId, checkedAt) {
      const covered = await client
        .from("company_sources")
        .update({
          last_checked_at: checkedAt,
          last_success_at: checkedAt,
          last_failure_reason: null,
        })
        .eq("id", sourceId)
        .select("id")
        .maybeSingle();
      if (!isMissingCoverageColumn(covered.error)) {
        return !covered.error && covered.data?.id === sourceId;
      }
      const legacy = await client
        .from("company_sources")
        .update({ last_checked_at: checkedAt })
        .eq("id", sourceId)
        .select("id")
        .maybeSingle();
      return !legacy.error && legacy.data?.id === sourceId;
    },

    async markSourceFailure(sourceId, _checkedAt, reason) {
      const { data, error } = await client
        .from("company_sources")
        .update({
          last_failure_reason: sanitizeJobError(reason),
        })
        .eq("id", sourceId)
        .select("id")
        .maybeSingle();
      if (isMissingCoverageColumn(error)) return true;
      return !error && data?.id === sourceId;
    },

    async markSourceSupport(sourceId, supportMode, checkedAt) {
      const { data, error } = await client
        .from("company_sources")
        .update({
          support_mode: supportMode,
          last_checked_at: checkedAt,
          last_failure_reason: null,
        })
        .eq("id", sourceId)
        .select("id")
        .maybeSingle();
      if (isMissingCoverageColumn(error)) return true;
      return !error && data?.id === sourceId;
    },

    async completeJob(job, completedAt) {
      const { data, error } = await client
        .from("company_ingestion_jobs")
        .update({
          status: "completed",
          completed_at: completedAt,
          locked_at: null,
          last_error: null,
        })
        .eq("id", job.id)
        .eq("company_id", job.companyId)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();

      return !error && data?.id === job.id;
    },

    async retryOrFailJob(job, reason, failedAt) {
      const permanentlyFailed = job.attempts >= MAX_JOB_ATTEMPTS;
      const retryDelaySeconds = Math.min(60 * 60, 60 * 2 ** (job.attempts - 1));
      const availableAt = new Date(
        new Date(failedAt).getTime() + retryDelaySeconds * 1_000,
      ).toISOString();
      const { data, error } = await client
        .from("company_ingestion_jobs")
        .update({
          status: permanentlyFailed ? "failed" : "pending",
          available_at: permanentlyFailed ? failedAt : availableAt,
          completed_at: permanentlyFailed ? failedAt : null,
          locked_at: null,
          last_error: sanitizeJobError(reason),
        })
        .eq("id", job.id)
        .eq("company_id", job.companyId)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();

      return !error && data?.id === job.id;
    },
  };
}
