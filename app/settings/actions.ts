"use server";

import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ChangePasswordState = {
  status: "idle" | "success" | "error";
  message: string;
};

const MIN_PASSWORD_LENGTH = 8;

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function changePasswordAction(
  _state: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await requireAuthenticatedUser();
  const currentPassword = getFormString(formData, "currentPassword");
  const newPassword = getFormString(formData, "newPassword");
  const confirmPassword = getFormString(formData, "confirmPassword");

  if (!currentPassword) {
    return {
      status: "error",
      message: "Ange ditt nuvarande lösenord.",
    };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      status: "error",
      message: "Använd minst 8 tecken för ditt nya lösenord.",
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      status: "error",
      message: "De nya lösenorden matchar inte.",
    };
  }

  if (newPassword === currentPassword) {
    return {
      status: "error",
      message: "Det nya lösenordet måste skilja sig från det nuvarande.",
    };
  }

  if (!user.email) {
    return {
      status: "error",
      message:
        "Det gick inte att verifiera ditt konto just nu. Försök igen om en stund.",
    };
  }

  const supabase = await createClient();

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reauthError) {
    return {
      status: "error",
      message: "Det nuvarande lösenordet stämmer inte.",
    };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return {
      status: "error",
      message:
        "Det gick inte att uppdatera lösenordet just nu. Försök igen om en stund.",
    };
  }

  return {
    status: "success",
    message: "Ditt lösenord har uppdaterats.",
  };
}
