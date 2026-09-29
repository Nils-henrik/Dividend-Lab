import "server-only";

import { companyDocumentQueryFailure, isCompanySchemaUnavailable } from "@/lib/companies/document-query";
import type { CompanyOfficialDocument } from "@/lib/companies/server";
import { persistedFactFromRow, type PersistedCompanyFact } from "@/lib/companies/official-data";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const DOCUMENT_COLUMNS =
  "company_id, id, document_type, title, source_url, source_publisher, published_at, event_at, fiscal_period";

const FACT_COLUMNS =
  "company_id, fact_type, value_text, value_numeric, unit, as_of, source_url, source_publisher";

const DOCUMENTS_PER_COMPANY = 16;
const DOCUMENT_QUERY_CAP = 400;

export type FollowedOfficialRecord = {
  documents: CompanyOfficialDocument[];
  facts: PersistedCompanyFact[];
};

export type FollowedOfficialRecords = {
  documentsUnavailable: boolean;
  byCompanyId: ReadonlyMap<string, FollowedOfficialRecord>;
};

type DocumentRow = {
  company_id: string;
  id: string;
  document_type: CompanyOfficialDocument["type"];
  title: string;
  source_url: string;
  source_publisher: string;
  published_at: string | null;
  event_at: string | null;
  fiscal_period: string | null;
};

function emptyRecords(documentsUnavailable: boolean): FollowedOfficialRecords {
  return { documentsUnavailable, byCompanyId: new Map() };
}

function isFactSchemaUnavailable(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return isCompanySchemaUnavailable(error)
    || error.code === "42703"
    || (error.message ?? "").includes("company_facts");
}

function mapDocument(row: DocumentRow): CompanyOfficialDocument {
  return {
    id: row.id,
    type: row.document_type,
    title: row.title,
    url: row.source_url,
    publisher: row.source_publisher,
    publishedAt: row.published_at,
    eventAt: row.event_at,
    fiscalPeriod: row.fiscal_period,
  };
}

/**
 * Official rows for companies the caller already loaded for the signed-in user.
 * The company ids come from that follow query. This function does not accept a user id.
 */
export async function loadFollowedOfficialRecords(
  companyIds: readonly string[],
): Promise<FollowedOfficialRecords> {
  const ids = [...new Set(companyIds.filter((id) => id.length > 0))];
  if (!tryGetSupabaseConfig() || ids.length === 0) {
    return emptyRecords(!tryGetSupabaseConfig());
  }

  const supabase = await createClient();
  const limit = Math.min(ids.length * DOCUMENTS_PER_COMPANY, DOCUMENT_QUERY_CAP);
  const [documentsResult, reportDatesResult, factsResult] = await Promise.all([
    supabase
      .from("company_documents")
      .select(DOCUMENT_COLUMNS)
      .in("company_id", ids)
      .eq("is_published", true)
      .neq("document_type", "report_date")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit),
    supabase
      .from("company_documents")
      .select(DOCUMENT_COLUMNS)
      .in("company_id", ids)
      .eq("is_published", true)
      .eq("document_type", "report_date")
      .order("event_at", { ascending: true })
      .limit(limit),
    supabase
      .from("company_facts")
      .select(FACT_COLUMNS)
      .in("company_id", ids),
  ]);

  if (companyDocumentQueryFailure(documentsResult.error) === "schema_unavailable") {
    return emptyRecords(true);
  }
  if (companyDocumentQueryFailure(reportDatesResult.error) === "schema_unavailable") {
    return emptyRecords(true);
  }
  if (factsResult.error && !isFactSchemaUnavailable(factsResult.error)) {
    throw new Error(factsResult.error.message);
  }

  const byCompanyId = new Map<string, FollowedOfficialRecord>();
  const ensure = (companyId: string) => {
    const existing = byCompanyId.get(companyId);
    if (existing) return existing;
    const created = { documents: [], facts: [] };
    byCompanyId.set(companyId, created);
    return created;
  };

  for (const row of [...(documentsResult.data ?? []), ...(reportDatesResult.data ?? [])] as DocumentRow[]) {
    if (typeof row.company_id !== "string") continue;
    ensure(row.company_id).documents.push(mapDocument(row));
  }

  if (!factsResult.error) {
    for (const row of (factsResult.data ?? []) as Array<Record<string, unknown>>) {
      const companyId = row.company_id;
      const fact = persistedFactFromRow(row);
      if (typeof companyId !== "string" || !fact) continue;
      ensure(companyId).facts.push(fact);
    }
  }

  return { documentsUnavailable: false, byCompanyId };
}
