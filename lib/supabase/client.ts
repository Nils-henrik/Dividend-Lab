"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const { supabaseUrl, supabasePublishableKey } = getSupabaseConfig();

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
