"use server";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getRequestOrigin } from "@/lib/auth/site-url";
import {
  LEGAL_ACCEPTANCE_METADATA_KEY,
  LEGAL_ACCEPTANCE_VALIDATION_MESSAGE,
} from "@/lib/legal/acceptance";
import { createClient } from "@/lib/supabase/server";

export type RegisterUserResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; reason: "validation" | "signup_failed"; message: string };

function mapSignUpErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("legal_acceptance_required") ||
    normalized.includes("no_active_terms_version") ||
    normalized.includes("no_active_privacy_version")
  ) {
    return LEGAL_ACCEPTANCE_VALIDATION_MESSAGE;
  }

  return message;
}

export async function registerUser(input: {
  email: string;
  password: string;
  legalAcceptanceConfirmed: boolean;
  redirectTo?: string;
}): Promise<RegisterUserResult> {
  if (!input.legalAcceptanceConfirmed) {
    return {
      ok: false,
      reason: "validation",
      message: LEGAL_ACCEPTANCE_VALIDATION_MESSAGE,
    };
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  if (!normalizedEmail.includes("@")) {
    return {
      ok: false,
      reason: "validation",
      message: "Ange en giltig e-postadress.",
    };
  }

  if (input.password.length < 6) {
    return {
      ok: false,
      reason: "validation",
      message: "Använd minst 6 tecken i lösenordet.",
    };
  }

  const origin = await getRequestOrigin();
  const redirectTo = getSafeRedirectPath(input.redirectTo);
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: input.password,
    options: {
      emailRedirectTo,
      data: {
        [LEGAL_ACCEPTANCE_METADATA_KEY]: true,
      },
    },
  });

  if (error) {
    return {
      ok: false,
      reason: "signup_failed",
      message: mapSignUpErrorMessage(error.message),
    };
  }

  return {
    ok: true,
    needsEmailConfirmation: !data.session,
  };
}
