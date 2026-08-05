"use server";

import { INVALID_LOGIN_CREDENTIALS_MESSAGE } from "@/lib/auth/login-messages";
import { resolveLoginEmail } from "@/lib/auth/login";
import { createClient } from "@/lib/supabase/server";
import type { SignInResult } from "@/lib/auth/login-messages";

export async function signInWithIdentifier(input: {
  identifier: string;
  password: string;
}): Promise<SignInResult> {
  const identifier = input.identifier.trim();
  const password = input.password;

  if (!identifier || !password) {
    return {
      ok: false,
      message: "Ange e-post eller användarnamn och lösenord för att fortsätta.",
    };
  }

  const email = await resolveLoginEmail(identifier);

  if (!email) {
    return { ok: false, message: INVALID_LOGIN_CREDENTIALS_MESSAGE };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, message: INVALID_LOGIN_CREDENTIALS_MESSAGE };
  }

  return { ok: true };
}
