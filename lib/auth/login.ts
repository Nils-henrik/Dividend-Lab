import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeUsername } from "@/lib/profiles/username";

export async function resolveLoginEmail(
  identifier: string,
): Promise<string | null> {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.includes("@")) {
    return trimmed.toLowerCase();
  }

  const normalizedUsername = normalizeUsername(trimmed);

  if (!normalizedUsername) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", normalizedUsername)
      .maybeSingle();

    if (profileError || !profile) {
      return null;
    }

    const admin = createAdminClient();
    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(profile.id);

    if (userError || !userData.user?.email) {
      return null;
    }

    return userData.user.email;
  } catch {
    return null;
  }
}
