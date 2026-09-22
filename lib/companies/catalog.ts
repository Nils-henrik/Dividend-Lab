import type { CompanyProfile } from "@/lib/companies/types";

const PILOT_COMPANIES = [
  {
    slug: "investor",
    name: "Investor",
    ticker: "INVE B",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    tradingViewSymbol: "OMXSTO:INVE_B",
    logoPath: "/company-logos/investor.svg",
    aliases: ["Investor", "Investor AB"],
    tickerAliases: ["INVE B", "INVE-B", "INVE_B"],
  },
  {
    slug: "volvo",
    name: "Volvo",
    ticker: "VOLV B",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    tradingViewSymbol: "OMXSTO:VOLV_B",
    logoPath: "/company-logos/volvo.svg",
    aliases: ["Volvo", "AB Volvo", "Volvo Group"],
    tickerAliases: ["VOLV B", "VOLV-B", "VOLV_B"],
  },
  {
    slug: "ericsson",
    name: "Ericsson",
    ticker: "ERIC B",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    tradingViewSymbol: "OMXSTO:ERIC_B",
    logoPath: "/company-logos/ericsson.svg",
    aliases: ["Ericsson", "Telefonaktiebolaget LM Ericsson"],
    tickerAliases: ["ERIC B", "ERIC-B", "ERIC_B"],
  },
  {
    slug: "atlas-copco",
    name: "Atlas Copco",
    ticker: "ATCO A",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    tradingViewSymbol: "OMXSTO:ATCO_A",
    logoPath: null,
    aliases: ["Atlas Copco", "Atlas Copco AB"],
    tickerAliases: ["ATCO A", "ATCO-A", "ATCO_A"],
  },
  {
    slug: "astrazeneca",
    name: "AstraZeneca",
    ticker: "AZN",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    tradingViewSymbol: "OMXSTO:AZN",
    logoPath: null,
    aliases: ["AstraZeneca", "AstraZeneca PLC"],
    tickerAliases: ["AZN"],
  },
] as const satisfies readonly CompanyProfile[];

export function getPilotCompanies(): readonly CompanyProfile[] {
  return PILOT_COMPANIES;
}

export function getCompanyProfile(slug: string): CompanyProfile | null {
  return PILOT_COMPANIES.find((company) => company.slug === slug) ?? null;
}

