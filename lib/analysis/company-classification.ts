export const DIVLAB_COMPANY_CLASSIFICATION_VERSION = "company-classification-v1" as const;

export type DivLabCompanyType =
  | "operating_company"
  | "bank"
  | "insurance"
  | "real_estate"
  | "financial_other"
  | "fund_or_etf"
  | "unknown";

export type CompanyClassificationConfidence = "high" | "medium" | "low";

export type ProviderCompanyMetadata = {
  sector: string | null;
  industry: string | null;
  quoteType: string | null;
};

export type DivLabCompanyClassification = {
  version: typeof DIVLAB_COMPANY_CLASSIFICATION_VERSION;
  type: DivLabCompanyType;
  confidence: CompanyClassificationConfidence;
  sector: string | null;
  industry: string | null;
  quoteType: string | null;
  basis: string[];
  /** Exact packet source IDs supporting the provider metadata used for classification. */
  sourceIds: string[];
};

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function text(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  const wrapped = record(value);
  if (!wrapped) return null;
  if (typeof wrapped.raw === "string" && wrapped.raw.trim()) return wrapped.raw.trim();
  if (typeof wrapped.fmt === "string" && wrapped.fmt.trim()) return wrapped.fmt.trim();
  return null;
}

function normalized(value: string | null): string {
  return value?.trim().toLocaleLowerCase("en-US") ?? "";
}

function includesAny(value: string, fragments: readonly string[]): boolean {
  return fragments.some((fragment) => value.includes(fragment));
}

export function extractYahooCompanyMetadata(payload: unknown): ProviderCompanyMetadata {
  const root = record(payload);
  const quoteSummary = record(root?.quoteSummary);
  const result = Array.isArray(quoteSummary?.result)
    ? record(quoteSummary.result[0])
    : null;
  const assetProfile = record(result?.assetProfile);
  const price = record(result?.price);

  return {
    sector: text(assetProfile?.sector),
    industry: text(assetProfile?.industry),
    quoteType: text(price?.quoteType),
  };
}

/**
 * Deterministic provider-metadata classification.
 *
 * This deliberately does not infer company type from the company name, ticker,
 * financial ratios or LLM interpretation. Ambiguous metadata remains unknown or
 * financial_other rather than being promoted to a more specific methodology.
 */
export function classifyCompanyMetadata(input: {
  metadata: ProviderCompanyMetadata;
  sourceIds?: readonly string[];
}): DivLabCompanyClassification {
  const sector = input.metadata.sector?.trim() || null;
  const industry = input.metadata.industry?.trim() || null;
  const quoteType = input.metadata.quoteType?.trim().toUpperCase() || null;
  const sectorKey = normalized(sector);
  const industryKey = normalized(industry);
  const basis: string[] = [];

  let type: DivLabCompanyType = "unknown";
  let confidence: CompanyClassificationConfidence = "low";

  if (
    quoteType &&
    includesAny(quoteType.toLocaleLowerCase("en-US"), ["etf", "fund", "mutualfund"])
  ) {
    type = "fund_or_etf";
    confidence = "high";
    basis.push(`quoteType=${quoteType}`);
  } else if (sectorKey === "real estate" || industryKey.includes("real estate")) {
    type = "real_estate";
    confidence = sectorKey === "real estate" ? "high" : "medium";
    if (sector) basis.push(`sector=${sector}`);
    if (industry) basis.push(`industry=${industry}`);
  } else if (
    includesAny(industryKey, [
      "bank",
      "banks",
      "diversified banks",
      "regional banks",
      "mortgage finance",
    ])
  ) {
    type = "bank";
    confidence = sectorKey === "financial services" ? "high" : "medium";
    if (sector) basis.push(`sector=${sector}`);
    if (industry) basis.push(`industry=${industry}`);
  } else if (industryKey.includes("insurance")) {
    type = "insurance";
    confidence = sectorKey === "financial services" ? "high" : "medium";
    if (sector) basis.push(`sector=${sector}`);
    if (industry) basis.push(`industry=${industry}`);
  } else if (sectorKey === "financial services" || sectorKey === "financials") {
    type = "financial_other";
    confidence = "medium";
    if (sector) basis.push(`sector=${sector}`);
    if (industry) basis.push(`industry=${industry}`);
  } else if (sector) {
    type = "operating_company";
    confidence = "medium";
    basis.push(`sector=${sector}`);
    if (industry) basis.push(`industry=${industry}`);
  } else if (quoteType === "EQUITY") {
    // EQUITY alone is not enough to safely distinguish an operating company
    // from a bank, insurer, property company or investment company.
    type = "unknown";
    confidence = "low";
    basis.push("quoteType=EQUITY_without_sector_metadata");
  } else {
    basis.push("provider_metadata_insufficient");
  }

  return {
    version: DIVLAB_COMPANY_CLASSIFICATION_VERSION,
    type,
    confidence,
    sector,
    industry,
    quoteType,
    basis,
    sourceIds: [...new Set(input.sourceIds ?? [])].sort(),
  };
}
