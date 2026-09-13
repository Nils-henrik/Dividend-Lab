import {
  ADSENSE_CONNECT_SOURCES,
  ADSENSE_FRAME_SOURCES,
  ADSENSE_SCRIPT_SOURCES,
} from "../adsense/constants";

/**
 * Extra Supabase origins for the CSP `connect-src` directive.
 *
 * The hosted project is covered by the `*.supabase.co` wildcard, but a
 * self-hosted or local Supabase stack (e.g. `http://127.0.0.1:54321` from the
 * Supabase CLI) uses a different origin. Derive it from the public URL so the
 * browser can reach Supabase Auth/Realtime in local development without
 * loosening the production policy.
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

function uniqueJoin(values: readonly string[]): string {
  return [...new Set(values)].join(" ");
}

/**
 * Production-safe static allowlist CSP.
 *
 * Google's documented AdSense model is nonce + `strict-dynamic`. Next.js
 * applies request nonces only during dynamic rendering, which would force
 * every public page off static/CDN/ISR. This policy therefore keeps the
 * existing static allowlist and adds scoped AdSense/CMP origins instead of
 * `script-src https:` or a global nonce migration.
 */
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
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    `script-src ${uniqueJoin([...EXISTING_SCRIPT_SOURCES, ...ADSENSE_SCRIPT_SOURCES])}`,
    `connect-src ${uniqueJoin([
      ...EXISTING_CONNECT_SOURCES,
      ...extraConnectSources,
      ...ADSENSE_CONNECT_SOURCES,
    ])}`,
    `frame-src ${uniqueJoin([...EXISTING_FRAME_SOURCES, ...ADSENSE_FRAME_SOURCES])}`,
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
