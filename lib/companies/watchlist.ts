import { getCompanyProfile, getPilotCompanies } from "@/lib/companies/catalog";
import { isVerifiedOmxs30Member } from "@/lib/companies/omxs30";

export const MISSING_MARKET_VALUE = "—";

export type WatchlistSort = "name" | "exchange" | "recent";
export type WatchlistView = "list" | "compact";
export type QuoteTone = "positive" | "negative" | "neutral";
export type FollowControlMode = "unfollow" | "discovery";

export type MarketFilter = {
  id: string;
  label: string;
  kind: "all" | "index" | "country";
};

export type CompanySearchFields = {
  name: string;
  displayName: string;
  ticker: string;
  slug: string;
  aliases?: readonly string[];
  tickerAliases?: readonly string[];
};

export type DiscoveryCompany = CompanySearchFields & {
  exchange: string;
  countryCode: string;
  countryName: string;
  logoPath: string | null;
  indexLabels: readonly string[];
};

export type FollowedCompanyInput = {
  id: string;
  slug: string;
  name: string;
  ticker: string;
  exchange: string;
  logoPath: string | null;
  followedAt: string;
};

export type WatchlistQuoteInput = {
  price: number | null;
  change: number | null;
  changePct: number | null;
  currency: string | null;
  sessionVolume: number | null;
  marketTimestamp: string | null;
  marketCap: number | null;
  dayHigh: number | null;
  dayLow: number | null;
  sparkline: readonly number[];
};

export type FollowedCompanyCard = DiscoveryCompany & {
  id: string;
  followedAt: string;
  priceLabel: string;
  changeLabel: string;
  changePctLabel: string;
  tone: QuoteTone;
  timestampLabel: string;
  dayHighLabel: string;
  dayLowLabel: string;
  volumeLabel: string;
  marketCapLabel: string;
  sparkline: number[] | null;
};

export type FollowControlModel = {
  slug: string;
  displayName: string;
  isFollowing: boolean;
  followMode: FollowControlMode;
};

export type FollowedNewsItem = {
  id: string;
  title: string;
  href: string | null;
  publishedLabel: string;
};

const priceFormat = new Intl.NumberFormat("sv-SE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const signedFormat = new Intl.NumberFormat("sv-SE", {
  signDisplay: "exceptZero",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormat = new Intl.NumberFormat("sv-SE", {
  maximumFractionDigits: 0,
});

const timeFormat = new Intl.DateTimeFormat("sv-SE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Stockholm",
});

function normalizeSearch(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("sv").trim();
}

function compactSearch(value: string) {
  return normalizeSearch(value).replace(/[^a-z0-9]/g, "");
}

function indexLabelsFor(slug: string) {
  return isVerifiedOmxs30Member(slug) ? ["OMXS30"] : [];
}

export function listDiscoveryCompanies(): DiscoveryCompany[] {
  return getPilotCompanies().map((company) => ({
    slug: company.slug,
    name: company.name,
    displayName: company.displayName,
    ticker: company.ticker,
    exchange: company.exchange,
    countryCode: company.countryCode,
    countryName: company.countryName,
    logoPath: company.logoPath,
    indexLabels: indexLabelsFor(company.slug),
    aliases: company.aliases,
    tickerAliases: company.tickerAliases,
  }));
}

export function listMarketFilters(companies: readonly DiscoveryCompany[]): MarketFilter[] {
  const filters: MarketFilter[] = [{ id: "all", label: "Alla", kind: "all" }];

  if (companies.some((company) => company.indexLabels.includes("OMXS30"))) {
    filters.push({ id: "omxs30", label: "OMXS30", kind: "index" });
  }

  const countries = new Map<string, string>();

  for (const company of companies) {
    if (company.countryCode && company.countryName) {
      countries.set(company.countryCode, company.countryName);
    }
  }

  for (const [code, name] of [...countries.entries()].sort((left, right) =>
    left[1].localeCompare(right[1], "sv"),
  )) {
    filters.push({ id: `country:${code}`, label: name, kind: "country" });
  }

  return filters;
}

export function matchesMarketFilter(
  company: Pick<DiscoveryCompany, "indexLabels" | "countryCode">,
  filterId: string,
) {
  if (filterId === "all") {
    return true;
  }

  if (filterId === "omxs30") {
    return company.indexLabels.includes("OMXS30");
  }

  if (filterId.startsWith("country:")) {
    return company.countryCode === filterId.slice("country:".length);
  }

  return false;
}

export function companyMatchesQuery(company: CompanySearchFields, query: string) {
  const normalized = normalizeSearch(query);

  if (!normalized) {
    return true;
  }

  const compactQuery = compactSearch(query);
  const fields = [
    company.name,
    company.displayName,
    company.ticker,
    company.slug,
    ...(company.aliases ?? []),
    ...(company.tickerAliases ?? []),
  ];

  return fields.some((field) => {
    const normalizedField = normalizeSearch(field);
    return (
      normalizedField.includes(normalized) ||
      (compactQuery.length > 0 && compactSearch(field).includes(compactQuery))
    );
  });
}

export function searchCompanies<T extends CompanySearchFields>(
  companies: readonly T[],
  query: string,
) {
  return companies.filter((company) => companyMatchesQuery(company, query));
}

function compareName(left: { displayName: string }, right: { displayName: string }) {
  return left.displayName.localeCompare(right.displayName, "sv");
}

export function sortFollowedCompanies<T extends { displayName: string; exchange: string; followedAt: string }>(
  companies: readonly T[],
  sort: WatchlistSort,
) {
  return [...companies].sort((left, right) => {
    if (sort === "recent") {
      const byDate = right.followedAt.localeCompare(left.followedAt);
      return byDate || compareName(left, right);
    }

    if (sort === "exchange") {
      const byExchange = left.exchange.localeCompare(right.exchange, "sv");
      return byExchange || compareName(left, right);
    }

    return compareName(left, right);
  });
}

export function sortDiscoveryCompanies<T extends { slug: string; displayName: string; exchange: string }>(
  companies: readonly T[],
  sort: WatchlistSort,
  followedAtBySlug: ReadonlyMap<string, string>,
) {
  return [...companies].sort((left, right) => {
    if (sort === "exchange") {
      const byExchange = left.exchange.localeCompare(right.exchange, "sv");
      return byExchange || compareName(left, right);
    }

    if (sort === "recent") {
      const leftFollowed = followedAtBySlug.get(left.slug);
      const rightFollowed = followedAtBySlug.get(right.slug);

      if (leftFollowed && rightFollowed && leftFollowed !== rightFollowed) {
        return rightFollowed.localeCompare(leftFollowed);
      }

      if (leftFollowed && !rightFollowed) {
        return -1;
      }

      if (!leftFollowed && rightFollowed) {
        return 1;
      }
    }

    return compareName(left, right);
  });
}

export function quoteTone(changePct: number | null): QuoteTone {
  if (changePct === null || changePct === 0) {
    return "neutral";
  }

  return changePct > 0 ? "positive" : "negative";
}

export function quoteToneClass(tone: QuoteTone) {
  if (tone === "positive") {
    return "text-divlab-green";
  }

  if (tone === "negative") {
    return "text-divlab-red";
  }

  return "text-divlab-text-muted";
}

export function formatPrice(price: number | null, currency: string | null) {
  if (price === null) {
    return MISSING_MARKET_VALUE;
  }

  const formatted = priceFormat.format(price);
  return currency ? `${formatted} ${currency}` : formatted;
}

export function formatSignedNumber(value: number | null) {
  if (value === null) {
    return MISSING_MARKET_VALUE;
  }

  return signedFormat.format(value);
}

export function formatSignedPercent(value: number | null) {
  if (value === null) {
    return MISSING_MARKET_VALUE;
  }

  return `${signedFormat.format(value)} %`;
}

export function formatVolume(value: number | null) {
  if (value === null) {
    return MISSING_MARKET_VALUE;
  }

  return compactFormat.format(value);
}

export function formatMarketCap(value: number | null, currency: string | null) {
  if (value === null || !currency) {
    return MISSING_MARKET_VALUE;
  }

  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000) {
    return `${compactFormat.format(value / 1_000_000_000)} md ${currency}`;
  }

  if (absolute >= 1_000_000) {
    return `${compactFormat.format(value / 1_000_000)} mn ${currency}`;
  }

  return `${compactFormat.format(value)} ${currency}`;
}

export function formatMarketTimestamp(value: string | null) {
  if (!value) {
    return MISSING_MARKET_VALUE;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return MISSING_MARKET_VALUE;
  }

  return timeFormat.format(date);
}

function realSparkline(values: readonly number[] | undefined) {
  if (!values || values.length < 2) {
    return null;
  }

  const closes = values.filter((value) => Number.isFinite(value));
  return closes.length >= 2 ? closes.slice(-30) : null;
}

export function buildFollowedCompanyCards(
  followed: readonly FollowedCompanyInput[],
  quotes: Readonly<Record<string, WatchlistQuoteInput | undefined>>,
): FollowedCompanyCard[] {
  return followed.map((row) => {
    const profile = getCompanyProfile(row.slug);
    const quote = quotes[row.slug];
    const currency = quote?.currency ?? null;

    return {
      id: row.id,
      slug: row.slug,
      name: profile?.name ?? row.name,
      displayName: profile?.displayName ?? row.name,
      ticker: profile?.ticker ?? row.ticker,
      exchange: profile?.exchange ?? row.exchange,
      countryCode: profile?.countryCode ?? "",
      countryName: profile?.countryName ?? "",
      logoPath: profile?.logoPath ?? row.logoPath,
      indexLabels: profile ? indexLabelsFor(profile.slug) : [],
      aliases: profile?.aliases ?? [],
      tickerAliases: profile?.tickerAliases ?? [],
      followedAt: row.followedAt,
      priceLabel: formatPrice(quote?.price ?? null, currency),
      changeLabel: formatSignedNumber(quote?.change ?? null),
      changePctLabel: formatSignedPercent(quote?.changePct ?? null),
      tone: quoteTone(quote?.changePct ?? null),
      timestampLabel: formatMarketTimestamp(quote?.marketTimestamp ?? null),
      dayHighLabel: formatPrice(quote?.dayHigh ?? null, currency),
      dayLowLabel: formatPrice(quote?.dayLow ?? null, currency),
      volumeLabel: formatVolume(quote?.sessionVolume ?? null),
      marketCapLabel: formatMarketCap(quote?.marketCap ?? null, currency),
      sparkline: realSparkline(quote?.sparkline),
    };
  });
}
