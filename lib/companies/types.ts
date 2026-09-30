/**
 * Explicit Finansinspektionen identity. Matching is exact.
 * A missing field is not a guess, and a missing register row is not 0%.
 */
export type CompanyFiMatchIdentity = {
  lei?: string;
  organizationNumber?: string;
  isins?: readonly string[];
  issuerNames?: readonly string[];
};

export type CompanyProfile = {
  slug: string;
  name: string;
  displayName: string;
  ticker: string;
  exchange: string;
  countryCode: string;
  countryName: string;
  segment: string;
  sector: string;
  founded: string;
  headquarters: string;
  shortDescription: string;
  description: string;
  websiteLabel: string;
  websiteUrl: string;
  pressReleasesUrl: string;
  reportsUrl: string;
  calendarUrl: string;
  ownershipUrl?: string;
  governanceUrl?: string;
  linkedinUrl?: string;
  xUrl?: string;
  relatedSlugs: readonly string[];
  tradingViewSymbol: string;
  marketDataSymbol: string;
  logoPath: string | null;
  aliases: string[];
  tickerAliases: string[];
  fiIdentity?: CompanyFiMatchIdentity;
};
