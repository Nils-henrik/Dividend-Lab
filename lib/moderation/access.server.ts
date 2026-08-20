import "server-only";

import { notFound } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const MODERATOR_ROLES = ["moderator", "admin", "founder", "ceo_divlab"] as const;
const OWNER_ROLES = ["founder", "ceo_divlab"] as const;
const DIVLAB_OWNER_USERNAME = "divlab";

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

export async function isDivLabOwnerUser(userId: string) {
  const supabase = await createClient();
  const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("profile_staff_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", [...OWNER_ROLES])
        .limit(1),
    ]);

  if (profileError || rolesError) {
    console.error("[moderation] owner role lookup failed", {
      profileCode: profileError?.code,
      profileMessage: profileError?.message,
      rolesCode: rolesError?.code,
      rolesMessage: rolesError?.message,
    });
    return false;
  }

  return (
    profile?.username?.trim().toLowerCase() === DIVLAB_OWNER_USERNAME &&
    Boolean(roles?.length)
  );
}

export async function requireModeratorUser() {
  const user = await requireAuthenticatedUser();
  const allowed = await isModeratorUser(user.id);

  if (!allowed) {
    notFound();
  }

  return user;
}

export async function requireDivLabOwnerUser() {
  const user = await requireAuthenticatedUser();
  const allowed = await isDivLabOwnerUser(user.id);

  if (!allowed) {
    notFound();
  }

  return user;
}
