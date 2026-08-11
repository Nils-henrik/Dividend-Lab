/**
 * Privileged DivBrain attachment wiring (service-role).
 * Never returns the admin client or credentials.
 */

import { createClient } from "@supabase/supabase-js";
import type { DivBrainResult } from "../../results";
import { divBrainFailureFromCode, divBrainSuccess } from "../../results";
import {
  createDivBrainAttachmentRepository,
  type DivBrainAttachmentRepository,
} from "./repository";
import {
  createSupabaseDivBrainAttachmentPersistencePort,
  createSupabaseDivBrainAttachmentStoragePort,
} from "./supabase-persistence";

export type CreateDivBrainAttachmentRepositoryOptions = {
  onMissingConfiguration?: () => void;
  onClientCreationThrow?: () => void;
};

export function createDivBrainServiceRoleAttachmentRepository(
  options: CreateDivBrainAttachmentRepositoryOptions = {},
): DivBrainResult<DivBrainAttachmentRepository> {
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

    return divBrainSuccess(
      createDivBrainAttachmentRepository({
        persistence: createSupabaseDivBrainAttachmentPersistencePort(client),
        storage: createSupabaseDivBrainAttachmentStoragePort(client),
      }),
    );
  } catch {
    options.onClientCreationThrow?.();
    return divBrainFailureFromCode("internal_error");
  }
}
