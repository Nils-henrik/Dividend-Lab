export const DIVBRAIN_ANALYSIS_IDENTITY_VERSION =
  "divbrain-analysis-identity-v1" as const;

export type DivBrainAnalysisInstrumentIdentity = {
  symbol: string;
  exchange: "ST" | "OL" | "HE" | "CO" | "US";
};

const EXPLICIT_INSTRUMENT_PATTERN =
  /(?:^|[\s([{“”'",;:!?])\$?([A-Z0-9][A-Z0-9-]{0,19})\.(ST|OL|HE|CO|US)(?=$|[\s)\]}“”'",;:!?])/gu;

/**
 * Extract canonical explicit instrument identities from user text.
 *
 * Safety properties:
 * - only uppercase `<SYMBOL>.<EXCHANGE>` notation is accepted;
 * - exchange is restricted to the markets DivLab currently models;
 * - ordinary domains such as `example.com` do not match;
 * - identities are canonicalized and deduplicated;
 * - no company-name, ticker or exchange inference is performed.
 */
export function extractExplicitDivBrainAnalysisIdentities(
  value: unknown,
): DivBrainAnalysisInstrumentIdentity[] {
  if (typeof value !== "string") return [];
  const text = value.normalize("NFC").trim();
  if (!text) return [];

  const seen = new Set<string>();
  const identities: DivBrainAnalysisInstrumentIdentity[] = [];

  for (const match of text.matchAll(EXPLICIT_INSTRUMENT_PATTERN)) {
    const symbol = match[1];
    const exchange = match[2] as DivBrainAnalysisInstrumentIdentity["exchange"] | undefined;
    if (!symbol || !exchange) continue;
    const key = `${symbol}.${exchange}`;
    if (seen.has(key)) continue;
    seen.add(key);
    identities.push({ symbol, exchange });
  }

  return identities;
}

/**
 * Resolve one unambiguous instrument only. Zero or multiple explicit identities
 * deliberately return null so DivBrain never grounds a comparison request in a
 * partial one-company analysis by accident.
 */
export function resolveSingleExplicitDivBrainAnalysisIdentity(
  value: unknown,
): DivBrainAnalysisInstrumentIdentity | null {
  const identities = extractExplicitDivBrainAnalysisIdentities(value);
  return identities.length === 1 ? identities[0]! : null;
}
