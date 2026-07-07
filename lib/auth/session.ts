import { redirect } from "next/navigation";
import { mapSupabaseUser } from "@/lib/auth/user";
import { getUserDisplayIdentity } from "@/lib/profiles/identity";
import { ensureProfileForUser } from "@/lib/profiles/profile";
import { createClient } from "@/lib/supabase/server";

export async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? mapSupabaseUser(user) : null;
}

export async function requireAuthenticatedUser() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAuthenticatedUserWithProfile() {
  const user = await requireAuthenticatedUser();
  const profile = await ensureProfileForUser(user.id);
  const identity = getUserDisplayIdentity(user, profile);

  return {
    user,
    profile,
    identity,
  };
}
