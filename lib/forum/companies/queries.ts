import { createClient } from "@/lib/supabase/server";
import type {
  ForumCompanyCollectionRecord,
  ForumCompanyCollectionSummary,
  ForumCompanyDetailResult,
  ForumCompanyDirectoryFilters,
  ForumCompanyDirectoryResult,
  ForumCompanyRecord,
} from "@/lib/forum/companies/types";

type CompanyRow = {
  id: string;
  slug: string;
  name: string;
  primary_ticker: string;
  exchange: string;
  country_code: string;
  logo_path: string | null;
  sort_order: number;
};

type CollectionRow = {
  id: string;
  slug: string;
  name: string;
  country_code: string | null;
  collection_type: "index" | "market" | "editorial";
  sort_order: number;
};

type MembershipRow = {
  company_id: string;
  collection_id: string;
  sort_order: number;
  forum_company_collections: CollectionRow | CollectionRow[] | null;
};

function isMissingForumCompanyTableError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.message?.includes("forum_companies") ||
    error.message?.includes("forum_company_collections") ||
    error.message?.includes("forum_company_collection_members")
  );
}

function getCollectionRow(
  relation: MembershipRow["forum_company_collections"],
): CollectionRow | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function mapCollectionSummary(row: CollectionRow): ForumCompanyCollectionSummary {
  return {
    slug: row.slug,
    name: row.name,
    countryCode: row.country_code,
    collectionType: row.collection_type,
  };
}

function mapCompanyRow(
  row: CompanyRow,
  collections: ForumCompanyCollectionSummary[],
): ForumCompanyRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    primaryTicker: row.primary_ticker,
    exchange: row.exchange,
    countryCode: row.country_code,
    logoPath: row.logo_path,
    sortOrder: row.sort_order,
    collections,
  };
}

async function getActiveCollectionRows() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_company_collections")
    .select("id, slug, name, country_code, collection_type, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    if (isMissingForumCompanyTableError(error)) {
      return { rows: [] as CollectionRow[], isDirectoryUnavailable: true };
    }

    throw new Error(error.message);
  }

  return {
    rows: (data ?? []) as CollectionRow[],
    isDirectoryUnavailable: false,
  };
}

async function getCompanyIdsForCollectionSlug(collectionSlug: string) {
  const supabase = await createClient();
  const { data: collection, error: collectionError } = await supabase
    .from("forum_company_collections")
    .select("id")
    .eq("slug", collectionSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (collectionError) {
    if (isMissingForumCompanyTableError(collectionError)) {
      return {
        companyIds: null,
        collectionFound: false,
        isDirectoryUnavailable: true,
      };
    }

    throw new Error(collectionError.message);
  }

  if (!collection) {
    return {
      companyIds: null,
      collectionFound: false,
      isDirectoryUnavailable: false,
    };
  }

  const { data, error } = await supabase
    .from("forum_company_collection_members")
    .select("company_id")
    .eq("collection_id", collection.id);

  if (error) {
    if (isMissingForumCompanyTableError(error)) {
      return {
        companyIds: null,
        collectionFound: true,
        isDirectoryUnavailable: true,
      };
    }

    throw new Error(error.message);
  }

  return {
    companyIds: (data ?? []).map((row) => row.company_id),
    collectionFound: true,
    isDirectoryUnavailable: false,
  };
}

async function getMembershipsByCompanyIds(companyIds: string[]) {
  if (companyIds.length === 0) {
    return new Map<string, ForumCompanyCollectionSummary[]>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_company_collection_members")
    .select(
      `
      company_id,
      collection_id,
      sort_order,
      forum_company_collections (
        id,
        slug,
        name,
        country_code,
        collection_type,
        sort_order
      )
    `,
    )
    .in("company_id", companyIds)
    .order("sort_order", { ascending: true });

  if (error) {
    if (isMissingForumCompanyTableError(error)) {
      return new Map<string, ForumCompanyCollectionSummary[]>();
    }

    throw new Error(error.message);
  }

  const memberships = new Map<string, ForumCompanyCollectionSummary[]>();

  for (const row of (data ?? []) as MembershipRow[]) {
    const collection = getCollectionRow(row.forum_company_collections);

    if (!collection) {
      continue;
    }

    const current = memberships.get(row.company_id) ?? [];
    current.push(mapCollectionSummary(collection));
    memberships.set(row.company_id, current);
  }

  for (const [companyId, items] of memberships) {
    memberships.set(
      companyId,
      items.sort((first, second) => first.name.localeCompare(second.name, "sv")),
    );
  }

  return memberships;
}

async function getCollectionCompanyCounts(collectionIds: string[]) {
  if (collectionIds.length === 0) {
    return new Map<string, number>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_company_collection_members")
    .select("collection_id, company_id")
    .in("collection_id", collectionIds);

  if (error) {
    if (isMissingForumCompanyTableError(error)) {
      return new Map<string, number>();
    }

    throw new Error(error.message);
  }

  const counts = new Map<string, Set<string>>();

  for (const row of data ?? []) {
    const current = counts.get(row.collection_id) ?? new Set<string>();
    current.add(row.company_id);
    counts.set(row.collection_id, current);
  }

  return new Map(
    [...counts.entries()].map(([collectionId, companyIds]) => [
      collectionId,
      companyIds.size,
    ]),
  );
}

export async function getForumCompanyCollectionsWithCounts(): Promise<{
  collections: ForumCompanyCollectionRecord[];
  isDirectoryUnavailable: boolean;
}> {
  const { rows, isDirectoryUnavailable } = await getActiveCollectionRows();

  if (isDirectoryUnavailable) {
    return { collections: [], isDirectoryUnavailable: true };
  }

  const counts = await getCollectionCompanyCounts(rows.map((row) => row.id));

  return {
    collections: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      countryCode: row.country_code,
      collectionType: row.collection_type,
      sortOrder: row.sort_order,
      companyCount: counts.get(row.id) ?? 0,
    })),
    isDirectoryUnavailable: false,
  };
}

export async function getForumCompanyDirectory(
  filters: ForumCompanyDirectoryFilters,
): Promise<ForumCompanyDirectoryResult> {
  const supabase = await createClient();
  const { collections, isDirectoryUnavailable } =
    await getForumCompanyCollectionsWithCounts();

  if (isDirectoryUnavailable) {
    return {
      companies: [],
      collections: [],
      filters,
      isDirectoryUnavailable: true,
    };
  }

  const activeCollectionSlug =
    filters.collectionSlug &&
    collections.some((collection) => collection.slug === filters.collectionSlug)
      ? filters.collectionSlug
      : null;

  const collectionFilter = activeCollectionSlug
    ? await getCompanyIdsForCollectionSlug(activeCollectionSlug)
    : {
        companyIds: null as string[] | null,
        collectionFound: false,
        isDirectoryUnavailable: false,
      };

  if (collectionFilter.isDirectoryUnavailable) {
    return {
      companies: [],
      collections: [],
      filters: {
        ...filters,
        collectionSlug: activeCollectionSlug,
      },
      isDirectoryUnavailable: true,
    };
  }

  if (
    activeCollectionSlug &&
    collectionFilter.collectionFound &&
    collectionFilter.companyIds &&
    collectionFilter.companyIds.length === 0
  ) {
    return {
      companies: [],
      collections,
      filters: {
        ...filters,
        collectionSlug: activeCollectionSlug,
      },
      isDirectoryUnavailable: false,
    };
  }

  let query = supabase
    .from("forum_companies")
    .select(
      "id, slug, name, primary_ticker, exchange, country_code, logo_path, sort_order",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (filters.countryCode) {
    query = query.eq("country_code", filters.countryCode);
  }

  if (activeCollectionSlug && collectionFilter.companyIds) {
    query = query.in("id", collectionFilter.companyIds);
  }

  const normalizedQuery = filters.query?.trim();

  if (normalizedQuery) {
    const escaped = normalizedQuery.replace(/[%_,]/g, "");
    query = query.or(
      `name.ilike.%${escaped}%,primary_ticker.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingForumCompanyTableError(error)) {
      return {
        companies: [],
        collections: [],
        filters: {
          ...filters,
          collectionSlug: activeCollectionSlug,
        },
        isDirectoryUnavailable: true,
      };
    }

    throw new Error(error.message);
  }

  const rows = (data ?? []) as CompanyRow[];
  const memberships = await getMembershipsByCompanyIds(rows.map((row) => row.id));

  return {
    companies: rows.map((row) =>
      mapCompanyRow(row, memberships.get(row.id) ?? []),
    ),
    collections,
    filters: {
      ...filters,
      collectionSlug: activeCollectionSlug,
    },
    isDirectoryUnavailable: false,
  };
}

export async function getForumCompanyBySlug(
  slug: string,
): Promise<ForumCompanyDetailResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forum_companies")
    .select(
      "id, slug, name, primary_ticker, exchange, country_code, logo_path, sort_order",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (isMissingForumCompanyTableError(error)) {
      return { company: null, isDirectoryUnavailable: true };
    }

    throw new Error(error.message);
  }

  if (!data) {
    return { company: null, isDirectoryUnavailable: false };
  }

  const memberships = await getMembershipsByCompanyIds([data.id]);
  const row = data as CompanyRow;

  return {
    company: mapCompanyRow(row, memberships.get(row.id) ?? []),
    isDirectoryUnavailable: false,
  };
}
