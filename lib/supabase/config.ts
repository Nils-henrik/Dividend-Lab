const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export function tryGetSupabaseConfig() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabasePublishableKey,
  };
}

export function getSupabaseConfig() {
  const config = tryGetSupabaseConfig();

  if (!config) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return config;
}
