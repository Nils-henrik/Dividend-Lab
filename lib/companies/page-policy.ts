import type { CompanyProfile } from "@/lib/companies/types";

/**
 * Company pages are indexable only when the profile already carries a real
 * description and dedicated official source links. New DAX and Nasdaq-100
 * pages are followable, but they stay noindex until that minimum exists.
 * This avoids publishing a large set of thin pages.
 */
export function isSubstantiveCompanyPage(company: CompanyProfile) {
  return Boolean(
    company.description &&
      company.description.trim().length > 60 &&
      company.pressReleasesUrl &&
      company.reportsUrl &&
      company.calendarUrl,
  );
}
