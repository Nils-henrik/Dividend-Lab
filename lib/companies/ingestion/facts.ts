export const COMPANY_FACT_TYPES = [
  "ceo",
  "dividend_per_share",
  "dividend_currency",
  "dividend_year",
] as const;

export type CompanyFactType = (typeof COMPANY_FACT_TYPES)[number];

export type CompanyFactDraft = {
  factType: CompanyFactType;
  valueText: string | null;
  valueNumeric: number | null;
  unit: string | null;
  asOf: string | null;
  sourceUrl: string;
  sourcePublisher: string;
};

export type CompanyOwnershipDraft = {
  ownerName: string;
  capitalPct: number;
  votesPct: number | null;
  asOf: string | null;
  sourceUrl: string;
  sourcePublisher: string;
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function isCanonicalFactUrl(value: string, allowedOrigins: readonly string[]): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      allowedOrigins.includes(url.origin) &&
      url.username === "" &&
      url.password === "" &&
      url.port === "" &&
      value.length <= 2000
    );
  } catch {
    return false;
  }
}

function validPublisher(value: string): boolean {
  return value.length >= 1 && value.length <= 160;
}

export function validateCompanyFact(
  fact: CompanyFactDraft,
  allowedOrigins: readonly string[],
): boolean {
  if (!COMPANY_FACT_TYPES.includes(fact.factType)) return false;
  if (!validPublisher(fact.sourcePublisher) || !isCanonicalFactUrl(fact.sourceUrl, allowedOrigins)) {
    return false;
  }
  if (fact.asOf !== null && !DATE_ONLY.test(fact.asOf)) return false;
  if (fact.unit !== null && (fact.unit.length < 1 || fact.unit.length > 16)) return false;

  if (fact.factType === "ceo") {
    return (
      typeof fact.valueText === "string" &&
      fact.valueText.length >= 1 &&
      fact.valueText.length <= 160 &&
      fact.valueNumeric === null
    );
  }

  if (fact.factType === "dividend_per_share") {
    return (
      fact.valueText === null &&
      typeof fact.valueNumeric === "number" &&
      Number.isFinite(fact.valueNumeric) &&
      fact.valueNumeric > 0 &&
      fact.valueNumeric < 100_000
    );
  }

  if (fact.factType === "dividend_currency") {
    return fact.valueNumeric === null && /^[A-Z]{3}$/.test(fact.valueText ?? "");
  }

  return (
    fact.valueText === null &&
    typeof fact.valueNumeric === "number" &&
    Number.isInteger(fact.valueNumeric) &&
    fact.valueNumeric >= 1990 &&
    fact.valueNumeric <= 2100
  );
}

export function validateCompanyOwnership(
  owner: CompanyOwnershipDraft,
  allowedOrigins: readonly string[],
): boolean {
  if (
    owner.ownerName.length < 1 ||
    owner.ownerName.length > 200 ||
    !validPublisher(owner.sourcePublisher) ||
    !isCanonicalFactUrl(owner.sourceUrl, allowedOrigins)
  ) {
    return false;
  }
  if (owner.asOf !== null && !DATE_ONLY.test(owner.asOf)) return false;
  if (!Number.isFinite(owner.capitalPct) || owner.capitalPct < 0 || owner.capitalPct > 100) {
    return false;
  }
  if (
    owner.votesPct !== null &&
    (!Number.isFinite(owner.votesPct) || owner.votesPct < 0 || owner.votesPct > 100)
  ) {
    return false;
  }
  return true;
}

export function companyFactRows(
  facts: readonly CompanyFactDraft[],
  allowedOrigins: readonly string[],
  fetchedAt: string,
) {
  if (facts.some((fact) => !validateCompanyFact(fact, allowedOrigins))) return null;
  const seen = new Set<string>();
  const rows = [];
  for (const fact of facts) {
    if (seen.has(fact.factType)) return null;
    seen.add(fact.factType);
    rows.push({
      fact_type: fact.factType,
      value_text: fact.valueText,
      value_numeric: fact.valueNumeric,
      unit: fact.unit,
      as_of: fact.asOf,
      source_url: fact.sourceUrl,
      source_publisher: fact.sourcePublisher,
      fetched_at: fetchedAt,
    });
  }
  return rows;
}

export function companyOwnershipRows(
  owners: readonly CompanyOwnershipDraft[],
  allowedOrigins: readonly string[],
  fetchedAt: string,
) {
  if (owners.length === 0 || owners.some((owner) => !validateCompanyOwnership(owner, allowedOrigins))) {
    return null;
  }
  const seen = new Set<string>();
  const rows = [];
  for (const owner of owners) {
    if (seen.has(owner.ownerName)) continue;
    seen.add(owner.ownerName);
    rows.push({
      owner_name: owner.ownerName,
      capital_pct: owner.capitalPct,
      votes_pct: owner.votesPct,
      as_of: owner.asOf,
      source_url: owner.sourceUrl,
      source_publisher: owner.sourcePublisher,
      fetched_at: fetchedAt,
    });
  }
  return rows;
}
