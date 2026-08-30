import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Analysis reads follow the environment-specific access boundary:
 *
 * - Preview: use the request-scoped authenticated Supabase client. RLS grants
 *   founder/CEO/admin access only to already-published analysis rows.
 * - Production/other runtimes: keep using the server admin binding so public
 *   analysis pages remain readable without requiring a visitor session.
 *
 * Preview deliberately avoids a service-role dependency. This keeps the test
 * center usable with the founder session while preserving fail-closed RLS.
 */
export async function createDivLabAnalysisReadClient(): Promise<SupabaseClient | null> {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() === "preview") {
    try {
      return await createClient();
    } catch {
      return null;
    }
  }
  return createModelPortfolioAdminClient();
}
