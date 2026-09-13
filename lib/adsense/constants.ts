/**
 * Central Google AdSense publisher contract.
 *
 * The official script is loaded once from the root layout. Do not add
 * per-page `adsbygoogle` snippets or a second publisher script.
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

/**
 * Script hosts required for the official AdSense bootstrap plus Google's CMP
 * (Funding Choices / Privacy & messaging). Kept as explicit origins — not
 * `https:` / `http:` — because this app retains a static allowlist CSP to
 * preserve CDN/static rendering.
 */
export const ADSENSE_SCRIPT_SOURCES = [
  "https://pagead2.googlesyndication.com",
  "https://tpc.googlesyndication.com",
  "https://www.googletagservices.com",
  "https://googleads.g.doubleclick.net",
  "https://www.googleadservices.com",
  "https://partner.googleadservices.com",
  "https://adservice.google.com",
  "https://adservice.google.se",
  "https://www.google.com",
  "https://www.gstatic.com",
  "https://fundingchoicesmessages.google.com",
  "https://ep1.adtrafficquality.google",
  "https://ep2.adtrafficquality.google",
] as const;

/**
 * XHR/fetch/websocket targets used by AdSense measurement and Google's CMP.
 * Product-family wildcards cover changing Google subdomains without opening
 * `connect-src` to every HTTPS origin.
 */
export const ADSENSE_CONNECT_SOURCES = [
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.googleadservices.com",
  "https://*.adtrafficquality.google",
  "https://fundingchoicesmessages.google.com",
  "https://*.google.com",
  "https://adservice.google.se",
  "https://*.gstatic.com",
] as const;

/**
 * Iframes used by SafeFrame creatives and Google's CMP dialogs.
 */
export const ADSENSE_FRAME_SOURCES = [
  "https://*.googlesyndication.com",
  "https://*.doubleclick.net",
  "https://*.adtrafficquality.google",
  "https://fundingchoicesmessages.google.com",
  "https://www.google.com",
  "https://*.google.com",
  "https://www.google.se",
  "https://*.google.se",
  "https://www.gstatic.com",
] as const;
