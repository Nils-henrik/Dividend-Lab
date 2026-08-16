/**
 * Privileged chat attachment wiring (service-role).
 * Never returns the admin client or credentials.
 */

import { createClient } from "@supabase/supabase-js";
import {
  createChatAttachmentRepository,
  type ChatAttachmentRepository,
} from "./repository";
import {
  createSupabaseChatAttachmentPersistencePort,
  createSupabaseChatAttachmentStoragePort,
} from "./supabase";

export function createChatServiceRoleAttachmentRepository():
  | { ok: true; data: ChatAttachmentRepository }
  | { ok: false } {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    typeof supabaseUrl !== "string" ||
    supabaseUrl.trim().length === 0 ||
    typeof serviceRoleKey !== "string" ||
    serviceRoleKey.trim().length === 0
  ) {
    return { ok: false };
  }

  try {
    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    return {
      ok: true,
      data: createChatAttachmentRepository({
        persistence: createSupabaseChatAttachmentPersistencePort(client),
        storage: createSupabaseChatAttachmentStoragePort(client),
      }),
    };
  } catch {
    return { ok: false };
  }
}
