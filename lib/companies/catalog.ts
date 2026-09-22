import type { CompanyProfile } from "@/lib/companies/types";

const PILOT_COMPANIES = [
  {
    slug: "investor",
    name: "Investor",
    displayName: "Investor B",
    ticker: "INVE B",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    countryName: "Sverige",
    segment: "Large Cap",
    sector: "Finans",
    founded: "1916",
    headquarters: "Stockholm",
    shortDescription:
      "Investmentbolag med långsiktiga ägarintressen i ledande nordiska och internationella bolag.",
    description:
      "Investor är ett svenskt investmentbolag med fokus på aktivt och långsiktigt ägande i noterade bolag och helägda verksamheter.",
    websiteLabel: "investorab.com",
    websiteUrl: "https://www.investorab.com/",
    pressReleasesUrl:
      "https://www.investorab.com/investors-media/press-releases",
    reportsUrl:
      "https://www.investorab.com/investors-media/reports-presentations/",
    calendarUrl:
      "https://www.investorab.com/investors-media/events-calendar",
    ownershipUrl:
      "https://www.investorab.com/investors-media/the-investor-share/ownership-structure",
    governanceUrl:
      "https://www.investorab.com/about-investor/board-management/executive-leadership-team",
    linkedinUrl: "https://www.linkedin.com/company/investor-ab",
    relatedSlugs: ["atlas-copco", "ericsson", "volvo"],
    tradingViewSymbol: "OMXSTO:INVE_B",
    marketDataSymbol: "INVE-B.ST",
    logoPath: "/company-logos/investor.svg",
    aliases: ["Investor", "Investor AB"],
    tickerAliases: ["INVE B", "INVE-B", "INVE_B"],
  },
  {
    slug: "volvo",
    name: "Volvo",
    displayName: "Volvo B",
    ticker: "VOLV B",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    countryName: "Sverige",
    segment: "Large Cap",
    sector: "Industri",
    founded: "1927",
    headquarters: "Göteborg",
    shortDescription:
      "Global tillverkare av lastbilar, bussar, anläggningsmaskiner samt marina och industriella drivsystem.",
    description:
      "Volvo Group är en global industrikoncern som utvecklar transportlösningar och infrastruktursystem för professionella kunder.",
    websiteLabel: "volvogroup.com",
    websiteUrl: "https://www.volvogroup.com/",
    pressReleasesUrl: "https://www.volvogroup.com/en/news-and-media.html",
    reportsUrl:
      "https://www.volvogroup.com/en/investors/reports-and-presentations.html",
    calendarUrl:
      "https://www.volvogroup.com/en/investors/financial-calendar.html",
    relatedSlugs: ["atlas-copco", "ericsson", "investor"],
    tradingViewSymbol: "OMXSTO:VOLV_B",
    marketDataSymbol: "VOLV-B.ST",
    logoPath: "/company-logos/volvo.svg",
    aliases: ["Volvo", "AB Volvo", "Volvo Group"],
    tickerAliases: ["VOLV B", "VOLV-B", "VOLV_B"],
  },
  {
    slug: "ericsson",
    name: "Ericsson",
    displayName: "Ericsson B",
    ticker: "ERIC B",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    countryName: "Sverige",
    segment: "Large Cap",
    sector: "Teknik",
    founded: "1876",
    headquarters: "Stockholm",
    shortDescription:
      "Global leverantör av kommunikationsteknik, nätverksutrustning och digital infrastruktur.",
    description:
      "Ericsson utvecklar nätverk, mjukvara och tjänster för telekomoperatörer och andra aktörer inom digital infrastruktur.",
    websiteLabel: "ericsson.com",
    websiteUrl: "https://www.ericsson.com/",
    pressReleasesUrl:
      "https://www.ericsson.com/en/newsroom/latest-news?locs=68304&typeFilters=3",
    reportsUrl:
      "https://www.ericsson.com/en/investors/financial-reports-and-presentations",
    calendarUrl: "https://www.ericsson.com/en/investors/financial-calendar",
    relatedSlugs: ["investor", "volvo", "atlas-copco"],
    tradingViewSymbol: "OMXSTO:ERIC_B",
    marketDataSymbol: "ERIC-B.ST",
    logoPath: "/company-logos/ericsson.svg",
    aliases: ["Ericsson", "Telefonaktiebolaget LM Ericsson"],
    tickerAliases: ["ERIC B", "ERIC-B", "ERIC_B"],
  },
  {
    slug: "atlas-copco",
    name: "Atlas Copco",
    displayName: "Atlas Copco A",
    ticker: "ATCO A",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    countryName: "Sverige",
    segment: "Large Cap",
    sector: "Industri",
    founded: "1873",
    headquarters: "Nacka",
    shortDescription:
      "Global industrikoncern inom kompressorer, vakuumteknik, energilösningar och industriteknik.",
    description:
      "Atlas Copco utvecklar produkter, tjänster och system som höjer produktivitet, energieffektivitet och säkerhet i industriella verksamheter.",
    websiteLabel: "atlascopcogroup.com",
    websiteUrl: "https://www.atlascopcogroup.com/",
    pressReleasesUrl:
      "https://www.atlascopcogroup.com/en/media/press-releases",
    reportsUrl:
      "https://www.atlascopcogroup.com/en/investors/reports-and-presentations",
    calendarUrl:
      "https://www.atlascopcogroup.com/en/investors/calendar-and-events",
    relatedSlugs: ["volvo", "investor", "ericsson"],
    tradingViewSymbol: "OMXSTO:ATCO_A",
    marketDataSymbol: "ATCO-A.ST",
    logoPath: null,
    aliases: ["Atlas Copco", "Atlas Copco AB"],
    tickerAliases: ["ATCO A", "ATCO-A", "ATCO_A"],
  },
  {
    slug: "astrazeneca",
    name: "AstraZeneca",
    displayName: "AstraZeneca",
    ticker: "AZN",
    exchange: "Nasdaq Stockholm",
    countryCode: "SE",
    countryName: "Sverige",
    segment: "Large Cap",
    sector: "Hälsovård",
    founded: "1999",
    headquarters: "Cambridge, Storbritannien",
    shortDescription:
      "Globalt forskningsdrivet läkemedelsbolag med fokus på bland annat onkologi och sällsynta sjukdomar.",
    description:
      "AstraZeneca forskar, utvecklar och kommersialiserar receptbelagda läkemedel med global verksamhet och notering i Stockholm.",
    websiteLabel: "astrazeneca.com",
    websiteUrl: "https://www.astrazeneca.com/",
    pressReleasesUrl:
      "https://www.astrazeneca.com/media-centre/press-releases.html",
    reportsUrl:
      "https://www.astrazeneca.com/investor-relations/results-and-presentations.html",
    calendarUrl:
      "https://www.astrazeneca.com/investor-relations/events.html",
    relatedSlugs: ["investor", "ericsson", "atlas-copco"],
    tradingViewSymbol: "OMXSTO:AZN",
    marketDataSymbol: "AZN.ST",
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

export function getRelatedCompanies(
  company: CompanyProfile,
): readonly CompanyProfile[] {
  const relatedSlugs = new Set(company.relatedSlugs);

  return PILOT_COMPANIES.filter((candidate) => relatedSlugs.has(candidate.slug));
}
