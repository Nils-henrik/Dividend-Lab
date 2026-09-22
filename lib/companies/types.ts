export type CompanyProfile = {
  slug: string;
  name: string;
  ticker: string;
  exchange: string;
  countryCode: string;
  tradingViewSymbol: string;
  logoPath: string | null;
  aliases: string[];
  tickerAliases: string[];
};

