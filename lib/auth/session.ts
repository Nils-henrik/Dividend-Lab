import { redirect } from "next/navigation";
import { mapSupabaseUser } from "@/lib/auth/user";
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
