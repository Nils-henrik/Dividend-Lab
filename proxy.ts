import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Keep this Proxy limited to `updateSession(request)`.
 *
 * Per-request nonce CSP belongs to Google's supported AdSense model, but
 * wiring it here plus `headers()` in the root layout was measured to convert
 * every HTML route from static/SSG to dynamic. Do not attach CSP nonces until
 * ADR-007 is explicitly accepted by the Product Owner.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
