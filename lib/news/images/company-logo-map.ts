export type ApprovedCompanyLogo = {
  company: string;
  file: string;
  source: string;
  checkedAt: string;
};

/**
 * Approved local-only assets. Daily automation must never fetch a logo from
 * the network. Additions belong here only after the local file and provenance
 * have been reviewed.
 */
export const APPROVED_COMPANY_LOGOS = {
  "H&M": {
    company: "H&M",
    file: "public/company-logos/hm.svg",
    source: "Wikimedia Commons; documented in public/company-logos/SOURCES.md",
    checkedAt: "2026-07-11",
  },
  Volvo: {
    company: "Volvo",
    file: "public/company-logos/volvo.svg",
    source: "Wikimedia Commons; documented in public/company-logos/SOURCES.md",
    checkedAt: "2026-07-11",
  },
  Ericsson: {
    company: "Ericsson",
    file: "public/company-logos/ericsson.svg",
    source: "Wikimedia Commons; documented in public/company-logos/SOURCES.md",
    checkedAt: "2026-07-11",
  },
  Investor: {
    company: "Investor",
    file: "public/company-logos/investor.svg",
    source: "Wikimedia Commons; documented in public/company-logos/SOURCES.md",
    checkedAt: "2026-07-11",
  },
} as const satisfies Record<string, ApprovedCompanyLogo>;

export type ApprovedCompanyName = keyof typeof APPROVED_COMPANY_LOGOS;

export function getApprovedCompanyLogo(company: string): ApprovedCompanyLogo | null {
  const entry = (APPROVED_COMPANY_LOGOS as Record<string, ApprovedCompanyLogo>)[company];
  return entry ?? null;
}

export function hasApprovedCompanyLogo(company: string): boolean {
  return getApprovedCompanyLogo(company) !== null;
}
