import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./lib/security/content-security-policy";

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
        headers: buildSecurityHeaders(),
      },
    ];
  },
};

export default nextConfig;
