import type { NextConfig } from "next";
import {
  buildContentSecurityPolicy,
  deriveSupabaseConnectSources,
} from "./lib/security/content-security-policy";

/**
 * Production-safe security headers.
 * CSP accounts for Next.js, Supabase Auth, Vercel Analytics, TradingView
 * widgets, Google AdSense and Google's CMP.
 */
const ContentSecurityPolicy = buildContentSecurityPolicy(
  deriveSupabaseConnectSources(),
);

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
  // pdf-parse's official Next.js/Vercel guidance requires its Node canvas
  // dependencies to remain external so the serverless runtime can load them.
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  images: {
    formats: ["image/avif", "image/webp"],
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
