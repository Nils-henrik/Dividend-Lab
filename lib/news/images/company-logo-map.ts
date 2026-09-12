export type ApprovedCompanyLogo = {
  company: string;
  file: string;
  source: string;
  checkedAt: string;
};

const EXISTING_LOGO_SOURCE =
  "Approved local asset; provenance documented in public/company-logos/SOURCES.md";

/**
 * Approved local-only assets. Daily automation must never fetch a logo from
 * the network. Additions belong here only after the local file and provenance
 * have been reviewed.
 */
export const APPROVED_COMPANY_LOGOS = {
  Apple: { company: "Apple", file: "public/company-logos/apple.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  Amazon: { company: "Amazon", file: "public/company-logos/amazon.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  Microsoft: { company: "Microsoft", file: "public/company-logos/microsoft.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  Nvidia: { company: "Nvidia", file: "public/company-logos/nvidia.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  "Meta Platforms": { company: "Meta Platforms", file: "public/company-logos/meta.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  Walmart: { company: "Walmart", file: "public/company-logos/walmart.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  "Coca-Cola": { company: "Coca-Cola", file: "public/company-logos/coca-cola.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  "H&M": { company: "H&M", file: "public/company-logos/hm.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  Volvo: { company: "Volvo", file: "public/company-logos/volvo.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  Ericsson: { company: "Ericsson", file: "public/company-logos/ericsson.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
  Investor: { company: "Investor", file: "public/company-logos/investor.svg", source: EXISTING_LOGO_SOURCE, checkedAt: "2026-07-11" },
} as const satisfies Record<string, ApprovedCompanyLogo>;

export type ApprovedCompanyName = keyof typeof APPROVED_COMPANY_LOGOS;

export function getApprovedCompanyLogo(company: string): ApprovedCompanyLogo | null {
  const entry = (APPROVED_COMPANY_LOGOS as Record<string, ApprovedCompanyLogo>)[company];
  return entry ?? null;
}

export function hasApprovedCompanyLogo(company: string): boolean {
  return getApprovedCompanyLogo(company) !== null;
}
