import "server-only";

import { cache } from "react";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CompanyOfficialDocument = {
  id: string;
  type:
    | "press_release"
    | "quarterly_report"
    | "half_year_report"
    | "annual_report"
    | "report_date";
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  eventAt: string | null;
  fiscalPeriod: string | null;
};

export type CompanyFollowState = {
  companyId: string | null;
  isAvailable: boolean;
  isFollowing: boolean;
  documents: CompanyOfficialDocument[];
};

export type FollowedCompany = {
  id: string;
  slug: string;
  name: string;
  ticker: string;
  exchange: string;
  logoPath: string | null;
  followedAt: string;
};

type CompanyDocumentRow = {
  id: string;
  document_type: CompanyOfficialDocument["type"];
  title: string;
  source_url: string;
  source_publisher: string;
  published_at: string | null;
  event_at: string | null;
  fiscal_period: string | null;
};

type InstrumentRelation = {
  symbol: string;
  exchange_name: string;
  is_primary: boolean;
  is_active: boolean;
};

type CompanyRelation = {
  id: string;
  slug: string;
  name: string;
  logo_path: string | null;
  company_instruments: InstrumentRelation | InstrumentRelation[] | null;
};

type FollowRow = {
  created_at: string;
  companies: CompanyRelation | CompanyRelation[] | null;
};

function isCompanySchemaUnavailable(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("company_follows") ||
    error.message?.includes("company_documents") ||
    error.message?.includes("companies")
  );
}

function mapDocument(row: CompanyDocumentRow): CompanyOfficialDocument {
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

function getRelation<T>(relation: T | T[] | null): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export const getCompanyFollowState = cache(
  async (slug: string, userId?: string | null): Promise<CompanyFollowState> => {
    if (!tryGetSupabaseConfig()) {
      return {
        companyId: null,
        isAvailable: false,
        isFollowing: false,
        documents: [],
      };
    }

    const supabase = await createClient();
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (companyError) {
      if (isCompanySchemaUnavailable(companyError)) {
        return {
          companyId: null,
          isAvailable: false,
          isFollowing: false,
          documents: [],
        };
      }

      throw new Error(companyError.message);
    }

    if (!company) {
      return {
        companyId: null,
        isAvailable: false,
        isFollowing: false,
        documents: [],
      };
    }

    const documentQuery = supabase
      .from("company_documents")
      .select(
        "id, document_type, title, source_url, source_publisher, published_at, event_at, fiscal_period",
      )
      .eq("company_id", company.id)
      .eq("is_published", true)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(12);

    const followQuery = userId
      ? supabase
          .from("company_follows")
          .select("company_id")
          .eq("company_id", company.id)
          .eq("user_id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null });

    const [documentsResult, followResult] = await Promise.all([
      documentQuery,
      followQuery,
    ]);

    if (documentsResult.error) {
      if (isCompanySchemaUnavailable(documentsResult.error)) {
        return {
          companyId: company.id,
          isAvailable: true,
          isFollowing: Boolean(followResult.data),
          documents: [],
        };
      }

      throw new Error(documentsResult.error.message);
    }

    if (followResult.error && !isCompanySchemaUnavailable(followResult.error)) {
      throw new Error(followResult.error.message);
    }

    return {
      companyId: company.id,
      isAvailable: !followResult.error,
      isFollowing: Boolean(followResult.data),
      documents: ((documentsResult.data ?? []) as CompanyDocumentRow[]).map(
        mapDocument,
      ),
    };
  },
);

export async function getFollowedCompanies(
  userId: string,
): Promise<{ companies: FollowedCompany[]; isAvailable: boolean }> {
  if (!tryGetSupabaseConfig()) {
    return { companies: [], isAvailable: false };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("company_follows")
    .select(
      `
      created_at,
      companies!inner (
        id,
        slug,
        name,
        logo_path,
        company_instruments (
          symbol,
          exchange_name,
          is_primary,
          is_active
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isCompanySchemaUnavailable(error)) {
      return { companies: [], isAvailable: false };
    }

    throw new Error(error.message);
  }

  const companies = ((data ?? []) as FollowRow[]).flatMap((row) => {
    const company = getRelation(row.companies);

    if (!company) {
      return [];
    }

    const instruments = Array.isArray(company.company_instruments)
      ? company.company_instruments
      : company.company_instruments
        ? [company.company_instruments]
        : [];
    const instrument =
      instruments.find((item) => item.is_primary && item.is_active) ??
      instruments.find((item) => item.is_active);

    if (!instrument) {
      return [];
    }

    return [
      {
        id: company.id,
        slug: company.slug,
        name: company.name,
        ticker: instrument.symbol.replaceAll("-", " "),
        exchange: instrument.exchange_name,
        logoPath: company.logo_path,
        followedAt: row.created_at,
      },
    ];
  });

  return { companies, isAvailable: true };
}
