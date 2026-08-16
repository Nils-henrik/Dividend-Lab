import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DIVLAB_ANALYSIS_DEV_PROJECT_REF = "faaxloafogpsywfkpbrm" as const;
export const DIVLAB_ANALYSIS_DEV_URL_ENV =
  "DIVLAB_ANALYSIS_DEV_SUPABASE_URL" as const;
export const DIVLAB_ANALYSIS_DEV_SERVICE_ROLE_ENV =
  "DIVLAB_ANALYSIS_DEV_SUPABASE_SERVICE_ROLE_KEY" as const;

/**
 * Preview-only service-role client for destructive/real-data analysis validation.
 *
 * This path deliberately does NOT reuse the application's generic Supabase URL
 * or service-role variables. A Preview must receive explicit, server-only DEV
 * credentials for dividend-lab-dev or persistence remains disabled. That makes
 * it impossible for a production/default Supabase binding to become a fallback
 * write target merely because the Preview environment was configured poorly.
 */
export function createDivLabAnalysisDevAdminClient(): SupabaseClient | null {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") return null;

  const supabaseUrl = process.env[DIVLAB_ANALYSIS_DEV_URL_ENV]?.trim();
  const serviceRoleKey =
    process.env[DIVLAB_ANALYSIS_DEV_SERVICE_ROLE_ENV]?.trim();
  if (!supabaseUrl || !serviceRoleKey) return null;

  try {
    const url = new URL(supabaseUrl);
    if (url.protocol !== "https:") return null;
    if (url.hostname !== `${DIVLAB_ANALYSIS_DEV_PROJECT_REF}.supabase.co`) return null;

    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch {
    return null;
  }
}
