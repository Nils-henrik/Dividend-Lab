const NON_DISTINGUISHING_COMPANY_TOKENS = new Set([
  "ab",
  "asa",
  "oyj",
  "plc",
  "ltd",
  "limited",
  "group",
  "holding",
  "holdings",
  "company",
  "corp",
  "corporation",
  "inc",
  "ser",
  "series",
]);

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function significantCompanyTokens(value: string): string[] {
  return normalizeName(value)
    .split(" ")
    .filter(
      (token) =>
        token.length > 2 && !NON_DISTINGUISHING_COMPANY_TOKENS.has(token),
    );
}

/**
 * Conservative issuer-name comparison for Nasdaq CNS free-text discovery.
 *
 * Legal/generic suffixes such as AB/Plc/Group are not treated as identity-bearing
 * words, because the same issuer may be labelled differently between DivLab and
 * Nasdaq (for example "Stillfront Group" vs "StillFront AB"). Single-token
 * identities only match another single-token identity, which prevents a generic
 * prefix such as "Nordic Group" from matching "Nordic Semiconductor".
 */
export function companyNamesLikelyMatch(
  candidateCompany: string,
  targetCompany: string,
): boolean {
  const left = significantCompanyTokens(candidateCompany);
  const right = significantCompanyTokens(targetCompany);
  if (!left.length || !right.length) return false;

  if (left.length === 1 || right.length === 1) {
    return left.length === 1 && right.length === 1 && left[0] === right[0];
  }

  const leftSet = new Set(left);
  const overlap = right.filter((token) => leftSet.has(token)).length;
  return overlap >= 2;
}
