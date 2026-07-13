export const LEGAL_ACCEPTANCE_METADATA_KEY = "legal_acceptance_confirmed";

export const LEGAL_ACCEPTANCE_VALIDATION_MESSAGE =
  "Du måste acceptera användarvillkoren och bekräfta att du har läst integritetspolicyn.";

/**
 * Published legal document versions shown on /terms and /privacy.
 *
 * A new legal version requires a coordinated release of:
 * - the legal page text
 * - these visible version labels and effective dates
 * - a matching row in public.legal_document_versions (via migration)
 * - the application deployment that ships the above together
 *
 * Do not activate a new database version without deploying the matching legal content.
 */
export const LEGAL_PUBLISHED_VERSIONS = {
  terms: {
    version: "1.0",
    effectiveDateLabel: "13 juli 2026",
    effectiveDateIso: "2026-07-13",
  },
  privacy: {
    version: "1.0",
    effectiveDateLabel: "13 juli 2026",
    effectiveDateIso: "2026-07-13",
  },
} as const;
