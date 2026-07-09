"use server";

import { getRecoveryCallbackUrl } from "@/lib/auth/recovery";
import { getRequestOrigin } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/server";

export type PasswordResetRequestResult =
  | { ok: true }
  | { ok: false; reason: "request_failed" };

export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetRequestResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const origin = await getRequestOrigin();
  const redirectTo = getRecoveryCallbackUrl(origin);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo,
  });

  if (error) {
    console.error("[password-reset] resetPasswordForEmail failed", {
      redirectTo,
      origin,
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
    });

    return { ok: false, reason: "request_failed" };
  }

  console.info("[password-reset] reset email requested", {
    redirectTo,
    origin,
  });

  return { ok: true };
}
