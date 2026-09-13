import type { NextConfig } from "next";
import { getProductionSecurityHeaders } from "./lib/security/content-security-policy";

/**
 * Production-safe security headers.
 *
 * CSP remains the current static policy. Google's supported AdSense nonce +
 * `strict-dynamic` model is implemented but not attached: measuring it on this
 * repository forces every HTML route from static/SSG to dynamic. See ADR-007.
 */
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
        headers: getProductionSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
