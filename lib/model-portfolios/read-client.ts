import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createModelPortfolioAdminClient } from "@/lib/model-portfolios/admin";
import { createClient } from "@/lib/supabase/server";
import { tryGetSupabaseConfig } from "@/lib/supabase/config";

/**
 * Prefer the signed-in user client (RLS). Anonymous visitors fall back to the
 * service-role reader for public model-portfolio aggregates only.
 */
export async function getModelPortfolioReadContext(): Promise<{
  client: SupabaseClient | null;
  user: User | null;
}> {
  if (!tryGetSupabaseConfig()) {
    return { client: createModelPortfolioAdminClient(), user: null };
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = !userError ? (userData.user ?? null) : null;

  if (user) {
    return { client: supabase, user };
  }

  return { client: createModelPortfolioAdminClient(), user: null };
}
