/**
 * Central Google AdSense publisher contract.
 *
 * The official script is loaded exactly once from the root layout `<head>`.
 * Do not add per-page `adsbygoogle` snippets or a second publisher bootstrap.
 * Auto Ads placements are controlled in the AdSense account, not in this repo.
 */
export const ADSENSE_CLIENT_ID = "ca-pub-1024192127032504";

export const ADSENSE_SCRIPT_ID = "google-adsense";

export const ADSENSE_SCRIPT_SRC =
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

export const ADSENSE_SCRIPT_CROSS_ORIGIN = "anonymous";

/**
 * Official ads.txt line. Keep `public/ads.txt` byte-for-byte identical.
 */
export const ADS_TXT_BODY =
  "google.com, pub-1024192127032504, DIRECT, f08c47fec0942fa0\n";
