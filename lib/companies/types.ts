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
  /**
   * Verified broker instrument URLs. Absent means no button.
   * Query strings stay off these URLs until a tracked template is configured.
   */
  avanzaUrl?: string;
  nordnetUrl?: string;
  /** Exact LEI from FI:s blankningsregister. Matching never uses the display name. */
  fiLei?: string;
  /** Exact issuer name in FI:s register, used only to read named positions. */
  fiIssuerName?: string;
};
