/**
 * Production Content-Security-Policy and related security headers.
 *
 * The production policy is the current static next.config contract. It does
 * not enable AdSense and does not encode a rolling Google script-host
 * allowlist. Google's supported AdSense model (nonce + `strict-dynamic`) is
 * implemented here as a measured, unwired builder because attaching it in
 * `proxy.ts` + the root layout forces site-wide dynamic rendering.
 *
 * See `docs/project/ADSENSE_STRICT_CSP_MEASUREMENT.md` and ADR-007.
 */

export const CSP_NONCE_REQUEST_HEADER = "x-nonce";

const NONCE_BYTE_LENGTH = 16;

export type SecurityHeader = {
  key: string;
  value: string;
};

/**
 * Extra Supabase origins for the CSP `connect-src` directive.
 *
 * The hosted project is covered by the `*.supabase.co` wildcard, but a
 * self-hosted or local Supabase stack (e.g. `http://127.0.0.1:54321` from the
 * Supabase CLI) uses a different origin. Derive it from the public URL so the
 * browser can reach Supabase Auth/Realtime in local development without
 * loosening the production policy.
 */
export function supabaseConnectSources(
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

/**
 * Cryptographically random CSP nonce.
 *
 * Shape matches the Next.js documented approach (base64 of random bytes) so
 * it can be placed in `'nonce-{value}'` and on script tags. Not attached to
 * production requests.
 */
export function generateCspNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(NONCE_BYTE_LENGTH))).toString(
    "base64",
  );
}

export function isCspNonce(value: string): boolean {
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value) && Buffer.from(value, "base64").length === NONCE_BYTE_LENGTH;
}

export function cspNonceSource(nonce: string): string {
  if (!isCspNonce(nonce)) {
    throw new Error("CSP nonce must be a 16-byte base64 value.");
  }

  return `'nonce-${nonce}'`;
}

function joinPolicy(directives: string[]): string {
  return directives.join("; ");
}

/**
 * Current production CSP. Kept byte-stable for existing Next.js, Supabase,
 * Vercel Analytics and TradingView behavior.
 */
export function buildProductionContentSecurityPolicy(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string {
  return joinPolicy([
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    // Next.js and some third-party embeds still require inline/eval in practice.
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://s3.tradingview.com https://www.tradingview.com",
    [
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      ...supabaseConnectSources(supabaseUrl),
      "https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.tradingview.com https://s3.tradingview.com",
    ].join(" "),
    "frame-src 'self' https://s.tradingview.com https://www.tradingview.com https://*.tradingview.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ]);
}

/**
 * Google's currently supported AdSense `script-src` model:
 * nonce + `'strict-dynamic'` with the documented older-browser fallback tokens.
 *
 * This is not a rolling AdSense host allowlist. It is not applied in production.
 *
 * @see https://support.google.com/adsense/answer/16283098?hl=en-GB
 */
export function buildSupportedStrictScriptSrc(nonce: string): string {
  return [
    "script-src",
    cspNonceSource(nonce),
    "'unsafe-inline'",
    "'unsafe-eval'",
    "'strict-dynamic'",
    "https:",
    "http:",
  ].join(" ");
}

/**
 * Full strict-CSP candidate that keeps current DivLab non-script protections
 * and replaces only `script-src` with Google's supported model.
 *
 * Not attached to production responses. Enabling it requires Product Owner
 * approval of the measured site-wide dynamic-rendering trade-off.
 */
export function buildSupportedStrictContentSecurityPolicy(
  nonce: string,
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): string {
  return joinPolicy([
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    buildSupportedStrictScriptSrc(nonce),
    [
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      ...supabaseConnectSources(supabaseUrl),
      "https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.tradingview.com https://s3.tradingview.com",
    ].join(" "),
    "frame-src 'self' https://s.tradingview.com https://www.tradingview.com https://*.tradingview.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ]);
}

export function applyNonceToScriptProps(nonce: string): { nonce: string } {
  // Validate shape first so theme / AdSense helpers cannot attach a weak nonce.
  cspNonceSource(nonce);
  return { nonce };
}

export function createRequestWithCspHeaders(
  request: Request,
  nonce: string,
  policy: string,
): Headers {
  const headers = new Headers(request.headers);
  headers.set(CSP_NONCE_REQUEST_HEADER, nonce);
  headers.set("Content-Security-Policy", policy);
  return headers;
}

export function applyContentSecurityPolicyHeader(
  headers: Headers,
  policy: string,
): Headers {
  headers.set("Content-Security-Policy", policy);
  return headers;
}

export function getProductionSecurityHeaders(
  supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL,
): SecurityHeader[] {
  return [
    {
      key: "Content-Security-Policy",
      value: buildProductionContentSecurityPolicy(supabaseUrl),
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
