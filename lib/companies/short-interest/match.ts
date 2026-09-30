import { FI_SHORT_INTEREST_COPY, formatShortInterestPercent } from "@/lib/companies/short-interest/copy";
import {
  isIsin,
  isLei,
  normalizeIssuerName,
  normalizeOrganizationNumber,
} from "@/lib/companies/short-interest/identifiers";
import { fiIdentityForSlug } from "@/lib/companies/short-interest/identity";
import {
  FI_AGGREGATE_ODS_URL,
  FI_CURRENT_POSITIONS_ODS_URL,
  FI_SHORT_INTEREST_PAGE_URL,
  FI_SHORT_INTEREST_PUBLISHER,
} from "@/lib/companies/short-interest/constants";
import type {
  CompanyShortInterest,
  FiAggregatePosition,
  FiNamedShortPosition,
  FiShortInterestRegister,
  FiShortInterestSource,
} from "@/lib/companies/short-interest/types";
import type { CompanyFiMatchIdentity } from "@/lib/companies/types";

type PreparedIdentity = {
  lei: string | null;
  organizationNumber: string | null;
  isins: readonly string[];
  issuerNames: readonly string[];
};

type Resolution =
  | { status: "issuer"; row: FiAggregatePosition; positions: FiNamedShortPosition[] }
  | { status: "absent" | "unmatched" | "ambiguous" };

const EMPTY_SOURCE: FiShortInterestSource = {
  publisher: FI_SHORT_INTEREST_PUBLISHER,
  pageUrl: FI_SHORT_INTEREST_PAGE_URL,
  aggregateUrl: FI_AGGREGATE_ODS_URL,
  currentPositionsUrl: FI_CURRENT_POSITIONS_ODS_URL,
  fetchedAt: null,
};

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const values = new Set(right);
  return left.every((value) => values.has(value));
}

function prepareIdentity(identity: CompanyFiMatchIdentity): PreparedIdentity | null {
  const lei = identity.lei?.trim().toUpperCase() ?? null;
  if (lei !== null && !isLei(lei)) return null;
  const organizationNumber = identity.organizationNumber
    ? normalizeOrganizationNumber(identity.organizationNumber)
    : null;
  if (identity.organizationNumber && !organizationNumber) return null;
  const isins = (identity.isins ?? []).map((isin) => isin.trim().toUpperCase());
  if (isins.some((isin) => !isIsin(isin))) return null;
  const issuerNames = (identity.issuerNames ?? []).map((name) => name.trim()).filter(Boolean);
  if ((identity.issuerNames ?? []).some((name) => name.trim() === "")) return null;
  if (!lei && !organizationNumber && isins.length === 0 && issuerNames.length === 0) return null;
  return { lei, organizationNumber, isins, issuerNames };
}

export function combineFiIdentity(
  slug: string,
  override?: CompanyFiMatchIdentity | null,
): PreparedIdentity | null | "ambiguous" {
  const catalog = fiIdentityForSlug(slug);
  if (!override) return catalog ? prepareIdentity(catalog) : null;
  const preparedOverride = prepareIdentity(override);
  if (!preparedOverride) return null;
  if (!catalog) return preparedOverride;
  const preparedCatalog = prepareIdentity(catalog);
  if (!preparedCatalog) return null;
  if (preparedCatalog.lei && preparedOverride.lei && preparedCatalog.lei !== preparedOverride.lei) {
    return "ambiguous";
  }
  if (
    preparedCatalog.organizationNumber
    && preparedOverride.organizationNumber
    && preparedCatalog.organizationNumber !== preparedOverride.organizationNumber
  ) {
    return "ambiguous";
  }
  if (
    preparedCatalog.isins.length > 0
    && preparedOverride.isins.length > 0
    && !sameSet(preparedCatalog.isins, preparedOverride.isins)
  ) {
    return "ambiguous";
  }
  if (
    preparedCatalog.issuerNames.length > 0
    && preparedOverride.issuerNames.length > 0
    && !sameSet(
      preparedCatalog.issuerNames.map(normalizeIssuerName),
      preparedOverride.issuerNames.map(normalizeIssuerName),
    )
  ) {
    return "ambiguous";
  }
  return {
    lei: preparedOverride.lei ?? preparedCatalog.lei,
    organizationNumber: preparedOverride.organizationNumber ?? preparedCatalog.organizationNumber,
    isins: preparedOverride.isins.length > 0 ? preparedOverride.isins : preparedCatalog.isins,
    issuerNames: preparedOverride.issuerNames.length > 0
      ? preparedOverride.issuerNames
      : preparedCatalog.issuerNames,
  };
}

function positionsForIssuer(
  register: FiShortInterestRegister,
  issuerName: string,
): FiNamedShortPosition[] {
  const key = normalizeIssuerName(issuerName);
  return register.namedPositions
    .filter((position) => normalizeIssuerName(position.issuerName) === key)
    .slice()
    .sort((left, right) => {
      if (right.percent !== left.percent) return right.percent - left.percent;
      const holder = left.holder.localeCompare(right.holder, "sv");
      if (holder !== 0) return holder;
      const isin = left.isin.localeCompare(right.isin);
      if (isin !== 0) return isin;
      return right.positionDate.localeCompare(left.positionDate);
    });
}

function resolveIssuer(
  register: FiShortInterestRegister,
  identity: PreparedIdentity,
): Resolution {
  const nameKeys = new Set(identity.issuerNames.map(normalizeIssuerName));
  const leiRows = identity.lei
    ? register.aggregates.filter((row) => row.lei === identity.lei)
    : null;
  const nameRows = nameKeys.size > 0
    ? register.aggregates.filter((row) => nameKeys.has(normalizeIssuerName(row.issuerName)))
    : null;
  const isinRows = identity.isins.length > 0
    ? register.namedPositions.filter((position) => identity.isins.includes(position.isin))
    : null;
  const isinIssuers = isinRows
    ? [...new Set(isinRows.map((position) => normalizeIssuerName(position.issuerName)))]
    : null;

  if (leiRows && leiRows.length > 1) return { status: "ambiguous" };
  if (nameRows && (nameRows.length > 1 || new Set(nameRows.map((row) => row.lei)).size > 1)) {
    return { status: "ambiguous" };
  }

  if (leiRows && leiRows.length === 1) {
    const row = leiRows[0];
    if (!row) return { status: "ambiguous" };
    if (nameRows && (nameRows.length !== 1 || nameRows[0]?.lei !== row.lei)) return { status: "ambiguous" };
    if (isinIssuers?.some((issuer) => issuer !== normalizeIssuerName(row.issuerName))) {
      return { status: "ambiguous" };
    }
    return { status: "issuer", row, positions: positionsForIssuer(register, row.issuerName) };
  }

  if (leiRows && leiRows.length === 0) {
    if ((nameRows && nameRows.length > 0) || (isinIssuers && isinIssuers.length > 0)) {
      return { status: "ambiguous" };
    }
    return { status: "absent" };
  }

  if (nameRows && nameRows.length === 1) {
    const row = nameRows[0];
    if (!row) return { status: "ambiguous" };
    if (isinIssuers?.some((issuer) => issuer !== normalizeIssuerName(row.issuerName))) {
      return { status: "ambiguous" };
    }
    return { status: "issuer", row, positions: positionsForIssuer(register, row.issuerName) };
  }

  if (nameRows && nameRows.length === 0) {
    if (isinIssuers && isinIssuers.length > 0) return { status: "ambiguous" };
    return { status: "absent" };
  }

  if (isinIssuers && isinIssuers.length === 1) {
    const issuer = isinIssuers[0];
    const matches = register.aggregates.filter((row) => normalizeIssuerName(row.issuerName) === issuer);
    if (matches.length !== 1) return { status: "ambiguous" };
    const row = matches[0];
    if (!row) return { status: "ambiguous" };
    return { status: "issuer", row, positions: positionsForIssuer(register, row.issuerName) };
  }

  if (isinIssuers && isinIssuers.length > 1) return { status: "ambiguous" };
  if (identity.organizationNumber && !identity.lei && nameKeys.size === 0 && identity.isins.length === 0) {
    return { status: "unmatched" };
  }
  return { status: "unmatched" };
}

function viewBase(source: FiShortInterestSource): Omit<
  CompanyShortInterest,
  "status" | "aggregatePercent" | "aggregatePercentLabel" | "aggregatePositionDate" | "issuerName" | "lei" | "namedPositions" | "message"
> {
  return {
    source,
    labels: {
      aggregate: FI_SHORT_INTEREST_COPY.aggregateLabel,
      significantPositions: FI_SHORT_INTEREST_COPY.significantPositionsLabel,
      source: FI_SHORT_INTEREST_COPY.sourceLabel,
    },
    rules: {
      aggregate: FI_SHORT_INTEREST_COPY.aggregateRule,
      significantPositions: FI_SHORT_INTEREST_COPY.significantPositionRule,
      absenceIsNotZero: FI_SHORT_INTEREST_COPY.absenceIsNotZero,
    },
    history: {
      supported: false,
      reason: FI_SHORT_INTEREST_COPY.historyUnsupported,
    },
  };
}

function emptyFigures(status: Exclude<CompanyShortInterest["status"], "present">, message: string | null, source: FiShortInterestSource): CompanyShortInterest {
  return {
    ...viewBase(source),
    status,
    aggregatePercent: null,
    aggregatePercentLabel: null,
    aggregatePositionDate: null,
    issuerName: null,
    lei: null,
    namedPositions: [],
    message,
  };
}

export function companyShortInterest(
  register: FiShortInterestRegister | null,
  slug: string,
  override?: CompanyFiMatchIdentity | null,
): CompanyShortInterest {
  const source = register?.source ?? EMPTY_SOURCE;
  if (!register) {
    return emptyFigures("unavailable", FI_SHORT_INTEREST_COPY.unavailable, source);
  }
  const identity = combineFiIdentity(slug, override);
  if (identity === "ambiguous") {
    return emptyFigures("ambiguous", FI_SHORT_INTEREST_COPY.ambiguous, source);
  }
  if (!identity) {
    return emptyFigures("unmatched", FI_SHORT_INTEREST_COPY.unmatched, source);
  }
  if (
    identity.organizationNumber
    && !identity.lei
    && identity.issuerNames.length === 0
    && identity.isins.length === 0
  ) {
    return emptyFigures("unmatched", FI_SHORT_INTEREST_COPY.unmatched, source);
  }
  const resolved = resolveIssuer(register, identity);
  if (resolved.status === "absent") {
    return emptyFigures("absent", FI_SHORT_INTEREST_COPY.absent, source);
  }
  if (resolved.status !== "issuer") {
    return emptyFigures(resolved.status, resolved.status === "ambiguous"
      ? FI_SHORT_INTEREST_COPY.ambiguous
      : FI_SHORT_INTEREST_COPY.unmatched, source);
  }
  return {
    ...viewBase(source),
    status: "present",
    aggregatePercent: resolved.row.percent,
    aggregatePercentLabel: formatShortInterestPercent(resolved.row.percent),
    aggregatePositionDate: resolved.row.positionDate,
    issuerName: resolved.row.issuerName,
    lei: resolved.row.lei,
    namedPositions: resolved.positions,
    message: null,
  };
}
