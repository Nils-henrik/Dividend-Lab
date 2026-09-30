/** User-facing market-data labels. Internal provider ids stay elsewhere. */
export const DELAYED_MARKET_DATA_LABEL = "Fördröjd marknadsdata";

export const MARKET_DATA_LABEL = "Marknadsdata";

export const EXTERNAL_MARKET_DATA_LABEL = "Extern marknadsdata";

/**
 * DivLab's own cache window for company chart history is 15 minutes
 * (`YAHOO_HISTORY_REVALIDATE_SECONDS` = 900). This is not an exchange delay.
 */
export const MARKET_DATA_REFRESH_NOTE =
  "Fördröjd marknadsdata · uppdateras normalt var 15:e minut";

const YAHOO_FINANCE_BRAND = /yahoo\s+finance/i;

/**
 * Presentation boundary for stored market-evidence publishers.
 * Provider ids, source URLs and the stored publisher string stay unchanged.
 */
export function presentMarketEvidencePublisher(publisher: string): string {
  const value = publisher.trim();
  if (!YAHOO_FINANCE_BRAND.test(value)) return value;
  const market = /eodhd/i.test(value) ? EXTERNAL_MARKET_DATA_LABEL : MARKET_DATA_LABEL;
  if (/divlab/i.test(value)) return `${market} + DivLab-analys`;
  return market;
}
