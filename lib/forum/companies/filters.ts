export const FORUM_COMPANY_COUNTRY_URL_VALUES = {
  sverige: "SE",
  usa: "US",
} as const;

export type ForumCompanyCountryUrlValue =
  keyof typeof FORUM_COMPANY_COUNTRY_URL_VALUES;

const FORUM_COMPANY_COUNTRY_CODE_TO_URL: Record<string, ForumCompanyCountryUrlValue> =
  {
    SE: "sverige",
    US: "usa",
  };

export function parseForumCompanyCountryParam(
  land: string | undefined,
): string | null {
  if (!land) {
    return null;
  }

  const normalized = land.trim().toLowerCase();

  if (normalized in FORUM_COMPANY_COUNTRY_URL_VALUES) {
    return FORUM_COMPANY_COUNTRY_URL_VALUES[
      normalized as ForumCompanyCountryUrlValue
    ];
  }

  return null;
}

export function parseForumCompanySearchParam(query: string | undefined) {
  return query?.trim() ?? "";
}

export function parseForumCompanyCollectionParam(lista: string | undefined) {
  const normalized = lista?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function getForumCompanyCountryUrlValue(countryCode: string) {
  return FORUM_COMPANY_COUNTRY_CODE_TO_URL[countryCode] ?? null;
}

export function buildForumCompanyDirectoryHref(filters: {
  query?: string;
  land?: string | null;
  lista?: string | null;
}) {
  const params = new URLSearchParams();

  if (filters.query) {
    params.set("q", filters.query);
  }

  if (filters.land) {
    params.set("land", filters.land);
  }

  if (filters.lista) {
    params.set("lista", filters.lista);
  }

  const queryString = params.toString();

  return queryString ? `/forum/bolag?${queryString}` : "/forum/bolag";
}

export function getForumCompanyCountryLabel(countryCode: string) {
  switch (countryCode) {
    case "SE":
      return "Sverige";
    case "US":
      return "USA";
    default:
      return countryCode;
  }
}

export function getForumCompanyInitials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-z0-9]/g, ""))
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return name.slice(0, 2).toUpperCase();
}

export function formatForumCompanyMetadata(
  primaryTicker: string,
  exchange: string,
) {
  return `${primaryTicker} · ${exchange}`;
}

export function resolveActiveForumCompanyCollectionSlug(
  lista: string | undefined,
  collections: Array<{ slug: string; isActive?: boolean }>,
) {
  const parsed = parseForumCompanyCollectionParam(lista);

  if (!parsed) {
    return null;
  }

  const collection = collections.find((item) => item.slug === parsed);

  if (!collection || collection.isActive === false) {
    return null;
  }

  return parsed;
}
