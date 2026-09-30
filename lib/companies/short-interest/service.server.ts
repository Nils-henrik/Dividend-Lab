import "server-only";

import { loadCachedFiShortInterest } from "@/lib/companies/short-interest/cache";
import { companyShortInterest } from "@/lib/companies/short-interest/match";
import { readFiShortInterestOnce } from "@/lib/companies/short-interest/read";
import type { CompanyShortInterest, FiShortInterestRegister } from "@/lib/companies/short-interest/types";
import type { CompanyProfile } from "@/lib/companies/types";

/**
 * Cached read of FI's current aggregate file and current named-position file.
 * Transport failures are not stored. Schema and content failures are stored as
 * unavailable so a drifted file is not requested on every render.
 * Historic positions are intentionally not fetched.
 */
export async function loadFiShortInterestRegister(): Promise<FiShortInterestRegister | null> {
  return loadCachedFiShortInterest(() => readFiShortInterestOnce());
}

export async function loadCompanyShortInterest(
  company: Pick<CompanyProfile, "slug" | "fiLei" | "fiIssuerName">,
): Promise<CompanyShortInterest> {
  const register = await loadFiShortInterestRegister();
  const lei = company.fiLei?.trim();
  const issuerName = company.fiIssuerName?.trim();
  return companyShortInterest(
    register,
    company.slug,
    lei || issuerName
      ? {
          ...(lei ? { lei } : {}),
          ...(issuerName ? { issuerNames: [issuerName] } : {}),
        }
      : null,
  );
}
