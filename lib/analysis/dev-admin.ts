import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const DIVLAB_ANALYSIS_DEV_PROJECT_REF = "faaxloafogpsywfkpbrm" as const;

/**
 * Preview-only service-role client for destructive/real-data analysis validation.
 * It refuses to initialize unless the configured Supabase URL is the known
 * dividend-lab-dev project. This prevents a Preview environment from silently
 * persisting analysis validation data into production.
 */
export function createDivLabAnalysisDevAdminClient(): SupabaseClient | null {
  if (process.env.VERCEL_ENV?.trim().toLowerCase() !== "preview") return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
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
