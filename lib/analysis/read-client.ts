import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import { createDivLabAnalysisDevAdminClient } from "./dev-admin";

/**
 * Analysis reads follow the environment-specific persistence boundary:
 *
 * - Preview: read only from the explicitly bound dividend-lab-dev project.
 * - Production/other runtimes: use the application's ordinary Supabase binding.
 *
 * A Preview deliberately does not fall back to the generic Supabase binding if
 * DEV credentials are missing. Otherwise a misconfigured Preview could render
 * analysis state from a different database than the operator writes to.
 */
export function createDivLabAnalysisReadClient(): SupabaseClient | null {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() === "preview") {
    return createDivLabAnalysisDevAdminClient();
  }
  return createModelPortfolioAdminClient();
}
