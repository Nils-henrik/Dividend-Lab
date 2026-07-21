/**
 * Verified operator and service facts for DivLab legal pages.
 * Contact emails are sourced from lib/site/contact.ts.
 */

import { DIVLAB_CONTACT } from "@/lib/site/contact";

/** Shared fallback shown on legal pages that have not been updated individually. */
export const LEGAL_LAST_UPDATED = "12 juli 2026";

/**
 * Page-specific “Senast uppdaterad” labels.
 * Does not affect LEGAL_PUBLISHED_VERSIONS or legal acceptance.
 */
export const LEGAL_PAGE_LAST_UPDATED = {
  privacy: "21 juli 2026",
  cookies: "21 juli 2026",
} as const;

export const legalConfig = {
  serviceName: "DivLab",
  operatorName: "Henrik Karlsson",
  country: "Sverige",
  phaseLabel: "kostnadsfri beta",
  minAccountAge: 18,
} as const;

/** Terms introduction — defines DivLab and operatören. */
export const LEGAL_OPERATOR_TERMS =
  "DivLab är namnet på tjänsten. Tjänsten tillhandahålls av Henrik Karlsson, privatperson i Sverige (”operatören”).";

/** Standard operator wording for Privacy policy. */
export const LEGAL_OPERATOR_PRIVACY =
  "Personuppgiftsansvarig för behandlingen av personuppgifter i DivLab är Henrik Karlsson, privatperson i Sverige.";

/** Verified public postal address not yet provided. */
export const LEGAL_POSTAL_ADDRESS: string | null = null;

/** General public contact email. */
export const LEGAL_SUPPORT_EMAIL = DIVLAB_CONTACT.generalEmail;

/** Privacy, data-protection and user-rights contact email. */
export const LEGAL_PRIVACY_EMAIL = DIVLAB_CONTACT.privacyEmail;

export const LEGAL_PRIVACY_RIGHTS_REQUEST =
  `Begäran om tillgång, rättelse, radering eller andra dataskyddsrättigheter kan lämnas till DivLabs integritetskontakt på ${DIVLAB_CONTACT.privacyEmail}. Begäran bedöms och hanteras enligt tillämpliga dataskyddsregler.`;

export const RECOVERY_COOKIE_NAME = "sb-recovery-pending";

export const TRADINGVIEW_WIDGET_SCRIPT =
  "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
