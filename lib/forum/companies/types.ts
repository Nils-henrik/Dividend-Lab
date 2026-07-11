export type ForumCompanyCollectionType = "index" | "market" | "editorial";

export type ForumCompanyCollectionRecord = {
  id: string;
  slug: string;
  name: string;
  countryCode: string | null;
  collectionType: ForumCompanyCollectionType;
  sortOrder: number;
  companyCount: number;
};

export type ForumCompanyCollectionSummary = {
  slug: string;
  name: string;
  countryCode: string | null;
  collectionType: ForumCompanyCollectionType;
};

export type ForumCompanyRecord = {
  id: string;
  slug: string;
  name: string;
  primaryTicker: string;
  exchange: string;
  countryCode: string;
  logoPath: string | null;
  sortOrder: number;
  collections: ForumCompanyCollectionSummary[];
};

export type ForumCompanyDirectoryFilters = {
  query?: string;
  countryCode?: string | null;
  collectionSlug?: string | null;
};

export type ForumCompanyDirectoryResult = {
  companies: ForumCompanyRecord[];
  collections: ForumCompanyCollectionRecord[];
  filters: ForumCompanyDirectoryFilters;
  isDirectoryUnavailable: boolean;
};

export type ForumCompanyDetailResult = {
  company: ForumCompanyRecord | null;
  isDirectoryUnavailable: boolean;
};
