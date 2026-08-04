/**
 * Privileged DivBrain persistence wiring (Ticket 1A-7a).
 *
 * Model A denies authenticated message INSERT. A service-role client is used
 * only inside this module to build a PersistencePort. The raw Supabase client
 * is never returned to callers and must never be imported by browser code.
 *
 * Actor identity is NOT derived from this client — repository callers must
 * pass a trusted server-derived actor id; the port/repository must scope
 * every query by that actor.
 */

import { createClient } from "@supabase/supabase-js";

import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import type { DivBrainPersistencePort } from "./persistence";
import { createSupabaseDivBrainPersistencePort } from "./supabase-persistence";

export type CreateDivBrainServiceRolePersistencePortOptions = {
  /**
   * Invoked when required environment configuration is missing.
   * Must not receive environment values, secrets, or error objects.
   */
  onMissingConfiguration?: () => void;
  /**
   * Invoked when client or persistence-port construction throws.
   * Must not receive the thrown value.
   */
  onClientCreationThrow?: () => void;
};

/**
 * Build a privileged persistence port for server-controlled DivBrain writes.
 *
 * Reads:
 * - `NEXT_PUBLIC_SUPABASE_URL` (existing public project URL convention)
 * - `SUPABASE_SERVICE_ROLE_KEY` (private; never NEXT_PUBLIC_*)
 *
 * On success returns only `DivBrainPersistencePort` — never the admin client
 * or credential. Missing configuration → safe `internal_error`.
 */
export function createDivBrainServiceRolePersistencePort(
  options: CreateDivBrainServiceRolePersistencePortOptions = {},
): DivBrainResult<DivBrainPersistencePort> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    typeof supabaseUrl !== "string" ||
    supabaseUrl.trim().length === 0 ||
    typeof serviceRoleKey !== "string" ||
    serviceRoleKey.trim().length === 0
  ) {
    options.onMissingConfiguration?.();
    return divBrainFailureFromCode("internal_error");
  }

  try {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    return divBrainSuccess(createSupabaseDivBrainPersistencePort(client));
  } catch {
    options.onClientCreationThrow?.();
    return divBrainFailureFromCode("internal_error");
  }
}
