import type { NextConfig } from "next";

/**
 * Extra Supabase origins for the CSP `connect-src` directive.
 *
 * The hosted project is covered by the `*.supabase.co` wildcard, but a
 * self-hosted or local Supabase stack (e.g. `http://127.0.0.1:54321` from the
 * Supabase CLI) uses a different origin. Derive it from the public URL so the
 * browser can reach Supabase Auth/Realtime in local development without
 * loosening the production policy.
 */
function supabaseConnectSources(): string[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
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
 * Production-safe security headers.
 * CSP accounts for Next.js, Supabase Auth, Vercel Analytics and TradingView widgets.
 */
const ContentSecurityPolicy = [
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
    ...supabaseConnectSources(),
    "https://va.vercel-scripts.com https://vitals.vercel-insights.com https://*.tradingview.com https://s3.tradingview.com",
  ].join(" "),
  "frame-src 'self' https://s.tradingview.com https://www.tradingview.com https://*.tradingview.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy,
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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    localPatterns: [
      {
        pathname: "/**",
        search: "",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
