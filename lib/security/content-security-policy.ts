/**
 * Production security headers and Content-Security-Policy.
 *
 * This is not a strict CSP. Current production already allows
 * `'unsafe-inline'` and `'unsafe-eval'`. Issue #308 enables Google AdSense
 * and CMP by adding a scheme-level `https:` allowance on the directives
 * Google's dynamic resource graph actually needs, instead of a rolling
 * host list (unsupported) or request nonces (which force site-wide dynamic
 * HTML and remove SSG/CDN benefits).
 *
 * Google's AdSense CSP guidance states that a more permissive CSP may be
 * chosen if it fits the use case. `http:` is intentionally omitted because
 * production is HTTPS-only (`upgrade-insecure-requests`).
 */

export function deriveSupabaseConnectSources(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string[] {
  const url = supabaseUrl?.trim();
  if (!url) {
    return [];
  }
  try {
    const { origin } = new URL(url);
    const wsOrigin = origin.replace(/^http/, "ws");
    return [origin, wsOrigin];
  } catch {
    return [];
  }
}

const EXISTING_SCRIPT_SOURCES = [
  "'self'",
  "'unsafe-inline'",
  "'unsafe-eval'",
  "https://va.vercel-scripts.com",
  "https://s3.tradingview.com",
  "https://www.tradingview.com",
] as const;

const EXISTING_CONNECT_SOURCES = [
  "'self'",
  "https://*.supabase.co",
  "wss://*.supabase.co",
  "https://va.vercel-scripts.com",
  "https://vitals.vercel-insights.com",
  "https://*.tradingview.com",
  "https://s3.tradingview.com",
] as const;

const EXISTING_FRAME_SOURCES = [
  "'self'",
  "https://s.tradingview.com",
  "https://www.tradingview.com",
  "https://*.tradingview.com",
] as const;

/**
 * Narrowest scheme-level relaxation compatible with AdSense/CMP hosts that
 * change over time. Not a domain allowlist.
 */
export const ADSENSE_HTTPS_SCHEME = "https:";

function uniqueJoin(values: readonly string[]): string {
  return [...new Set(values)].join(" ");
}

export function buildContentSecurityPolicy(
  extraConnectSources: readonly string[] = deriveSupabaseConnectSources(),
): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    `script-src ${uniqueJoin([...EXISTING_SCRIPT_SOURCES, ADSENSE_HTTPS_SCHEME])}`,
    `connect-src ${uniqueJoin([
      ...EXISTING_CONNECT_SOURCES,
      ...extraConnectSources,
      ADSENSE_HTTPS_SCHEME,
    ])}`,
    `frame-src ${uniqueJoin([...EXISTING_FRAME_SOURCES, ADSENSE_HTTPS_SCHEME])}`,
    "media-src 'self' https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export const SECURITY_HEADER_KEYS = [
  "Content-Security-Policy",
  "Referrer-Policy",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Permissions-Policy",
  "Strict-Transport-Security",
] as const;

export function buildSecurityHeaders(
  extraConnectSources: readonly string[] = deriveSupabaseConnectSources(),
): { key: string; value: string }[] {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(extraConnectSources),
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
  ];
}
