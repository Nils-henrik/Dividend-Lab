"use server";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { getRequestOrigin } from "@/lib/auth/site-url";
import {
  LEGAL_ACCEPTANCE_METADATA_KEY,
  LEGAL_ACCEPTANCE_VALIDATION_MESSAGE,
} from "@/lib/legal/acceptance";
import { validateUsername } from "@/lib/profiles/username";
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

  if (normalized.includes("username_required")) {
    return "Välj ett användarnamn.";
  }

  if (normalized.includes("username_invalid")) {
    return "Användarnamnet måste vara 3–20 tecken och får bara innehålla a–z, 0–9 och _.";
  }

  if (normalized.includes("username_reserved")) {
    return "Det användarnamnet är reserverat. Välj ett annat.";
  }

  if (
    normalized.includes("username_taken") ||
    normalized.includes("duplicate key") ||
    normalized.includes("profiles_username")
  ) {
    return "Användarnamnet är redan upptaget.";
  }

  if (
    normalized.includes("already") ||
    normalized.includes("registered") ||
    normalized.includes("exists")
  ) {
    return "Kunde inte skapa kontot med de uppgifterna. Prova att logga in eller återställa lösenordet.";
  }

  if (normalized.includes("password")) {
    return "Lösenordet uppfyller inte kraven. Använd minst 8 tecken.";
  }

  if (normalized.includes("rate") || normalized.includes("too many")) {
    return "För många försök. Vänta en stund och försök igen.";
  }

  return "Kunde inte skapa kontot just nu. Försök igen om en stund.";
}

export async function registerUser(input: {
  email: string;
  password: string;
  username: string;
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

  const usernameResult = validateUsername(input.username, { required: true });

  if (!usernameResult.ok) {
    return {
      ok: false,
      reason: "validation",
      message: usernameResult.error,
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

  if (input.password.length < 8) {
    return {
      ok: false,
      reason: "validation",
      message: "Använd minst 8 tecken i lösenordet.",
    };
  }

  const origin = await getRequestOrigin();
  const redirectTo = getSafeRedirectPath(input.redirectTo);
  const emailRedirectTo = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

  const supabase = await createClient();

  // Friendly preflight for the normal "already taken" case. This is advisory:
  // the profiles.username UNIQUE constraint remains authoritative so concurrent
  // registrations cannot claim the same handle.
  const { data: existingUsername, error: usernameLookupError } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", usernameResult.username)
    .maybeSingle();

  if (!usernameLookupError && existingUsername) {
    return {
      ok: false,
      reason: "validation",
      message: "Användarnamnet är redan upptaget.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: input.password,
    options: {
      emailRedirectTo,
      data: {
        [LEGAL_ACCEPTANCE_METADATA_KEY]: true,
        username: usernameResult.username,
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
