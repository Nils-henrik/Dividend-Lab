/**
 * Privileged Supabase client for DivBrain server-controlled writes.
 *
 * Required for Model A message INSERT (authenticated clients have SELECT only).
 * Must never be imported by client components or exposed through public env.
 *
 * Actor identity is NOT taken from this client — callers must pass a trusted
 * server-derived actor id and the repository must scope every query by it.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";

export type DivBrainServiceRoleClient = SupabaseClient;

/**
 * Create a service-role Supabase client for DivBrain persistence.
 * Reads `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.
 * Never logs or returns the key.
 */
export function createDivBrainServiceRoleClient(): DivBrainResult<DivBrainServiceRoleClient> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    typeof supabaseUrl !== "string" ||
    supabaseUrl.trim().length === 0 ||
    typeof serviceRoleKey !== "string" ||
    serviceRoleKey.trim().length === 0
  ) {
    return divBrainFailureFromCode("internal_error");
  }

  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return divBrainSuccess(client);
}
