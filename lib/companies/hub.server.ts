import "server-only";

import { getPilotCompanies } from "@/lib/companies/catalog";
import { selectUpcomingReports, type UpcomingReport } from "@/lib/companies/hub";
import { stockholmIsoDate } from "@/lib/companies/current-events";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type CompanyRow = { id: string; slug: string; name: string };
type DocumentRow = { company_id: string; title: string; event_at: string | null };

export async function loadUpcomingCompanyReports(now = new Date()): Promise<UpcomingReport[]> {
  if (!tryGetSupabaseConfig()) return [];
  try {
    const supabase = await createClient();
    const companies = getPilotCompanies();
    const slugs = companies.map((company) => company.slug);
    const companyResult = await supabase.from("companies").select("id, slug, name").in("slug", slugs);
    if (companyResult.error || !companyResult.data) return [];
    const byId = new Map((companyResult.data as CompanyRow[]).map((row) => [row.id, row]));
    const ids = [...byId.keys()];
    if (ids.length === 0) return [];
    const today = stockholmIsoDate(now);
    const documentResult = await supabase
      .from("company_documents")
      .select("company_id, title, event_at")
      .in("company_id", ids)
      .eq("document_type", "report_date")
      .eq("is_published", true)
      .gte("event_at", today)
      .order("event_at", { ascending: true })
      .limit(40);
    if (documentResult.error || !documentResult.data) return [];
    const catalog = new Map(companies.map((company) => [company.slug, company]));
    const rows = (documentResult.data as DocumentRow[]).flatMap((row) => {
      const stored = byId.get(row.company_id);
      const company = stored ? catalog.get(stored.slug) : undefined;
      const date = row.event_at?.slice(0, 10) ?? "";
      if (!company || !date) return [];
      return [{
        slug: company.slug,
        name: company.displayName,
        ticker: company.ticker,
        title: row.title,
        date,
      }];
    });
    return selectUpcomingReports(rows, today);
  } catch {
    return [];
  }
}
