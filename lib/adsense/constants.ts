/**
 * Official Google AdSense publisher identifiers for Dividend Lab.
 *
 * AdSense is not loaded in production. These constants exist so tests and a
 * future Product Owner-approved enablement can use the exact official script
 * once, without inventing a rolling domain allowlist.
 *
 * See `docs/project/ADSENSE_STRICT_CSP_MEASUREMENT.md` and ADR-007.
 */

export const ADSENSE_PUBLISHER_ID = "ca-pub-1024192127032504";

export const ADSENSE_PUBLISHER_NUMERIC_ID = "1024192127032504";

export const ADSENSE_OFFICIAL_SCRIPT_URL =
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`;

/**
 * Fail-closed switch. Must remain false until the Product Owner accepts the
 * measured site-wide dynamic-rendering cost of nonce + `strict-dynamic` CSP.
 */
export const ADSENSE_PRODUCTION_ENABLED = false;
