/**
 * Verified operator and service facts for DivLab legal pages.
 * Do not add fictional contact or company details — null means Founder input pending.
 */

export const LEGAL_LAST_UPDATED = "12 juli 2026";

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

/** Verified support email not yet provided. */
export const LEGAL_SUPPORT_EMAIL: string | null = null;

/** Verified privacy contact email not yet provided. */
export const LEGAL_PRIVACY_EMAIL: string | null = null;

export const LEGAL_PRIVACY_RIGHTS_REQUEST =
  "Begäran om tillgång, rättelse, radering eller andra dataskyddsrättigheter kan lämnas genom DivLabs integritetskontakt. Begäran bedöms och hanteras enligt tillämpliga dataskyddsregler.";

export const LEGAL_PRIVACY_CONTACT_PENDING =
  "En verifierad kontaktadress publiceras före den bredare beta-lanseringen.";

export const RECOVERY_COOKIE_NAME = "sb-recovery-pending";

export const TRADINGVIEW_WIDGET_SCRIPT =
  "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
