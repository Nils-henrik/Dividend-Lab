import "server-only";

import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const MODERATOR_ROLES = ["moderator", "admin", "founder", "ceo_divlab"] as const;

export async function isModeratorUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_staff_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", [...MODERATOR_ROLES])
    .limit(1);

  if (error) {
    console.error("[moderation] staff role lookup failed", {
      code: error.code,
      message: error.message,
    });
    return false;
  }

  return Boolean(data?.length);
}

export async function requireModeratorUser() {
  const user = await requireAuthenticatedUser();
  const allowed = await isModeratorUser(user.id);

  if (!allowed) {
    notFound();
  }

  return user;
}
